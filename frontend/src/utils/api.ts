// src/utils/api.ts

// Clean the slash from .env URL and attach the /api prefix automatically
// If VITE_API_URL is empty, use relative path (/api) — Nginx proxy handles it
const rawUrl: string | undefined = import.meta.env.VITE_API_URL
const BASE_URL: string = rawUrl ? `${rawUrl.replace(/\/$/, '')}/api` : '/api'

// 🔒 บังคับใช้ unknown แทน any เพื่อความปลอดภัยสูงสุดตามกฎห้ามใช้ any
interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | Record<string, unknown> | null
}

/**
 * ฟังก์ชันยิง API ส่วนกลาง รองรับระบบ Generic Type <T> ปลอดภัยจาก any 100%
 */
export const api = async <T = unknown>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> => {
  // Prevent URL duplication by removing leading slash if present (e.g., /api//auth/login)
  const cleanEndpoint: string = endpoint.startsWith('/')
    ? endpoint.slice(1)
    : endpoint
  const url: string = `${BASE_URL}/${cleanEndpoint}`

  const headers: Headers = new Headers(options.headers)

  // Automatically set Content-Type if the body is not FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // 🌟 IMPORTANT: Instructs fetch to include cookies in cross-origin requests
    body:
      options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body),
  }

  const response: Response = await fetch(url, config)

  // 🌟 ปรับปรุงการจัดการสถานะ 401 / 403 ใหม่
  if (response.status === 401 || response.status === 403) {
    const errorData = (await response.json().catch(() => ({}))) as {
      message?: string
    }
    const message: string = errorData.message || 'Unauthorized'

    if (
      window.location.pathname === '/login' ||
      endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/logout') ||
      endpoint.includes('/auth/me') ||
      endpoint.includes('/2fa/verify-login') ||
      endpoint.includes('/2fa/recovery/use') // ✨ Recovery key: อย่า redirect กลับ login
    ) {
      throw new Error(message)
    }

    // ดีดกลับหน้า Login อัตโนมัติถ้าเกิด 401/403 ในจังหวะอื่น (เช่น Token หมดอายุกลางคัน)
    window.location.href = '/login'
    throw new Error(message)
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      message?: string
    }
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    )
  }

  // 🔒 สั่งเปลี่ยนโครงสร้างข้อมูลส่งกลับผ่าน as T เพื่อให้ตรงตามที่เรียกใช้งานจากฝั่ง Service
  return response.json() as Promise<T>
}
