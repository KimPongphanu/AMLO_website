import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth'
import * as contentService from '../services/contentService'
import { logAudit } from '../utils/auditLogger'

export const createNews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, content, type } = req.body
  if (!title || !description) {
    res.status(400).json({ message: 'กรุณากรอกหัวข้อและรายละเอียดสั้น' })
    return
  }
  if (title.length > 150 || description.length > 500) {
    res.status(400).json({ message: 'ตัวอักษรมีความยาวเกินกำหนด' })
    return
  }
  if (!req.file) {
    res.status(400).json({ message: 'กรุณาอัปโหลดรูปภาพหน้าปกข่าว' })
    return
  }
  const imagePath = `/uploads/${req.file.filename}`
  const news = await contentService.createNews({ title, description, content, type, imagePath })
  const adminUser = await prisma.user.findUnique({ where: { uuid: req.user?.uuid } })
  await logAudit(
    req,
    'CREATE_NEWS_SUCCESS',
    `Admin created a new news/event: "${title.trim()}" (ID: ${news.id}, Type: ${news.type})`,
    adminUser?.id,
  )
  res.status(201).json({ message: 'สร้างข่าวสารสำเร็จ', newsRef: news.id })
})

export const getNews = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(String(req.query.page)) || 1
  const limit = parseInt(String(req.query.limit)) || 10
  const type = String(req.query.type)
  const isAll = req.query.all === 'true'
  const whereCondition: any = {}
  if (!isAll) whereCondition.isShow = true
  if (type === 'PR' || type === 'NEWS') whereCondition.type = type

  const [newsList, totalItems] = await prisma.$transaction([
    prisma.news.findMany({
      where: whereCondition,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.news.count({ where: whereCondition }),
  ])
  res.status(200).json({
    success: true,
    data: newsList,
    pagination: { totalItems, currentPage: page, totalPages: Math.ceil(totalItems / limit) },
  })
})

export const updateNews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id))
  if (isNaN(id)) {
    res.status(400).json({ success: false, message: 'ID ไม่ถูกต้อง' })
    return
  }
  const { title, description, content, isShow, views, type, date } = req.body
  const updateData: any = { title, description, content, isShow, views, type, date }
  if (req.file) updateData.image_src = `/uploads/${req.file.filename}`
  const updatedNews = await contentService.updateNews(id, updateData)
  const adminUser = await prisma.user.findUnique({ where: { uuid: req.user?.uuid } })
  await logAudit(
    req,
    'UPDATE_NEWS_SUCCESS',
    `Admin updated news/event: (ID: ${id}, Title: "${updatedNews.title}", Image updated: ${req.file ? 'Yes' : 'No'})`,
    adminUser?.id,
  )
  res.status(200).json({ success: true, message: 'แก้ไขข้อมูลเสร็จสิ้น', data: updatedNews })
})
