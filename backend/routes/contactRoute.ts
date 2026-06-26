import { Router } from 'express'
import {
  createContact,
  getContactRequests,
  updateContactStatus,
} from '../controllers/contactController'
import auth from '../middlewares/auth'
import { contactLimiter } from '../middlewares/rateLimiter'

const router = Router()

/**
 * @ROUTE   POST /api/contact
 * @DESC    บันทึกข้อความการติดต่อจากประชาชนหน้าเว็บไซต์ (Public)
 */
router.post('/', contactLimiter, createContact)

/**
 * @ROUTE   GET /api/contact
 * @DESC    ดึงรายการข้อความติดต่อทั้งหมด (สิทธิ์ Admin ในแดชบอร์ด)
 */
router.get('/', auth, getContactRequests)

/**
 * @ROUTE   PUT /api/contact/update
 * @DESC    อัปเดตสถานะข้อมูล (สถานะตอบกลับ) โดยผู้ใช้งานที่ลงทะเบียนผ่านสิทธิ์ตัวตน (Admin)
 */
router.put('/update', auth, updateContactStatus)

export default router
