import bcrypt from 'bcryptjs'
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth'
import { step1RequestConfirmation, step2ConfirmWithReason } from '../middlewares/confirmAction'
import { revokeAllUserSessions } from '../middlewares/session'
import { generateToken } from '../services/authService'
import { sendUserActionAlert } from '../services/emailService'
import { logAudit } from '../utils/auditLogger'
import { getClientMetadata } from '../utils/ipSelector'
import { paramStr } from '../utils/reqHelpers'
import { sanitizeText } from '../utils/sanitizer'

const addToPasswordHistory = async (userId: number, passwordHash: string): Promise<void> => {
  await prisma.passwordHistory.create({ data: { userId, passwordHash } })
}

export const registerUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, firstname, lastname, role } = req.body
  const { ipAddress } = getClientMetadata(req)

  if (!email || !password || !firstname || !lastname) {
    res.status(400).json({ message: 'All fields are required' })
    return
  }
  if (
    email.length > 100 ||
    password.length > 100 ||
    firstname.length > 50 ||
    lastname.length > 50
  ) {
    res.status(400).json({ message: 'Input data exceeds maximum length.' })
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ message: 'Invalid email format.' })
    return
  }
  const domainMatch = email.match(/@(.+)$/)
  if (!domainMatch || !domainMatch[1].includes('go.th')) {
    res.status(400).json({ message: 'Only organization email (.go.th) is allowed' })
    return
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
    res.status(400).json({
      message:
        'Password must be at least 8 characters long, including uppercase, lowercase, and numbers.',
    })
    return
  }

  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existingUser) {
    res.status(400).json({ message: 'This email is already in use.' })
    return
  }

  const requestedRole = role === 'SUPERVISOR' ? 'SUPERVISOR' : 'ADMIN'
  if (requestedRole === 'SUPERVISOR') {
    const supervisorCount = await prisma.user.count({ where: { role: 'SUPERVISOR' } })
    if (supervisorCount >= 2) {
      res.status(400).json({ message: 'จำนวน Supervisor ครบ 2 ท่านแล้ว ไม่สามารถสร้างเพิ่มได้' })
      return
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstname: sanitizeText(firstname),
      lastname: sanitizeText(lastname),
      role: requestedRole,
      twoFactorMethod: 'NONE',
      twoFactorEnabled: false,
    },
  })

  await addToPasswordHistory(user.id, hashedPassword)

  const supervisor = await prisma.user.findUnique({ where: { uuid: req.user?.uuid } })
  await logAudit(
    req,
    'CREATE_ADMIN_SUCCESS',
    `Supervisor created new admin: ${email.toLowerCase()} (Admin ID: ${user.id})`,
    supervisor?.id,
  )
  if (supervisor) {
    await sendUserActionAlert(
      supervisor.email,
      `${supervisor.firstname} ${supervisor.lastname}`,
      user.email,
      `${user.firstname} ${user.lastname}`,
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
      id: user.uuid,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role,
      createdAt: user.createdAt,
    },
  })
})

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { ipAddress } = getClientMetadata(req)
  const { email, password } = req.body

  if (!email || !password || email.length > 100 || password.length > 100) {
    res.status(400).json({ message: 'Please provide valid credentials.' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  let failedAttempt = await prisma.failedLoginAttempt.findFirst({
    where: { email: email.toLowerCase() },
  })

  if (failedAttempt && failedAttempt.lockedUntil && failedAttempt.lockedUntil > new Date()) {
    res.status(429).json({
      message: 'บัญชีถูกระงับชั่วคราวเนื่องจากเข้าสู่ระบบผิดพลาดหลายครั้ง กรุณาลองใหม่ในภายหลัง',
    })
    return
  }

  if (!user || !(await bcrypt.compare(password, user.password))) {
    if (failedAttempt) {
      const newAttempts = failedAttempt.attempts + 1
      let lockedUntil = null
      if (newAttempts >= 5) lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
      await prisma.failedLoginAttempt.update({
        where: { id: failedAttempt.id },
        data: { attempts: newAttempts, lastAttempt: new Date(), lockedUntil },
      })
    } else {
      await prisma.failedLoginAttempt.create({
        data: { email: email.toLowerCase(), ipAddress, attempts: 1, userId: user ? user.id : null },
      })
    }
    await logAudit(
      req,
      'LOGIN_FAILED',
      `Failed login attempt for email: ${email.slice(0, 50)} (Invalid credentials)`,
      user ? user.id : null,
    )
    res.status(401).json({ message: 'Invalid email or password.' })
    return
  }

  if (failedAttempt)
    await prisma.failedLoginAttempt.deleteMany({ where: { email: email.toLowerCase() } })

  if (user.status === 'Inactive') {
    await logAudit(
      req,
      'LOGIN_FAILED',
      `Login attempt for banned account: ${email.slice(0, 50)}`,
      user.id,
    )
    res.status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' })
    return
  }

  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('Server configuration error.')

  if (user.twoFactorEnabled && user.twoFactorMethod !== 'NONE') {
    const tempToken = jwt.sign({ userId: user.id, purpose: '2fa_verification' }, secret, {
      expiresIn: '5m',
    })
    res.cookie('temp_2fa_token', tempToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
      path: '/',
    })
    res.status(200).json({
      success: true,
      requires2FA: true,
      twoFactorMethod: user.twoFactorMethod,
      message: 'กรุณายืนยันตัวตนด้วย 2FA',
      user: {
        uuid: user.uuid,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      },
    })
    return
  }

  const token = generateToken({
    uuid: user.uuid,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    role: user.role,
  })
  const isProduction = process.env.NODE_ENV === 'production'
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  })

  await logAudit(req, 'LOGIN_SUCCESS', 'User logged in successfully.', user.id)
  res.status(200).json({
    message: 'Login successful.',
    success: true,
    requires2FA: false,
    user: {
      uuid: user.uuid,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role,
      forcePasswordReset: user.forcePasswordReset,
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorMethod: user.twoFactorMethod,
    },
  })
})

