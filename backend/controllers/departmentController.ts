import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import DOMPurify from 'isomorphic-dompurify'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth'
import * as contentService from '../services/contentService'
import { logAudit } from '../utils/auditLogger'
import { getClientMetadata } from '../utils/ipSelector'
import { sanitizeText } from '../utils/sanitizer'

export const createDepartment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { ipAddress } = getClientMetadata(req)
  const { title, content, galleryUrls } = req.body
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined
  if (!title) {
    res.status(400).json({ message: 'กรุณากรอกหัวข้อภาควิชา' })
    return
  }
  if (title.length > 150) {
    res.status(400).json({ message: 'หัวข้อยาวเกินกำหนด' })
    return
  }
  const safeTitle = sanitizeText(title)
  if (!files || !files['cover_image']) {
    res.status(400).json({ message: 'กรุณาอัปโหลดรูปภาพปก (cover_image)' })
    return
  }
  const sanitizedContent = content ? DOMPurify.sanitize(content) : null

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
  for (const file of [...files['cover_image'], ...(files['gallery'] || [])]) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      res.status(400).json({ message: `ไฟล์ ${file.originalname} ไม่รองรับ` })
      return
    }
  }

  const coverImagePath = `/uploads/${files['cover_image'][0].filename}`
  const galleryData = [
    ...(files['gallery'] || []).map((f) => ({
      url: `/uploads/${f.filename}`,
      type: f.mimetype.startsWith('video/') ? ('VIDEO' as const) : ('IMAGE' as const),
    })),
    ...(Array.isArray(galleryUrls) ? galleryUrls : galleryUrls ? [galleryUrls] : []).map((url) => ({
      url,
      type: 'VIDEO' as const,
    })),
  ]

  const department = await contentService.createDepartment({
    title: safeTitle,
    content,
    coverImagePath,
    galleryData,
  })
  const adminUser = await prisma.user.findUnique({ where: { uuid: req.user?.uuid } })
  await logAudit(
    req,
    'CREATE_DEPARTMENT_SUCCESS',
    `Admin created a new department: "${safeTitle}" (Department ID: ${department.id})`,
    adminUser?.id,
  )
  res.status(201).json({
    message: 'สร้างภาควิชาสำเร็จ',
    data: {
      ...department,
      gallery: department.GalleryItem.map((g: any) => ({ ...g, type: g.type.toLowerCase() })),
    },
  })
})

export const getDepartments = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(String(req.query.page)) || 1
  const limit = parseInt(String(req.query.limit)) || 20
  const all = req.query.all === 'true'
  const result = await contentService.getDepartments(page, limit, all)
  const formattedDepartments = result.departments.map((d: any) => ({
    ...d,
    gallery: d.GalleryItem.map((g: any) => ({ ...g, type: g.type.toLowerCase() })),
  }))
  res.status(200).json({
    success: true,
    data: formattedDepartments,
    pagination: { total: result.total, page: result.page, totalPages: result.totalPages },
  })
})

export const deleteDepartment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id))
  if (isNaN(id)) {
    res.status(400).json({ message: 'ID ไม่ถูกต้อง' })
    return
  }
  await contentService.deleteDepartment(id)
  const adminUser = await prisma.user.findUnique({ where: { uuid: req.user?.uuid } })
  await logAudit(
    req,
    'DELETE_DEPARTMENT_SUCCESS',
    `Admin deleted department (ID: ${id})`,
    adminUser?.id,
  )
  res.status(200).json({ message: 'ลบหน่วยงานสำเร็จ' })
})

export const updateDepartment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id))
  if (isNaN(id)) {
    res.status(400).json({ message: 'ID ไม่ถูกต้อง' })
    return
  }
  const { title, content } = req.body
  if (!title) {
    res.status(400).json({ message: 'กรุณากรอกหัวข้อภาควิชา' })
    return
  }
  if (title.length > 150) {
    res.status(400).json({ message: 'หัวข้อยาวเกินกำหนด' })
    return
  }
  const existingDept = await prisma.department.findUnique({ where: { id } })
  if (!existingDept) {
    res.status(404).json({ message: 'ไม่พบหน่วยงานที่ต้องการแก้ไข' })
    return
  }
  const safeTitle = sanitizeText(title)
  const sanitizedContent = content ? DOMPurify.sanitize(content) : null

  const updatedDept = await prisma.department.update({
    where: { id },
    data: { title: safeTitle, content: sanitizedContent },
    include: { GalleryItem: true },
  })
  const adminUser = await prisma.user.findUnique({ where: { uuid: req.user?.uuid } })
  await logAudit(
    req,
    'UPDATE_DEPARTMENT_SUCCESS',
    `Admin updated department: "${safeTitle}" (ID: ${id})`,
    adminUser?.id,
  )
  res.status(200).json({
    message: 'แก้ไขหน่วยงานสำเร็จ',
    data: {
      ...updatedDept,
      gallery: updatedDept.GalleryItem.map((g: any) => ({ ...g, type: g.type.toLowerCase() })),
    },
  })
})
