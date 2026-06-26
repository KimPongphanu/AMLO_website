// routes/uploadRoute.ts
import express, { Request, Response, Router } from 'express'
import asyncHandler from 'express-async-handler' // 🌟 นำเข้า asyncHandler
import { uploadLimiter } from '../middlewares/rateLimiter'
import upload from '../middlewares/upload' // นำเข้า multer middleware แบบ ES Modules

const router: Router = express.Router()

/**
 * @ROUTE   POST /api/upload/single
 * @DESC    1. อัปโหลดไฟล์เดียว (Single File) - คีย์ต้องชื่อว่า 'singleFile'
 */
router.post(
  '/single',
  uploadLimiter,
  upload.single('singleFile'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ message: 'กรุณาอัปโหลดไฟล์' })
      return
    }

    res.status(200).json({
      message: 'อัปโหลดไฟล์เดียวสำเร็จ!',
      fileInfo: req.file,
    })
  }),
)

/**
 * @ROUTE   POST /api/upload/multiple
 * @DESC    2. อัปโหลดหลายไฟล์ (Multiple Files) - คีย์ต้องชื่อว่า 'multipleFiles' สูงสุด 5 ไฟล์
 */
router.post(
  '/multiple',
  upload.array('multipleFiles', 5),
  asyncHandler(async (req: Request, res: Response) => {
    // กำหนด Type ให้ชัดเจนว่าเป็น Array ของ Multer File
    const files = req.files as Express.Multer.File[] | undefined

    if (!files || files.length === 0) {
      res.status(400).json({ message: 'กรุณาอัปโหลดอย่างน้อย 1 ไฟล์' })
      return
    }

    res.status(200).json({
      message: 'อัปโหลดหลายไฟล์สำเร็จ!',
      filesInfo: files,
    })
  }),
)

export default router
