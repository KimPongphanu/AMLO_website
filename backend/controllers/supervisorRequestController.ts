// controllers/supervisorRequestController.ts
import bcrypt from 'bcryptjs'
import { Response } from 'express'
import asyncHandler from 'express-async-handler'
import speakeasy from 'speakeasy'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth'
import { revokeAllUserSessions } from '../middlewares/session'
import { logAudit } from '../utils/auditLogger'

interface CreateRequestBody {
  targetUuid: string
  actionType: 'BAN' | 'DELETE' | 'FORCE_RESET'
  reason: string
  password: string
}

interface ActionBody {
  otpToken?: string
  password?: string
}

const VERIFY_PASSWORD_ACTION = 'password'
const VERIFY_OTP = 'otp'

/**
 * POST /api/supervisor-request
 * Create a new supervisor action request (Requires: password verification)
 */
export const createRequest = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { targetUuid, actionType, reason, password } =
      req.body as CreateRequestBody

    if (!targetUuid || !actionType || !reason || !password) {
      res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' })
      return
    }

    if (!['BAN', 'DELETE', 'FORCE_RESET'].includes(actionType)) {
      res.status(400).json({ message: 'ประเภทคำร้องไม่ถูกต้อง' })
      return
    }

    // Get requester (current user) with password
    const requester = await prisma.user.findUnique({
      where: { uuid: req.user?.uuid },
    })

    if (!requester || requester.role !== 'SUPERVISOR') {
      res.status(403).json({ message: 'เฉพาะ Supervisor เท่านั้น' })
      return
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, requester.password)
    if (!isPasswordValid) {
      await logAudit(
        req,
        'SUPERVISOR_REQUEST_FAILED',
        `Supervisor ${requester.email} attempted to create request but password was invalid`,
        requester.id,
      )
      res.status(400).json({ message: 'รหัสผ่านไม่ถูกต้อง' })
      return
    }

    // Get target user
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

    // Check existing pending requests
    const existingPending = await prisma.supervisorRequest.findFirst({
      where: {
        requesterId: requester.id,
        targetId: target.id,
        status: 'PENDING',
      },
    })
    if (existingPending) {
      res.status(400).json({ message: 'มีคำร้องที่รอการอนุมัติอยู่แล้ว' })
      return
    }

    // Create request
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const request = await prisma.supervisorRequest.create({
      data: {
        actionType,
        reason,
        requesterId: requester.id,
        targetId: target.id,
        expiresAt,
      },
    })

    await logAudit(
      req,
      'SUPERVISOR_REQUEST_CREATED',
      `Supervisor ${requester.email} created ${actionType} request for ${target.email}. Reason: ${reason}`,
      requester.id,
    )

    res.status(201).json({
      success: true,
      message: 'คำร้องถูกส่งไปยัง Supervisor เป้าหมายแล้ว',
      data: { id: request.id },
    })
  },
)

/**
 * GET /api/supervisor-request/pending
 * Get all pending requests targeting the current user
 */
