// routes/backupRoute.ts
import { Router } from 'express'
import {
  createBackup,
  deleteBackup,
  downloadBackup,
  listBackupFiles,
  restoreBackup,
} from '../controllers/backupController'
import auth, { requireSupervisor } from '../middlewares/auth'
import { backupLimiter } from '../middlewares/rateLimiter'

const router = Router()

// All backup routes require auth + supervisor + rate limit
router.use(auth, requireSupervisor, backupLimiter)

router.get('/', listBackupFiles)
router.post('/', createBackup)
router.get('/:filename', downloadBackup)
router.delete('/:filename', deleteBackup)
router.post('/:filename/restore', restoreBackup)

export default router
