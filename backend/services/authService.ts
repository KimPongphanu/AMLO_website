// services/authService.ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import { AppError } from '../utils/AppError'
import {
  PASSWORD_HISTORY_CHECK_COUNT,
  TOKEN_EXPIRY_ADMIN,
  TOKEN_EXPIRY_SUPERVISOR,
} from '../utils/constants'

export interface LoginResult {
  user: {
    uuid: string
    email: string
    firstname: string
    lastname: string
    role: string
    forcePasswordReset: boolean
    twoFactorEnabled: boolean
    twoFactorMethod: string
  }
  requires2FA: boolean
  twoFactorMethod?: string
  tempToken?: string
}

export const authenticateUser = async (
  email: string,
  password: string,
  ipAddress: string,
): Promise<LoginResult> => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid email or password', 401)
  }

  if (user.status === 'Inactive') {
    throw new AppError('บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ', 403)
  }

  // Check if 2FA is required
  if (user.twoFactorEnabled && user.twoFactorMethod !== 'NONE') {
    const tempToken = jwt.sign(
      { userId: user.id, purpose: '2fa_verification' },
      process.env.JWT_SECRET!,
      { expiresIn: '5m' },
    )
    return {
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
      requires2FA: true,
      twoFactorMethod: user.twoFactorMethod,
      tempToken,
    }
  }

  return {
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
    requires2FA: false,
  }
}

export const generateToken = (user: {
  uuid: string
  email: string
  firstname: string
  lastname: string
  role: string
}): string => {
  const expiresIn = user.role === 'SUPERVISOR' ? TOKEN_EXPIRY_SUPERVISOR : TOKEN_EXPIRY_ADMIN
  return jwt.sign(
    {
      uuid: user.uuid,
      email: user.email,
      firstName: user.firstname,
      lastName: user.lastname,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn },
  )
}

export const checkPasswordHistory = async (
  userId: number,
  newPassword: string,
): Promise<boolean> => {
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: PASSWORD_HISTORY_CHECK_COUNT,
  })

  for (const record of history) {
    if (await bcrypt.compare(newPassword, record.passwordHash)) {
      return false // Password was used before
    }
  }
  return true
}