export const logoutUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = req.cookies.token
  if (token) await prisma.jwtBlacklist.create({ data: { token } }).catch(console.error)
  const user = await prisma.user.findUnique({ where: { uuid: req.user?.uuid } })
  await logAudit(req, 'LOGOUT', 'User logged out and token was blacklisted.', user?.id)
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })
  res.status(200).json({ success: true, message: 'Logged out successfully.' })
})

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { uuid: req.user!.uuid },
    select: {
      id: true,
      uuid: true,
      email: true,
      firstname: true,
      lastname: true,
      role: true,
      createdAt: true,
      recentOnline: true,
      forcePasswordReset: true,
      twoFactorEnabled: true,
      twoFactorMethod: true,
    },
  })
  if (!user) {
    res.status(404).json({ success: false, message: 'User account not found.' })
    return
  }
  res.status(200).json({ success: true, user })
})

export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        uuid: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        status: true,
        twoFactorEnabled: true,
        twoFactorMethod: true,
        createdAt: true,
        recentOnline: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count(),
  ])
  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: users,
  })
})

export const banUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { step } = req.body
  const { ipAddress } = getClientMetadata(req)
  const action = 'BAN_USER'
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
      if (!reason || !reason.trim()) {
        res.status(400).json({ message: 'Reason is required for banning a user' })
        return
      }
      const user = await prisma.user.findUnique({ where: { uuid } })
      if (!user) {
        res.status(404).json({ message: 'User not found' })
        return
      }
      if (user.role === 'SUPERVISOR') {
        res.status(403).json({ message: 'Cannot ban supervisor account' })
        return
      }
      await prisma.user.update({ where: { uuid }, data: { status: 'Inactive' } })
      await revokeAllUserSessions(user.id)
      const supervisor = await prisma.user.findUnique({ where: { uuid: req.user?.uuid } })
      await logAudit(
        req,
        'BAN_USER_SUCCESS',
        `Supervisor banned user: ${user.email} (User ID: ${user.id}). Reason: ${reason}`,
        supervisor?.id,
      )
      if (supervisor)
        await sendUserActionAlert(
          supervisor.email,
          `${supervisor.firstname} ${supervisor.lastname}`,
          user.email,
          `${user.firstname} ${user.lastname}`,
          'BAN_USER',
          reason,
          `${req.user?.firstName} ${req.user?.lastName}`,
          ipAddress,
        )
      res.status(200).json({ success: true, message: 'User has been banned' })
      break
    }
    default:
      res
        .status(400)
        .json({ success: false, message: 'Invalid step. Please provide step 1, 2, or 3.' })
  }
})

