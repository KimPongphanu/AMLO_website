import { useCallback, useEffect, useRef, useState } from 'react'
import { FaImage, FaLightbulb, FaQuestionCircle, FaTimes } from 'react-icons/fa'
import { API_URL } from '../../config/constants'
import type { SliderImage } from '../../type'
import { api } from '../../utils/api'
import { swal, toast } from '../../utils/swalConfig'

// ─── Unified item type ────────────────────────────────────────────────────────
// รวมทั้ง saved slides และ pending files ไว้ใน array เดียวกัน
type OrderedItem =
  | { kind: 'saved'; slide: SliderImage; tempId: string }
  | { kind: 'pending'; file: File; preview: string; tempId: string }

// ─── UnifiedSlideCard ─────────────────────────────────────────────────────────
const UnifiedSlideCard = ({
  item,
  index,
  dragOverIndex,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDelete,
}: {
  item: OrderedItem
  index: number
  dragOverIndex: number | null
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  onDelete: (tempId: string) => void
}) => {
  const imgSrc =
    item.kind === 'pending'
      ? item.preview
      : item.slide.image_url.startsWith('http')
        ? item.slide.image_url
        : `${API_URL}${item.slide.image_url}`

  const isPending = item.kind === 'pending'
  const isDragTarget = dragOverIndex === index

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
        isDragTarget
          ? 'border-blue-500 ring-2 ring-blue-300 scale-[1.02] shadow-xl'
          : isPending
            ? 'border-dashed border-amber-400 hover:border-amber-500 hover:shadow-lg'
            : 'border-slate-200 hover:border-blue-400 hover:shadow-lg'
      }`}
      style={{ aspectRatio: '16/9' }}
    >
      <img
        src={imgSrc}
        alt={`Slide ${index + 1}`}
        className='w-full h-full object-cover pointer-events-none'
        draggable={false}
      />

      {/* Drop target highlight */}
      {isDragTarget && (
        <div className='absolute inset-0 bg-blue-500/20 flex items-center justify-center pointer-events-none'>
          <div className='bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow'>
            วางที่นี่
          </div>
        </div>
      )}

      {/* Overlay on hover */}
      <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center gap-3'>
        {/* Order badge */}
        <div className='absolute top-2 left-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-lg'>
          #{index + 1}
        </div>

        {/* Pending badge */}
        {isPending && (
          <div className='absolute bottom-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg'>
            รอบันทึก
          </div>
        )}

        {/* Drag hint */}
        <div className='opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-xl px-3 py-2 flex items-center gap-2 text-slate-700 text-sm font-medium pointer-events-none'>
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 8h16M4 16h16'
            />
          </svg>
          ลากเพื่อเรียงลำดับ
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(item.tempId)
          }}
          className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg'
          title='ลบรูปนี้'
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
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────
export default function SliderManagerDashboard() {
  // รวมทุก item ไว้ใน array เดียว: ทั้ง saved และ pending
  const [orderedItems, setOrderedItems] = useState<OrderedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Fetch saved slides ──
  const fetchSlides = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api<{ success: boolean; data: SliderImage[] }>(
        '/slider',
        { method: 'GET' },
      )
      if (res?.success) {
        const items: OrderedItem[] = (res.data || []).map((slide) => ({
          kind: 'saved',
          slide,
          tempId: `saved-${slide.id}`,
        }))
        setOrderedItems(items)
      }
    } catch (err) {
      console.error('Failed to fetch slides', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSlides()
  }, [fetchSlides])

  // ── File picker ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    const newItems: OrderedItem[] = imageFiles.map((file) => ({
      kind: 'pending',
      file,
      preview: URL.createObjectURL(file),
      tempId: `pending-${Date.now()}-${Math.random()}`,
    }))

    setOrderedItems((prev) => [...prev, ...newItems])
    setHasChanges(true)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Delete item (ทั้ง saved และ pending) ──
  const handleDelete = async (tempId: string) => {
    const item = orderedItems.find((i) => i.tempId === tempId)
    if (!item) return

    if (item.kind === 'pending') {
      // pending: แค่ลบออกจาก list
      URL.revokeObjectURL(item.preview)
      setOrderedItems((prev) => prev.filter((i) => i.tempId !== tempId))
      setHasChanges(orderedItems.length > 1)
      return
    }

    // saved: ยืนยันก่อนลบ
    const confirm = await swal.fire({
      title: 'ลบรูปภาพนี้?',
      text: 'รูปภาพจะถูกลบออกจาก Slider หน้าหลักทันที',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    })
    if (!confirm.isConfirmed) return

    try {
      await api(`/slider/${item.slide.id}`, { method: 'DELETE' })
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
        text: 'ไม่สามารถลบรูปภาพได้',
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
      // Map tempId → จะถูกแทนที่ด้วย real ID หลังอัปโหลด
      const uploadedIdMap = new Map<string, number>()

      // 1. อัปโหลด pending files ตามลำดับ
      for (const item of orderedItems) {
        if (item.kind === 'pending') {
          const formData = new FormData()
          formData.append('image', item.file)
          const res = await api<{ success: boolean; data: SliderImage }>(
            '/slider',
            {
              method: 'POST',
              body: formData,
            },
          )
          if (res?.data?.id) {
            uploadedIdMap.set(item.tempId, res.data.id)
          }
        }
      }

      // 2. สร้าง orderedIds ตามลำดับปัจจุบัน (รวม saved + newly uploaded)
      const orderedIds: number[] = orderedItems
        .map((item) => {
          if (item.kind === 'saved') return item.slide.id
          return uploadedIdMap.get(item.tempId) ?? null
        })
        .filter((id): id is number => id !== null)

      // 3. บันทึกลำดับ
      if (orderedIds.length > 0) {
        await api('/slider/reorder', { method: 'PUT', body: { orderedIds } })
      }

      // 4. โหลดข้อมูลใหม่
      const res = await api<{ success: boolean; data: SliderImage[] }>(
        '/slider',
        { method: 'GET' },
      )
      if (res?.success) {
        const items: OrderedItem[] = (res.data || []).map((slide) => ({
          kind: 'saved',
          slide,
          tempId: `saved-${slide.id}`,
        }))
        setOrderedItems(items)
      }

      setHasChanges(false)
      toast.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        text: 'Slider หน้าหลักอัปเดตเรียบร้อยแล้ว',
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

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2'>
            <h2 className='text-2xl font-bold text-slate-800'>
              จัดการ Slider หน้าหลัก
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
            เพิ่ม/ลบรูปภาพ และลากเพื่อจัดลำดับการแสดงผล
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <button
            onClick={() => fileInputRef.current?.click()}
            className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-semibold hover:border-blue-400 hover:text-blue-600 transition-all text-sm'
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
                strokeWidth={2}
                d='M12 4v16m8-8H4'
              />
            </svg>
            เพิ่มรูปภาพ
          </button>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            multiple
            className='hidden'
            onChange={handleFileChange}
          />

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
                <svg
                  className='w-4 h-4 animate-spin'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8v8H4z'
                  />
                </svg>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
                บันทึกการเปลี่ยนแปลง
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pending change indicator */}
      {hasChanges && (
        <div className='flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm font-medium'>
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
          {hasPending && ' (มีรูปใหม่รออัปโหลด)'} — กด "บันทึกการเปลี่ยนแปลง"
          เพื่อบันทึก
        </div>
      )}

      {/* Unified Slides Grid */}
      {isLoading ? (
        <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='rounded-2xl bg-slate-200 animate-pulse'
              style={{ aspectRatio: '16/9' }}
            />
          ))}
        </div>
      ) : orderedItems.length === 0 ? (
        /* Empty state */
        <div
          onClick={() => fileInputRef.current?.click()}
          className='flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-300 rounded-2xl p-16 text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all'
        >
          <svg
            className='w-12 h-12'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
          <div className='text-center'>
            <p className='font-semibold text-base'>ยังไม่มีรูปภาพใน Slider</p>
            <p className='text-sm mt-1'>คลิกที่นี่เพื่อเพิ่มรูปภาพแรก</p>
          </div>
        </div>
      ) : (
        <div>
          <h3 className='text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3'>
            รูปภาพทั้งหมด ({orderedItems.length} รูป) — ลากเพื่อเรียงลำดับ
            {hasPending && (
              <span className='ml-2 text-amber-600 normal-case font-medium'>
                (มีรูปที่รอบันทึก{' '}
                {orderedItems.filter((i) => i.kind === 'pending').length} รูป)
              </span>
            )}
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
            {orderedItems.map((item, index) => (
              <UnifiedSlideCard
                key={item.tempId}
                item={item}
                index={index}
                dragOverIndex={dragOverIndex}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onDelete={handleDelete}
              />
            ))}
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
                <FaImage className='text-lg shrink-0 mt-0.5 text-blue-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    การเพิ่มรูปภาพ
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    คลิก "เพิ่มรูปภาพ" เพื่อเลือกรูปจากเครื่อง
                    หรือลากรูปเพื่อจัดลำดับ
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <FaTimes className='text-lg shrink-0 mt-0.5 text-red-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>การลบ</p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    เลื่อนเมาส์ไปที่รูปแล้วกดปุ่มแดงเพื่อลบ
                    หรือลบรูปที่ยังไม่บันทึก
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

      {/* Preview Section */}
      {orderedItems.length > 0 && (
        <div className='mt-8 bg-slate-900 rounded-2xl p-4'>
          <h3 className='text-white text-sm font-semibold mb-3 flex items-center gap-2'>
            <svg
              className='w-4 h-4 text-blue-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
              />
            </svg>
            ตัวอย่างลำดับการแสดงผล (Slider Preview)
          </h3>
          <div className='flex gap-2 overflow-x-auto pb-2'>
            {orderedItems.map((item, i) => {
              const src =
                item.kind === 'pending'
                  ? item.preview
                  : item.slide.image_url.startsWith('http')
                    ? item.slide.image_url
                    : `${API_URL}${item.slide.image_url}`
              const isPending = item.kind === 'pending'
              return (
                <div
                  key={item.tempId}
                  className={`shrink-0 relative rounded-xl overflow-hidden ${isPending ? 'border-2 border-amber-400' : ''}`}
                  style={{ width: 120, height: 68 }}
                >
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className='w-full h-full object-cover'
                  />
                  <div className='absolute inset-0 bg-black/20 flex items-end justify-start p-1'>
                    <span
                      className={`text-xs font-bold bg-black/50 rounded px-1 ${isPending ? 'text-amber-300' : 'text-white'}`}
                    >
                      #{i + 1}
                      {isPending ? ' รอ' : ''}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
