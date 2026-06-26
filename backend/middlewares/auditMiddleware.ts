// middlewares/auditMiddleware.ts
import { NextFunction, Response } from 'express'
import { logAudit } from '../utils/auditLogger'
import { AuthRequest } from './auth'

/**
 * Middleware factory that logs audit messages before passing to the next handler.
 * This keeps audit logic out of route files and controllers.
 *
 * Usage:
 *   router.post('/', auth, requireSupervisor, audit('CREATE_ITEM', 'Created item'), createHandler)
 */
export const audit =
  (action: string, getDetails?: (req: AuthRequest) => string) =>
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const details = getDetails ? getDetails(req) : action
      await logAudit(req, action, details, null)
    } catch {
      // Audit failure should never block the request
    }
    next()
  }