export const unbanUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { step } = req.body
  const { ipAddress } = getClientMetadata(req)
  const action = 'UNBAN_USER'
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
      if (!reason || !reason.trim()) {
        res.status(400).json({ message: 'Reason is required for unbanning a user' })
        return
      }
      const user = await prisma.user.findUnique({ where: { uuid } })
      if (!user) {
        res.status(404).json({ message: 'User not found' })
        return
      }
      await prisma.user.update({ where: { uuid }, data: { status: 'Active' } })
      const supervisor = await prisma.user.findUnique({ where: { uuid: req.user?.uuid } })
      await logAudit(
        req,
        'UNBAN_USER_SUCCESS',
        `Supervisor unbanned user: ${user.email} (User ID: ${user.id}). Reason: ${reason}`,
        supervisor?.id,
      )
      if (supervisor)
        await sendUserActionAlert(
          supervisor.email,
          `${supervisor.firstname} ${supervisor.lastname}`,
          user.email,
          `${user.firstname} ${user.lastname}`,
          'UNBAN_USER',
          reason,
          `${req.user?.firstName} ${req.user?.lastName}`,
          ipAddress,
        )
      res.status(200).json({ success: true, message: 'User has been unbanned' })
      break
    }
    default:
      res
        .status(400)
        .json({ success: false, message: 'Invalid step. Please provide step 1, 2, or 3.' })
  }
})

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { step } = req.body
  const { ipAddress } = getClientMetadata(req)
  const action = 'DELETE_USER'
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
      if (!reason || !reason.trim()) {
        res.status(400).json({ message: 'Reason is required for deleting a user' })
        return
      }
      const user = await prisma.user.findUnique({ where: { uuid } })
      if (!user) {
        res.status(404).json({ message: 'User not found' })
        return
      }
      if (user.role === 'SUPERVISOR') {
        res.status(403).json({ message: 'Cannot delete supervisor account' })
        return
      }
      await revokeAllUserSessions(user.id)
      await prisma.user.delete({ where: { uuid } })
      const supervisor = await prisma.user.findUnique({ where: { uuid: req.user?.uuid } })
      await logAudit(
        req,
        'DELETE_USER_SUCCESS',
        `Supervisor deleted user: ${user.email} (User ID: ${user.id}). Reason: ${reason}`,
        supervisor?.id,
      )
      if (supervisor)
        await sendUserActionAlert(
          supervisor.email,
          `${supervisor.firstname} ${supervisor.lastname}`,
          user.email,
          `${user.firstname} ${user.lastname}`,
          'DELETE_USER',
          reason,
          `${req.user?.firstName} ${req.user?.lastName}`,
          ipAddress,
        )
      res.status(200).json({ success: true, message: 'User has been deleted' })
      break
    }
    default:
      res
        .status(400)
        .json({ success: false, message: 'Invalid step. Please provide step 1, 2, or 3.' })
  }
})

export const heartbeat = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.user.update({
    where: { uuid: req.user!.uuid },
    data: { recentOnline: new Date() },
    select: { id: true },
  })
  res.status(200).json({ ok: true })
})

export const updateMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { firstname, lastname } = req.body
  const { ipAddress } = getClientMetadata(req)
  if (!firstname || !lastname) {
    res.status(400).json({ message: 'กรุณากรอกชื่อและนามสกุล' })
    return
  }
  if (firstname.length > 50 || lastname.length > 50) {
    res.status(400).json({ message: 'ชื่อหรือนามสกุลยาวเกินไป' })
    return
  }
  const updated = await prisma.user.update({
    where: { uuid: req.user?.uuid },
    select: { uuid: true, email: true, firstname: true, lastname: true, role: true },
    data: { firstname: sanitizeText(firstname), lastname: sanitizeText(lastname) },
  })
  await logAudit(
    req,
    'UPDATE_PROFILE_SUCCESS',
    `User ${updated.email} updated their profile`,
    undefined,
  )
  res.status(200).json({ success: true, message: 'อัปเดตข้อมูลส่วนตัวสำเร็จ', data: updated })
})

