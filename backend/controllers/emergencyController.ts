// controllers/emergencyController.ts
import { Response } from 'express'
import asyncHandler from 'express-async-handler'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth'
import { revokeAllUserSessions } from '../middlewares/session'
import {
  disableTOTPForUser,
  verifyRecoveryKey,
} from '../services/twoFactorService'
import { logAudit } from '../utils/auditLogger'
import { getClientMetadata } from '../utils/ipSelector'

interface EmergencyBody {
  targetUuid: string
  recoveryKey: string
  action: 'BAN' | 'DELETE' | 'FORCE_RESET'
  reason: string
}

/**
 * @ROUTE   POST /api/auth/emergency-action
 * @DESC    Supervisor uses another Supervisor's recovery key to BAN/DELETE/FORCE_RESET
 *          Used when the target supervisor account is compromised
 * @ACCESS  Supervisor only (auth + requireSupervisor)
 */
export const emergencyAction = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { targetUuid, recoveryKey, action, reason } =
      req.body as EmergencyBody
    const { ipAddress, userAgent } = getClientMetadata(req)

    // 1. Validate required fields
    if (!targetUuid || !recoveryKey || !action || !reason) {
      res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' })
      return
    }

    if (!['BAN', 'DELETE', 'FORCE_RESET'].includes(action)) {
      res.status(400).json({ message: 'ประเภทการดำเนินการไม่ถูกต้อง' })
      return
    }

    if (!reason.trim()) {
      res.status(400).json({ message: 'กรุณาระบุเหตุผล' })
      return
    }

    // 2. Get current user (requester)
    const requester = await prisma.user.findUnique({
      where: { uuid: req.user?.uuid },
    })

    if (!requester || requester.role !== 'SUPERVISOR') {
      res.status(403).json({ message: 'เฉพาะ Supervisor เท่านั้น' })
      return
    }

    // 3. Get target user
    const target = await prisma.user.findUnique({
      where: { uuid: targetUuid },
    })

    if (!target || target.role !== 'SUPERVISOR') {
      res.status(404).json({ message: 'ไม่พบบัญชี Supervisor เป้าหมาย' })
      return
    }

    if (target.uuid === requester.uuid) {
      res.status(400).json({ message: 'ไม่สามารถดำเนินการกับตนเองได้' })
      return
    }

    // 4. Verify recovery key of the REQUESTER user
    const isValidKey = await verifyRecoveryKey(requester.id, recoveryKey, req)

    if (!isValidKey) {
      await logAudit(
        req,
        'EMERGENCY_ACTION_FAILED',
        `Supervisor ${requester.email} attempted emergency ${action} on ${target.email} but recovery key was invalid`,
        requester.id,
      )
      res.status(400).json({ message: 'Recovery Key ไม่ถูกต้องหรือหมดอายุ' })
      return
    }

    // 5. Disable 2FA on target (so the hacker can't use it anymore)
    await disableTOTPForUser(target.id)

    // 6. Revoke all sessions of target
    await revokeAllUserSessions(target.id)

    // 7. Execute the action
    let actionDescription = ''
    switch (action) {
      case 'BAN':
        await prisma.user.update({
          where: { id: target.id },
          data: { status: 'Inactive' },
        })
        actionDescription = `Supervisor ${target.email} was banned via emergency recovery key`
        break

      case 'DELETE':
        await prisma.user.delete({
          where: { id: target.id },
        })
        actionDescription = `Supervisor ${target.email} was deleted via emergency recovery key`
        break

      case 'FORCE_RESET':
        await prisma.user.update({
          where: { id: target.id },
          data: { forcePasswordReset: true },
        })
        actionDescription = `Supervisor ${target.email} was force reset via emergency recovery key`
        break
    }

    await logAudit(
      req,
      'EMERGENCY_ACTION_SUCCESS',
      `${actionDescription}. Reason: ${reason}. Executed by supervisor: ${requester.email}`,
      requester.id,
    )

    res.status(200).json({
      success: true,
      message: 'ดำเนินการฉุกเฉินสำเร็จ',
      data: {
        action,
        target: target.email,
        targetUuid: target.uuid,
      },
    })
  },
)
