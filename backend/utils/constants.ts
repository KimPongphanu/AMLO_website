// utils/constants.ts
// Centralized constants to eliminate magic numbers across the codebase

// ── Bcrypt ──
export const BCRYPT_SALT_ROUNDS = 12
export const BCRYPT_SALT_ROUNDS_SUPERVISOR = 12
export const BCRYPT_SALT_ROUNDS_OTP = 10
export const BCRYPT_SALT_ROUNDS_RECOVERY_KEY = 8

// ── Password ──
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MIN_LENGTH_SUPERVISOR = 16
export const PASSWORD_HISTORY_CHECK_COUNT = 3

// ── TOTP/2FA ──
export const TOTP_WINDOW = 1
export const TOTP_SECRET_LENGTH = 20
export const TEMP_TOKEN_EXPIRY = '5m'
export const TOKEN_EXPIRY_ADMIN = '12h'
export const TOKEN_EXPIRY_SUPERVISOR = '4h'
export const TOKEN_EXPIRY_DEFAULT = '1d'
export const RECOVERY_KEY_EXPIRY_DAYS = 30
export const RECOVERY_KEY_COUNT = 8

// ── Session ──
export const SUPERVISOR_MAX_SESSIONS = 1
export const ADMIN_MAX_SESSIONS = 3
export const SESSION_INACTIVITY_MS = 30 * 60 * 1000
export const SUPERVISOR_INACTIVITY_MS = 15 * 60 * 1000

// ── Lockout ──
export const MAX_FAILED_LOGIN_ATTEMPTS = 5
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000

// ── OTP ──
export const OTP_EXPIRE_MINUTES = 5
export const OTP_LENGTH = 6

// ── Pagination ──
export const DEFAULT_PAGE_SIZE = 10
export const DEFAULT_PAGE = 1

// ── File Upload ──
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20MB
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const ALLOWED_MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
]

// ── Rate Limiting ──
export const LOGIN_RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000
export const LOGIN_RATE_LIMIT_MAX = 10
export const API_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
export const API_RATE_LIMIT_MAX = 400

// ── Audit ──
export const AUDIT_LOG_RETENTION_DAYS = 90
export const GEO_CACHE_TTL_SECONDS = 86400 // 24h

// ── Backup ──
export const BACKUP_TIMEOUT_MS = 5 * 60 * 1000
export const BACKUP_RESTORE_TIMEOUT_MS = 10 * 60 * 1000

// ── Email ──
export const SMTP_DEFAULT_PORT = 587
