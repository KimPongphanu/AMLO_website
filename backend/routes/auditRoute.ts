// routes/auditRoute.ts
import express, { Request, Response, Router } from 'express'
import asyncHandler from 'express-async-handler'
import prisma from '../lib/prisma'
import auth, { restrictTo } from '../middlewares/auth'

const router: Router = express.Router()

router.get(
  '/',
  auth,
  restrictTo('SUPERVISOR'),
  asyncHandler(async (req: Request, res: Response) => {
    let userId: number | undefined = undefined
    if (req.query.userId) {
      const parsed = Number(req.query.userId)
      if (!isNaN(parsed)) {
        userId = parsed
      }
    }
    // รองรับการค้นหาผ่าน UUID (จาก Frontend UserAuditLog)
    if (!userId && req.query.uuid) {
      const user = await prisma.user.findUnique({
        where: { uuid: req.query.uuid as string },
        select: { id: true },
      })
      if (user) userId = user.id
    }
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50))
    const sortField = (req.query.sort as string) || 'createdAt'
    const sortOrder = (req.query.order as string) === 'asc' ? 'asc' : 'desc'
    const skip = (page - 1) * limit

    const validSortFields = ['createdAt', 'action', 'ipAddress'] as const
    const orderBy: Record<string, 'asc' | 'desc'> = validSortFields.includes(
      sortField as (typeof validSortFields)[number],
    )
      ? { [sortField]: sortOrder as 'asc' | 'desc' }
      : { createdAt: 'desc' }

    const action = req.query.action as string | undefined
    const q = req.query.q as string | undefined
    const dateFrom = req.query.dateFrom as string | undefined
    const dateTo = req.query.dateTo as string | undefined
    const region = req.query.region as string | undefined
    const serverIp = req.query.serverIp as string | undefined

    const where: any = {}
    if (userId) where.userId = userId
    if (action && action !== 'all') where.action = action
    if (q && q.trim()) {
      const searchTerm = q.trim()
      where.OR = [
        { action: { contains: searchTerm, mode: 'insensitive' } },
        { details: { contains: searchTerm, mode: 'insensitive' } },
        { ipAddress: { contains: searchTerm } },
        { serverIp: { contains: searchTerm } },
        { region: { contains: searchTerm, mode: 'insensitive' } },
        { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
      ]
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }
    if (region && region.trim()) {
      where.region = { contains: region.trim(), mode: 'insensitive' }
    }
    if (serverIp && serverIp.trim()) {
      where.serverIp = { contains: serverIp.trim() }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              email: true,
              firstname: true,
              lastname: true,
            },
          },
        },
        omit: {
          // ไม่ต้องเลือก field ที่ไม่จำเป็น (ถ้ามี)
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  }),
)

export default router
