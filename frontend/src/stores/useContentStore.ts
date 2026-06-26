import isEmail from 'validator/lib/isEmail'
import { create } from 'zustand'
import { contentService } from '../services/contentService'
import type {
  CommentFormData,
  CommentItem,
  ContactFormData,
  ContactFormErrors,
  ContactRequest,
  DepartmentItem,
  NewsFormData,
  NewsItem,
} from '../type'
import { swal, toast } from '../utils/swalConfig'

interface ContentState {
  newsList: NewsItem[]
  prList: NewsItem[]
  commentList: CommentItem[]
  departmentList: DepartmentItem[]
  contactList: ContactRequest[]

  isLoading: boolean
  isContactLoading: boolean
  isSubmittingContact: boolean
  contactErrors: ContactFormErrors
  isSubmittingComment: boolean
  commentError: string

  formData: NewsFormData | null
  activePost: NewsItem | null
  uploadFile: File | null
  mobileView: 'form' | 'preview'

  // 🌟 ย้ายมาเก็บใน Store เพื่อทำ Rate Limit แบบไม่ต้องส่งพารามิเตอร์รุงรัง
  commentTimestamps: number[]

  setMobileView: (view: 'form' | 'preview') => void
  setUploadFile: (file: File | null) => void
  setFormData: (data: NewsFormData | null) => void
  setActivePost: (post: NewsItem | null) => void
  setCommentError: (error: string) => void

  fetchPublicData: () => Promise<void>
  fetchContacts: () => Promise<void>
  saveNewsEntry: (type: 'PR' | 'NEWS', closeModal: () => void) => Promise<void>
  toggleNewsVisibility: (id: string, currentShow: boolean) => Promise<void>
  toggleCommentStatus: (id: string, currentShow: boolean) => Promise<void>
  bulkCommentsStatus: (ids: Set<string>, show: boolean) => Promise<void>
  updateContactStatus: (id: string, currentStatus: string) => Promise<void>
  submitContactForm: (
    formData: ContactFormData,
    resetForm: () => void,
  ) => Promise<void>
  clearContactErrors: () => void
  submitUserComment: (
    formData: CommentFormData,
    resetForm: () => void,
    setIsOpen: (open: boolean) => void,
  ) => Promise<void>
}

