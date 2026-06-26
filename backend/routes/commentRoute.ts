import { Router } from 'express'
import {
  createComment,
  getComments,
  updateComment,
} from '../controllers/commentController'
import auth from '../middlewares/auth'
import { commentRateLimiter } from '../middlewares/rateLimiter'

const router = Router()

/**
 * @ROUTE   POST /api/comments
 * @DESC    บันทึกความคิดเห็นจากประชาชนหน้าเว็บไซต์ (Public)
 */
router.post('/', commentRateLimiter, createComment)

/**
 * @ROUTE   GET /api/comments
 * @DESC    ดึงรายการความคิดเห็นทั้งหมด (แสดงตามเงื่อนไขของฝั่งผู้ใช้หรือ Admin)
 */
router.get('/', getComments)

/**
 * @ROUTE   PUT /api/comments/update
 * @DESC    อัปเดตสถานะการแสดงผล (isShow) ของความคิดเห็น (สิทธิ์ Admin ในแดชบอร์ด)
 */
router.put('/update', auth, updateComment)

export default router
