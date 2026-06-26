// middlewares/setCharset.ts
import { NextFunction, Request, Response } from 'express'

export const setCharset = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Only set JSON content-type for API routes, not for file downloads or static files
  // This prevents corrupting file downloads (e.g., backup .sql files)
  const isApiRoute = req.path.startsWith('/api')
  if (isApiRoute) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
  }
  next()
}