export const getPendingRequests = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { uuid: req.user?.uuid },
    })

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    const requests = await prisma.supervisorRequest.findMany({
      where: {
        targetId: user.id,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        requester: {
          select: {
            uuid: true,
            email: true,
            firstname: true,
            lastname: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: requests })
  },
)

/**
 * GET /api/supervisor-request/sent
 * Get requests created by the current user
 */
export const getSentRequests = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { uuid: req.user?.uuid },
    })

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    const requests = await prisma.supervisorRequest.findMany({
      where: { requesterId: user.id },
      include: {
        target: {
          select: {
            uuid: true,
            email: true,
            firstname: true,
            lastname: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: requests })
  },
)

/**
 * POST /api/supervisor-request/:id/approve
 * Approve a request (Requires: OTP from Google Authenticator)
 */
export const approveRequest = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const { otpToken } = req.body as ActionBody

    if (!otpToken) {
      res.status(400).json({ message: 'กรุณากรอกรหัส OTP' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { uuid: req.user?.uuid },
    })

    if (!user || user.role !== 'SUPERVISOR') {
      res.status(403).json({ message: 'เฉพาะ Supervisor เท่านั้น' })
      return
    }

    // Get request
    const request = await prisma.supervisorRequest.findUnique({
      where: { id: Number(id) },
      include: {
        requester: true,
        target: true,
      },
    })

    if (!request || request.targetId !== user.id) {
      res.status(404).json({ message: 'ไม่พบคำร้อง' })
      return
    }

    if (request.status !== 'PENDING') {
      res.status(400).json({ message: 'คำร้องนี้ถูกดำเนินการไปแล้ว' })
      return
    }

    if (request.expiresAt < new Date()) {
      await prisma.supervisorRequest.update({
        where: { id: request.id },
        data: { status: 'EXPIRED' },
      })
      res.status(400).json({ message: 'คำร้องหมดอายุแล้ว' })
      return
    }

    // Verify OTP with Google Authenticator
    if (!user.twoFactorSecret) {
      res.status(400).json({ message: 'คุณยังไม่ได้ตั้งค่า 2FA' })
      return
    }

    const isValidOTP = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: otpToken,
      window: 1,
    })

    if (!isValidOTP) {
      res.status(400).json({ message: 'รหัส OTP ไม่ถูกต้อง' })
      return
    }

    // Approve and execute action
    await prisma.supervisorRequest.update({
      where: { id: request.id },
      data: { status: 'APPROVED', respondedAt: new Date() },
    })

    // Execute the action
    let actionDescription = ''
    switch (request.actionType) {
      case 'BAN':
        await prisma.user.update({
          where: { id: request.targetId },
          data: { status: 'Inactive' },
        })
        await revokeAllUserSessions(request.targetId)
        actionDescription = `Supervisor ${request.target.email} was banned by dual approval`
        break

      case 'DELETE':
        await revokeAllUserSessions(request.targetId)
        await prisma.user.delete({
          where: { id: request.targetId },
        })
        actionDescription = `Supervisor ${request.target.email} was deleted by dual approval`
        break

      case 'FORCE_RESET':
        await prisma.user.update({
          where: { id: request.targetId },
          data: { forcePasswordReset: true },
        })
        await revokeAllUserSessions(request.targetId)
        actionDescription = `Supervisor ${request.target.email} was force reset by dual approval`
        break
    }

    await logAudit(
      req,
      'SUPERVISOR_REQUEST_APPROVED',
      `${actionDescription}. Requester: ${request.requester.email}, Approver: ${user.email}. Reason: ${request.reason}`,
      user.id,
    )

    res.json({
      success: true,
      message: 'ดำเนินการสำเร็จ',
    })
  },
)

/**
 * POST /api/supervisor-request/:id/reject
 * Reject a request
 */
export const rejectRequest = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { uuid: req.user?.uuid },
    })

    if (!user || user.role !== 'SUPERVISOR') {
      res.status(403).json({ message: 'เฉพาะ Supervisor เท่านั้น' })
      return
    }

    const request = await prisma.supervisorRequest.findUnique({
      where: { id: Number(id) },
      include: { requester: true },
    })

    if (!request || request.targetId !== user.id) {
      res.status(404).json({ message: 'ไม่พบคำร้อง' })
      return
    }

    if (request.status !== 'PENDING') {
      res.status(400).json({ message: 'คำร้องนี้ถูกดำเนินการไปแล้ว' })
      return
    }

    await prisma.supervisorRequest.update({
      where: { id: request.id },
      data: { status: 'REJECTED', respondedAt: new Date() },
    })

    await logAudit(
      req,
      'SUPERVISOR_REQUEST_REJECTED',
      `Supervisor ${user.email} rejected ${request.actionType} request for their account from ${request.requester.email}`,
      user.id,
    )

    res.json({
      success: true,
      message: 'ปฏิเสธคำร้องเรียบร้อย',
    })
  },
)