export const supervisorOTPAction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const uuid = paramStr(req, 'uuid')
  const { otpToken, reason } = req.body
  const { ipAddress } = getClientMetadata(req)
  if (!otpToken || !reason || !reason.trim()) {
    res.status(400).json({ message: 'กรุณากรอก OTP และเหตุผล' })
    return
  }
  const requester = await prisma.user.findUnique({ where: { uuid: req.user?.uuid } })
  if (!requester || requester.role !== 'SUPERVISOR') {
    res.status(403).json({ message: 'เฉพาะ Supervisor เท่านั้น' })
    return
  }
  const target = await prisma.user.findUnique({ where: { uuid } })
  if (!target || target.role !== 'SUPERVISOR') {
    res.status(404).json({ message: 'ไม่พบบัญชี Supervisor เป้าหมาย' })
    return
  }
  if (target.uuid === requester.uuid) {
    res.status(400).json({ message: 'ไม่สามารถดำเนินการกับตนเองได้' })
    return
  }
  if (target.status !== 'Inactive') {
    res.status(400).json({ message: 'สมาชิกนี้ยังไม่ได้ถูกระงับ' })
    return
  }
  if (!requester.twoFactorSecret) {
    res.status(400).json({ message: 'คุณยังไม่ได้ตั้งค่า 2FA' })
    return
  }
  const isValidOTP = speakeasy.totp.verify({
    secret: requester.twoFactorSecret,
    encoding: 'base32',
    token: otpToken,
    window: 1,
  })
  if (!isValidOTP) {
    await logAudit(
      req,
      'OTP_ACTION_FAILED',
      `Supervisor ${requester.email} attempted to unban ${target.email} but OTP was invalid`,
      requester.id,
    )
    res.status(400).json({ message: 'รหัส OTP ไม่ถูกต้อง' })
    return
  }
  await prisma.user.update({ where: { id: target.id }, data: { status: 'Active' } })
  await revokeAllUserSessions(target.id)
  await logAudit(
    req,
    'OTP_ACTION_UNBAN_SUCCESS',
    `Supervisor ${requester.email} unbanned ${target.email} via OTP. Reason: ${reason}`,
    requester.id,
  )
  res.status(200).json({
    success: true,
    message: 'ปลดระงับการใช้งานสำเร็จ',
    data: { action: 'unban', target: target.email },
  })
})

export const forceLogoutUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const uuid = paramStr(req, 'uuid')
  const { otpToken, reason } = req.body
  const { ipAddress } = getClientMetadata(req)
  if (!otpToken || !reason || !reason.trim()) {
    res.status(400).json({ message: 'กรุณากรอก OTP และเหตุผล' })
    return
  }
  const requester = await prisma.user.findUnique({ where: { uuid: req.user?.uuid } })
  if (!requester || requester.role !== 'SUPERVISOR') {
    res.status(403).json({ message: 'เฉพาะ Supervisor เท่านั้น' })
    return
  }
  const target = await prisma.user.findUnique({ where: { uuid } })
  if (!target) {
    res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้เป้าหมาย' })
    return
  }
  if (target.uuid === requester.uuid) {
    res.status(400).json({ message: 'ไม่สามารถดำเนินการกับตนเองได้' })
    return
  }
  if (!requester.twoFactorSecret) {
    res.status(400).json({ message: 'คุณยังไม่ได้ตั้งค่า 2FA' })
    return
  }
  const isValidOTP = speakeasy.totp.verify({
    secret: requester.twoFactorSecret,
    encoding: 'base32',
    token: otpToken,
    window: 1,
  })
  if (!isValidOTP) {
    await logAudit(
      req,
      'FORCE_LOGOUT_FAILED',
      `Supervisor ${requester.email} attempted to force logout ${target.email} but OTP was invalid`,
      requester.id,
    )
    res.status(400).json({ message: 'รหัส OTP ไม่ถูกต้อง' })
    return
  }
  await revokeAllUserSessions(target.id)
  await logAudit(
    req,
    'FORCE_LOGOUT_SUCCESS',
    `Supervisor ${requester.email} force logged out ${target.email}. Reason: ${reason}`,
    requester.id,
  )
  res.status(200).json({
    success: true,
    message: 'บังคับออกจากระบบสำเร็จ',
    data: { target: target.email, sessionsRevoked: true },
  })
})
