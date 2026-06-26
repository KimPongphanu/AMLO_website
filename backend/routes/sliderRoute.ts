import express, { Router } from 'express'
import {
  createSlide,
  deleteSlide,
  getAllSlides,
  reorderSlides,
} from '../controllers/sliderController'
import auth from '../middlewares/auth'
import { uploadLimiter } from '../middlewares/rateLimiter'
import upload from '../middlewares/upload'

const router: Router = express.Router()

// GET /api/slider - สาธารณะ
router.get('/', getAllSlides)

// POST /api/slider - ต้องล็อกอิน, จำกัด rate, อัปโหลดไฟล์ก่อน
router.post('/', auth, uploadLimiter, upload.single('image'), createSlide)

// PUT /api/slider/reorder - ต้องล็อกอิน
router.put('/reorder', auth, reorderSlides)

// DELETE /api/slider/:id - ต้องล็อกอิน
router.delete('/:id', auth, deleteSlide)

export default router
