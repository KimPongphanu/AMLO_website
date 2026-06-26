// routes/adminRoute.ts
import { Router } from 'express'
import {
  banAdmin,
  createAdmin,
  deleteAdmin,
  getAdminById,
  getAdmins,
  unbanAdmin,
  updateAdmin,
} from '../controllers/adminUserController'
import auth, { requireSupervisor } from '../middlewares/auth'

const router = Router()

/**
 * @ROUTE   POST /api/admin/users
 * @DESC    Create a new admin (Supervisor only)
 */
router.post('/users', auth, requireSupervisor, createAdmin)

/**
 * @ROUTE   GET /api/admin/users
 * @DESC    Get all admins (Supervisor only)
 */
router.get('/users', auth, requireSupervisor, getAdmins)

/**
 * @ROUTE   GET /api/admin/users/:uuid
 * @DESC    Get admin by UUID (Supervisor only)
 */
router.get('/users/:uuid', auth, requireSupervisor, getAdminById)

/**
 * @ROUTE   PUT /api/admin/users/:uuid
 * @DESC    Update admin info (Supervisor only)
 */
router.put('/users/:uuid', auth, requireSupervisor, updateAdmin)

/**
 * @ROUTE   POST /api/admin/users/:uuid/ban
 * @DESC    Ban admin with 3-step confirmation (Supervisor only)
 */
router.post('/users/:uuid/ban', auth, requireSupervisor, banAdmin)

/**
 * @ROUTE   POST /api/admin/users/:uuid/unban
 * @DESC    Unban admin with 3-step confirmation (Supervisor only)
 */
router.post('/users/:uuid/unban', auth, requireSupervisor, unbanAdmin)

/**
 * @ROUTE   DELETE /api/admin/users/:uuid
 * @DESC    Delete admin with 3-step confirmation (Supervisor only)
 */
router.delete('/users/:uuid', auth, requireSupervisor, deleteAdmin)

export default router
