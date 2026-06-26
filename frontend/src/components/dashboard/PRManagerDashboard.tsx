import { Grid, List } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import {
  FaBullhorn,
  FaEye,
  FaLightbulb,
  FaQuestionCircle,
  FaTimes,
} from 'react-icons/fa'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { dashboardService } from '../../services/dashboardService'
import { useDashboardStore } from '../../stores/useDashboardStore'
import type { NewsItem } from '../../type'
import { swal, toast } from '../../utils/swalConfig'

type StatusFilter = 'all' | 'shown' | 'hidden'
type SortOrder = 'newest' | 'oldest'
type ViewMode = 'card' | 'list'

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean'],
  ],
}

// ==========================================
// Mini Preview Component
// ==========================================
const MiniAdvertisePreview = ({ data }: { data: NewsItem | null }) => {
  if (!data) return null
  return (
    <div className='bg-white h-full overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl relative shadow-sm'>
      <div className='w-full h-40 md:h-48 bg-slate-200 flex items-center justify-center text-slate-400'>
        {data.image_src ? (
          <img
            src={data.image_src}
            alt='cover'
            className='w-full h-full object-cover'
          />
        ) : (
          <span className='text-xs'>ไม่มีรูปภาพประกอบ</span>
        )}
      </div>
      <div className='p-4 md:p-6 pb-8'>
        <p className='text-xs text-blue-600 font-bold mb-2'>
          {data.date ? data.date.split('T')[0] : 'YYYY-MM-DD'}
        </p>
        <h1 className='text-base md:text-lg font-bold text-slate-800 mb-3 leading-snug'>
          {data.title || 'พิมพ์หัวข้อประกาศ...'}
        </h1>
        <hr className='border-slate-100 mb-4' />
        <div
          className='text-slate-600 text-sm leading-relaxed ql-rendered'
          dangerouslySetInnerHTML={{
            __html: data.content || data.description || 'พิมพ์เนื้อหาประกาศ...',
          }}
        />
      </div>
      <div className='absolute top-3 right-3 bg-slate-900/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm'>
        Live Preview
      </div>
    </div>
  )
}

// ==========================================
// Filter Bar Component
// ==========================================
interface FilterBarProps {
  search: string
  onSearch: (value: string) => void
  status: StatusFilter
  onStatus: (value: StatusFilter) => void
  sort: SortOrder
  onSort: (value: SortOrder) => void
  view: ViewMode
  onView: (value: ViewMode) => void
  totalCount: number
  filteredCount: number
}

