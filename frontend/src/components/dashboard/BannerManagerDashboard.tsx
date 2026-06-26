import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaImage,
  FaLightbulb,
  FaLink,
  FaPlus,
  FaQuestionCircle,
  FaSave,
  FaSpinner,
  FaTimes,
  FaTrash,
  FaUpload,
} from 'react-icons/fa'
import { API_URL } from '../../config/constants'
import { contentService } from '../../services/contentService'
import type { BannerImage } from '../../type'
import { api } from '../../utils/api'
import { swal, toast } from '../../utils/swalConfig'

// ─── Unified item type ────────────────────────────────────────────────────────
type OrderedItem =
  | { kind: 'saved'; banner: BannerImage; tempId: string }
  | {
      kind: 'pending'
      file: File
      preview: string
      tempId: string
      title: string
      link_url: string
    }

// ─── Add Banner Modal ─────────────────────────────────────────────────────────
const AddBannerModal = ({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (file: File, title: string, link_url: string) => void
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      toast.fire({
        icon: 'error',
        title: 'กรุณาเลือกรูปภาพเท่านั้น',
        timer: 1500,
        showConfirmButton: false,
      })
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = () => {
    if (!file) {
      toast.fire({
        icon: 'warning',
        title: 'กรุณาเลือกรูปภาพ',
        timer: 1500,
        showConfirmButton: false,
      })
      return
    }
    onAdd(file, title.trim(), linkUrl.trim())
    onClose()
  }

  return (
    <div
      className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/40'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-[scaleIn_0.2s_ease-out]'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#e8eaed]'>
          <div className='flex items-center gap-2'>
            <FaPlus className='text-lg text-blue-500' />
            <span className='text-[16px] font-semibold text-[#202124]'>
              เพิ่ม Banner ใหม่
            </span>
          </div>
          <button
            onClick={onClose}
            className='w-8 h-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] transition-colors'
          >
            <FaTimes className='w-5 h-5' />
          </button>
        </div>

        {/* Body */}
        <div className='px-6 py-4 space-y-8'>
          {/* Image upload */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              รูปภาพ <span className='text-red-500'>*</span>
            </label>
            {preview ? (
              <div className='relative rounded-xl overflow-hidden border border-slate-200'>
                <img
                  src={preview}
                  alt='Preview'
                  className='w-full h-40 object-cover'
                />
                <button
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className='absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors'
                >
                  <FaTimes className='w-4 h-4' />
                </button>
              </div>
            ) : (
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='w-full h-40 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all cursor-pointer'
              >
                <FaUpload className='w-8 h-8' />
                <span className='text-sm font-medium'>
                  คลิกเพื่อเลือกรูปภาพ
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleFileSelect}
            />
          </div>

          {/* Title */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              หัวข้อ (Title)
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='เช่น โปรโมชั่นเดือนนี้...'
              className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400'
            />
          </div>

          {/* Link URL */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              ลิงก์ (ไม่บังคับ)
            </label>
            <div className='flex items-center gap-2 border border-slate-300 rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-400'>
              <FaLink className='w-3.5 h-3.5 text-slate-400 shrink-0' />
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder='https://example.com'
                className='w-full py-2 text-sm focus:outline-none bg-transparent'
              />
            </div>
            <p className='text-xs text-slate-400 mt-1'>
              ถ้าไม่ระบุ Banner จะเป็นรูปภาพไม่มีลิงก์
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className='px-6 pb-4 pt-2 flex justify-end gap-3'>
          <button
            onClick={onClose}
            className='px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors'
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all ${
              file
                ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.97] shadow-sm'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            เพิ่ม Banner
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Banner Modal ─────────────────────────────────────────────────────────
const EditBannerModal = ({
  banner,
  onClose,
  onSave,
}: {
  banner: BannerImage
  onClose: () => void
  onSave: (title: string, link_url: string) => void
}) => {
  const [title, setTitle] = useState(banner.title)
  const [linkUrl, setLinkUrl] = useState(banner.link_url)

  return (
    <div
      className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/40'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-[scaleIn_0.2s_ease-out]'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#e8eaed]'>
          <div className='flex items-center gap-2'>
            <FaEdit className='text-lg text-green-500' />
            <span className='text-[16px] font-semibold text-[#202124]'>
              แก้ไข Banner
            </span>
          </div>
          <button
            onClick={onClose}
            className='w-8 h-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] transition-colors'
          >
            <FaTimes className='w-5 h-5' />
          </button>
        </div>

        <div className='px-6 py-4 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              หัวข้อ (Title)
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              ลิงก์ (ไม่บังคับ)
            </label>
            <div className='flex items-center gap-2 border border-slate-300 rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-400'>
              <FaLink className='w-3.5 h-3.5 text-slate-400 shrink-0' />
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder='https://example.com'
                className='w-full py-2 text-sm focus:outline-none bg-transparent'
              />
            </div>
          </div>
        </div>

        <div className='px-6 pb-4 pt-2 flex justify-end gap-3'>
          <button
            onClick={onClose}
            className='px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors'
          >
            ยกเลิก
          </button>
          <button
            onClick={() => {
              onSave(title.trim(), linkUrl.trim())
              onClose()
            }}
            className='px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm'
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Banner Card ───────────────────────────────────────────────────────────────
const BannerCard = ({
  item,
  index,
  dragOverIndex,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDelete,
  onEdit,
  onToggleVisibility,
  isToggling,
}: {
  item: OrderedItem
  index: number
  dragOverIndex: number | null
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  onDelete: (tempId: string) => void
  onEdit: (tempId: string) => void
  onToggleVisibility: (tempId: string) => void
  isToggling: boolean
}) => {
  const imgSrc =
    item.kind === 'pending'
      ? item.preview
      : item.banner.image_url.startsWith('http')
        ? item.banner.image_url
        : `${API_URL}${item.banner.image_url}`

  const isPending = item.kind === 'pending'
  const isDragTarget = dragOverIndex === index
  const savedItem = item.kind === 'saved' ? item.banner : null
  const isHidden = savedItem && !savedItem.isShow
  const title = isPending ? item.title : savedItem?.title || ''
  const linkUrl = isPending ? item.link_url : savedItem?.link_url || ''
  const isShowing = savedItem?.isShow === true

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`group relative flex items-center gap-6 p-5 rounded-2xl border bg-white transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
        isDragTarget
          ? 'border-gray-900 shadow-lg ring-2 ring-gray-300'
          : isPending
            ? 'border-dashed border-gray-400 bg-gray-50'
            : isHidden
              ? 'border-gray-200 opacity-50'
              : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
      }`}
    >
      {/* Image thumbnail - larger */}
      <div className='shrink-0 w-44 h-28 rounded-xl overflow-hidden bg-gray-100'>
        <img
          src={imgSrc}
          alt={`Banner ${index + 1}`}
          className='w-full h-full object-cover pointer-events-none'
          draggable={false}
        />
      </div>

      {/* Info */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-3 mb-1'>
          <span className='text-base font-bold text-gray-400'>
            #{index + 1}
          </span>
          {!isPending && isShowing && (
            <span className='inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full'>
              <span className='w-2.5 h-2.5 rounded-full bg-green-500' />
              แสดงผลอยู่
            </span>
          )}
          {isPending && (
            <span className='inline-flex items-center gap-1.5 text-sm font-medium text-gray-500'>
              <FaSpinner className='w-3.5 h-3.5 animate-spin' />
              รอบันทึก
            </span>
          )}
        </div>
        <div className='text-2xl font-bold text-gray-900 truncate'>
          {title || (
            <span className='text-gray-400 font-normal'>ไม่มีชื่อ</span>
          )}
        </div>
        {linkUrl && (
          <div className='flex items-center gap-1.5 text-sm text-gray-400 mt-1 truncate'>
            <FaLink className='w-4 h-4 shrink-0' />
            <span className='truncate'>{linkUrl}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className='shrink-0 flex items-center gap-2 pr-2'>
        {savedItem && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleVisibility(item.tempId)
            }}
            disabled={isToggling}
            className='w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            title={savedItem.isShow ? 'ซ่อน' : 'แสดง'}
          >
            {isToggling ? (
              <FaSpinner className='w-4 h-4 animate-spin' />
            ) : savedItem.isShow ? (
              <FaEye className='w-4 h-4' />
            ) : (
              <FaEyeSlash className='w-4 h-4' />
            )}
          </button>
        )}
        {savedItem && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item.tempId)
            }}
            className='w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            title='แก้ไข'
          >
            <FaEdit className='w-4 h-4' />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(item.tempId)
          }}
          className='w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50'
          title='ลบ'
        >
          <FaTrash className='w-4 h-4' />
        </button>
      </div>

      {/* Drag */}
      <div className='shrink-0 flex items-center text-gray-300'>
        <svg className='w-7 h-7' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z' />
        </svg>
      </div>

      {/* Drop target */}
      {isDragTarget && (
        <div className='absolute inset-0 bg-gray-900/5 rounded-2xl flex items-center justify-center pointer-events-none'>
          <span className='bg-gray-800 text-white text-base font-medium px-6 py-2.5 rounded-xl shadow'>
            วางที่นี่
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────
export default function BannerManagerDashboard() {
  const [orderedItems, setOrderedItems] = useState<OrderedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTempId, setEditingTempId] = useState<string | null>(null)

  // ── Fetch saved banners ──
  const fetchBanners = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await contentService.getBanners(true)
      const items: OrderedItem[] = data.map((banner) => ({
        kind: 'saved',
        banner,
        tempId: `saved-${banner.id}`,
      }))
      setOrderedItems(items)
    } catch (err) {
      console.error('Failed to fetch banners', err)
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
    fetchBanners()
  }, [fetchBanners])

  // ── Add banner via modal ──
  const handleAddBanner = (file: File, title: string, link_url: string) => {
    const newItem: OrderedItem = {
      kind: 'pending',
      file,
      preview: URL.createObjectURL(file),
      tempId: `pending-${Date.now()}-${Math.random()}`,
      title,
      link_url,
    }

    setOrderedItems((prev) => [...prev, newItem])
    setHasChanges(true)
  }

  // ── Delete item ──
  const handleDelete = async (tempId: string) => {
    const item = orderedItems.find((i) => i.tempId === tempId)
    if (!item) return

    if (item.kind === 'pending') {
      URL.revokeObjectURL(item.preview)
      setOrderedItems((prev) => prev.filter((i) => i.tempId !== tempId))
      setHasChanges(orderedItems.length > 1)
      return
    }

    const confirm = await swal.fire({
      title: 'ลบ Banner นี้?',
      text: 'Banner จะถูกลบออกจากหน้าหลักทันที',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    })
    if (!confirm.isConfirmed) return

    try {
      await contentService.deleteBanner(item.banner.id)
      setOrderedItems((prev) => prev.filter((i) => i.tempId !== tempId))
      toast.fire({
        icon: 'success',
        title: 'ลบสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      })
    } catch {
      toast.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถลบ Banner ได้',
      })
    }
  }

  // ── Edit banner title/link via modal ──
  const handleEdit = async (
    tempId: string,
    title: string,
    link_url: string,
  ) => {
    const item = orderedItems.find((i) => i.tempId === tempId)
    if (!item || item.kind === 'pending') return

    const oldBanner = item.banner
    // Optimistic update
    setOrderedItems((prev) =>
      prev.map((i) =>
        i.tempId === tempId && i.kind === 'saved'
          ? { ...i, banner: { ...i.banner, title, link_url } }
          : i,
      ),
    )

    try {
      await contentService.updateBanner(item.banner.id, { title, link_url })
      toast.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        timer: 1000,
        showConfirmButton: false,
      })
    } catch {
      // Revert
      setOrderedItems((prev) =>
        prev.map((i) =>
          i.tempId === tempId && i.kind === 'saved'
            ? {
                ...i,
                banner: {
                  ...i.banner,
                  title: oldBanner.title,
                  link_url: oldBanner.link_url,
                },
              }
            : i,
        ),
      )
      toast.fire({
        icon: 'error',
        title: 'ไม่สามารถบันทึกได้',
      })
    }
  }

  // ── Toggle visibility ──
  const handleToggleVisibility = async (tempId: string) => {
    const item = orderedItems.find((i) => i.tempId === tempId)
    if (!item || item.kind === 'pending') return

    setTogglingIds((prev) => new Set(prev).add(tempId))

    try {
      const res = await api<{ success: boolean; data: BannerImage }>(
        `/banners/${item.banner.id}/toggle`,
        { method: 'PATCH' },
      )
      if (res?.success) {
        setOrderedItems((prev) =>
          prev.map((i) =>
            i.tempId === tempId && i.kind === 'saved'
              ? { ...i, banner: { ...i.banner, isShow: !i.banner.isShow } }
              : i,
          ),
        )
      }
    } catch {
      toast.fire({
        icon: 'error',
        title: 'ไม่สามารถเปลี่ยนสถานะได้',
      })
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(tempId)
        return next
      })
    }
  }

  // ── Drag handlers ──
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
    setDragOverIndex(null)
    if (isNaN(fromIndex) || fromIndex === toIndex) return

    setOrderedItems((prev) => {
      const updated = [...prev]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      return updated
    })
    setHasChanges(true)
  }

  const handleDragEnd = () => {
    setDragOverIndex(null)
  }

  // ── Save ──
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const uploadedIdMap = new Map<string, number>()

      // 1. Upload pending files with title + link_url
      for (const item of orderedItems) {
        if (item.kind === 'pending') {
          const formData = new FormData()
          formData.append('image', item.file)
          formData.append('title', item.title)
          formData.append('link_url', item.link_url)
          const res = await api<{ success: boolean; data: BannerImage }>(
            '/banners',
            { method: 'POST', body: formData },
          )
          if (res?.data?.id) {
            uploadedIdMap.set(item.tempId, res.data.id)
          }
        }
      }

      // 2. Create ordered IDs
      const orderedIds: number[] = orderedItems
        .map((item) => {
          if (item.kind === 'saved') return item.banner.id
          return uploadedIdMap.get(item.tempId) ?? null
        })
        .filter((id): id is number => id !== null)

      // 3. Save order
      if (orderedIds.length > 0) {
        await contentService.reorderBanners(orderedIds)
      }

      // 4. Refresh
      await fetchBanners()
      setHasChanges(false)

      toast.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        text: 'Banner หน้าหลักอัปเดตเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch {
      toast.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถบันทึกข้อมูลได้',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const [showTips, setShowTips] = useState(false)
  const hasPending = orderedItems.some((i) => i.kind === 'pending')

  // ── Get editing banner data ──
  const editingItem = editingTempId
    ? orderedItems.find((i) => i.tempId === editingTempId)
    : null
  const editingBanner =
    editingItem?.kind === 'saved' ? editingItem.banner : null

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2'>
            <h2 className='text-2xl font-bold text-slate-800'>
              จัดการ Banner หน้าหลัก
            </h2>
            <button
              type='button'
              onClick={() => setShowTips(true)}
              aria-label='ดูวิธีการใช้งาน'
              className='w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors'
            >
              <FaQuestionCircle className='w-5 h-5' />
            </button>
          </div>
          <p className='text-slate-500 text-sm mt-1'>
            เพิ่ม/ลบ/แก้ไข Banner และลากเพื่อจัดลำดับการแสดงผล
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <button
            onClick={() => setShowAddModal(true)}
            className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-semibold hover:border-blue-400 hover:text-blue-600 transition-all text-sm'
          >
            <FaPlus className='w-4 h-4' />
            เพิ่ม Banner
          </button>

          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              hasChanges && !isSaving
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <FaSpinner className='w-4 h-4 animate-spin' />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <FaSave className='w-4 h-4' />
                บันทึกการเปลี่ยนแปลง
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pending change indicator */}
      {hasChanges && (
        <div className='flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-600 text-sm font-medium'>
          <svg
            className='w-4 h-4 shrink-0'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
            />
          </svg>
          มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
          {hasPending && ' (มี Banner ใหม่รออัปโหลด)'} — กด
          "บันทึกการเปลี่ยนแปลง" เพื่อบันทึก
        </div>
      )}

      {/* Banner List */}
      {isLoading ? (
        <div className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='h-20 rounded-xl bg-slate-200 animate-pulse'
            />
          ))}
        </div>
      ) : orderedItems.length === 0 ? (
        /* Empty state */
        <div
          onClick={() => setShowAddModal(true)}
          className='flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-300 rounded-2xl p-16 text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all'
        >
          <FaImage className='w-12 h-12' />
          <div className='text-center'>
            <p className='font-semibold text-base'>ยังไม่มี Banner</p>
            <p className='text-sm mt-1'>คลิกที่นี่เพื่อเพิ่ม Banner แรก</p>
          </div>
        </div>
      ) : (
        <div>
          <h3 className='text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2'>
            <span>Banner ทั้งหมด ({orderedItems.length} รายการ)</span>
            <span className='text-xs font-normal normal-case text-slate-400'>
              — ลากเพื่อเรียงลำดับ
            </span>
            {hasPending && (
              <span className='ml-auto text-gray-500 normal-case font-medium text-xs'>
                (มีที่รอบันทึก{' '}
                {orderedItems.filter((i) => i.kind === 'pending').length}{' '}
                รายการ)
              </span>
            )}
          </h3>
          <div className='space-y-2'>
            {orderedItems.map((item, index) => (
              <BannerCard
                key={item.tempId}
                item={item}
                index={index}
                dragOverIndex={dragOverIndex}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onDelete={handleDelete}
                onEdit={(tempId) => setEditingTempId(tempId)}
                onToggleVisibility={handleToggleVisibility}
                isToggling={togglingIds.has(item.tempId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preview Section */}
      {orderedItems.length > 0 && (
        <div className='mt-8 bg-slate-900 rounded-2xl p-4'>
          <h3 className='text-white text-sm font-semibold mb-3 flex items-center gap-2'>
            <FaImage className='w-4 h-4 text-blue-400' />
            ตัวอย่างลำดับการแสดงผล (Banner Preview)
          </h3>
          <div className='flex gap-2 overflow-x-auto pb-2'>
            {orderedItems.map((item, i) => {
              const src =
                item.kind === 'pending'
                  ? item.preview
                  : item.banner.image_url.startsWith('http')
                    ? item.banner.image_url
                    : `${API_URL}${item.banner.image_url}`
              const isPending = item.kind === 'pending'
              const isHidden = item.kind === 'saved' && !item.banner.isShow
              return (
                <div
                  key={item.tempId}
                  className={`shrink-0 relative rounded-xl overflow-hidden ${
                    isPending
                      ? 'border-2 border-amber-400'
                      : isHidden
                        ? 'opacity-50 border-2 border-slate-600'
                        : ''
                  }`}
                  style={{ width: 120, height: 68 }}
                >
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className='w-full h-full object-cover'
                  />
                  <div className='absolute inset-0 bg-black/20 flex items-end justify-start p-1'>
                    <span
                      className={`text-xs font-bold bg-black/50 rounded px-1 ${
                        isPending
                          ? 'text-amber-300'
                          : isHidden
                            ? 'text-slate-400'
                            : 'text-white'
                      }`}
                    >
                      #{i + 1}
                      {isPending ? ' รอ' : ''}
                      {isHidden ? ' ซ่อน' : ''}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Banner Modal */}
      {showAddModal && (
        <AddBannerModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddBanner}
        />
      )}

      {/* Edit Banner Modal */}
      {editingBanner && (
        <EditBannerModal
          banner={editingBanner}
          onClose={() => setEditingTempId(null)}
          onSave={(title, link_url) => {
            handleEdit(editingTempId!, title, link_url)
            setEditingTempId(null)
          }}
        />
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
                <FaPlus className='text-lg shrink-0 mt-0.5 text-blue-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    การเพิ่ม Banner
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    คลิก "เพิ่ม Banner" → กรอกรายละเอียด → เลือกรูป
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <FaLink className='text-lg shrink-0 mt-0.5 text-green-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    การเพิ่มลิงก์
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    ใส่ URL ถ้าต้องการให้ Banner คลิกไปยังหน้าที่ต้องการ
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <FaEye className='text-lg shrink-0 mt-0.5 text-blue-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    แสดง/ซ่อน Banner
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    กดปุ่มรูปตาเพื่อเปลี่ยนสถานะแสดงหรือซ่อน
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <FaTrash className='text-lg shrink-0 mt-0.5 text-red-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>การลบ</p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    เลื่อนเมาส์ไปที่ Banner แล้วกดปุ่มแดงเพื่อลบ
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
