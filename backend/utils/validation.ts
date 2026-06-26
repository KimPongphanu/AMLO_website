// utils/validation.ts
import { NextFunction, Request, Response } from 'express'
import { z, ZodSchema } from 'zod'

// ── Helper: validate request body against a Zod schema ──
export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      })
      return
    }
    req.body = result.data
    next()
  }

// ── Auth Schemas ──
export const loginSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').max(100),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน').max(100),
})

export const registerSchema = z.object({
  email: z.string().email().max(100),
  password: z
    .string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'รหัสผ่านต้องมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข',
    ),
  firstname: z.string().min(1).max(50),
  lastname: z.string().min(1).max(50),
})

export const createAdminSchema = z.object({
  email: z.string().email().max(100),
  password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร').max(100),
  firstname: z.string().min(1).max(50),
  lastname: z.string().min(1).max(50),
})

export const updateProfileSchema = z.object({
  firstname: z.string().min(1).max(50).optional(),
  lastname: z.string().min(1).max(50).optional(),
})

export const resetPasswordSchema = z.object({
  email: z.string().email().max(100),
  newPassword: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  otp: z.string().optional(),
  totp: z.string().optional(),
  resetToken: z.string().optional(),
})

// ── Content Schemas ──
export const createNewsSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(500),
  content: z.string().optional(),
  type: z.enum(['NEWS', 'PR']).optional(),
})

export const createBannerSchema = z.object({
  title: z.string().max(200).optional(),
  link_url: z.string().max(500).optional(),
})

export const createPopupSchema = z.object({
  title: z.string().max(200).optional(),
})

export const createDepartmentSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().optional(),
  galleryUrls: z.array(z.string()).optional(),
})

export const createContactSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().max(100),
  tel_number: z.string().optional(),
  preferred_contact: z.string().min(1).max(50),
  message: z.string().min(1).max(2000),
})

export const createCommentSchema = z.object({
  star: z.number().int().min(1).max(5),
  msg: z.string().min(1).max(500),
})

export const updateSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
    }),
  ),
})

// ── Supervisor Action Schemas ──
export const supervisorActionSchema = z.object({
  targetUuid: z.string().uuid(),
  actionType: z.enum(['BAN', 'DELETE', 'FORCE_RESET']),
  reason: z.string().min(1).max(500),
  password: z.string().min(1),
})

export const emergencyActionSchema = z.object({
  targetUuid: z.string().uuid(),
  recoveryKey: z.string().min(1),
  action: z.enum(['BAN', 'DELETE', 'FORCE_RESET']),
  reason: z.string().min(1).max(500),
})

// ── Force Reset Schemas ──
export const forceResetSchema = z.object({
  otp: z.string().min(1).optional(),
  newPassword: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .optional(),
})
