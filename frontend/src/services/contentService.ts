import type {
  ApiResponseBase,
  BannerImage,
  CommentItem,
  ContactRequest,
  DepartmentItem,
  NewsItem,
  SliderImage,
} from '../type'
import { api } from '../utils/api'

export const contentService = {
  /**
   * Fetch content items by type ('PR' or 'NEWS')
   */
  getNews: async (type: 'PR' | 'NEWS', limit = 50): Promise<NewsItem[]> => {
    // 🌟 ส่ง Generic Type เข้าไปที่ api เพื่อบอกว่า Response นี้จะมีโครงสร้างอย่างไร
    const res = await api<{ data?: NewsItem[] }>(
      `/news?type=${type}&limit=${limit}`,
      {
        method: 'GET',
      },
    )
    return res?.data || []
  },

  /**
   * Create a new announcement or activity entry
   */
  createNews: async (body: FormData): Promise<ApiResponseBase> => {
    return await api('/news', { method: 'POST', body })
  },

  /**
   * Update an existing news or PR entry
   */
  updateNews: async (id: string, body: FormData): Promise<ApiResponseBase> => {
    return await api(`/news/update/${id}`, { method: 'PUT', body })
  },

  /**
   * Toggle visibility status of a news item
   */
  toggleNewsVisibility: async (
    id: string,
    isShow: boolean,
  ): Promise<ApiResponseBase> => {
    return await api(`/news/update/${id}`, {
      method: 'PUT',
      body: { isShow },
    })
  },

  /**
   * Fetch all comments from database
   */
  getComments: async (all = false): Promise<CommentItem[]> => {
    const url = all ? '/comments?all=true' : '/comments'
    // 🌟 ปรับใส่ Generic Type ป้องกัน Error แบบเดียวกัน
    const res = await api<{ data?: CommentItem[] }>(url, { method: 'GET' })
    return res?.data || []
  },

  /**
   * Update single comment presentation status
   */
  updateCommentStatus: async (
    id: string,
    isShow: boolean,
  ): Promise<ApiResponseBase> => {
    return await api('/comments/update', {
      method: 'PUT',
      body: { id, isShow },
    })
  },

  /**
   * Submit a new feedback or rating comment
   */
  createComment: async (body: {
    star: number
    msg: string
  }): Promise<ApiResponseBase> => {
    return await api('/comments', { method: 'POST', body })
  },

  /**
   * Fetch contact inquiries list
   */
  getContacts: async (): Promise<ContactRequest[]> => {
    // 🌟 ปรับใส่ Generic Type ป้องกัน Error แบบเดียวกัน
    const res = await api<{ data?: ContactRequest[] }>('/contact', {
      method: 'GET',
    })
    return res?.data || []
  },

  /**
   * Update action status of a contact inquiry
   */
  updateContactStatus: async (
    id: string,
    status: string,
  ): Promise<ApiResponseBase> => {
    return await api('/contact/update', {
      method: 'PUT',
      body: { id, status },
    })
  },

  /**
   * Submit a contact form inquiry
   */
  createContact: async (
    body: Record<string, unknown>,
  ): Promise<ApiResponseBase> => {
    return await api('/contact', { method: 'POST', body })
  },

  /**
   * Fetch organizational departments list
   */
  getDepartments: async (): Promise<DepartmentItem[]> => {
    // 🌟 ปรับ Generic Type ให้รับค่าเป็น Array ของ DepartmentItem ตรงๆ
    const res = await api<DepartmentItem[]>('/departments', {
      method: 'GET',
    })

    // 🌟 คืนค่า res กลับไปตรงๆ (หาก res ไม่มีค่าให้ fallback เป็น Array ว่าง)
    return res || []
  },

  /**
   * Fetch home page slider images
   */
  getSlider: async (): Promise<SliderImage[]> => {
    const res = await api<{ success: boolean; data: SliderImage[] }>(
      '/slider',
      { method: 'GET' },
    )
    return res?.data || []
  },

  // ── Banner API ──────────────────────────────────────────────────────────

  /**
   * Fetch banners (public: only isShow=true, admin: use ?all=true)
   */
  getBanners: async (all = false): Promise<BannerImage[]> => {
    const url = all ? '/banners?all=true' : '/banners'
    const res = await api<{ success: boolean; data: BannerImage[] }>(url, {
      method: 'GET',
    })
    return res?.data || []
  },

  /**
   * Create a new banner (multipart form)
   */
  createBanner: async (formData: FormData): Promise<ApiResponseBase> => {
    return await api('/banners', { method: 'POST', body: formData })
  },

  /**
   * Update banner (title, link_url)
   */
  updateBanner: async (
    id: number,
    data: { title?: string; link_url?: string },
  ): Promise<ApiResponseBase> => {
    return await api(`/banners/${id}`, {
      method: 'PUT',
      body: data,
    })
  },

  /**
   * Reorder banners
   */
  reorderBanners: async (orderedIds: number[]): Promise<ApiResponseBase> => {
    return await api('/banners/reorder', {
      method: 'PUT',
      body: { orderedIds },
    })
  },

  /**
   * Delete a banner
   */
  deleteBanner: async (id: number): Promise<ApiResponseBase> => {
    return await api(`/banners/${id}`, { method: 'DELETE' })
  },

  /**
   * Toggle banner visibility (isShow)
   */
  toggleBannerVisibility: async (id: number): Promise<ApiResponseBase> => {
    return await api(`/banners/${id}/toggle`, { method: 'PATCH' })
  },

  // ── Splash Popup API ─────────────────────────────────────────────────

  /**
   * Fetch active splash popup (public)
   */
  getActiveSplashPopup: async (): Promise<{
    image_url: string
    title: string
  } | null> => {
    const res = await api<{
      success: boolean
      data: {
        id: number
        image_url: string
        title: string
        isActive: boolean
      } | null
    }>('/splash-popups/active', { method: 'GET' })
    return res?.data || null
  },

  /**
   * Fetch all splash popups (admin)
   */
  getAllSplashPopups: async (): Promise<any[]> => {
    const res = await api<{ success: boolean; data: any[] }>('/splash-popups', {
      method: 'GET',
    })
    return res?.data || []
  },

  /**
   * Create splash popup (admin)
   */
  createSplashPopup: async (formData: FormData): Promise<any> => {
    return await api('/splash-popups', { method: 'POST', body: formData })
  },

  /**
   * Update splash popup (admin)
   */
  updateSplashPopup: async (
    id: number,
    data: { title?: string; isActive?: boolean },
  ): Promise<any> => {
    return await api(`/splash-popups/${id}`, { method: 'PUT', body: data })
  },

  /**
   * Delete splash popup (admin)
   */
  deleteSplashPopup: async (id: number): Promise<any> => {
    return await api(`/splash-popups/${id}`, { method: 'DELETE' })
  },

  // ── Site Settings API ─────────────────────────────────────────────────

  /**
   * Fetch all site settings (footer, policies, social)
   */
  getSiteSettings: async (): Promise<Record<string, string>> => {
    const res = await api<{ success: boolean; data: Record<string, string> }>(
      '/settings',
      { method: 'GET' },
    )
    return res?.data || {}
  },

  /**
   * Update site settings (admin only)
   */
  updateSiteSettings: async (
    settings: { key: string; value: string }[],
  ): Promise<Record<string, string>> => {
    const res = await api<{ success: boolean; data: Record<string, string> }>(
      '/settings',
      { method: 'PUT', body: { settings } },
    )
    return res?.data || {}
  },
}
