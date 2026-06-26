// middlewares/csrf.ts
import crypto from 'crypto'
import { NextFunction, Request, Response } from 'express'

/**
 * Custom CSRF protection using Double-Submit Cookie pattern.
 *
 * How it works:
 * 1. Server sets a CSRF token as an httpOnly cookie when user logs in.
 * 2. Frontend reads the token from a non-httpOnly cookie (or response header)
 *    and sends it back in a custom header (X-CSRF-Token).
 * 3. Server compares the cookie value with the header value.
 *
 * This does NOT require server-side session storage for CSRF tokens.
 */

const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const TOKEN_LENGTH = 32

export const generateCsrfToken = (): string => {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex')
}

/**
 * Middleware: Set CSRF cookie on responses (for logged-in users).
 */
export const setCsrfCookie = (req: Request, res: Response, next: NextFunction): void => {
  if (req.cookies && !req.cookies[CSRF_COOKIE_NAME]) {
    const token = generateCsrfToken()
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })
    res.cookie('csrf-token-readable', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })
  }
  next()
}

/**
 * Middleware: Validate CSRF token for state-changing requests.
 */
export const validateCsrf = (req: Request, res: Response, next: NextFunction): void => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next()
    return
  }

  // Skip CSRF in test mode
  if (process.env.NODE_ENV === 'test') {
    next()
    return
  }

  // If cookies are not parsed yet, skip gracefully
  if (!req.cookies) {
    next()
    return
  }

  const cookieToken: string | undefined = req.cookies[CSRF_COOKIE_NAME]
  const headerToken: string | undefined = req.headers[CSRF_HEADER_NAME] as string | undefined

  if (!cookieToken || !headerToken) {
    res.status(403).json({
      success: false,
      message: 'Missing CSRF token',
    })
    return
  }

  if (cookieToken.length !== headerToken.length) {
    res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
    })
    return
  }

  let isValid = true
  for (let i = 0; i < cookieToken.length; i++) {
    if (cookieToken[i] !== headerToken[i]) {
      isValid = false
    }
  }

  if (!isValid) {
    res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
    })
    return
  }

  next()
}
