// middlewares/session.ts
import crypto from 'crypto'
import { NextFunction, Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from './auth'

const SUPERVISOR_MAX_SESSIONS = 1
const ADMIN_MAX_SESSIONS = 3
const SESSION_INACTIVITY_MS = 30 * 60 * 1000
const SUPERVISOR_INACTIVITY_MS = 15 * 60 * 1000

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export const createSession = async (
  userId: number,
  token: string,
  ipAddress: string,
  userAgent: string,
  expiresInHours: number,
): Promise<void> => {
  const tokenHash = hashToken(token)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + expiresInHours)

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      ipAddress,
      userAgent,
      expiresAt,
      lastActiveAt: new Date(),
    },
  })
}

export const validateAndUpdateSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies.token
    if (!token) {
      next()
      return
    }

    const tokenHash = hashToken(token)
    const session = await prisma.session.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    })

    if (!session) {
      next()
      return
    }

    const inactivityMs =
      session.user.role === 'SUPERVISOR'
        ? SUPERVISOR_INACTIVITY_MS
        : SESSION_INACTIVITY_MS

    const lastActive = new Date(session.lastActiveAt)
    const now = new Date()

    if (now.getTime() - lastActive.getTime() > inactivityMs) {
      await prisma.session.delete({ where: { id: session.id } })
      res.clearCookie('token')
      res.status(401).json({ message: 'Session expired due to inactivity' })
      return
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: now },
    })

    req.session = { id: session.id, userId: session.userId }
    next()
  } catch (error) {
    console.error('Session validation error:', error)
    next()
  }
}

export const checkSessionLimit = async (
  userId: number,
  role: string,
): Promise<{
  allowed: boolean
  currentSessions: number
  maxSessions: number
}> => {
  const activeSessions = await prisma.session.count({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
  })

  const maxSessions =
    role === 'SUPERVISOR' ? SUPERVISOR_MAX_SESSIONS : ADMIN_MAX_SESSIONS
  const allowed = activeSessions < maxSessions

  return { allowed, currentSessions: activeSessions, maxSessions }
}

export const revokeAllUserSessions = async (userId: number): Promise<void> => {
  await prisma.session.deleteMany({
    where: { userId },
  })
}

export const revokeOtherSessions = async (
  userId: number,
  currentSessionId: string,
): Promise<void> => {
  await prisma.session.deleteMany({
    where: {
      userId,
      id: { not: currentSessionId },
    },
  })
}

export const cleanupExpiredSessions = async (): Promise<void> => {
  await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
}
