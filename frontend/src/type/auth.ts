// src/types/auth.ts
// ============================================
// Authentication & User Management Types
// ============================================

import type { ApiResponseBase } from './api'

/**
 * User role enumeration
 * USER: Regular website visitor
 * ADMIN: System administrator (can manage content but not users)
 * SUPERVISOR: Super admin (can manage other admins and view audit logs)
 */
export type UserRole = 'USER' | 'ADMIN' | 'SUPERVISOR'

/**
 * Two-factor authentication methods
 */
export type TwoFactorMethod = 'NONE' | 'AUTHENTICATOR' | 'EMAIL_OTP'

/**
 * Current authenticated user profile
 * Retrieved from /api/auth/me endpoint
 */
export interface UserProfile {
  uuid: string
  email: string
  firstname: string
  lastname: string
  role: UserRole
  createdAt?: string
  recentOnline?: string
  twoFactorEnabled?: boolean
  twoFactorMethod?: TwoFactorMethod
  status?: 'Active' | 'Inactive'
  forcePasswordReset?: boolean
}

/**
 * Login request payload
 */
export interface LoginPayload {
  email: string
  password: string
}

/**
 * Login response from /api/auth/login
 */
export interface LoginResponse extends ApiResponseBase {
  user?: UserProfile
  requires2FA?: boolean
  twoFactorMethod?: TwoFactorMethod
}

/**
 * Create new admin request payload (Supervisor only)
 */
export interface CreateAdminData {
  email: string
  password: string
  firstname: string
  lastname: string
}

/**
 * Create admin response
 */
export interface CreateAdminResponse extends ApiResponseBase {
  data?: {
    id: string
    email: string
    firstname: string
    lastname: string
    role: string
    createdAt: string
  }
}

/**
 * Update admin information payload
 */
export interface UpdateAdminData {
  firstname?: string
  lastname?: string
}

/**
 * Admin action response (ban, unban, delete)
 */
export interface AdminActionResponse extends ApiResponseBase {
  data?: {
    uuid: string
    email: string
    status?: string
  }
}

/**
 * Validation error for form fields
 */
export interface ValidationError {
  field: string
  message: string
}

/**
 * Heartbeat request to keep session alive
 */
export interface HeartbeatResponse {
  ok: boolean
}
