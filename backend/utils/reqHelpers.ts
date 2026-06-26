// utils/reqHelpers.ts
import { Request } from 'express'

/**
 * Safely extract a string parameter from Express request params.
 * Express 5 types define params values as `string | string[]`,
 * so we need to normalize them before use with Prisma or other typed APIs.
 */
export function paramStr(req: Request, name: string): string {
  const val = req.params[name]
  if (Array.isArray(val)) return val[0] || ''
  return val || ''
}
