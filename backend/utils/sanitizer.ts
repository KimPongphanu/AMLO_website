// utils/sanitizer.ts
import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize a string input to prevent XSS attacks.
 * Strips dangerous HTML tags and attributes.
 * Use this for any user-supplied text that might be rendered on a web page.
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return ''
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: [], // Strip ALL HTML tags by default
    ALLOWED_ATTR: [],
  })
}

/**
 * Sanitize a string but allow safe HTML tags (e.g., for rich text content).
 * Use sparingly and only for fields that genuinely need HTML.
 */
export function sanitizeRichText(input: string): string {
  if (typeof input !== 'string') return ''
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

/**
 * Sanitize an object's string fields recursively.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
  richFields: (keyof T)[] = [],
): T {
  const sanitized = { ...obj }
  for (const key of fields) {
    const val = sanitized[key]
    if (typeof val === 'string') {
      sanitized[key] = sanitizeText(val) as T[keyof T]
    }
  }
  for (const key of richFields) {
    const val = sanitized[key]
    if (typeof val === 'string') {
      sanitized[key] = sanitizeRichText(val) as T[keyof T]
    }
  }
  return sanitized
}
