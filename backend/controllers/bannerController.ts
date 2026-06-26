import { NextFunction, Request, Response } from 'express'
import fs from 'fs/promises'
import path from 'path'
import prisma from '../lib/prisma'
import * as contentService from '../services/contentService'
import { AppError } from '../utils/AppError'

export const getAllBanners = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { all } = req.query
  try {
    const banners = await contentService.getAllBanners(all === 'true')
    res.status(200).json({ success: true, data: banners })
  } catch (err: any) {
    next(new AppError(err.message, 500))
  }
}

export const createBanner = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const file = req.file
  if (!file) throw new AppError('กรุณาอัปโหลดรูปภาพ', 400)
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedMimeTypes.includes(file.mimetype)) {
    await fs.unlink(path.join(process.cwd(), file.path)).catch(() => {})
    throw new AppError('รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WEBP เท่านั้น', 400)
  }
  const MAX_FILE_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_FILE_SIZE) {
    await fs.unlink(path.join(process.cwd(), file.path)).catch(() => {})
    throw new AppError('ขนาดไฟล์ต้องไม่เกิน 5MB', 400)
  }
  const sanitizedFilename = file.filename.replace(/[^a-zA-Z0-9.\-_]/g, '')
  const title = typeof req.body.title === 'string' ? req.body.title : ''
  const link_url = typeof req.body.link_url === 'string' ? req.body.link_url : ''
  const newBanner = await contentService.createBanner({
    title,
    link_url,
    imagePath: `/uploads/${sanitizedFilename}`,
  })
  res.status(201).json({ success: true, data: newBanner })
}

export const reorderBanners = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { orderedIds } = req.body as { orderedIds: number[] }
  if (!Array.isArray(orderedIds)) throw new AppError('ข้อมูลลำดับต้องเป็น array', 400)
  if (orderedIds.length === 0) throw new AppError('ข้อมูลลำดับไม่ถูกต้อง', 400)
  if (!orderedIds.every((id: unknown) => typeof id === 'number' && Number.isInteger(id) && id > 0))
    throw new AppError('ข้อมูล ID ไม่ถูกต้อง', 400)
  const existingBanners = await prisma.banners.findMany({
    where: { id: { in: orderedIds } },
    select: { id: true },
  })
  const existingIds = new Set(existingBanners.map((s) => s.id))
  const invalidIds = orderedIds.filter((id) => !existingIds.has(id))
  if (invalidIds.length > 0) throw new AppError(`ไม่พบ Banner ID: ${invalidIds.join(', ')}`, 404)
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.banners.update({ where: { id }, data: { order: index } })),
  )
  res.status(200).json({ success: true, message: 'บันทึกลำดับสำเร็จ' })
}

export const updateBanner = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id) || id <= 0) throw new AppError('ID ไม่ถูกต้อง', 400)
  const title = typeof req.body.title === 'string' ? req.body.title : undefined
  const link_url = typeof req.body.link_url === 'string' ? req.body.link_url : undefined
  const updated = await contentService.updateBanner(id, { title, link_url })
  res.status(200).json({ success: true, data: updated })
}

export const toggleBannerVisibility = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id) || id <= 0) throw new AppError('ID ไม่ถูกต้อง', 400)
  const updated = await contentService.toggleBannerVisibility(id)
  res.status(200).json({ success: true, data: updated })
}

export const deleteBanner = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id) || id <= 0 || !Number.isInteger(id)) throw new AppError('ID ไม่ถูกต้อง', 400)
  await contentService.deleteBanner(id)
  res.status(200).json({ success: true, message: 'ลบ Banner สำเร็จ' })
}
