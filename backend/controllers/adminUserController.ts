// controllers/adminUserController.ts
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { AuthRequest } from '../middlewares/auth'
import { step1RequestConfirmation, step2ConfirmWithReason } from '../middlewares/confirmAction'
import * as adminService from '../services/adminService'
import { sendUserActionAlert } from '../services/emailService'
import { logAudit } from '../utils/auditLogger'
import { getClientMetadata } from '../utils/ipSelector'
import { paramStr } from '../utils/reqHelpers'

const auditAndNotify = async (
  req: AuthRequest,
  action: string,
  details: string,
  targetEmail: string,
  targetName: string,
  reason: string,
  ipAddress: string,
  supervisor?: any,
) => {
  await logAudit(req, action, details, supervisor?.id)
  if (supervisor) {
    await sendUserActionAlert(
      supervisor.email,
      `${supervisor.firstname} ${supervisor.lastname}`,
      targetEmail,
      targetName,
      action.replace('_SUCCESS', ''),
      reason,
      `${req.user?.firstName} ${req.user?.lastName}`,
      ipAddress,
    )
  }
}

export const createAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, firstname, lastname } = req.body
  const { ipAddress } = getClientMetadata(req)

  try {
    const { admin: newAdmin, supervisor } = await adminService.createAdmin(
      { email, password, firstname, lastname },
      req.user?.uuid,
    )

    await logAudit(
      req,
      'CREATE_ADMIN_SUCCESS',
      `Supervisor created new admin: ${email.toLowerCase()} (Admin ID: ${newAdmin.id})`,
      supervisor?.id,
    )
    if (supervisor) {
      await sendUserActionAlert(
        supervisor.email,
        `${supervisor.firstname} ${supervisor.lastname}`,
        newAdmin.email,
        `${newAdmin.firstname} ${newAdmin.lastname}`,
        'CREATE_ADMIN',
        `New admin account created by supervisor`,
        `${req.user?.firstName} ${req.user?.lastName}`,
        ipAddress,
      )
    }

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: newAdmin.uuid,
        email: newAdmin.email,
        firstname: newAdmin.firstname,
        lastname: newAdmin.lastname,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt,
      },
    })
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Internal Server Error' })
  }
})

export const getAdmins = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const result = await adminService.getAdmins(page, limit)
  res.status(200).json({
    success: true,
    count: result.admins.length,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    data: result.admins,
  })
})

export const getAdminById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const uuid = paramStr(req, 'uuid')
  try {
    const admin = await adminService.getAdminById(uuid)
    res.status(200).json({ success: true, data: admin })
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Internal Server Error' })
  }
})

export const updateAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const uuid = paramStr(req, 'uuid')
  const { firstname, lastname } = req.body
  const { ipAddress } = getClientMetadata(req)

  try {
    const {
      admin: updatedAdmin,
      supervisor,
      oldAdminEmail,
      oldAdminId,
    } = await adminService.updateAdmin(uuid, { firstname, lastname }, req.user?.uuid)
    await logAudit(
      req,
      'UPDATE_ADMIN_SUCCESS',
      `Supervisor updated admin: ${oldAdminEmail} (Admin ID: ${oldAdminId})`,
      supervisor?.id,
    )
    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: {
        uuid: updatedAdmin.uuid,
        email: updatedAdmin.email,
        firstname: updatedAdmin.firstname,
        lastname: updatedAdmin.lastname,
      },
    })
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Internal Server Error' })
  }
})

// 3-step confirmation wrappers
export const adminBan = asyncHandler(async (req: Request, res: Response) => {
  const { step } = req.body
  const action = 'BAN_ADMIN'
  switch (step) {
    case 1:
      await step1RequestConfirmation(req, res, action)
      break
    case 2:
      await step2ConfirmWithReason(req, res, action)
      break
    default:
      res
        .status(400)
        .json({ success: false, message: 'Invalid step. Please provide step 1, 2, or 3.' })
  }
})

