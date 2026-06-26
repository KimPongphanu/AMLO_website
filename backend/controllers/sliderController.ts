import { NextFunction, Request, Response } from 'express'
import fs from 'fs/promises'
import path from 'path'
import prisma from '../lib/prisma'
import * as contentService from '../services/contentService'
import { AppError } from '../utils/AppError'

export const getAllSlides = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const slides = await contentService.getSlides()
  res.status(200).json({ success: true, data: slides })
}

export const createSlide = async (
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
  const maxOrder = await prisma.slider_images.aggregate({ _max: { order: true } })
  const nextOrder = (maxOrder._max.order ?? -1) + 1
  const sanitizedFilename = file.filename.replace(/[^a-zA-Z0-9.\-_]/g, '')
  const newSlide = await prisma.slider_images.create({
    data: { image_url: `/uploads/${sanitizedFilename}`, order: nextOrder },
  })
  res.status(201).json({ success: true, data: newSlide })
}

export const reorderSlides = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { orderedIds } = req.body as { orderedIds: number[] }
  if (!Array.isArray(orderedIds)) throw new AppError('ข้อมูลลำดับต้องเป็น array', 400)
  if (orderedIds.length === 0) throw new AppError('ข้อมูลลำดับไม่ถูกต้อง', 400)
  if (!orderedIds.every((id: unknown) => typeof id === 'number' && Number.isInteger(id) && id > 0))
    throw new AppError('ข้อมูล ID ไม่ถูกต้อง', 400)
  const existingSlides = await prisma.slider_images.findMany({
    where: { id: { in: orderedIds } },
    select: { id: true },
  })
  const existingIds = new Set(existingSlides.map((s) => s.id))
  const invalidIds = orderedIds.filter((id) => !existingIds.has(id))
  if (invalidIds.length > 0) throw new AppError(`ไม่พบสไลด์ ID: ${invalidIds.join(', ')}`, 404)
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.slider_images.update({ where: { id }, data: { order: index } }),
    ),
  )
  res.status(200).json({ success: true, message: 'บันทึกลำดับสำเร็จ' })
}

export const deleteSlide = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id) || id <= 0 || !Number.isInteger(id)) throw new AppError('ID ไม่ถูกต้อง', 400)
  const slide = await prisma.slider_images.findUnique({ where: { id } })
  if (!slide) throw new AppError('ไม่พบสไลด์ที่ต้องการลบ', 404)
  if (slide.image_url) {
    const resolved = path.resolve(process.cwd(), slide.image_url)
    const uploadsDir = path.resolve(process.cwd(), 'uploads')
    if (!resolved.startsWith(uploadsDir)) throw new AppError('Invalid file path', 400)
    await fs.unlink(resolved).catch(() => {})
  }
  await prisma.slider_images.delete({ where: { id } })
  res.status(200).json({ success: true, message: 'ลบสไลด์สำเร็จ' })
}
