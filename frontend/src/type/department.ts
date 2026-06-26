// src/types/department.ts
// ============================================
// Department & Gallery Types (SINGLE SOURCE OF TRUTH)
// ============================================

/**
 * Gallery media type
 * IMAGE: Static image file (JPEG, PNG, WEBP)
 * VIDEO: YouTube embed URL
 */
export type GalleryType = 'image' | 'video'

/**
 * Individual gallery item within a department
 * Can be either an uploaded image or a YouTube video URL
 */
export interface GalleryItem {
  /** Type of media: 'image' or 'video' */
  type: GalleryType
  /** URL path (for images: /uploads/filename.jpg) or YouTube URL (for videos) */
  url: string
}

/**
 * Department/Division structure
 * Represents organizational units within AMLO (Anti-Money Laundering Office)
 * Each department has a cover image, description, and a gallery of images/videos
 */
export interface DepartmentItem {
  /** Unique identifier (auto-increment from database) */
  id: number
  /** Department name/title (e.g., "กองข่าวกรองทางการเงิน") */
  title: string
  /** HTML content describing department mission and responsibilities (sanitized) */
  content?: string
  /** Cover image URL path (stored in /uploads/) */
  cover_image: string
  /** Array of gallery items (images and YouTube videos) */
  gallery: GalleryItem[]
  /** Creation timestamp from database */
  created_at?: string
  /** Last update timestamp from database */
  updated_at?: string
}

/**
 * View mode for department listing
 * 'card': Grid layout with image cards
 * 'list': Table/list layout with compact rows
 */
export type ViewMode = 'card' | 'list'

/**
 * Temporary file object for gallery upload preview
 * Used when uploading new images before saving to database
 * Contains the raw File object and a blob URL for preview
 */
export interface GalleryFile {
  /** Raw file object from file input */
  file: File
  /** Blob URL for instant preview (revoked after upload) */
  preview: string
}

/**
 * Response from department create/update operations
 * Returned by the API after successful mutation
 */
export interface DepartmentMutationResponse {
  /** Whether the operation was successful */
  success: boolean
  /** The created/updated department data (if successful) */
  data?: DepartmentItem
  /** Optional message from server */
  message?: string
}

/**
 * Filter options for department listing
 * Used in DepartmentManagerDashboard for search functionality
 */
export interface DepartmentFilterOptions {
  /** Search by title or content */
  searchTerm?: string
  /** Only show departments with content */
  hasContentOnly?: boolean
}