export const adminUnban = asyncHandler(async (req: Request, res: Response) => {
  const { step } = req.body
  const action = 'UNBAN_ADMIN'
  switch (step) {
    case 1:
      await step1RequestConfirmation(req, res, action)
      break
    case 2:
      await step2ConfirmWithReason(req, res, action)
      break
    default:
      res
        .status(400)
        .json({ success: false, message: 'Invalid step. Please provide step 1, 2, or 3.' })
  }
})

export const banAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { step } = req.body
  const { ipAddress } = getClientMetadata(req)
  const action = 'BAN_ADMIN'
  switch (step) {
    case 1:
      await step1RequestConfirmation(req, res, action)
      break
    case 2:
      await step2ConfirmWithReason(req, res, action)
      break
    case 3: {
      const uuid = paramStr(req, 'uuid')
      const { reason } = req.body
      try {
        const { admin, supervisor } = await adminService.banAdmin(uuid, reason, req.user?.uuid)
        await auditAndNotify(
          req,
          'BAN_ADMIN_SUCCESS',
          `Supervisor banned admin: ${admin.email} (Admin ID: ${admin.id}). Reason: ${reason}`,
          admin.email,
          `${admin.firstname} ${admin.lastname}`,
          reason,
          ipAddress,
          supervisor,
        )
        res.status(200).json({
          success: true,
          message: 'Admin has been banned',
          data: { uuid: admin.uuid, email: admin.email, status: admin.status },
        })
      } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message })
      }
      break
    }
    default:
      res
        .status(400)
        .json({ success: false, message: 'Invalid step. Please provide step 1, 2, or 3.' })
  }
})

export const unbanAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { step } = req.body
  const { ipAddress } = getClientMetadata(req)
  const action = 'UNBAN_ADMIN'
  switch (step) {
    case 1:
      await step1RequestConfirmation(req, res, action)
      break
    case 2:
      await step2ConfirmWithReason(req, res, action)
      break
    case 3: {
      const uuid = paramStr(req, 'uuid')
      const { reason } = req.body
      try {
        const { admin, supervisor } = await adminService.unbanAdmin(uuid, reason, req.user?.uuid)
        await auditAndNotify(
          req,
          'UNBAN_ADMIN_SUCCESS',
          `Supervisor unbanned admin: ${admin.email} (Admin ID: ${admin.id}). Reason: ${reason}`,
          admin.email,
          `${admin.firstname} ${admin.lastname}`,
          reason,
          ipAddress,
          supervisor,
        )
        res.status(200).json({
          success: true,
          message: 'Admin has been unbanned',
          data: { uuid: admin.uuid, email: admin.email, status: admin.status },
        })
      } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message })
      }
      break
    }
    default:
      res
        .status(400)
        .json({ success: false, message: 'Invalid step. Please provide step 1, 2, or 3.' })
  }
})

export const deleteAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { step } = req.body
  const { ipAddress } = getClientMetadata(req)
  const action = 'DELETE_ADMIN'
  switch (step) {
    case 1:
      await step1RequestConfirmation(req, res, action)
      break
    case 2:
      await step2ConfirmWithReason(req, res, action)
      break
    case 3: {
      const uuid = paramStr(req, 'uuid')
      const { reason } = req.body
      try {
        const { admin, supervisor } = await adminService.deleteAdmin(uuid, reason, req.user?.uuid)
        await auditAndNotify(
          req,
          'DELETE_ADMIN_SUCCESS',
          `Supervisor deleted admin: ${admin.email} (Admin ID: ${admin.id}). Reason: ${reason}`,
          admin.email,
          `${admin.firstname} ${admin.lastname}`,
          reason,
          ipAddress,
          supervisor,
        )
        res.status(200).json({ success: true, message: 'Admin has been deleted' })
      } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message })
      }
      break
    }
    default:
      res
        .status(400)
        .json({ success: false, message: 'Invalid step. Please provide step 1, 2, or 3.' })
  }
})
