// middlewares/rateLimiter.ts
import { Request, Response } from 'express'
import rateLimit from 'express-rate-limit'

// Minimal user type for rate limiter key generator (runs before full auth)
interface RateLimitUser {
  uuid?: string
}

// Custom key generator: use userId if logged in, fallback to IP
const keyGenerator = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for']
  const ip =
    typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip
  const user = (req as unknown as { user?: RateLimitUser }).user
  return user?.uuid || ip || 'unknown'
}

// ── Login Limiter ────────────────────────────────────────────
export const loginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  keyGenerator,
  skipSuccessfulRequests: true,
  validate: false,
  message: {
    message:
      'คุณลองเข้าสู่ระบบเกินจำนวนครั้งที่กำหนด กรุณาลองใหม่อีกครั้งในอีก 30 นาที',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`[RATE-LIMIT] login blocked for key: ${keyGenerator(req)}`)
    res.status(429).json({
      message:
        'คุณลองเข้าสู่ระบบเกินจำนวนครั้งที่กำหนด กรุณาลองใหม่อีกครั้งในอีก 30 นาที',
    })
  },
})

// ── Register Limiter ─────────────────────────────────────────
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator,
  validate: false,
  message: {
    message: 'คุณทำการสมัครสมาชิกถี่เกินไป กรุณาลองใหม่อีกครั้งในอีก 1 ชั่วโมง',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// ── Upload Limiter ───────────────────────────────────────────
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator,
  validate: false,
  message: {
    message: 'คุณอัปโหลดไฟล์ถี่เกินไป กรุณาลองใหม่อีกครั้งในอีก 15 นาที',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// ── Public API Limiter (general) ─────────────────────────────
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  keyGenerator,
  validate: false,
  message: { message: 'ระบบตรวจพบการเรียกใช้งานที่ถี่เกินไป' },
  standardHeaders: true,
  legacyHeaders: false,
})

// ── Comment Limiter ──────────────────────────────────────────
export const commentRateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  keyGenerator,
  validate: false,
  message: {
    success: false,
    message: 'คุณส่งความคิดเห็นบ่อยเกินไป กรุณารอ 30 นาที แล้วลองใหม่อีกครั้ง',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// ── Contact Form Limiter ─────────────────────────────────────
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator,
  validate: false,
  message: {
    success: false,
    message:
      'คุณส่งแบบฟอร์มติดต่อถี่เกินไป กรุณาลองใหม่อีกครั้งในอีก 1 ชั่วโมง',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// ── Auth Actions Limiter (password reset, 2FA, etc.) ─────────
export const authActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator,
  validate: false,
  message: {
    message: 'คุณดำเนินการถี่เกินไป กรุณาลองใหม่อีกครั้งในอีก 15 นาที',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// ── Content Management Limiter (CRUD on banners, news, etc.) ─
export const contentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyGenerator,
  validate: false,
  message: {
    message: 'คุณดำเนินการถี่เกินไป กรุณาลองใหม่อีกครั้ง',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// ── Admin Actions Limiter (ban, delete, supervisor actions) ──
export const adminActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator,
  validate: false,
  message: {
    message: 'คุณดำเนินการถี่เกินไป กรุณาลองใหม่อีกครั้ง',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// ── 2FA Limiter ─────────────────────────────────────────────
export const twoFALimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator,
  validate: false,
  message: {
    message: 'คุณขอรหัส 2FA ถี่เกินไป กรุณาลองใหม่อีกครั้งในอีก 15 นาที',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// ── Backup Limiter ───────────────────────────────────────────
export const backupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator,
  validate: false,
  message: {
    message:
      'คุณดำเนินการ Backup ถี่เกินไป กรุณาลองใหม่อีกครั้งในอีก 1 ชั่วโมง',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