export const useContentStore = create<ContentState>((set, get) => ({
  newsList: [],
  prList: [],
  commentList: [],
  departmentList: [],
  contactList: [],
  isLoading: true,
  isContactLoading: false,
  formData: null,
  activePost: null,
  uploadFile: null,
  mobileView: 'form',
  isSubmittingContact: false,
  contactErrors: {},
  isSubmittingComment: false,
  commentError: '',
  commentTimestamps: [],

  setMobileView: (view) => set({ mobileView: view }),
  setUploadFile: (file) => set({ uploadFile: file }),
  setFormData: (data) => set({ formData: data }),
  setActivePost: (post) => set({ activePost: post }),
  setCommentError: (error) => set({ commentError: error }),

  fetchPublicData: async () => {
    try {
      set({ isLoading: true })

      // 🌟 ใช้ Promise.allSettled เพื่อป้องกันกรณี API ตัวใดตัวหนึ่งล่ม แล้วทำให้ตัวอื่นไม่ยอมโหลดข้อมูล
      const results = await Promise.allSettled([
        contentService.getNews('PR'),
        contentService.getNews('NEWS'),
        contentService.getComments(false),
        contentService.getDepartments(),
      ])

      set({
        prList: results[0].status === 'fulfilled' ? results[0].value : [],
        newsList: results[1].status === 'fulfilled' ? results[1].value : [],
        commentList: results[2].status === 'fulfilled' ? results[2].value : [],
        departmentList:
          results[3].status === 'fulfilled' ? results[3].value || [] : [],
      })
    } catch (err: unknown) {
      console.error('[Content Store] Loading master data failed:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchContacts: async () => {
    try {
      set({ isContactLoading: true })
      const data = (await contentService.getContacts()) as ContactRequest[]
      set({ contactList: data })
    } catch (err: unknown) {
      console.error('[Content Store] Fetching contacts data failed:', err)
    } finally {
      set({ isContactLoading: false })
    }
  },

  clearContactErrors: () => set({ contactErrors: {} }),

  submitContactForm: async (formData, resetForm) => {
    if (formData.botField) {
      console.warn(
        '[Contact Store] Bot submission intercepted via honeypot field.',
      )
      resetForm()
      return
    }

    const newErrors: ContactFormErrors = {}
    let isValid = true

    // ปรับปรุง Regex ขยายขอบเขตภาษาไทยให้ครอบคลุมสระ/วรรณยุกต์พิเศษทั้งหมด
    const isThaiOnly = (v: string) => /^[ก-๙\sหนึ่-์]+$/.test(v)
    const isEngOnly = (v: string) => /^[a-zA-Z\s\-.]+$/.test(v)

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'กรุณากรอกชื่อจริงของท่าน'
      isValid = false
    } else if (
      !isThaiOnly(formData.firstName) &&
      !isEngOnly(formData.firstName)
    ) {
      newErrors.firstName =
        'กรุณากรอกเฉพาะตัวอักษรภาษาไทยหรือภาษาอังกฤษล้วนเท่านั้น'
      isValid = false
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'กรุณากรอกนามสกุลของท่าน'
      isValid = false
    } else if (
      !isThaiOnly(formData.lastName) &&
      !isEngOnly(formData.lastName)
    ) {
      newErrors.lastName =
        'กรุณากรอกเฉพาะตัวอักษรภาษาไทยหรือภาษาอังกฤษล้วนเท่านั้น'
      isValid = false
    }

    if (isValid && formData.firstName && formData.lastName) {
      if (isThaiOnly(formData.firstName) !== isThaiOnly(formData.lastName)) {
        newErrors.firstName = 'ชื่อและนามสกุลต้องเป็นภาษาเดียวกันเท่านั้น'
        newErrors.lastName = 'ชื่อและนามสกุลต้องเป็นภาษาเดียวกันเท่านั้น'
        isValid = false
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมลครับ/ค่ะ'
      isValid = false
    } else if (!isEmail(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง (เช่น example@mail.com)'
      isValid = false
    }

    if (formData.telNumber && !/^0[0-9]{9}$/.test(formData.telNumber)) {
      newErrors.telNumber = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องมี 10 หลัก)'
      isValid = false
    }

    if (!formData.preferredContact) {
      newErrors.preferredContact = 'กรุณาเลือกช่องทางการติดต่อกลับ'
      isValid = false
    }

    if (!formData.message.trim()) {
      newErrors.message = 'กรุณากรอกข้อความที่ต้องการสอบถาม'
      isValid = false
    }

    set({ contactErrors: newErrors })
    if (!isValid) return

    set({ isSubmittingContact: true })

    swal.fire({
      title: 'กำลังส่งข้อความ...',
      text: 'กรุณารอสักครู่ระบบกำลังบันทึกข้อมูล',
      allowOutsideClick: false,
      didOpen: () => swal.showLoading(),
    })

    const { botField: _, ...actualData } = formData

    try {
      const response = await contentService.createContact(actualData)

      if (response && response.success) {
        await toast.fire({
          icon: 'success',
          title: 'ส่งข้อความสำเร็จ!',
          text: 'ขอบคุณที่ติดต่อเรา เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด',
        })
        resetForm()
        await get().fetchContacts()
      } else {
        toast.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text:
            response?.message ||
            'ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้งในภายหลัง',
        })
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'ระบบขัดข้อง'
      toast.fire({
        icon: 'error',
        title: 'การเชื่อมต่อล้มเหลว',
        text: msg,
      })
    } finally {
      set({ isSubmittingContact: false })
    }
  },

  saveNewsEntry: async (type, closeModal) => {
    const { formData, activePost, uploadFile, mobileView } = get()

    if (!formData || !formData.title.trim()) {
      toast.fire({
        icon: 'error',
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณาระบุหัวข้อประกาศก่อนดำเนินการต่อครับ',
      })
      if (mobileView === 'preview') set({ mobileView: 'form' })
      return
    }

    if (activePost === null && !uploadFile) {
      toast.fire({
        icon: 'error',
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณาทำการอัปโหลดรูปภาพปกสำหรับประกาศใหม่นี้ด้วยครับ',
      })
      return
    }

    swal.fire({
      title: 'กำลังบันทึกข้อมูล...',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => swal.showLoading(),
    })

    try {
      const form = new FormData()
      form.append('type', type)
      form.append('title', formData.title)
      form.append('description', formData.description || '')
      form.append('content', formData.content || '')
      if (uploadFile) form.append('image', uploadFile)

      if (activePost === null) {
        await contentService.createNews(form)
      } else if (formData.id) {
        await contentService.updateNews(String(formData.id), form)
      }

      await get().fetchPublicData()
      closeModal()

      toast.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จเรียบร้อย',
      })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'บันทึกข้อมูลล้มเหลว'
      toast.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดภายในระบบ',
        text: msg,
      })
    }
  },

  toggleNewsVisibility: async (id, currentShow) => {
    try {
      const nextShow = !currentShow
      await contentService.toggleNewsVisibility(id, nextShow)
      await get().fetchPublicData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[Content Store] Toggle visibility pattern aborted:', msg)
    }
  },

  toggleCommentStatus: async (id, currentShow) => {
    swal.fire({
      title: 'กำลังบันทึกสถานะ',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => swal.showLoading(),
    })
    try {
      const nextShow = !currentShow
      await contentService.updateCommentStatus(id, nextShow)
      set((state) => ({
        commentList: state.commentList.map((c) =>
          c.id === id ? { ...c, isShow: nextShow } : c,
        ),
      }))
      toast.fire({
        title: 'บันทึกสถานะเรียบร้อย',
        icon: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ระบบขัดข้อง'
      toast.fire({
        icon: 'error',
        title: 'อัปเดตสถานะล้มเหลว',
        text: msg,
      })
    }
  },

  bulkCommentsStatus: async (ids, show) => {
    if (ids.size === 0) return
    swal.fire({
      title: `กำลังอัปเดตสถานะ ${ids.size} รายการ`,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => swal.showLoading(),
    })
    try {
      await Promise.all(
        Array.from(ids).map((id) =>
          contentService.updateCommentStatus(id, show),
        ),
      )
      set((state) => ({
        commentList: state.commentList.map((c) =>
          ids.has(c.id) ? { ...c, isShow: show } : c,
        ),
      }))
      toast.fire({
        title: 'อัปเดตกลุ่มสำเร็จเรียบร้อย',
        icon: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ระบบขัดข้อง'
      toast.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการอัปเดตกลุ่ม',
        text: msg,
      })
    }
  },

  updateContactStatus: async (id, currentStatus) => {
    const nextStatus =
      currentStatus === 'ยังไม่ตอบกลับ' ? 'ตอบกลับแล้ว' : 'ยังไม่ตอบกลับ'
    const result = await swal.fire({
      title: 'เปลี่ยนสถานะการติดต่อ?',
      text: `ปรับสถานะรายการนี้เป็น "${nextStatus}" ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
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
      await contentService.updateContactStatus(id, nextStatus)
      await get().fetchContacts()
      toast.fire({
        icon: 'success',
        title: 'อัปเดตสำเร็จ',
        text: `เปลี่ยนสถานะเป็น "${nextStatus}" เรียบร้อยแล้ว`,
      })
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'ไม่สามารถอัปเดตสถานะได้'
      toast.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: msg,
      })
    }
  },

  // 🌟 ปรับปรุงลดการส่ง Arguments ซ้ำซ้อนลงอย่างชัดเจน
  submitUserComment: async (formData, resetForm, setIsOpen) => {
    const MIN_COMMENT_LENGTH = 10
    const RATE_LIMIT_WINDOW_MS = 60000
    const RATE_LIMIT_COUNT = 3

    if (formData.botField) {
      toast.fire({
        title: 'ส่งความคิดเห็นสำเร็จ',
        icon: 'success',
      })
      resetForm()
      setIsOpen(false)
      return
    }

    if (formData.rating === 0) {
      toast.fire({
        icon: 'warning',
        title: 'กรุณาให้คะแนนความพึงพอใจ',
        text: 'โปรดเลือกคะแนนดาวก่อนส่งข้อเสนอแนะให้แก่ระบบครับ',
      })
      return
    }

    if (formData.content.trim().length < MIN_COMMENT_LENGTH) {
      set({ commentError: `กรุณากรอกอย่างน้อย ${MIN_COMMENT_LENGTH} ตัวอักษร` })
      return
    }

    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i
    if (urlRegex.test(formData.content)) {
      toast.fire({
        icon: 'error',
        title: 'ไม่อนุญาตให้แนบลิงก์',
        text: 'ระบบความปลอดภัยไม่อนุญาตให้ระบุที่อยู่ลิงก์เว็บไซต์ใดๆ ภายในช่องความคิดเห็นครับ',
      })
      return
    }

    const now = Date.now()
    const filteredTimestamps = get().commentTimestamps.filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS,
    )

    if (filteredTimestamps.length >= RATE_LIMIT_COUNT) {
      toast.fire({
        icon: 'warning',
        title: 'ส่งข้อมูลบ่อยเกินไป',
        text: 'คุณทำรายการถี่เกินกำหนด กรุณาเว้นระยะสักครู่แล้วลองใหม่อีกครั้งครับ',
      })
      set({ commentTimestamps: filteredTimestamps })
      return
    }

    set({
      isSubmittingComment: true,
      commentTimestamps: [...filteredTimestamps, now],
    })

    try {
      const response = await contentService.createComment({
        star: formData.rating,
        msg: formData.content.trim(),
      })

      if (response && response.success) {
        toast.fire({
          title: 'ส่งความคิดเห็นสำเร็จ',
          html: 'ขอบพระคุณสำหรับข้อเสนอแนะและคำติชมของท่าน',
          icon: 'success',
        })
        resetForm()
        set({ commentError: '' })
        setIsOpen(false)
        await get().fetchPublicData() // ดึงข้อมูลใหม่ผ่าน get() โดยตรง
      } else {
        throw new Error(response?.message || 'ไม่สามารถส่งข้อมูลได้')
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'ไม่สามารถเชื่อมต่อระบบเซิร์ฟเวอร์ได้ในขณะนี้ กรุณาลองใหม่ครับ'
      toast.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: msg,
      })
    } finally {
      set({ isSubmittingComment: false })
    }
  },
}))
