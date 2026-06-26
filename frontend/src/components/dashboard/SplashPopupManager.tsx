// src/components/dashboard/SplashPopupManager.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FaCalendarAlt,
  FaCircle,
  FaEdit,
  FaEye,
  FaImage,
  FaLightbulb,
  FaPlus,
  FaQuestionCircle,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaTrash,
  FaUpload,
} from 'react-icons/fa'
import { API_URL } from '../../config/constants'
import { contentService } from '../../services/contentService'
import { swal, toast } from '../../utils/swalConfig'

interface SplashPopupItem {
  id: number
  image_url: string
  title: string
  isActive: boolean
  createdAt: string
}

type FilterTab = 'all' | 'active' | 'inactive'

export default function SplashPopupManager() {
  const [popups, setPopups] = useState<SplashPopupItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState<SplashPopupItem | null>(null)
  const [showTips, setShowTips] = useState(false)

  // Add form
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPopups = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await contentService.getAllSplashPopups()
      setPopups(data as SplashPopupItem[])
    } catch {
      toast.fire({
        icon: 'error',
        title: 'โหลดข้อมูลไม่สำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPopups()
  }, [fetchPopups])

  // ── Filtered list ──
  const filtered = popups
    .filter((p) => {
      if (filter === 'active') return p.isActive
      if (filter === 'inactive') return !p.isActive
      return true
    })
    .filter((p) => {
      if (!search.trim()) return true
      return p.title.toLowerCase().includes(search.trim().toLowerCase())
    })

  // ── Image helpers ──
  const getImageSrc = (item: { image_url: string }) =>
    item.image_url.startsWith('http')
      ? item.image_url
      : `${API_URL}${item.image_url}`

  // ── Form handlers ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f || !f.type.startsWith('image/')) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const resetForm = () => {
    setFile(null)
    setPreview(null)
    setTitle('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAdd = async () => {
    if (!file) {
      toast.fire({
        icon: 'warning',
        title: 'กรุณาเลือกรูปภาพ',
        timer: 1500,
        showConfirmButton: false,
      })
      return
    }
    setAdding(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('title', title.trim())
      await contentService.createSplashPopup(fd)
      toast.fire({
        icon: 'success',
        title: 'เพิ่ม Popup สำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      })
      setShowAddModal(false)
      resetForm()
      fetchPopups()
    } catch {
      toast.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' })
    } finally {
      setAdding(false)
    }
  }

  const handleToggleActive = async (popup: SplashPopupItem) => {
    try {
      await contentService.updateSplashPopup(popup.id, {
        isActive: !popup.isActive,
      })
      toast.fire({
        icon: 'success',
        title: popup.isActive ? 'ซ่อน Popup' : 'แสดง Popup',
        timer: 1200,
        showConfirmButton: false,
      })
      fetchPopups()
    } catch {
      toast.fire({ icon: 'error', title: 'ไม่สามารถเปลี่ยนสถานะได้' })
    }
  }

  const handleDelete = async (popup: SplashPopupItem) => {
    const confirm = await swal.fire({
      title: 'ลบ Popup นี้?',
      text: 'การดำเนินการนี้ไม่สามารถย้อนกลับได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    })
    if (!confirm.isConfirmed) return
    try {
      await contentService.deleteSplashPopup(popup.id)
      toast.fire({
        icon: 'success',
        title: 'ลบสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      })
      fetchPopups()
    } catch {
      toast.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' })
    }
  }

  const handleEdit = async () => {
    if (!editTarget) return
    setAdding(true)
    try {
      await contentService.updateSplashPopup(editTarget.id, {
        title: title.trim() || editTarget.title,
        ...(file ? { isActive: editTarget.isActive } : {}),
      })
      toast.fire({
        icon: 'success',
        title: 'อัปเดตสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      })
      setEditTarget(null)
      resetForm()
      fetchPopups()
    } catch {
      toast.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' })
    } finally {
      setAdding(false)
    }
  }

  const openEdit = (popup: SplashPopupItem) => {
    setEditTarget(popup)
    setTitle(popup.title)
    setFile(null)
    setPreview(null)
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <FaSpinner className='w-8 h-8 animate-spin text-gray-400' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* ── Header ── */}
      <div className='flex items-center justify-between'>
        <div>
          <div className='flex items-center gap-3'>
            <h2 className='text-2xl font-bold text-slate-800'>
              จัดการ Popup เปิดหน้า
            </h2>
            <button
              type='button'
              onClick={() => setShowTips(true)}
              aria-label='ดูวิธีการใช้งาน'
              className='w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors'
            >
              <FaQuestionCircle />
            </button>
          </div>
          <p className='text-slate-500 text-sm mt-1'>
            เพิ่ม/ลบ Popup แสดงครั้งแรกของวัน (Splash Screen)
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowAddModal(true)
          }}
          className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all'
        >
          <FaPlus className='w-4 h-4' /> เพิ่ม Popup
        </button>
      </div>

      {/* ── Search + Filter Bar ── */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-col sm:flex-row gap-3'>
        <div className='flex-1 relative'>
          <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs' />
          <input
            type='text'
            placeholder='ค้นหาตามชื่อ Popup...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50'
          />
        </div>
        <div className='flex gap-1 bg-gray-100 rounded-lg p-1'>
          {[
            { key: 'all' as FilterTab, label: 'ทั้งหมด' },
            { key: 'active' as FilterTab, label: 'กำลังแสดง' },
            { key: 'inactive' as FilterTab, label: 'ซ่อน' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === tab.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.key === 'active' && (
                <FaCircle className='inline text-green-500 mr-1 text-[8px]' />
              )}
              {tab.key === 'inactive' && (
                <FaCircle className='inline text-gray-300 mr-1 text-[8px]' />
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-16 text-gray-400 gap-4 border-2 border-dashed border-gray-200 rounded-2xl'>
          <FaImage className='w-12 h-12' />
          <p className='font-semibold'>
            {search ? 'ไม่พบ Popup ที่ค้นหา' : 'ยังไม่มี Popup'}
          </p>
          <p className='text-sm'>คลิก "เพิ่ม Popup" เพื่อเพิ่ม</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
          {filtered.map((popup) => (
            <div
              key={popup.id}
              className='group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-200'
            >
              {/* Image (click → edit) */}
              <div
                className='relative aspect-[16/9] overflow-hidden bg-gray-100 cursor-pointer'
                onClick={() => openEdit(popup)}
              >
                <img
                  src={getImageSrc(popup)}
                  alt={popup.title}
                  className='w-full h-full object-contain group-hover:scale-105 transition-transform duration-300'
                />
                {/* Edit overlay on hover */}
                <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center'>
                  <span className='opacity-0 group-hover:opacity-100 text-white text-sm font-semibold bg-black/50 px-4 py-2 rounded-lg flex items-center gap-2 transition-opacity'>
                    <FaEdit /> แก้ไข
                  </span>
                </div>
                {/* Status badge */}
                <div
                  className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
                    popup.isActive
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-500 border border-gray-300'
                  }`}
                >
                  <FaCircle
                    className={`text-[6px] ${popup.isActive ? 'text-green-500' : 'text-gray-400'}`}
                  />
                  {popup.isActive ? 'กำลังแสดง' : 'ซ่อน'}
                </div>
                {/* Edit icon corner */}
                <div className='absolute top-3 right-3 w-7 h-7 rounded-full bg-white/80 text-gray-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow'>
                  <FaEdit className='w-3 h-3' />
                </div>
              </div>

              {/* Info */}
              <div className='p-4'>
                <h3
                  className='text-sm font-semibold text-gray-800 line-clamp-2 mb-1 cursor-pointer hover:text-blue-600'
                  onClick={() => openEdit(popup)}
                >
                  {popup.title || (
                    <span className='text-gray-400 italic'>ไม่มีชื่อ</span>
                  )}
                </h3>
                <div className='flex items-center gap-1 text-xs text-gray-400 mb-3'>
                  <FaCalendarAlt className='text-[10px]' />
                  {new Date(popup.createdAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>

                {/* Actions */}
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => openEdit(popup)}
                    className='flex-1 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors'
                  >
                    <FaEdit className='inline mr-1 text-[10px]' /> แก้ไข
                  </button>
                  <button
                    onClick={() => handleToggleActive(popup)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      popup.isActive
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    <FaEye className='inline mr-1 text-[10px]' />
                    {popup.isActive ? 'ซ่อน' : 'แสดง'}
                  </button>
                  <button
                    onClick={() => handleDelete(popup)}
                    className='w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors'
                    title='ลบ'
                  >
                    <FaTrash className='w-3.5 h-3.5' />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination info ── */}
      {filtered.length > 0 && popups.length > 0 && (
        <p className='text-xs text-gray-400 text-center'>
          แสดง {filtered.length} จาก {popups.length} รายการ
        </p>
      )}

      {/* ── Add Modal ── */}
      {showAddModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'
          onClick={() => {
            setShowAddModal(false)
            resetForm()
          }}
        >
          <div
            className='bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
              <h3 className='text-base font-bold text-gray-800 flex items-center gap-2'>
                <FaPlus className='text-blue-600' /> เพิ่ม Popup ใหม่
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                className='p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              >
                <FaTimes />
              </button>
            </div>
            <div className='px-6 py-5 space-y-4'>
              {preview ? (
                <div
                  className='relative rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center'
                  style={{ minHeight: 200 }}
                >
                  <img
                    src={preview}
                    alt='Preview'
                    className='max-w-full max-h-[300px] object-contain'
                  />
                  <button
                    onClick={() => {
                      setFile(null)
                      setPreview(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className='absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600'
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className='w-full h-40 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all'
                >
                  <FaUpload className='w-8 h-8' />
                  <span className='text-sm font-medium'>เลือกรูปภาพ</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleFileSelect}
              />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='หัวข้อ (ถ้ามี)'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
              />
            </div>
            <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3'>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-100'
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAdd}
                disabled={!file || adding}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${!file || adding ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {adding ? (
                  <>
                    <FaSpinner className='w-4 h-4 animate-spin inline' />{' '}
                    กำลังเพิ่ม...
                  </>
                ) : (
                  'เพิ่ม Popup'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'
          onClick={() => {
            setEditTarget(null)
            resetForm()
          }}
        >
          <div
            className='bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
              <h3 className='text-base font-bold text-gray-800 flex items-center gap-2'>
                <FaEdit className='text-blue-600' /> แก้ไข Popup
              </h3>
              <button
                onClick={() => {
                  setEditTarget(null)
                  resetForm()
                }}
                className='p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              >
                <FaTimes />
              </button>
            </div>
            <div className='px-6 py-5 space-y-4'>
              {/* Current image + new preview */}
              {preview ? (
                <div
                  className='relative rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center'
                  style={{ minHeight: 200 }}
                >
                  <img
                    src={preview}
                    alt='Preview'
                    className='max-w-full max-h-[300px] object-contain'
                  />
                  <button
                    onClick={() => {
                      setFile(null)
                      setPreview(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className='absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600'
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <div
                  className='relative rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center'
                  style={{ minHeight: 200 }}
                >
                  <img
                    src={getImageSrc(editTarget)}
                    alt={editTarget.title}
                    className='max-w-full max-h-[300px] object-contain'
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className='absolute bottom-2 right-2 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 shadow'
                    title='เปลี่ยนรูปภาพ'
                  >
                    <FaUpload className='w-3.5 h-3.5' />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleFileSelect}
              />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='หัวข้อ'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
              />
              {editTarget.isActive ? (
                <div className='flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg'>
                  <FaCircle className='text-[8px] text-green-500' /> กำลังแสดง —
                  ผู้ใช้จะเห็น Popup นี้เมื่อเข้าเว็บ
                </div>
              ) : (
                <div className='flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg'>
                  <FaCircle className='text-[8px] text-gray-400' /> ซ่อนอยู่ —
                  ผู้ใช้จะไม่เห็น Popup นี้
                </div>
              )}
            </div>
            <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3'>
              <button
                onClick={() => {
                  setEditTarget(null)
                  resetForm()
                }}
                className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-100'
              >
                ยกเลิก
              </button>
              <button
                onClick={handleEdit}
                disabled={adding}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${adding ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {adding ? (
                  <>
                    <FaSpinner className='w-4 h-4 animate-spin inline' />{' '}
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึกการเปลี่ยนแปลง'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tips Popup ── */}
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
                <FaImage className='text-lg shrink-0 mt-0.5 text-blue-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    การเพิ่ม Popup
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    คลิก "เพิ่ม Popup" เพื่ออัปโหลดรูปภาพและตั้งชื่อ — Popup
                    จะแสดงเมื่อผู้ใช้เข้าหน้าแรกวันละ 1 ครั้ง
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <FaEdit className='text-lg shrink-0 mt-0.5 text-green-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>การแก้ไข</p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    คลิกที่รูปภาพหรือปุ่ม "แก้ไข"
                    เพื่อเปลี่ยนชื่อหรืออัปโหลดรูปใหม่
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <FaEye className='text-lg shrink-0 mt-0.5 text-purple-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    เปิด/ปิดการแสดง
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    ใช้ปุ่ม "แสดง/ซ่อน" เพื่อเปิดหรือปิด Popup — Active
                    ได้พร้อมกันแค่ 1 Popup เท่านั้น
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
