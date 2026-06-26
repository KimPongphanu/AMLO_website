// routes/supervisorRequestRoute.ts
import { Router } from 'express'
import {
  approveRequest,
  createRequest,
  getPendingRequests,
  getSentRequests,
  rejectRequest,
} from '../controllers/supervisorRequestController'
import authMiddleware, { requireSupervisor } from '../middlewares/auth'

const router = Router()

router.post('/', authMiddleware, requireSupervisor, createRequest)
router.get('/pending', authMiddleware, requireSupervisor, getPendingRequests)
router.get('/sent', authMiddleware, requireSupervisor, getSentRequests)
router.post('/:id/approve', authMiddleware, requireSupervisor, approveRequest)
router.post('/:id/reject', authMiddleware, requireSupervisor, rejectRequest)

export default router
