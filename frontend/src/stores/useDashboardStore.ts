import { create } from 'zustand'
import { dashboardService } from '../services/dashboardService'
import type {
  ApiResponseBase,
  CommentItem,
  ContactRequest,
  DepartmentItem,
  NewsItem,
} from '../type'
import { swal, toast } from '../utils/swalConfig'

interface ContactsGroup {
  data: ContactRequest[]
  loading: boolean
  total: number
  pending: number
  fetchAll: () => Promise<void>
  updateStatus: (id: string, currentStatus: string) => Promise<void>
}

interface DashboardState {
  // --- Contact State & Actions ---
  contacts: ContactsGroup

  // --- PR State & Actions ---
  prs: NewsItem[]
  fetchPRs: () => Promise<void>
  createPR: (form: FormData) => Promise<void>
  updatePR: (id: number, form: FormData) => Promise<void>

  // --- News State & Actions ---
  newsList: NewsItem[]
  fetchNews: () => Promise<void>
  createNews: (form: FormData) => Promise<void>
  updateNews: (id: number, form: FormData) => Promise<void>

  // --- Department State & Actions ---
  departmentList: DepartmentItem[]
  departmentLoading: boolean
  fetchDepartments: () => Promise<void>
  setDepartmentList: (
    updater: DepartmentItem[] | ((prev: DepartmentItem[]) => DepartmentItem[]),
  ) => void
  createDepartment: (form: FormData) => Promise<boolean>
  updateDepartment: (id: number, form: FormData) => Promise<boolean>
  deleteDepartment: (id: number) => Promise<boolean>

