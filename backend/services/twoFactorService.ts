// services/twoFactorService.ts
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import speakeasy from 'speakeasy'
import prisma from '../lib/prisma'
import { sendOTPEmail } from './emailService'

export const generateTOTPSecret = (email: string) => {
  const secret = speakeasy.generateSecret({
    name: `AMLO System (${email})`,
    length: 20,
  })
  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url || '',
  }
}

export const verifyTOTP = (token: string, secret: string): boolean => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1,
  })
}

export const generateEmailOTP = async (email: string): Promise<void> => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  const hashedOtp = await bcrypt.hash(otp, 12)

  await prisma.email_otps.create({
    data: {
      email: email.toLowerCase(),
      otp: hashedOtp,
      expiresAt,
      used: false,
    },
  })

  // 🔴 DEVELOPMENT ONLY: Log OTP to console for debugging
  // ⚠️ CRITICAL: This must NEVER be enabled in production!
  // If NODE_ENV is 'production', this block is completely skipped.
  if (process.env.NODE_ENV !== 'production') {
    // Only log in local development (not in test, staging, or CI)
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      const separator = '='.repeat(60)
      console.warn(
        '⚠️  [DEV ONLY] OTP displayed for debugging — DO NOT USE IN PRODUCTION',
      )
      console.log(separator)
      console.log(`🔐 [OTP] Email: ${email}`)
      console.log(`🔐 [OTP] Code:  ${otp}`)
      console.log(`🔐 [OTP] Expires at: ${expiresAt.toISOString()}`)
      console.log(`🔐 [OTP] Valid for: 5 minutes`)
      console.log(separator)
    }
  }

  try {
    await sendOTPEmail(email, otp, 5)
    console.log(`[OTP] Email sent successfully to ${email}`)
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[OTP] Email sending failed (SMTP not configured).`)
      console.log(`[OTP] Use the OTP code from console above: ${otp}`)
    } else {
      console.error(`[OTP] Email sending failed for ${email}`)
    }
  }
}

export const verifyEmailOTP = async (
  email: string,
  otp: string,
): Promise<boolean> => {
  const records = await prisma.email_otps.findMany({
    where: {
      email: email.toLowerCase(),
      used: false,
      expiresAt: { gt: new Date() },
    },
  })

  for (const record of records) {
    const isMatch = await bcrypt.compare(otp, record.otp)
    if (isMatch) {
      await prisma.email_otps.update({
        where: { id: record.id },
        data: { used: true },
      })
      return true
    }
  }

  return false
}

export const generateRecoveryKeys = async (
  userId: number,
): Promise<string[]> => {
  const recoveryKeyStrings: string[] = []

  await prisma.recoveryKey.deleteMany({ where: { userId } })

  for (let i = 0; i < 8; i++) {
    const key = crypto.randomBytes(8).toString('hex').toUpperCase()
    const formatted = `${key.slice(0, 4)}-${key.slice(4, 8)}-${key.slice(8, 12)}-${key.slice(12, 16)}`
    recoveryKeyStrings.push(formatted)

    // Use bcrypt with 8 rounds to prevent CPU exhaustion
    const hashedKey = await bcrypt.hash(key, 8)
    await prisma.recoveryKey.create({
      data: {
        userId,
        keyHash: hashedKey,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
  }

  return recoveryKeyStrings
}

export const verifyRecoveryKey = async (
  userId: number,
  recoveryKey: string,
  req: any,
): Promise<boolean> => {
  const rawKey = recoveryKey.replace(/-/g, '').toUpperCase()

  // Fetch all valid (unused, not expired) recovery keys
  const records = await prisma.recoveryKey.findMany({
    where: {
      userId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  })

  // All keys are now bcrypt-hashed (both seed and runtime) for consistency
  for (const record of records) {
    const isMatch = await bcrypt
      .compare(rawKey, record.keyHash)
      .catch(() => false)
    if (isMatch) {
      await prisma.recoveryKey.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      })
      return true
    }
  }

  return false
}

export const enableTOTPForUser = async (
  userId: number,
  secret: string,
): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorMethod: 'AUTHENTICATOR',
      twoFactorSecret: secret,
    },
  })
}

export const disableTOTPForUser = async (userId: number): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorMethod: 'NONE',
      twoFactorSecret: null,
    },
  })
}
