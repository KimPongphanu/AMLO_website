// src/types/content.ts
// ============================================
// Content Management Types (News, PR, Comments, Contacts)
// ============================================

/**
 * News or PR article type
 * PR: Public Relations / Announcement
 * NEWS: Activity / Event
 */
export type NewsType = 'PR' | 'NEWS'

/**
 * News/PR article structure
 * Used for both frontend display and admin management
 */
export interface NewsItem {
  id: number
  type?: NewsType
  title: string
  date: string
  image_src: string
  description: string
  content?: string
  views?: number
  isShow?: boolean
}

/**
 * Form data for creating/editing news or PR
 */
export interface NewsFormData {
  id?: string | number
  type?: NewsType
  title: string
  date?: string
  image_src?: string
  description?: string
  content?: string
  views?: number
  isShow?: boolean
}

/**
 * User comment/rating on the website
 */
export interface CommentItem {
  id: string
  msg: string
  star: number
  createdAt: string
  isShow: boolean
}

/**
 * Form data for submitting a comment
 */
export interface CommentFormData {
  rating: number
  content: string
  botField: string // Honeypot field to prevent bot submissions
}

/**
 * Contact inquiry from website visitors
 */
export interface ContactRequest {
  id: string
  firstName: string
  lastName: string
  email: string
  telNumber: string
  preferredContact: string
  message: string
  status: string // 'ยังไม่ตอบกลับ' | 'ตอบกลับแล้ว'
  createdAt: string
  updatedAt: string
}

/**
 * Form data for contact inquiry submission
 */
export interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  telNumber: string
  preferredContact: string
  message: string
  botField: string // Honeypot field
}

/**
 * Validation errors for contact form
 */
export interface ContactFormErrors {
  firstName?: string
  lastName?: string
  email?: string
  telNumber?: string
  preferredContact?: string
  message?: string
}

/**
 * Slider image for homepage carousel
 */
export interface SliderImage {
  id: number
  image_url: string
  order: number
  createdAt: string
}

/**
 * Banner image for homepage carousel
 */
export interface BannerImage {
  id: number
  image_url: string
  title: string
  link_url: string
  order: number
  isShow: boolean
  createdAt: string
}
