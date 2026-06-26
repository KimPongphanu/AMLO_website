import express, { NextFunction, Request, Response, Router } from 'express'
import {
  createBanner,
  deleteBanner,
  getAllBanners,
  reorderBanners,
  toggleBannerVisibility,
  updateBanner,
} from '../controllers/bannerController'
import auth from '../middlewares/auth'
import { uploadLimiter } from '../middlewares/rateLimiter'
import upload from '../middlewares/upload'
import { logAudit } from '../utils/auditLogger'

const router: Router = express.Router()

// Audit log middleware for authenticated routes
const audit =
  (action: string, getDetails: (req: Request) => string) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id ?? null
    await logAudit(req, action, getDetails(req), userId)
    next()
  }

// GET /api/banners — สาธารณะ (default: only isShow=true, ใช้ ?all=true สำหรับ admin)
router.get('/', getAllBanners)

// POST /api/banners — ต้องล็อกอิน + rate limit + audit
router.post(
  '/',
  auth,
  uploadLimiter,
  upload.single('image'),
  audit(
    'CREATE_BANNER',
    (req) => `เพิ่ม Banner${req.body.title ? `: ${req.body.title}` : ''}`,
  ),
  createBanner,
)

// PUT /api/banners/reorder — ต้องล็อกอิน + audit
router.put(
  '/reorder',
  auth,
  audit(
    'REORDER_BANNERS',
    (req) => `จัดลำดับ Banner ใหม่: ${JSON.stringify(req.body.orderedIds)}`,
  ),
  reorderBanners,
)

// PUT /api/banners/:id — อัปเดต title และ link_url (ต้องล็อกอิน) + audit
router.put(
  '/:id',
  auth,
  audit(
    'UPDATE_BANNER',
    (req) =>
      `แก้ไข Banner #${req.params.id}${req.body.title ? ` title="${req.body.title}"` : ''}${req.body.link_url ? ` link="${req.body.link_url}"` : ''}`,
  ),
  updateBanner,
)

// PATCH /api/banners/:id/toggle — toggle isShow (ต้องล็อกอิน) + audit
router.patch(
  '/:id/toggle',
  auth,
  audit('TOGGLE_BANNER', (req) => `Toggle แสดง/ซ่อน Banner #${req.params.id}`),
  toggleBannerVisibility,
)

// DELETE /api/banners/:id — ต้องล็อกอิน + audit
router.delete(
  '/:id',
  auth,
  audit('DELETE_BANNER', (req) => `ลบ Banner #${req.params.id}`),
  deleteBanner,
)

export default router
