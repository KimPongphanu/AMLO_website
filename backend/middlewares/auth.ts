// middlewares/auth.ts - ตรวจสอบ export
import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'

export interface AuthRequest extends Request {
  user?: {
    uuid: string
    email: string
    firstName: string
    lastName: string
    role: string
  }
  session?: {
    id: string
    userId: number
  }
}

const hashToken = (token: string): string => {
  return require('crypto').createHash('sha256').update(token).digest('hex')
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies.token

    if (!token) {
      res.status(401).json({ message: 'Access Denied: No Token Provided' })
      return
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      res.status(500).json({ message: 'JWT Secret configuration missing' })
      return
    }

    const decoded = jwt.verify(token, secret) as {
      uuid: string
      email: string
      firstName: string
      lastName: string
      role: string
    }

    // 🌟 ตรวจสอบ JWT Blacklist (token ที่ถูก logout แล้ว)
    const isBlacklisted = await prisma.jwtBlacklist.findUnique({
      where: { token },
    })
    if (isBlacklisted) {
      res.clearCookie('token')
      res.status(401).json({ message: 'Token ถูกยกเลิกแล้ว กรุณาเข้าสู่ระบบใหม่' })
      return
    }

    // 🌟 เช็คสถานะผู้ใช้จาก Database (ban / forcePasswordReset)
    const user = await prisma.user.findUnique({
      where: { uuid: decoded.uuid },
      select: { status: true, forcePasswordReset: true },
    })

    if (!user) {
      res.clearCookie('token')
      res.status(401).json({ message: 'User account not found' })
      return
    }

    if (user.status === 'Inactive') {
      res.clearCookie('token')
      res.status(401).json({ message: 'บัญชีนี้ถูกระงับการใช้งาน' })
      return
    }

    req.user = decoded
    next()
  } catch (error) {
    res.clearCookie('token')
    res.status(401).json({ message: 'Invalid Token' })
  }
}

export const restrictTo = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
      })
      return
    }
    next()
  }
}

export const requireSupervisor = restrictTo('SUPERVISOR')
export const requireAdmin = restrictTo('ADMIN', 'SUPERVISOR')

// Default export for backward compatibility
const authMiddlewareExport = authMiddleware
export default authMiddlewareExport
