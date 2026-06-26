import { useEffect, useMemo, useState } from 'react'
import {
  FaEye,
  FaLightbulb,
  FaQuestionCircle,
  FaStar,
  FaTimes,
} from 'react-icons/fa'
import { useDashboardStore } from '../../stores/useDashboardStore'
import { swal, toast } from '../../utils/swalConfig'
import ExportExcelButton from '../common/ExportExcelButton'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  itemId: string
}

const ToggleSwitch = ({ checked, onChange, itemId }: ToggleSwitchProps) => (
  <label className='relative inline-flex items-center cursor-pointer gap-2'>
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

export default function ReviewManager() {
  const commentList = useDashboardStore((state) => state.commentList)
  const fetchComments = useDashboardStore((state) => state.fetchComments)
  const toggleCommentShow = useDashboardStore(
    (state) => state.toggleCommentShow,
  )
  const bulkToggleCommentShow = useDashboardStore(
    (state) => state.bulkToggleCommentShow,
  )

  const [showTips, setShowTips] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'all' | 'published'>('all')
  const [starFilter, setStarFilter] = useState<number | 'all'>('all')
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  const itemsPerPage = 12

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))

  const handleToggleShow = async (
    id: string,
    currentShow: boolean,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    e.stopPropagation()
    swal.fire({
      title: 'กำลังบันทึกสถานะ',
      html: 'ระบบกำลังดำเนินการสื่อสารกับฐานข้อมูลส่วนกลาง',
      allowOutsideClick: false,
      showConfirmButton: false,
      backdrop: 'rgba(15, 23, 42, 0.15)',
      customClass: {
        popup:
          'rounded-3xl border-2 border-stone-900 bg-white p-6 shadow-2xl backdrop-blur-md',
        title: 'text-sm font-bold tracking-tight text-stone-950 font-sans',
        htmlContainer: 'text-xs text-stone-500 font-medium mt-1',
        loader: 'border-stone-900 border-t-stone-200 w-10 h-10',
      },
      didOpen: () => {
        swal.showLoading()
      },
    })
    try {
      await Promise.all([toggleCommentShow(id, currentShow), sleep(500)])
      toast.fire({
        title: 'บันทึกสถานะเรียบร้อย',
        icon: 'success',
        timer: 500,
        timerProgressBar: true,
        showConfirmButton: false,
        buttonsStyling: false,
        customClass: {
          popup:
            'rounded-3xl border-2 border-stone-900 bg-white p-6 shadow-2xl',
          title: 'text-sm font-bold text-stone-950 font-sans tracking-tight',
          timerProgressBar: 'bg-stone-900',
        },
      })
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'เกิดข้อผิดพลาดภายในระบบเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง'
      toast.fire({
        icon: 'error',
        iconColor: '#DC2626',
        title: 'อัปเดตสถานะล้มเหลว',
        text: errorMsg,
        buttonsStyling: false,
        confirmButtonText: 'รับทราบและลองใหม่',
        customClass: {
          popup:
            'rounded-3xl border-2 border-stone-900 bg-white p-6 shadow-2xl',
          title:
            'text-base font-bold text-stone-950 font-sans tracking-tight pt-2',
          htmlContainer:
            'text-xs text-stone-600 font-medium leading-relaxed mt-2 px-4',
          confirmButton:
            'bg-stone-900 hover:bg-black text-white text-xs font-bold px-6 py-2.5 rounded-xl uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm active:scale-95 mt-4 outline-none',
        },
      })
    }
  }

  const handleBulkSetShow = async (show: boolean) => {
    if (selectedIds.size === 0) return
    swal.fire({
      title: `กำลังอัปเดตสถานะ ${selectedIds.size} รายการ`,
      html: 'ระบบกำลังดำเนินการส่งชุดข้อมูลแบบ Multitask ไปยังเซิร์ฟเวอร์ส่วนกลาง',
      allowOutsideClick: false,
      showConfirmButton: false,
      backdrop: 'rgba(15, 23, 42, 0.15)',
      customClass: {
        popup:
          'rounded-3xl border-2 border-stone-900 bg-white p-6 shadow-2xl backdrop-blur-md',
        title: 'text-sm font-bold tracking-tight text-stone-950 font-sans',
        htmlContainer: 'text-xs text-stone-500 font-medium mt-1',
        loader: 'border-stone-900 border-t-stone-200 w-10 h-10',
      },
      didOpen: () => {
        swal.showLoading()
      },
    })
    try {
      await Promise.all([
        bulkToggleCommentShow(Array.from(selectedIds), show),
        sleep(800),
      ])
      setSelectedIds(new Set())
      toast.fire({
        title: 'อัปเดตกลุ่มสำเร็จเรียบร้อย',
        icon: 'success',
        timer: 800,
        timerProgressBar: true,
        showConfirmButton: false,
        buttonsStyling: false,
        customClass: {
          popup:
            'rounded-3xl border-2 border-stone-900 bg-white p-6 shadow-2xl',
          title: 'text-sm font-bold text-stone-950 font-sans tracking-tight',
          timerProgressBar: 'bg-stone-900',
        },
      })
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'กระบวนการส่งสัญญาณล้มเหลว กรุณาลองใหม่อีกครั้ง'
      toast.fire({
        icon: 'error',
        iconColor: '#DC2626',
        title: 'เกิดข้อผิดพลาดในการอัปเดตกลุ่ม',
        text: errorMsg,
        buttonsStyling: false,
        confirmButtonText: 'รับทราบ',
        customClass: {
          popup:
            'rounded-3xl border-2 border-stone-900 bg-white p-6 shadow-2xl',
          title:
            'text-base font-bold text-stone-950 font-sans tracking-tight pt-2',
          confirmButton:
            'bg-stone-900 hover:bg-black text-white text-xs font-bold px-6 py-2.5 rounded-xl uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm active:scale-95 mt-4 outline-none',
        },
      })
    }
  }

  const processedData = useMemo(() => {
    let filtered = [...commentList]
    if (viewMode === 'published')
      filtered = filtered.filter((item) => item.isShow)
    if (starFilter !== 'all') {
      filtered = filtered.filter((item) => item.star === starFilter)
    }
    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [commentList, viewMode, starFilter])

  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const currentItems = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )
  const totalComments = processedData.length
  const avgStar =
    totalComments > 0
      ? (
          processedData.reduce((acc, curr) => acc + curr.star, 0) /
          totalComments
        ).toFixed(2)
      : '0.00'

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === currentItems.length) setSelectedIds(new Set())
    else {
      const newSelected = new Set(selectedIds)
      currentItems.forEach((item) => newSelected.add(item.id))
      setSelectedIds(newSelected)
    }
  }

  const handleTabChange = (mode: 'all' | 'published') => {
    setViewMode(mode)
    setSelectedIds(new Set())
    setCurrentPage(1)
  }

  return (
    <div className='bg-slate-100 min-h-screen p-4 md:p-8 font-sans text-slate-800 pb-32 md:pb-8'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* Header */}
        <header className='flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 pb-4'>
          <div className='w-full lg:w-auto'>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold mb-3 md:mb-2'>
                จัดการความคิดเห็น
              </h1>
              <button
                type='button'
                onClick={() => setShowTips(true)}
                aria-label='ดูวิธีการใช้งาน'
                className='w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mb-3 md:mb-2'
              >
                <FaQuestionCircle className='w-5 h-5' />
              </button>
            </div>
            <div className='flex flex-wrap gap-2 md:gap-4'>
              <div className='bg-white border border-slate-300 px-4 py-2 flex items-center gap-3 flex-1 sm:flex-none justify-center rounded-lg shadow-sm'>
                <span className='text-slate-500 text-sm'>ทั้งหมด</span>
                <span className='text-xl font-bold'>{totalComments}</span>
              </div>
              {totalComments > 0 && (
                <div className='bg-white border border-slate-300 px-4 py-2 flex items-center gap-3 flex-1 sm:flex-none justify-center rounded-lg shadow-sm'>
                  <span className='text-slate-500 text-sm'>คะแนนเฉลี่ย</span>
                  <span className='text-xl font-bold text-orange-500'>
                    {avgStar}
                  </span>
                </div>
              )}
            </div>
          </div>
          <ExportExcelButton
            data={commentList as unknown as Record<string, unknown>[]}
            filename='review_export'
            columns={[
              { key: 'star', label: 'คะแนน' },
              { key: 'msg', label: 'ข้อความ' },
              {
                key: 'createdAt',
                label: 'วันที่',
                format: (v) => new Date(v as string).toLocaleString('th-TH'),
              },
            ]}
          />
        </header>

        {/* Tabs & Select All */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-2 gap-4'>
          <div className='flex items-center gap-6 flex-wrap'>
            <div className='flex gap-6'>
              <button
                onClick={() => handleTabChange('all')}
                className={`pb-2 text-sm font-bold border-b-2 transition-colors ${viewMode === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                ข้อมูลทั้งหมด
              </button>
              <button
                onClick={() => handleTabChange('published')}
                className={`pb-2 text-sm font-bold border-b-2 transition-colors ${viewMode === 'published' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                แสดงผลหน้าเว็บ
              </button>
            </div>
            <div className='flex items-center pb-2 gap-3 flex-wrap'>
              <button
                onClick={() => {
                  setStarFilter('all')
                  setCurrentPage(1)
                  setSelectedIds(new Set())
                }}
                className={`px-4 py-1.5 text-sm font-bold border rounded-full transition-colors whitespace-nowrap ${starFilter === 'all' ? 'border-blue-500 text-blue-700 bg-blue-50 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 bg-white'}`}
              >
                ทั้งหมด
              </button>
              <div
                className='flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm'
                onMouseLeave={() => setHoveredStar(null)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled =
                    hoveredStar !== null
                      ? star <= hoveredStar
                      : starFilter !== 'all' && star <= starFilter
                  return (
                    <button
                      key={star}
                      onMouseEnter={() => setHoveredStar(star)}
                      onClick={() => {
                        setStarFilter(star)
                        setCurrentPage(1)
                        setSelectedIds(new Set())
                      }}
                      className='focus:outline-none transition-transform hover:scale-110'
                      title={`ดูรีวิว ${star} ดาว`}
                    >
                      <svg
                        className={`w-6 h-6 transition-colors ${isFilled ? 'text-orange-400 fill-current drop-shadow-sm' : 'text-slate-200 fill-current'}`}
                        viewBox='0 0 20 20'
                      >
                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                      </svg>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <button
            onClick={handleSelectAll}
            className='text-sm text-blue-600 hover:underline'
          >
            {selectedIds.size > 0 && selectedIds.size === currentItems.length
              ? 'ยกเลิกการเลือกหน้าปัจจุบัน'
              : 'เลือกทั้งหมดในหน้านี้'}
          </button>
        </div>

        {/* Bulk Action Bar */}
        <div
          className={`transition-all duration-300 overflow-hidden ${selectedIds.size > 0 ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
        >
          <div className='bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
            <span className='text-sm font-bold text-blue-700'>
              เลือกแล้ว {selectedIds.size} รายการ
            </span>
            <div className='flex gap-2'>
              <button
                onClick={() => handleBulkSetShow(true)}
                className='flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors shadow-sm'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='w-4 h-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                  />
                </svg>
                แสดงทั้งหมด
              </button>
              <button
                onClick={() => handleBulkSetShow(false)}
                className='flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-500 hover:bg-slate-600 text-white text-sm font-bold transition-colors shadow-sm'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='w-4 h-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                  />
                </svg>
                ซ่อนทั้งหมด
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className='px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-500 text-sm font-bold transition-colors'
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        {processedData.length === 0 ? (
          <div className='text-center py-20 text-slate-500'>
            ไม่พบข้อมูลในหมวดหมู่นี้
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {currentItems.map((item, index) => {
              const isToday =
                new Date(item.createdAt).toDateString() ===
                new Date().toDateString()
              const displayIndex = (currentPage - 1) * itemsPerPage + index + 1
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`relative bg-white border rounded-2xl p-5 flex flex-col h-full transition-all cursor-pointer shadow-sm hover:shadow-md ${selectedIds.has(item.id) ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className='flex justify-between items-start mb-3'>
                    <div className='flex items-center gap-2 h-6'>
                      <span className='bg-slate-800 text-white text-[11px] font-bold px-2 py-0.5 rounded-md font-mono'>
                        #{String(displayIndex).padStart(2, '0')}
                      </span>
                      {isToday && (
                        <span className='bg-green-100 text-green-700 border border-green-200 text-xs px-2 py-0.5 rounded-md font-bold'>
                          วันนี้
                        </span>
                      )}
                    </div>
                    <input
                      type='checkbox'
                      checked={selectedIds.has(item.id)}
                      onChange={() => handleSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className='w-5 h-5 cursor-pointer accent-slate-600 border-slate-300 rounded'
                    />
                  </div>
                  <div className='flex gap-1 mb-3 text-orange-400 drop-shadow-sm'>
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < item.star ? 'fill-current' : 'text-slate-200 fill-current'}`}
                        viewBox='0 0 20 20'
                      >
                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                      </svg>
                    ))}
                  </div>
                  <p className='text-slate-900 text-sm font-medium flex-1 mb-5 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-100/70'>
                    {item.msg}
                  </p>
                  <div className='text-xs text-slate-400 font-semibold font-mono flex justify-end items-center border-t border-slate-100 pt-3 mt-auto mb-4'>
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('th-TH')} •{' '}
                      {new Date(item.createdAt).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      น.
                    </span>
                  </div>
                  <div
                    className='bg-slate-50 border-t border-slate-100 px-5 py-3 -mx-5 -mb-5 flex justify-between items-center rounded-b-2xl'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className='text-xs text-slate-500 font-bold uppercase tracking-wide'>
                      แสดงหน้าเว็บ
                    </div>
                    <ToggleSwitch
                      checked={!!item.isShow}
                      onChange={(e) =>
                        handleToggleShow(item.id, item.isShow, e)
                      }
                      itemId={item.id}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex justify-center gap-2 pt-4'>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

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
                <FaStar className='text-lg shrink-0 mt-0.5 text-amber-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    การจัดการความคิดเห็น
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    ดูและจัดการความคิดเห็นของผู้ใช้งาน
                    กรองตามคะแนนและสถานะการแสดงผล
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
                    Toggle แสดง/ซ่อนความคิดเห็นบนหน้าเว็บไซต์
                    หรือจัดการทีละหลายรายการ
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
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