const FilterBar = ({
  search,
  onSearch,
  status,
  onStatus,
  sort,
  onSort,
  view,
  onView,
  totalCount,
  filteredCount,
}: FilterBarProps) => {
  return (
    <div className='bg-white border border-slate-200 rounded-xl px-4 py-3 mb-5'>
      <div className='flex flex-wrap gap-3 items-center'>
        <div className='relative flex-1 min-w-[180px]'>
          <svg
            className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
          <input
            type='text'
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder='ค้นหาชื่อประกาศประชาสัมพันธ์...'
            className='w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50'
          />
          {search && (
            <button
              onClick={() => onSearch('')}
              className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5'
            >
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          )}
        </div>
        <div className='flex flex-wrap gap-2 items-center'>
          <div className='flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium'>
            {(['all', 'shown', 'hidden'] as StatusFilter[]).map((s) => {
              const labels: Record<StatusFilter, string> = {
                all: 'ทั้งหมด',
                shown: 'แสดงอยู่',
                hidden: 'ซ่อนอยู่',
              }
              return (
                <button
                  key={s}
                  onClick={() => onStatus(s)}
                  className={`px-3 py-2 transition-colors ${status === s ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {labels[s]}
                </button>
              )
            })}
          </div>
          <div className='flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium'>
            <button
              onClick={() => onSort('newest')}
              className={`px-3 py-2 transition-colors ${sort === 'newest' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              ใหม่สุด
            </button>
            <button
              onClick={() => onSort('oldest')}
              className={`px-3 py-2 transition-colors ${sort === 'oldest' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              เก่าสุด
            </button>
          </div>
          <div className='flex rounded-lg border border-slate-200 overflow-hidden'>
            <button
              onClick={() => onView('card')}
              className={`px-3 py-2 transition-colors ${view === 'card' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => onView('list')}
              className={`px-3 py-2 transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>
      {search && (
        <p className='text-xs text-slate-500 mt-2'>
          พบ <span className='font-bold text-slate-700'>{filteredCount}</span>{' '}
          รายการ จากทั้งหมด {totalCount} รายการ
        </p>
      )}
    </div>
  )
}

// ==========================================
// Toggle Switch
// ==========================================
interface ToggleSwitchProps {
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  itemId: number
}

const ToggleSwitch = ({ checked, onChange, itemId }: ToggleSwitchProps) => (
  <label
    className='relative inline-flex items-center cursor-pointer gap-2'
    onClick={(e) => e.stopPropagation()}
  >
    <span
      className={`text-[11px] font-bold ${checked ? 'text-emerald-600' : 'text-slate-400'}`}
    >
      {checked ? 'แสดงบนเว็บ' : 'ซ่อน'}
    </span>
    <input
      type='checkbox'
      checked={checked}
      onChange={onChange}
      className='sr-only peer'
      id={`toggle-${itemId}`}
    />
    <div className="relative w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[18px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
  </label>
)

// ==========================================
// Main Component
// ==========================================
export default function PRManagerDashboard() {
  const newsList = useDashboardStore((state) => state.prs)
  const fetchNews = useDashboardStore((state) => state.fetchPRs)
  const createNews = useDashboardStore((state) => state.createPR)
  const updateNews = useDashboardStore((state) => state.updatePR)

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const [search, setSearch] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('card')

  const [showTips, setShowTips] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [activePost, setActivePost] = useState<NewsItem | null>(null)
  const [formData, setFormData] = useState<NewsItem | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const API_URL = import.meta.env.VITE_API_URL || ''

  const shownCount = newsList.filter((item) => item.isShow).length

  const filteredList = useMemo(() => {
    let result = [...newsList]
    if (search.trim()) {
      const query = search.trim().toLowerCase()
      result = result.filter((item) => item.title.toLowerCase().includes(query))
    }
    if (statusFilter === 'shown') result = result.filter((item) => item.isShow)
    else if (statusFilter === 'hidden')
      result = result.filter((item) => !item.isShow)

    result.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      if (dateA === dateB) {
        return sortOrder === 'newest' ? b.id - a.id : a.id - b.id
      }
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })
    return result
  }, [newsList, search, statusFilter, sortOrder])

  const handleToggleShow = async (id: number, currentShow: boolean) => {
    swal.fire({
      title: 'กำลังเปลี่ยนสถานะการแสดงผล...',
      allowOutsideClick: false,
      didOpen: () => swal.showLoading(),
    })
    try {
      // เรียก API patch โดยตรง ไม่ผ่าน updatePR ที่มี Swal ซ้อน
      const form = new FormData()
      form.append('isShow', String(!currentShow))
      await dashboardService.updateNewsItem(id, form)
      await fetchNews() // refresh list (fetchNews = fetchPRs ตามที่ bind ไว้ด้านบน)
      toast.fire({
        icon: 'success',
        title: !currentShow ? 'แสดงบนเว็บแล้ว' : 'ซ่อนแล้ว',
        timer: 1000,
        showConfirmButton: false,
      })
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'ไม่สามารถแก้ไขสถานะการแสดงผลได้'

      toast.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: errorMessage,
      })
    }
  }

  const handleCreateNew = () => {
    setActivePost(null)
    setFormData({
      id: Date.now(),
      type: 'PR',
      title: '',
      date: new Date().toISOString().split('T')[0],
      image_src: '',
      description: '',
      content: '',
      views: 0,
      isShow: true,
    })
    setUploadFile(null)
    setMobileView('form')
    setIsModalOpen(true)
  }

  const handleOpenModal = (post: NewsItem) => {
    setActivePost(post)
    setFormData({ ...post })
    setUploadFile(null)
    setMobileView('form')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => {
      setActivePost(null)
      setFormData(null)
      setUploadFile(null)
      setMobileView('form')
    }, 200)
  }

  const handleRefreshData = () => {
    swal
      .fire({
        title: 'คืนค่าข้อมูลพิมพ์?',
        text: 'ข้อมูลในฟอร์มปัจจุบันจะถูกรีเซ็ตกลับไปเป็นค่าตั้งต้นแรกสุด',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ยืนยันรีเซ็ต',
        cancelButtonText: 'ยกเลิก',
        reverseButtons: true,
      })
      .then((result) => {
        if (result.isConfirmed) {
          setFormData(
            activePost
              ? { ...activePost }
              : {
                  id: formData?.id || Date.now(),
                  type: 'PR',
                  title: '',
                  date: new Date().toISOString().split('T')[0],
                  image_src: '',
                  description: '',
                  content: '',
                  views: 0,
                  isShow: true,
                },
          )
          setUploadFile(null)
        }
      })
  }

  const handleClearAll = () => {
    swal
      .fire({
        title: 'ล้างช่องข้อความทั้งหมด?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonText: 'ยกเลิก',
        reverseButtons: true,
      })
      .then((result) => {
        if (result.isConfirmed) {
          setFormData({
            ...formData!,
            title: '',
            image_src: '',
            content: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
          })
          setUploadFile(null)
        }
      })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0])
      handleFileUpload(e.dataTransfer.files[0])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0])
  }

  const handleFileUpload = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.fire({
        icon: 'error',
        title: 'รูปแบบไฟล์ไม่ถูกต้อง',
        text: 'รองรับไฟล์รูปภาพ .jpg, .png, .webp เท่านั้น',
      })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.fire({
        icon: 'warning',
        title: 'ไฟล์มีขนาดใหญ่เกินไป',
        text: 'กรุณาอัปโหลดไฟล์รูปภาพขนาดไม่เกิน 5MB',
      })
      return
    }
    setUploadFile(file)
    if (formData) {
      setFormData({ ...formData, image_src: URL.createObjectURL(file) })
    }
  }

  const handleSave = async () => {
    if (!formData || !formData.title.trim()) {
      toast.fire({
        icon: 'error',
        title: 'กรอกข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกหัวข้อประกาศประชาสัมพันธ์ก่อนทำการบันทึก',
      })
      if (mobileView === 'preview') setMobileView('form')
      return
    }
    if (activePost === null && !uploadFile) {
      toast.fire({
        icon: 'error',
        title: 'กรอกข้อมูลไม่ครบถ้วน',
        text: 'กรุณาทำการเลือกอัปโหลดรูปภาพปกประชาสัมพันธ์หลักด้วยค่ะ',
      })
      return
    }

    try {
      const form = new FormData()
      form.append('type', 'PR')
      form.append('title', formData.title.trim())
      form.append('description', formData.description || '')
      form.append('content', formData.content || '')
      form.append('date', formData.date || new Date().toISOString())

      if (uploadFile) {
        form.append('image', uploadFile)
      }

      // เรียกใช้ฟังก์ชันผ่าน Store โดยตรงตามที่คุณคิดไว้เลยครับ
      if (activePost === null) {
        await createNews(form) // ผูกกับ createPR ไว้แล้วด้านบน
      } else {
        await updateNews(formData.id, form) // ผูกกับ updatePR ไว้แล้วด้านบน
      }

      // ปิดหน้าต่าง Popup ทันทีเมื่อฝั่ง Store ทำงานผ่านฉลุยโดยไม่โยนข้อความแครช
      handleCloseModal()
    } catch {
      // ไม่ต้องเขียนระบบแสดงผลผิดพลาดซ้ำซ้อน เพราะฝั่ง Store จัดการยิง SWAL แดงให้เสร็จเรียบร้อยแล้วครับ
      console.log('[Component Action] Operation halted due to store error.')
    }
  }

  return (
    <div className='bg-slate-100 min-h-screen p-4 md:p-8 font-sans text-slate-800 antialiased'>
      {/* --- Page Header --- */}
      <div className='max-w-7xl mx-auto mb-5 flex flex-col md:flex-row justify-between items-start md:items-end gap-4'>
        <div>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold mb-2 tracking-tight text-slate-900'>
              จัดการคลังประชาสัมพันธ์ (PR Manager)
            </h1>
            <button
              type='button'
              onClick={() => setShowTips(true)}
              aria-label='ดูวิธีการใช้งาน'
              className='w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mb-2'
            >
              <FaQuestionCircle className='w-5 h-5' />
            </button>
          </div>
          <div className='flex items-center gap-4 text-sm font-medium'>
            <span className='text-slate-600'>
              ข้อมูลทั้งหมด:{' '}
              <span className='font-bold text-slate-900'>
                {newsList.length}
              </span>{' '}
              รายการ{' '}
            </span>
            <span className='w-px h-4 bg-slate-300'></span>
            <span className='text-emerald-600 font-bold'>
              เปิดแสดงผลบนหน้าเว็บไซต์: {shownCount} รายการ
            </span>
          </div>
        </div>
        <button
          onClick={handleCreateNew}
          className='w-full md:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl shadow-sm hover:bg-blue-700 transition-all font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95'
        >
          สร้างประชาสัมพันธ์ใหม่
        </button>
      </div>

      <div className='max-w-7xl mx-auto'>
        <FilterBar
          search={search}
          onSearch={setSearch}
          status={statusFilter}
          onStatus={setStatusFilter}
          sort={sortOrder}
          onSort={setSortOrder}
          view={viewMode}
          onView={setViewMode}
          totalCount={newsList.length}
          filteredCount={filteredList.length}
        />
      </div>

      {/* ========================================== */}
      {/* CARD VIEW */}
      {/* ========================================== */}
      {viewMode === 'card' && filteredList.length > 0 && (
        <div className='max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-20'>
          {filteredList.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenModal(item)}
              className='bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all cubic-bezier(.4,0,.2,1) duration-200 cursor-pointer flex flex-col overflow-hidden group shadow-sm'
            >
              <div className='p-4 flex gap-4 flex-1'>
                <div className='w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 shrink-0 overflow-hidden relative shadow-inner'>
                  {item.image_src ? (
                    <img
                      src={
                        item.image_src.startsWith('blob:')
                          ? item.image_src
                          : `${API_URL}${item.image_src}`
                      }
                      alt='cover'
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                      loading='lazy'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-slate-300 text-xs font-semibold'>
                      ไม่มีรูป
                    </div>
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-[11px] text-blue-600 font-black mb-1 font-mono'>
                    {item.date ? item.date.split('T')[0] : ''}
                  </p>
                  <h3 className='text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-blue-700 transition-colors leading-snug'>
                    {item.title}
                  </h3>
                </div>
              </div>
              <div
                className='bg-slate-50 border-t border-slate-100 px-4 py-2.5 flex justify-end items-center'
                onClick={(e) => e.stopPropagation()}
              >
                <ToggleSwitch
                  checked={!!item.isShow}
                  onChange={() => handleToggleShow(item.id, !!item.isShow)}
                  itemId={item.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================== */}
      {/* LIST VIEW */}
      {/* ========================================== */}
      {viewMode === 'list' && filteredList.length > 0 && (
        <div className='max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100'>
          {filteredList.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenModal(item)}
              className='flex items-center gap-4 p-4 hover:bg-slate-50/60 cursor-pointer transition-colors'
            >
              <div className='w-24 h-16 bg-slate-100 rounded-xl border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center shadow-inner'>
                {item.image_src ? (
                  <img
                    src={
                      item.image_src.startsWith('blob:')
                        ? item.image_src
                        : `${API_URL}${item.image_src}`
                    }
                    alt='cover'
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <span className='text-slate-300 text-xs font-semibold'>
                    ไม่มีรูป
                  </span>
                )}
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-[11px] text-blue-600 font-bold mb-0.5 font-mono'>
                  {item.date ? item.date.split('T')[0] : ''}
                </p>
                <h3 className='text-sm font-bold text-slate-800 truncate'>
                  {item.title}
                </h3>
                <p className='text-xs text-slate-400 truncate mt-0.5 font-medium'>
                  {item.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                </p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <ToggleSwitch
                  checked={!!item.isShow}
                  onChange={() => handleToggleShow(item.id, !!item.isShow)}
                  itemId={item.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL POPUP */}
      {/* ========================================== */}
      {isModalOpen && formData && (
        <div
          onClick={handleCloseModal}
          className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='bg-white w-full max-w-6xl h-[95vh] md:h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden'
          >
            <div className='px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0'>
              <h2 className='text-base md:text-md font-bold text-slate-800'>
                {activePost === null
                  ? '✨ สร้างประกาศประชาสัมพันธ์ใหม่'
                  : `✏️ แก้ไขรายละเอียดประชาสัมพันธ์: ID ${formData.id}`}
              </h2>
              <div className='flex items-center gap-2 md:gap-4'>
                <button
                  onClick={handleRefreshData}
                  className='text-xs text-slate-600 font-bold hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-50 transition-all cursor-pointer'
                >
                  รีเซ็ตฟอร์ม
                </button>
                <button
                  onClick={handleClearAll}
                  className='flex items-center gap-1.5 text-xs text-red-500 font-bold hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 transition-all cursor-pointer'
                >
                  ล้างข้อมูลช่องกรอก
                </button>
                <button
                  onClick={handleCloseModal}
                  className='p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer'
                >
                  ✕
                </button>
              </div>
            </div>

            <div className='flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50'>
              <div
                className={`flex-1 overflow-y-auto custom-scrollbar bg-white p-4 md:p-8 ${mobileView === 'preview' ? 'hidden lg:block' : 'block'}`}
              >
                <div className='max-w-3xl mx-auto space-y-6 pb-4 text-sm font-medium'>
                  {/* หัวข้อประกาศ */}
                  <div className='space-y-1.5 border-b border-slate-100 pb-5'>
                    <label className='block font-bold text-slate-700'>
                      หัวข้อประกาศประชาสัมพันธ์{' '}
                      <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder='ระบุหัวข้อรายละเอียดงานประชาสัมพันธ์...'
                      className='w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all'
                    />
                  </div>

                  {/* วันที่ */}
                  <div className='space-y-1.5 border-b border-slate-100 pb-5'>
                    <label className='block font-bold text-slate-700'>
                      วันที่ลงบันทึกประกาศ (Date)
                    </label>
                    <input
                      type='date'
                      value={formData.date ? formData.date.split('T')[0] : ''}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className='border border-slate-200 bg-slate-50 font-mono rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                    />
                  </div>

                  {/* คำอธิบายสั้น */}
                  <div className='space-y-1.5 border-b border-slate-100 pb-5'>
                    <div className='flex justify-between items-baseline'>
                      <label className='block font-bold text-slate-700'>
                        คำอธิบายสั้นประจำข่าวการ์ดหน้าแรก
                      </label>
                      <span className='text-[10px] font-mono text-slate-400'>
                        {(formData.description || '').length}/200
                      </span>
                    </div>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder='สรุปคำอธิบายย่อใจความสำคัญสั้นๆ ไม่เกิน 200 ตัวอักษร...'
                      maxLength={200}
                      rows={3}
                      className='w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none font-medium transition-all'
                    />
                  </div>

                  {/* ภาพปก */}
                  <div className='space-y-1.5 border-b border-slate-100 pb-5'>
                    <label className='block font-bold text-slate-700'>
                      รูปภาพหน้าปกประชาสัมพันธ์ (Cover Image)
                    </label>
                    <div className='flex flex-col sm:flex-row gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/60'>
                      {formData.image_src && (
                        <div className='relative w-full sm:w-32 h-24 rounded-xl border border-slate-200 overflow-hidden shrink-0 shadow-sm'>
                          <img
                            src={
                              formData.image_src.startsWith('blob:')
                                ? formData.image_src
                                : `${API_URL}${formData.image_src}`
                            }
                            alt='cover'
                            className='w-full h-full object-cover'
                          />
                          <button
                            type='button'
                            onClick={() =>
                              setFormData({ ...formData, image_src: '' })
                            }
                            className='absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow transition-all cursor-pointer hover:bg-red-600 active:scale-90'
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`flex-1 w-full h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-colors cursor-pointer relative ${isDragging ? 'border-blue-500 bg-blue-100/50' : 'border-slate-300 bg-white'}`}
                      >
                        <input
                          type='file'
                          accept='image/jpeg,image/png,image/webp'
                          onChange={handleFileInput}
                          className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                        />
                        <p className='text-xs font-bold text-blue-600'>
                          คลิกเพื่ออัปโหลดไฟล์ภาพปก{' '}
                          <span className='text-slate-400 font-medium'>
                            หรือลากรูปมาวาง
                          </span>
                        </p>
                        <p className='text-[10px] text-slate-400 font-mono mt-0.5'>
                          PNG, JPG, WEBP (MAX 5MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* เนื้อหาหลัก */}
                  <div className='space-y-1.5'>
                    <label className='block font-bold text-slate-700'>
                      เนื้อหารายละเอียดประชาสัมพันธ์ฉบับเต็ม (Content Details)
                    </label>
                    <div className='bg-white rounded-xl border border-slate-200 overflow-hidden shadow-inner'>
                      <ReactQuill
                        theme='snow'
                        value={formData.content || ''}
                        onChange={(val) =>
                          setFormData({ ...formData, content: val })
                        }
                        modules={quillModules}
                        className='flex flex-col h-[320px] pb-10'
                        placeholder='เขียนข้อความ ลิงก์ หรือจัดรูปแบบตามต้องการในคอลัมน์นี้...'
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side Column Dashboard Preview */}
              <div
                className={`w-full lg:w-[400px] xl:w-[420px] bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 p-4 lg:p-6 overflow-y-auto custom-scrollbar flex flex-col shrink-0 ${mobileView === 'form' ? 'hidden lg:flex' : 'flex'}`}
              >
                <h3 className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0'>
                  <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse'></span>{' '}
                  ห้องตรวจสอบหน้าตัวอย่าง (Live Content Preview)
                </h3>
                <div className='flex-1 min-h-0 pb-4'>
                  <MiniAdvertisePreview
                    data={{
                      ...formData,
                      image_src:
                        formData.image_src &&
                        !formData.image_src.startsWith('blob:')
                          ? `${API_URL}${formData.image_src}`
                          : formData.image_src,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className='px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-2.5 shrink-0'>
              <button
                onClick={handleCloseModal}
                className='px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95'
              >
                ยกเลิกรายการ
              </button>
              <button
                onClick={handleSave}
                className='px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-blue-500/10 cursor-pointer active:scale-95'
              >
                บันทึกประกาศประชาสัมพันธ์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips Popup */}
      {showTips && (
        <div
          className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/40'
          onClick={() => setShowTips(false)}
        >
          <div
            className='bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-[scaleIn_0.2s_ease-out]'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#e8eaed]'>
              <div className='flex items-center gap-2'>
                <FaLightbulb className='text-xl text-amber-500' />
                <span className='text-[16px] font-semibold text-[#202124]'>
                  Tips การใช้งาน
                </span>
              </div>
              <button
                onClick={() => setShowTips(false)}
                aria-label='ปิด Tips'
                className='w-8 h-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] transition-colors'
              >
                <FaTimes className='w-5 h-5' />
              </button>
            </div>
            <div className='px-6 py-4 flex flex-col gap-4'>
              <div className='flex gap-3'>
                <FaBullhorn className='text-lg shrink-0 mt-0.5 text-blue-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    การจัดการประชาสัมพันธ์
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    สร้าง แก้ไข จัดการประชาสัมพันธ์ โดยคลิกที่รายการเพื่อแก้ไข
                    หรือสร้างใหม่
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <FaEye className='text-lg shrink-0 mt-0.5 text-emerald-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    การแสดงผล
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    Toggle สวิตช์เพื่อแสดงหรือซ่อนประชาสัมพันธ์บนหน้าเว็บไซต์
                  </p>
                </div>
              </div>
            </div>
            <div className='px-6 pb-4 pt-2 flex justify-end'>
              <button
                onClick={() => setShowTips(false)}
                className='px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm'
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .animate-fade-in { animation: modalFadeIn 0.2s ease-out; }
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
