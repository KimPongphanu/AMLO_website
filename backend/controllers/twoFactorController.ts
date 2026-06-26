// controllers/twoFactorController.ts
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth'
import { sendLoginAlertEmail } from '../services/emailService'
import {
  disableTOTPForUser,
  enableTOTPForUser,
  generateEmailOTP,
  generateRecoveryKeys,
  generateTOTPSecret,
  verifyEmailOTP,
  verifyRecoveryKey,
  verifyTOTP,
} from '../services/twoFactorService'
import { logAudit } from '../utils/auditLogger'
import { getClientMetadata } from '../utils/ipSelector'

interface Enable2FABody {
  otpToken: string
}

interface Disable2FABody {
  recoveryKey?: string
  otpToken?: string
}

interface Verify2FABody {
  otpToken: string
  tempToken?: string
}

interface RequestOTPBody {
  email: string
}

interface VerifyOTPBody {
  email: string
  otp: string
  tempToken?: string
}

export const SALT_ROUNDS = 10

export const setup2FA = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { uuid: req.user?.uuid },
    })

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    if (user.role !== 'SUPERVISOR') {
      res.status(403).json({
        message: '2FA with Authenticator is only for Supervisor accounts',
      })
      return
    }

    // ✅ Use existing secret if already saved, otherwise generate new one
    let secret = user.twoFactorSecret
    let otpauthUrl = ''

    if (!secret) {
      const generated = generateTOTPSecret(user.email)
      secret = generated.secret
      otpauthUrl = generated.otpauthUrl

      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: secret },
      })
    } else {
      // Rebuild otpauthUrl from existing secret (same secret every time)
      otpauthUrl = speakeasy.otpauthURL({
        secret: secret,
        label: `AMLO System (${user.email})`,
        encoding: 'base32',
      })
    }

    res.status(200).json({
      success: true,
      data: {
        secret,
        otpauthUrl,
        qrCodeDataUrl: null,
      },
      message:
        'Scan QR code with Google Authenticator or Microsoft Authenticator',
    })
  },
)

export const enable2FA = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { otpToken } = req.body as Enable2FABody
    const { ipAddress, userAgent } = getClientMetadata(req)

    if (!otpToken) {
      res.status(400).json({ message: 'OTP token is required' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { uuid: req.user?.uuid },
    })

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    if (!user.twoFactorSecret) {
      res.status(400).json({ message: 'Please setup 2FA first' })
      return
    }

    const isValid = verifyTOTP(otpToken, user.twoFactorSecret)

    if (!isValid) {
      res.status(400).json({ message: 'Invalid OTP token' })
      return
    }

    await enableTOTPForUser(user.id, user.twoFactorSecret)

    const recoveryKeys = await generateRecoveryKeys(user.id)

    await logAudit(
      req,
      'ENABLE_2FA_SUCCESS',
      `User enabled 2FA (Authenticator) for account: ${user.email}`,
      user.id,
    )

    res.status(200).json({
      success: true,
      message: '2FA enabled successfully. Save your recovery keys.',
      data: {
        recoveryKeys,
      },
    })
  },
)

export const disable2FA = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { recoveryKey, otpToken } = req.body as Disable2FABody
    const { ipAddress, userAgent } = getClientMetadata(req)

    const user = await prisma.user.findUnique({
      where: { uuid: req.user?.uuid },
    })

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    let isVerified = false

    if (otpToken && user.twoFactorSecret) {
      isVerified = verifyTOTP(otpToken, user.twoFactorSecret)
    }

    if (!isVerified && recoveryKey) {
      isVerified = await verifyRecoveryKey(user.id, recoveryKey, req)
    }

    if (!isVerified) {
      res.status(400).json({ message: 'Invalid OTP token or recovery key' })
      return
    }

    await disableTOTPForUser(user.id)

    await logAudit(
      req,
      'DISABLE_2FA_SUCCESS',
      `User disabled 2FA for account: ${user.email}`,
      user.id,
    )

    res.status(200).json({
      success: true,
      message: '2FA disabled successfully',
    })
  },
)

export const getRecoveryKeys = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { uuid: req.user?.uuid },
    })

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    const recoveryKeys = await prisma.recoveryKey.findMany({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    res.status(200).json({
      success: true,
      data: {
        count: recoveryKeys.length,
        available: recoveryKeys.length > 0,
      },
    })
  },
)

