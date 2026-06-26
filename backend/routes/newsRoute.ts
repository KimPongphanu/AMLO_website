import express, { Router } from 'express'
import { createNews, getNews, updateNews } from '../controllers/newsController'
import auth from '../middlewares/auth'
import { uploadLimiter } from '../middlewares/rateLimiter'
import upload from '../middlewares/upload'

const router: Router = express.Router()

/**
 * @ROUTE   POST /api/news
 * @DESC    สร้างข่าวสารหรือกิจกรรมใหม่ (Admin Only)
 */
router.post('/', auth, uploadLimiter, upload.single('image'), createNews)

/**
 * @ROUTE   GET /api/news
 * @DESC    ดึงรายการข่าวและกิจกรรมทั้งหมด
 */
router.get('/', getNews)

/**
 * @ROUTE   PUT /api/news/:id
 * @DESC    อัปเดตแก้ไขข้อมูลข่าวหรือ PR ตาม ID ข้อมูล (Admin Only)
 */
router.put('/:id', auth, upload.single('image'), updateNews)

export default router
