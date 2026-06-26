import type { ApiResponseBase, LoginResponse } from '../type'
import { api } from '../utils/api'

// กำหนด Interface สำหรับ Response ของ getUsers ให้ตรงกับหลังบ้าน
export interface UserItem {
  uuid: string
  firstname: string
  lastname: string
  email: string
  role: 'USER' | 'ADMIN' | 'SUPERVISOR'
  status: string
  twoFactorEnabled?: boolean
  twoFactorMethod?: string
  createdAt: string
  recentOnline: string
}

export interface UsersResponse extends ApiResponseBase {
  count: number
  data: UserItem[]
}

export const authService = {
  /**
   * Get current authenticated user profile
   */
  getMe: async (): Promise<ApiResponseBase> => {
    return await api('/auth/me', { method: 'GET' })
  },

  /**
   * Update current user's firstname and lastname
   */
  updateProfile: async (data: {
    firstname: string
    lastname: string
  }): Promise<ApiResponseBase> => {
    return await api('/auth/me', {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    })
  },

  /**
   * Log in user with credentials
   * Returns login response which may include requires2FA flag
   */
  login: async (body: Record<string, unknown>): Promise<LoginResponse> => {
    return await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body,
    })
  },

  /**
   * Terminate backend session and cookies
   */
  logout: async (): Promise<void> => {
    await api('/auth/logout', { method: 'POST' }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.warn('[Logout Service] Backend session clear skipped:', msg)
    })
  },

  /**
   * ดึงรายชื่อผู้ใช้ทั้งหมด (เฉพาะสิทธิ์ ADMIN)
   */
  getUsers: async (): Promise<UsersResponse> => {
    return await api<UsersResponse>('/auth/users', { method: 'GET' })
  },

  clearLocalSession: (): void => {
    sessionStorage.removeItem('activeDashboardMenu')
    // ไม่ต้องลบ token จาก sessionStorage แล้ว เพราะใช้ HTTP-Only Cookie
  },

  /**
   * ยิง Heartbeat เพื่อบอกว่ายัง Active อยู่บนเว็บ
   * ใช้ fire-and-forget: ไม่ให้ Error แพร่ออกมา เพราะเป็น background task
   */
  ping: async (): Promise<void> => {
    await api('/auth/heartbeat', { method: 'POST' }).catch(() => {
      // silent fail — ถ้า token หมดอายุหรือ network หลุดก็ไม่ crash
    })
  },
}
