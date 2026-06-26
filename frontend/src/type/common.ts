// src/types/common.ts
// ============================================
// Shared Utilities & Constants
// ============================================

/**
 * Thai months names for date formatting
 * Used across the application for displaying Thai dates
 */
export const THAI_MONTHS: readonly string[] = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
] as const

/**
 * Thai months abbreviations (short form)
 */
export const THAI_MONTHS_SHORT: readonly string[] = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
] as const

/**
 * Days of week in Thai
 */
export const THAI_DAYS: readonly string[] = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์',
] as const

/**
 * Contact status options
 */
export const CONTACT_STATUS = {
  PENDING: 'ยังไม่ตอบกลับ',
  COMPLETED: 'ตอบกลับแล้ว',
} as const

export type ContactStatus = (typeof CONTACT_STATUS)[keyof typeof CONTACT_STATUS]

/**
 * Preferred contact methods
 */
export const PREFERRED_CONTACT_METHODS = {
  EMAIL: 'email',
  PHONE: 'tel',
} as const

export type PreferredContactMethod =
  (typeof PREFERRED_CONTACT_METHODS)[keyof typeof PREFERRED_CONTACT_METHODS]

/**
 * File upload constraints
 */
export const FILE_CONSTRAINTS = {
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  ALLOWED_VIDEO_TYPES: ['video/mp4'] as const,
} as const

/**
 * Comment constraints
 */
export const COMMENT_CONSTRAINTS = {
  MIN_LENGTH: 10,
  MAX_LENGTH: 500,
  MAX_STAR: 5,
  MIN_STAR: 1,
} as const

/**
 * Contact form constraints
 */
export const CONTACT_CONSTRAINTS = {
  MAX_NAME_LENGTH: 100,
  MAX_MESSAGE_LENGTH: 500,
  PHONE_REGEX: /^0[0-9]{9}$/,
} as const

/**
 * Password constraints
 */
export const PASSWORD_CONSTRAINTS = {
  MIN_LENGTH: 8,
  SUPERVISOR_MIN_LENGTH: 16,
  PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/,
  SUPERVISOR_PATTERN:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{16,}$/,
} as const

/**
 * Session timeout values (in milliseconds)
 */
export const SESSION_CONFIG = {
  ADMIN_IDLE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  SUPERVISOR_IDLE_TIMEOUT_MS: 15 * 60 * 1000, // 15 minutes
  HEARTBEAT_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  WARNING_BEFORE_MS: 60 * 1000, // 1 minute warning
} as const
