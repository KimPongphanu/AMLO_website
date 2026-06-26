// controllers/forceResetController.ts
import bcrypt from 'bcryptjs'
import { Response } from 'express'
import asyncHandler from 'express-async-handler'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth'
import { sendOTPEmail } from '../services/emailService'
import { logAudit } from '../utils/auditLogger'
import { getClientMetadata } from '../utils/ipSelector'
import { paramStr } from '../utils/reqHelpers'

const OTP_EXPIRE_MINUTES = 5

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * @ROUTE   POST /api/auth/users/:uuid/force-reset
 * @DESC    Supervisor forces a user to reset their password on next login
 * @ACCESS  Supervisor only (auth + requireSupervisor)
 */
export const forceResetUserPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const uuid = paramStr(req, 'uuid')
  const { ipAddress } = getClientMetadata(req)

  const user = await prisma.user.findUnique({ where: { uuid } })
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  if (user.role === 'SUPERVISOR') {
    res.status(403).json({ message: 'Cannot force reset a supervisor account' })
    return
  }

  // Invalidate all existing OTPs for this email
  await prisma.email_otps.updateMany({
    where: { email: user.email.toLowerCase(), used: false },
    data: { used: true },
  })

  // Generate new OTP and send to user's email
  const otp = generateOTP()
  const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000)
  const hashedOtp = await bcrypt.hash(otp, 10)

  await prisma.email_otps.create({
    data: {
      email: user.email.toLowerCase(),
      otp: hashedOtp, // Store hashed OTP for consistency with passwordResetController
      expiresAt,
    },
  })

  await sendOTPEmail(user.email, otp, OTP_EXPIRE_MINUTES) // Send plain OTP to user

  // Set forcePasswordReset flag on the user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      forcePasswordReset: true,
      passwordChangedAt: null,
    },
  })

  // Revoke all user sessions so they must log in again
  await prisma.session.deleteMany({
    where: { userId: user.id },
  })

  const supervisor = await prisma.user.findUnique({
    where: { uuid: req.user?.uuid },
  })

  await logAudit(
    req,
    'FORCE_RESET_PASSWORD',
    `Supervisor forced password reset for user: ${user.email} (User ID: ${user.id})`,
    supervisor?.id,
  )

  res.status(200).json({
    success: true,
    message: `Force password reset triggered. OTP sent to ${user.email}`,
  })
})

/**
 * @ROUTE   POST /api/auth/force-reset/send-otp
 * @DESC    Send OTP to the current user's email (called on page mount after forced reset)
 * @ACCESS  Authenticated user with forcePasswordReset flag
 */
export const sendForceResetOTP = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { uuid: req.user?.uuid },
  })

  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  if (!user.forcePasswordReset) {
    res.status(400).json({ message: 'No force password reset required' })
    return
  }

  // Invalidate old OTPs for this email
  await prisma.email_otps.updateMany({
    where: { email: user.email.toLowerCase(), used: false },
    data: { used: true },
  })

  // Generate new OTP
  const otp = generateOTP()
  const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000)
  const hashedOtp = await bcrypt.hash(otp, 10)

  await prisma.email_otps.create({
    data: {
      email: user.email.toLowerCase(),
      otp: hashedOtp, // Store hashed OTP
      expiresAt,
    },
  })

  await sendOTPEmail(user.email, otp, OTP_EXPIRE_MINUTES) // Send plain OTP to user

  res.status(200).json({
    success: true,
    message: 'OTP sent to your email',
    expiresInMinutes: OTP_EXPIRE_MINUTES,
  })
})

/**
 * @ROUTE   POST /api/auth/force-reset/resend-otp
 * @DESC    Resend new OTP (invalidates old one)
 * @ACCESS  Authenticated user with forcePasswordReset flag
 */
export const resendForceResetOTP = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { uuid: req.user?.uuid },
  })

  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  if (!user.forcePasswordReset) {
    res.status(400).json({ message: 'No force password reset required' })
    return
  }

  // Invalidate ALL existing unused OTPs for this email
  await prisma.email_otps.updateMany({
    where: { email: user.email.toLowerCase(), used: false },
    data: { used: true },
  })

  // Generate new OTP
  const otp = generateOTP()
  const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000)
  const hashedOtp = await bcrypt.hash(otp, 10)

  await prisma.email_otps.create({
    data: {
      email: user.email.toLowerCase(),
      otp: hashedOtp, // Store hashed OTP
      expiresAt,
    },
  })

  await sendOTPEmail(user.email, otp, OTP_EXPIRE_MINUTES) // Send plain OTP to user

  res.status(200).json({
    success: true,
    message: 'New OTP sent to your email',
    expiresInMinutes: OTP_EXPIRE_MINUTES,
  })
})

/**
 * @ROUTE   POST /api/auth/force-reset/verify
 * @DESC    Verify OTP and set new password. Also clears forcePasswordReset flag.
 * @ACCESS  Authenticated user with forcePasswordReset flag
 */
export const verifyForceResetOTP = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { otp, newPassword } = req.body
  const { ipAddress, userAgent } = getClientMetadata(req)

  const user = await prisma.user.findUnique({
    where: { uuid: req.user?.uuid },
  })

  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  if (!user.forcePasswordReset) {
    res.status(400).json({ message: 'No force password reset required' })
    return
  }

  if (!otp) {
    res.status(400).json({ message: 'OTP is required' })
    return
  }

  if (!newPassword) {
    res.status(400).json({ message: 'New password is required' })
    return
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  if (!passwordRegex.test(newPassword)) {
    res.status(400).json({
      message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัว ประกอบด้วยตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข',
    })
    return
  }

  // Verify OTP
  const emailOtps = await prisma.email_otps.findMany({
    where: {
      email: user.email.toLowerCase(),
      used: false,
      expiresAt: { gt: new Date() },
    },
  })

  // Verify OTP by comparing with bcrypt hash (matching passwordResetController approach)
  let matchedOtp: { id: string } | null = null
  for (const record of emailOtps) {
    if (await bcrypt.compare(otp, record.otp)) {
      matchedOtp = { id: record.id }
      break
    }
  }

  if (!matchedOtp) {
    res.status(400).json({ message: 'รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว' })
    return
  }

  // Mark OTP as used
  await prisma.email_otps.update({
    where: { id: matchedOtp.id },
    data: { used: true },
  })

  // Check password history (last 3 passwords)
  const history = await prisma.passwordHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  for (const record of history) {
    const isMatch = await bcrypt.compare(newPassword, record.passwordHash)
    if (isMatch) {
      res.status(400).json({
        message: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านก่อนหน้า 3 ครั้งล่าสุด',
      })
      return
    }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  // Update user: new password, clear forcePasswordReset, set passwordChangedAt
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      forcePasswordReset: false,
      passwordChangedAt: new Date(),
    },
  })

  // Add to password history
  await prisma.passwordHistory.create({
    data: {
      userId: user.id,
      passwordHash: hashedPassword,
    },
  })

  await logAudit(
    req,
    'FORCE_RESET_PASSWORD_SUCCESS',
    `Password reset successfully after force reset for user: ${user.email}`,
    user.id,
  )

  res.status(200).json({
    success: true,
    message: 'ตั้งรหัสผ่านใหม่สำเร็จ',
  })
})
