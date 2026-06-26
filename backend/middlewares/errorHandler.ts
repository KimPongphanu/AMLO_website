// middlewares/errorHandler.ts
import * as Sentry from '@sentry/node'
import { NextFunction, Request, Response } from 'express'

interface AppError extends Error {
  statusCode?: number
  stack?: string
}

export const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Send error to Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err)
  }

  console.error('Global Error Handler:', err)

  const isProduction = process.env.NODE_ENV === 'production'
  const statusCode = err.statusCode || 500

  const message = isProduction
    ? statusCode === 500
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error'
    : err.message || 'Internal Server Error'

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction ? {} : { stack: err.stack }),
  })
}

// Sentry request context is configured at init in server.ts