  // --- Comment State & Actions ---
  commentList: CommentItem[]
  commentLoading: boolean
  fetchComments: () => Promise<void>
  setCommentList: (
    comments: CommentItem[] | ((prev: CommentItem[]) => CommentItem[]),
  ) => void
  toggleCommentShow: (id: string, currentShow: boolean) => Promise<void>
  bulkToggleCommentShow: (ids: string[], show: boolean) => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // ==========================================
  // 1. ระบบรับเรื่องติดต่อกลับ (CONTACT REQUESTS)
  // ==========================================
  contacts: {
    data: [],
    loading: false,
    total: 0,
    pending: 0,
    fetchAll: async () => {
      set((state) => ({ contacts: { ...state.contacts, loading: true } }))
      try {
        const response: ApiResponseBase<ContactRequest[]> =
          await dashboardService.getContacts()
        if (response?.success) {
          const data: ContactRequest[] = response.data || []
          set((state) => ({
            contacts: {
              ...state.contacts,
              data,
              total: data.length,
              pending: data.filter(
                (item: ContactRequest) => item.status === 'ยังไม่ตอบกลับ',
              ).length,
            },
          }))
        }
      } catch (error) {
        console.error('Fetch dashboard contacts failed:', error)
      } finally {
        set((state) => ({ contacts: { ...state.contacts, loading: false } }))
      }
    },
    updateStatus: async (id: string, currentStatus: string) => {
      const nextStatus =
        currentStatus === 'ยังไม่ตอบกลับ' ? 'ตอบกลับแล้ว' : 'ยังไม่ตอบกลับ'

      const result = await swal.fire({
        title: 'เปลี่ยนสถานะการติดต่อ?',
        text: `ปรับสถานะรายการนี้เป็น "${nextStatus}" ใช่หรือไม่?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#185FA5',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
      })

      if (!result.isConfirmed) return

      swal.fire({
        title: 'กำลังประมวลผล...',
        allowOutsideClick: false,
        didOpen: () => swal.showLoading(),
      })

      try {
        const response: ApiResponseBase<ContactRequest> =
          await dashboardService.updateContactStatus(id, nextStatus)

        if (response?.success) {
          await toast.fire({
            icon: 'success',
            title: 'อัปเดตสำเร็จ',
            text: `เปลี่ยนสถานะเป็น "${nextStatus}" เรียบร้อยแล้ว`,
          })
          get().contacts.fetchAll()
        } else {
          throw new Error(response?.message || 'อัปเดตสถานะล้มเหลว')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้'
        console.error('Update contact status failed:', error)
        toast.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: errorMessage,
        })
      }
    },
  },

  // ==========================================
  // 2. ระบบประชาสัมพันธ์ (PR ACTIONS)
  // ==========================================
  prs: [],
  fetchPRs: async () => {
    try {
      const response = await dashboardService.getNewsList('PR')
      if (response?.success) {
        set({ prs: response.data || [] })
      }
    } catch (error) {
      console.error('Failed to fetch PRs:', error)
    }
  },
  createPR: async (form: FormData) => {
    swal.fire({
      title: 'กำลังจัดเก็บข้อมูลประชาสัมพันธ์...',
      didOpen: () => swal.showLoading(),
      allowOutsideClick: false,
    })
    try {
      await dashboardService.createNewsItem(form)
      await get().fetchPRs()
      toast.fire({
        icon: 'success',
        title: 'บันทึกข้อมูลประชาสัมพันธ์สำเร็จ',
      })
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'ไม่สามารถจัดเก็บข้อมูลได้'
      // 🛡️ ดักจับเคสกรณี Backend ส่งสัญญานสำเร็จแต่ติด Error ตัวกลาง
      if (
        msg.includes('สำเร็จ') ||
        msg.includes('success') ||
        msg.includes('Success')
      ) {
        await get().fetchPRs()
        toast.fire({
          icon: 'success',
          title: 'บันทึกข้อมูลสำเร็จ',
        })
        return
      }
      toast.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: msg })
      throw error // โยนต่อเพื่อให้ component รู้ว่าแครช ห้ามปิด modal
    }
  },
  updatePR: async (id: number, form: FormData) => {
    swal.fire({
      title: 'กำลังจัดเก็บข้อมูลประชาสัมพันธ์...',
      didOpen: () => swal.showLoading(),
      allowOutsideClick: false,
    })
    try {
      await dashboardService.updateNewsItem(id, form)
      await get().fetchPRs()
      toast.fire({
        icon: 'success',
        title: 'บันทึกข้อมูลประชาสัมพันธ์สำเร็จ',
      })
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'ไม่สามารถจัดเก็บข้อมูลได้'
      if (
        msg.includes('สำเร็จ') ||
        msg.includes('success') ||
        msg.includes('Success')
      ) {
        await get().fetchPRs()
        toast.fire({
          icon: 'success',
          title: 'บันทึกข้อมูลสำเร็จ',
        })
        return
      }
      toast.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: msg })
      throw error
    }
  },

  // ==========================================
  // 3. ระบบข่าวสารและกิจกรรม (NEWS ACTIONS)
  // ==========================================
  newsList: [],
  fetchNews: async () => {
    try {
      const response = await dashboardService.getNewsList('NEWS')
      if (response?.success) {
        set({ newsList: response.data || [] })
      }
    } catch (error) {
      console.error('Failed to fetch News:', error)
    }
  },
  createNews: async (form: FormData) => {
    swal.fire({
      title: 'กำลังจัดเก็บข้อมูลกิจกรรม...',
      didOpen: () => swal.showLoading(),
      allowOutsideClick: false,
    })
    try {
      await dashboardService.createNewsItem(form)
      await get().fetchNews()
      toast.fire({
        icon: 'success',
        title: 'บันทึกข้อมูลกิจกรรมสำเร็จ',
      })
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'ไม่สามารถจัดเก็บข้อมูลได้'
      if (
        msg.includes('สำเร็จ') ||
        msg.includes('success') ||
        msg.includes('Success')
      ) {
        await get().fetchNews()
        toast.fire({
          icon: 'success',
          title: 'บันทึกข้อมูลสำเร็จ',
        })
        return
      }
      toast.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการบันทึก',
        text: msg,
      })
      throw error
    }
  },
  updateNews: async (id: number, form: FormData) => {
    swal.fire({
      title: 'กำลังจัดเก็บข้อมูลกิจกรรม...',
      didOpen: () => swal.showLoading(),
      allowOutsideClick: false,
    })
    try {
      await dashboardService.updateNewsItem(id, form)
      await get().fetchNews()
      toast.fire({
        icon: 'success',
        title: 'บันทึกข้อมูลกิจกรรมสำเร็จ',
      })
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'ไม่สามารถจัดเก็บข้อมูลได้'
      if (
        msg.includes('สำเร็จ') ||
        msg.includes('success') ||
        msg.includes('Success')
      ) {
        await get().fetchNews()
        toast.fire({
          icon: 'success',
          title: 'บันทึกข้อมูลสำเร็จ',
        })
        return
      }
      toast.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการบันทึก',
        text: msg,
      })
      throw error
    }
  },

  // ==========================================
  // 4. ระบบจัดการหน่วยงาน (DEPARTMENT ACTIONS)
  // ==========================================
  departmentList: [],
  departmentLoading: false,
  fetchDepartments: async () => {
    set({ departmentLoading: true })
    try {
      // 🌟 รับค่ากลับมาในรูปแบบ Array ของแผนกงานตรงๆ จาก Service
      const response: DepartmentItem[] = await dashboardService.getDepartments()

      // 🌟 เช็คว่าเป็น Array ไหม ถ้าใช่ก็อัปเดตลง Store ได้เลยโดยไม่ต้องผ่าน .success หรือ .data
      if (Array.isArray(response)) {
        set({ departmentList: response })
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    } finally {
      set({ departmentLoading: false })
    }
  },
  setDepartmentList: (updater) => {
    set((state) => ({
      departmentList:
        typeof updater === 'function' ? updater(state.departmentList) : updater,
    }))
  },
  createDepartment: async (form: FormData) => {
    try {
      const res = await dashboardService.createDepartment(form)

      // 🌟 เปลี่ยนมาตรวจสอบว่ามีค่า res หรือระบุสำเร็จกลับมาจริง (ไม่พึ่งพาคีย์ id โดดๆ)
      if (res) {
        // ทำการโหลดชุดข้อมูลแผนกใหม่ยกแผงเพื่อให้ข้อมูล Sync กับ DB ล่าสุด
        await get().fetchDepartments()
        return true
      }
      return false
    } catch (error) {
      console.error(error)
      return false
    }
  },
  updateDepartment: async (id: number, form: FormData) => {
    try {
      const res = await dashboardService.updateDepartment(id, form)

      // 🌟 ปรับปรุงการตรวจสอบให้ยืดหยุ่นในลักษณะเดียวกัน
      if (res) {
        await get().fetchDepartments()
        return true
      }
      return false
    } catch (error) {
      console.error(error)
      return false
    }
  },
  deleteDepartment: async (id: number) => {
    try {
      // 🌟 สำหรับ Method DELETE ถ้าไม่มี Error โยนขึ้นมา (HTTP 200) ถือว่าผ่าน
      await dashboardService.deleteDepartment(id)
      set((state) => ({
        departmentList: state.departmentList.filter((item) => item.id !== id),
      }))
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  },

  // ==========================================
  // 5. ระบบจัดการความคิดเห็น (COMMENT ACTIONS)
  // ==========================================
  commentList: [],
  commentLoading: false,
  fetchComments: async () => {
    set({ commentLoading: true })
    try {
      const response = await dashboardService.getComments()
      if (response?.success) {
        set({ commentList: response.data || [] })
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      set({ commentLoading: false })
    }
  },
  setCommentList: (updater) => {
    set((state) => ({
      commentList:
        typeof updater === 'function' ? updater(state.commentList) : updater,
    }))
  },
  toggleCommentShow: async (id: string, currentShow: boolean) => {
    const nextShow = !currentShow
    await dashboardService.updateCommentStatus(id, nextShow)
    set((state) => ({
      commentList: state.commentList.map((c) =>
        c.id === id ? { ...c, isShow: nextShow } : c,
      ),
    }))
  },
  bulkToggleCommentShow: async (ids: string[], show: boolean) => {
    await dashboardService.bulkUpdateCommentStatus(ids, show)
    const idSet = new Set(ids)
    set((state) => ({
      commentList: state.commentList.map((c) =>
        idSet.has(c.id) ? { ...c, isShow: show } : c,
      ),
    }))
  },
}))
