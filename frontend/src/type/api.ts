// src/types/api.ts
// ============================================
// API Response Base Types
// ============================================

/**
 * Standard backend response payload configuration
 * Generic T allows flexible data type
 */
export interface ApiResponseBase<T = unknown> {
  success: boolean
  message?: string
  error?: string
  data?: T
}

/**
 * Pagination metadata for list endpoints
 */
export interface PaginationMeta {
  totalItems: number
  currentPage: number
  totalPages: number
  itemsPerPage: number
}

/**
 * Paginated API response wrapper
 */
export interface PaginatedResponse<T> extends ApiResponseBase {
  data: T[]
  pagination: PaginationMeta
}
