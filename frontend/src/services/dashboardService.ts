import type {
  ApiResponseBase,
  CommentItem,
  ContactRequest,
  DepartmentItem,
  DepartmentMutationResponse,
  NewsItem,
} from '../type'
import { api } from '../utils/api'

export const dashboardService = {
  /**
   * ระบบรับเรื่องติดต่อกลับ (Contact Requests)
   * แปลง snake_case จาก Backend → camelCase ให้ Frontend
   */
  getContacts: async (): Promise<ApiResponseBase<ContactRequest[]>> => {
    const response = await api<{
      success: boolean
      data?: ContactRequest[]
    }>('/contact', { method: 'GET' })
    return response as unknown as ApiResponseBase<ContactRequest[]>
  },

  updateContactStatus: async (
    id: string,
    status: string,
  ): Promise<ApiResponseBase<ContactRequest>> => {
    return api<ApiResponseBase<ContactRequest>>('/contact/update', {
      method: 'PUT',
      body: { id, status },
    })
  },

  /**
   * ระบบข่าวสารและประชาสัมพันธ์ (News & PR)
   */
  getNewsList: async (
    type: 'NEWS' | 'PR',
  ): Promise<ApiResponseBase<NewsItem[]>> => {
    return api<ApiResponseBase<NewsItem[]>>(
      `/news?type=${type}&limit=50&all=true`,
      {
        method: 'GET',
      },
    )
  },

  createNewsItem: async (
    form: FormData,
  ): Promise<ApiResponseBase<NewsItem>> => {
    return api<ApiResponseBase<NewsItem>>('/news', {
      method: 'POST',
      body: form,
    })
  },

  updateNewsItem: async (
    id: number,
    form: FormData,
  ): Promise<ApiResponseBase<NewsItem>> => {
    return api<ApiResponseBase<NewsItem>>(`/news/${id}`, {
      method: 'PUT',
      body: form,
    })
  },

  /**
   * ระบบจัดการภาควิชา/หน่วยงาน (Departments)
   */
  getDepartments: async (): Promise<DepartmentItem[]> => {
    return api<DepartmentItem[]>('/departments', {
      method: 'GET',
    })
  },

  createDepartment: async (
    form: FormData,
  ): Promise<DepartmentMutationResponse> => {
    return api<DepartmentMutationResponse>('/departments', {
      method: 'POST',
      body: form,
    })
  },

  updateDepartment: async (
    id: number,
    form: FormData,
  ): Promise<DepartmentMutationResponse> => {
    return api<DepartmentMutationResponse>(`/departments/${id}`, {
      method: 'PUT',
      body: form,
    })
  },

  deleteDepartment: async (id: number): Promise<ApiResponseBase> => {
    return api<ApiResponseBase>(`/departments/${id}`, {
      method: 'DELETE',
    })
  },

  updateCommentStatus: async (id: string, isShow: boolean) => {
    const res = await api<ApiResponseBase>('/comments/update', {
      method: 'PUT',
      body: { id, isShow },
    })
    if (!res || !res.success) {
      throw new Error(res?.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ส่วนกลาง')
    }
    return res
  },

  bulkUpdateCommentStatus: async (ids: string[], isShow: boolean) => {
    await Promise.all(
      ids.map((id) =>
        api('/comments/update', {
          method: 'PUT',
          body: { id, isShow },
        }),
      ),
    )
  },

  getComments: async (): Promise<ApiResponseBase<CommentItem[]>> => {
    return api<ApiResponseBase<CommentItem[]>>('/comments?all=true', {
      method: 'GET',
    })
  },
}
