// routes/fileRoute.ts
import express, { Response, Router } from 'express'
import asyncHandler from 'express-async-handler' // 🌟 นำเข้า asyncHandler
import path from 'path'
import auth, { AuthRequest } from '../middlewares/auth'

const router: Router = express.Router()

router.get(
  '/private/:filename',
  auth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // 🌟 ใช้ path.basename() เพื่อสกัดเอาแค่ชื่อไฟล์ ป้องกัน Path Traversal (เช่น ../../.env)
    const fileName = path.basename(req.params.filename as string)

    // เมื่อถูกคลีนแล้ว นำไปต่อกับ Path หลักของโฟลเดอร์ได้อย่างปลอดภัย
    const filePath = path.join(__dirname, '../private_uploads', fileName)

    // 🌟 ส่งไฟล์พร้อมดักจับ Error กรณีไม่พบไฟล์
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).json({ success: false, message: 'ไม่พบไฟล์ที่ต้องการ' })
      }
    })
  }),
)

export default router