export const regenerateRecoveryKeys = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { uuid: req.user?.uuid },
    })

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    if (!user.twoFactorEnabled) {
      res
        .status(400)
        .json({ message: '2FA must be enabled to generate recovery keys' })
      return
    }

    const newRecoveryKeys = await generateRecoveryKeys(user.id)

    await logAudit(
      req,
      'REGENERATE_RECOVERY_KEYS',
      `User regenerated recovery keys for account: ${user.email}`,
      user.id,
    )

    res.status(200).json({
      success: true,
      message: 'New recovery keys generated. Save them immediately.',
      data: {
        recoveryKeys: newRecoveryKeys,
      },
    })
  },
)

export const requestEmailOTP = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body as RequestOTPBody

    if (!email) {
      res.status(400).json({ message: 'Email is required' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ' })
      return
    }

    await generateEmailOTP(email.toLowerCase())

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Valid for 5 minutes.',
    })
  },
)

export const verifyEmailOTPForLogin = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, otp } = req.body as VerifyOTPBody

    if (!email || !otp) {
      res.status(400).json({ message: 'Email and OTP are required' })
      return
    }

    const isValid = await verifyEmailOTP(email.toLowerCase(), otp)

    if (!isValid) {
      res.status(400).json({ message: 'Invalid or expired OTP' })
      return
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    })
  },
)

export const verify2FALogin = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { otpToken } = req.body as Verify2FABody

    if (!otpToken) {
      res.status(400).json({ message: 'OTP token is required' })
      return
    }

    const tempToken = req.cookies.temp_2fa_token
    if (!tempToken) {
      res
        .status(400)
        .json({ message: '2FA session expired. Please login again.' })
      return
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      res.status(500).json({ message: 'JWT secret configuration missing' })
      return
    }

    const decoded = jwt.verify(tempToken, secret) as {
      userId: number
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    let isValid = false

    if (user.twoFactorMethod === 'AUTHENTICATOR' && user.twoFactorSecret) {
      isValid = verifyTOTP(otpToken, user.twoFactorSecret)
    } else if (user.twoFactorMethod === 'EMAIL_OTP') {
      isValid = await verifyEmailOTP(user.email, otpToken)
    }

    if (!isValid) {
      res.status(400).json({ message: 'Invalid 2FA code' })
      return
    }

    const { ipAddress, userAgent } = getClientMetadata(req)

    const finalSecret = process.env.JWT_SECRET
    if (!finalSecret) {
      res.status(500).json({ message: 'JWT secret configuration missing' })
      return
    }

    const finalToken = jwt.sign(
      {
        uuid: user.uuid,
        email: user.email,
        firstName: user.firstname,
        lastName: user.lastname,
        role: user.role,
      },
      finalSecret,
      { expiresIn: user.role === 'SUPERVISOR' ? '4h' : '12h' },
    )

    res.cookie('token', finalToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:
        user.role === 'SUPERVISOR' ? 4 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000,
    })

    res.clearCookie('temp_2fa_token')

    await sendLoginAlertEmail(
      user.email,
      `${user.firstname} ${user.lastname}`,
      ipAddress,
      userAgent,
      new Date(),
    )

    await logAudit(
      req,
      'LOGIN_SUCCESS',
      'User logged in successfully with 2FA',
      user.id,
    )

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        uuid: user.uuid,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      },
    })
  },
)

export const useRecoveryKey = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, recoveryKey } = req.body

    if (!email || !recoveryKey) {
      res.status(400).json({ message: 'Email and recovery key are required' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user || user.role !== 'SUPERVISOR') {
      res.status(404).json({ message: 'Supervisor account not found' })
      return
    }

    const isValid = await verifyRecoveryKey(user.id, recoveryKey, req)

    if (!isValid) {
      await logAudit(
        req,
        'RECOVERY_KEY_FAILED',
        `Invalid recovery key used for ${email}`,
        user.id,
      )
      res.status(400).json({ message: 'Invalid or expired recovery key' })
      return
    }

    const resetSecret = process.env.JWT_SECRET
    if (!resetSecret) {
      res.status(500).json({ message: 'JWT secret configuration missing' })
      return
    }

    const tempToken = jwt.sign(
      { userId: user.id, purpose: 'password_reset' },
      resetSecret,
      { expiresIn: '15m' },
    )

    // Disable 2FA so user can login again with new password (without 2FA)
    await disableTOTPForUser(user.id)

    await logAudit(
      req,
      'RECOVERY_KEY_USED',
      `Recovery key used for ${email}. 2FA has been disabled.`,
      user.id,
    )

    res.status(200).json({
      success: true,
      message:
        'Recovery key verified. 2FA has been disabled. You can now reset your password.',
      data: { resetToken: tempToken },
    })
  },
)
