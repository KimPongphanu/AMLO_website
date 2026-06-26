// src/types/index.ts
// ============================================
// CENTRAL TYPE RE-EXPORT
// ============================================

// API Types
export type { ApiResponseBase, PaginatedResponse, PaginationMeta } from './api'

// Auth Types
export type {
  AdminActionResponse,
  CreateAdminData,
  CreateAdminResponse,
  HeartbeatResponse,
  LoginPayload,
  LoginResponse,
  TwoFactorMethod,
  UpdateAdminData,
  UserProfile,
  UserRole,
  ValidationError,
} from './auth'

// Content Types (News, Comments, Contacts - NO DepartmentItem)
export type {
  BannerImage,
  CommentFormData,
  CommentItem,
  ContactFormData,
  ContactFormErrors,
  ContactRequest,
  NewsFormData,
  NewsItem,
  NewsType,
  SliderImage,
} from './content'

// Department Types (SINGLE SOURCE - DepartmentItem is HERE only!)
export type {
  DepartmentItem,
  DepartmentMutationResponse,
  GalleryFile,
  GalleryItem,
  GalleryType,
  ViewMode,
} from './department'

// Dashboard Types
export type {
  AuthState,
  ContactsGroup,
  DashboardMenuId,
  DashboardState,
} from './dashboard'

// Common Constants
export {
  COMMENT_CONSTRAINTS,
  CONTACT_CONSTRAINTS,
  CONTACT_STATUS,
  FILE_CONSTRAINTS,
  PASSWORD_CONSTRAINTS,
  PREFERRED_CONTACT_METHODS,
  SESSION_CONFIG,
  THAI_DAYS,
  THAI_MONTHS,
  THAI_MONTHS_SHORT,
} from './common'

export type { ContactStatus, PreferredContactMethod } from './common'
