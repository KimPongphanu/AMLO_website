import express, { NextFunction, Response, Router } from 'express'
import {
  createPopup,
  deletePopup,
  getActivePopup,
  getAllPopups,
  updatePopup,
} from '../controllers/splashPopupController'
import auth, { AuthRequest, requireSupervisor } from '../middlewares/auth'
import { uploadLimiter } from '../middlewares/rateLimiter'
import upload from '../middlewares/upload'
import { logAudit } from '../utils/auditLogger'

const router: Router = express.Router()

// GET /api/splash-popups/active — สาธารณะ (ต้องมาก่อน /:id)
router.get('/active', getActivePopup)

// GET /api/splash-popups — admin
router.get('/', auth, requireSupervisor, getAllPopups)

// POST /api/splash-popups — admin + upload
router.post(
  '/',
  auth,
  requireSupervisor,
  uploadLimiter,
  upload.single('image'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    await logAudit(
      req,
      'CREATE_SPLASH_POPUP',
      `สร้าง Popup${req.body.title ? `: ${req.body.title}` : ''}`,
      null,
    )
    next()
  },
  createPopup,
)

// PUT /api/splash-popups/:id — admin
router.put(
  '/:id',
  auth,
  requireSupervisor,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const isActive = req.body.isActive
    await logAudit(
      req,
      'UPDATE_SPLASH_POPUP',
      `อัปเดต Popup #${req.params.id}${isActive !== undefined ? ` isActive=${isActive}` : ''}`,
      null,
    )
    next()
  },
  updatePopup,
)

// DELETE /api/splash-popups/:id — admin
router.delete(
  '/:id',
  auth,
  requireSupervisor,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    await logAudit(
      req,
      'DELETE_SPLASH_POPUP',
      `ลบ Popup #${req.params.id}`,
      null,
    )
    next()
  },
  deletePopup,
)

export default router
