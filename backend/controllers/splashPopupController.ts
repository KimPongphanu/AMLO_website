import { NextFunction, Request, Response } from 'express'
import fs from 'fs/promises'
import path from 'path'
import * as contentService from '../services/contentService'
import { AppError } from '../utils/AppError'
import { sanitizeText } from '../utils/sanitizer'

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads')

function assertPathInsideUploads(filePath: string): void {
  const resolved = path.resolve(process.cwd(), filePath)
  if (!resolved.startsWith(UPLOADS_DIR)) throw new AppError('Invalid file path', 400)
}

function sanitizeFilename(name: string): string {
  return path.basename(name).replace(/[^a-zA-Z0-9.\-_]/g, '')
}

export const getAllPopups = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const popups = await contentService.getAllPopups()
  res.status(200).json({ success: true, data: popups })
}

export const getActivePopup = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const popup = await contentService.getActivePopup()
  res.status(200).json({ success: true, data: popup || null })
}

export const createPopup = async (
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
  const safeFilename = sanitizeFilename(file.filename)
  const title = typeof req.body.title === 'string' ? sanitizeText(req.body.title) : ''
  const popup = await contentService.createPopup(`/uploads/${safeFilename}`, title)
  res.status(201).json({ success: true, data: popup })
}

export const updatePopup = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id) || id <= 0) throw new AppError('ID ไม่ถูกต้อง', 400)
  const data: { title?: string; isActive?: boolean } = {}
  if (typeof req.body.title === 'string') data.title = req.body.title
  if (typeof req.body.isActive === 'boolean') data.isActive = req.body.isActive
  const updated = await contentService.updatePopup(id, data)
  res.status(200).json({ success: true, data: updated })
}

export const deletePopup = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id) || id <= 0) throw new AppError('ID ไม่ถูกต้อง', 400)
  await contentService.deletePopup(id)
  res.status(200).json({ success: true, message: 'ลบ Popup สำเร็จ' })
}
