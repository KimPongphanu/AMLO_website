import { NextFunction, Request, Response } from 'express'
import * as contentService from '../services/contentService'
import { AppError } from '../utils/AppError'

export const getAllSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const settings = await contentService.getAllSettings()
    res.status(200).json({ success: true, data: settings })
  } catch (err: any) {
    next(new AppError(err.message, 500))
  }
}

export const updateSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { settings } = req.body as { settings: { key: string; value: string }[] }
  if (!Array.isArray(settings)) throw new AppError('ข้อมูล settings ต้องเป็น array', 400)
  for (const item of settings) {
    if (typeof item.key !== 'string' || typeof item.value !== 'string')
      throw new AppError('ข้อมูล key และ value ต้องเป็น string', 400)
  }
  const map = await contentService.updateSettings(settings)
  res.status(200).json({ success: true, data: map, message: 'บันทึกการตั้งค่าสำเร็จ' })
}
