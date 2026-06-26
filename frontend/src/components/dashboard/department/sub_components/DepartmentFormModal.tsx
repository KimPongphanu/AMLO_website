// src/components/dashboard/department/sub_components/DepartmentFormModal.tsx
import { Edit2, ImageIcon, Plus, Video, X } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { API_URL } from '../../../../config/constants'
import { useDashboardStore } from '../../../../stores/useDashboardStore'
import type { DepartmentItem, GalleryFile } from '../../../../type/department'
import { swal, toast } from '../../../../utils/swalConfig'

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ color: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
}

interface DepartmentFormModalProps {
  department: DepartmentItem | null
  onClose: () => void
}

const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({
  department,
  onClose,
}) => {
  const createDepartment = useDashboardStore((state) => state.createDepartment)
  const updateDepartment = useDashboardStore((state) => state.updateDepartment)

  const isEditing = department !== null

  // 🌟 Initialize state directly from props (not in useEffect)
  const [title, setTitle] = useState<string>(department?.title || '')
  const [content, setContent] = useState<string>(department?.content || '')
  const [youtubeInput, setYoutubeInput] = useState<string>('')

  const coverImageInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  const [coverPreview, setCoverPreview] = useState<string>(() => {
    if (!department?.cover_image) return ''
    return department.cover_image.startsWith('http')
      ? department.cover_image
      : `${API_URL}${department.cover_image}`
  })

  const [galleryUrls, setGalleryUrls] = useState<string[]>(() => {
    if (!department) return []
    return department.gallery
      .filter((g) => g.type === 'video')
      .map((g) => g.url)
  })

  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>(
    () => {
      if (!department) return []
      return department.gallery
        .filter((g) => g.type === 'image')
        .map((g) => g.url)
    },
  )

  const [newGalleryFiles, setNewGalleryFiles] = useState<GalleryFile[]>([])
  const [isGalleryUpdated, setIsGalleryUpdated] = useState<boolean>(false)

  // 🌟 CRITICAL: Memory leak fix - Cleanup all Object URLs on unmount
  // This effect ONLY handles cleanup, no setState calls
  useEffect(() => {
    // 🌟 CLEANUP FUNCTION: Revoke all Object URLs when component unmounts
    return () => {
      if (coverPreview && coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview)
      }
      newGalleryFiles.forEach(({ preview }) => {
        if (preview && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview)
        }
      })
    }
  }, [coverPreview, newGalleryFiles]) // Dependencies needed to access latest values in cleanup

  const handleCoverChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0]
      if (!file) return

      // Clean up previous Object URL before creating new one
      setCoverPreview((prev) => {
        if (prev && prev.startsWith('blob:')) {
          URL.revokeObjectURL(prev)
        }
        return URL.createObjectURL(file)
      })
    },
    [],
  )

  const handleAddYoutubeUrl = useCallback((): void => {
    const trimmed = youtubeInput.trim()
    if (!trimmed) return

    const youtubeRegex =
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=|shorts\/))([^?&\s]{11})/
    if (!youtubeRegex.test(trimmed)) {
      toast.fire({
        icon: 'warning',
        title: 'URL ไม่ถูกต้อง',
        text: 'กรุณาวางลิงก์วิดีโอ YouTube ที่ถูกต้อง',
        confirmButtonColor: '#185FA5',
      })
      return
    }

    setGalleryUrls((prev) => [...prev, trimmed])
    setYoutubeInput('')
    setIsGalleryUpdated(true)
  }, [youtubeInput])

  const handleRemoveYoutubeUrl = useCallback((index: number): void => {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== index))
    setIsGalleryUpdated(true)
  }, [])

  const handleRemoveExistingImage = useCallback((index: number): void => {
    setExistingGalleryUrls((prev) => prev.filter((_, i) => i !== index))
    setIsGalleryUpdated(true)
  }, [])

  const handleGalleryFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      if (e.target.files) {
        setNewGalleryFiles((prev) => {
          // Clean up previous previews before creating new ones
          prev.forEach(({ preview }) => {
            if (preview && preview.startsWith('blob:')) {
              URL.revokeObjectURL(preview)
            }
          })

          return Array.from(e.target.files!).map((file) => ({
            file,
            preview: URL.createObjectURL(file),
          }))
        })
        setIsGalleryUpdated(true)
      }
    },
    [],
  )

  const handleRemoveNewFile = useCallback((index: number): void => {
    setNewGalleryFiles((prev) => {
      const newFiles = [...prev]
      if (newFiles[index]?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(newFiles[index].preview)
      }
      return newFiles.filter((_, i) => i !== index)
    })
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault()
      if (!title.trim()) {
        toast.fire({
          icon: 'warning',
          title: 'กรุณากรอกหัวข้อหน่วยงาน',
          confirmButtonColor: '#185FA5',
        })
        return
      }

      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('content', content.trim())

      if (coverImageInputRef.current?.files?.[0]) {
        formData.append('cover_image', coverImageInputRef.current.files[0])
      }

      if (isGalleryUpdated) {
        formData.append('isGalleryUpdated', 'true')
        galleryUrls.forEach((url) => formData.append('galleryUrls', url))
        existingGalleryUrls.forEach((url) =>
          formData.append('existingGalleryUrls', url),
        )
        newGalleryFiles.forEach(({ file }) => formData.append('gallery', file))
      }

      swal.fire({
        title: 'กำลังบันทึกข้อมูล...',
        allowOutsideClick: false,
        didOpen: () => swal.showLoading(),
      })

      let success = false
      if (isEditing && department) {
        success = await updateDepartment(department.id, formData)
      } else {
        if (!coverImageInputRef.current?.files?.[0]) {
          toast.fire({
            icon: 'warning',
            title: 'กรุณาเลือกรูปภาพปกหน่วยงาน',
            confirmButtonColor: '#185FA5',
          })
          return
        }
        success = await createDepartment(formData)
      }

      if (success) {
        toast.fire({
          icon: 'success',
          title: 'บันทึกข้อมูลเรียบร้อย',
          timer: 1500,
          showConfirmButton: false,
        })
        onClose()
      } else {
        toast.fire({
          icon: 'error',
          title: 'ล้มเหลว',
          text: 'เกิดข้อผิดพลาดในการติดต่อฐานข้อมูล',
          confirmButtonColor: '#dc2626',
        })
      }
    },
    [
      title,
      content,
      isEditing,
      department,
      galleryUrls,
      existingGalleryUrls,
      newGalleryFiles,
      isGalleryUpdated,
      createDepartment,
      updateDepartment,
      onClose,
    ],
  )

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 antialiased'>
      <div className='bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-fade-in border border-slate-100 overflow-hidden'>
        {/* Header */}
        <div className='px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0'>
          <div className='flex items-center gap-2'>
            <div
              className={`p-2 rounded-lg text-white ${isEditing ? 'bg-amber-500' : 'bg-[#185FA5]'}`}
            >
              {isEditing ? (
                <Edit2 className='w-4 h-4' />
              ) : (
                <Plus className='w-4 h-4' />
              )}
            </div>
            <h3 className='font-bold text-slate-800 text-base'>
              {isEditing
                ? 'แก้ไขข้อมูลรายละเอียดหน่วยงาน'
                : 'เพิ่มระบบหน่วยงานโครงสร้างใหม่'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className='p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer'
          >
            <X className='w-4 h-4' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='flex-1 flex flex-col min-h-0'>
          <div className='p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-sm'>
            {/* Title Input */}
            <div className='space-y-1.5'>
              <label className='block font-bold text-slate-700'>
                หัวข้อชื่อภาควิชา / หน่วยงาน{' '}
                <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='ระบุชื่อหน่วยงาน เช่น กองข่าวกรองทางการเงิน...'
                className='w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium'
              />
            </div>

            {/* Cover Image Upload */}
            <div className='space-y-1.5'>
              <label className='block font-bold text-slate-700'>
                รูปภาพปกประจำหน่วยงาน
              </label>
              <div className='flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80'>
                {coverPreview && (
                  <img
                    src={coverPreview}
                    alt='Cover Preview'
                    className='w-20 h-14 rounded-lg object-cover border shadow-sm shrink-0'
                  />
                )}
                <input
                  type='file'
                  ref={coverImageInputRef}
                  accept='image/jpeg,image/png,image/webp'
                  onChange={handleCoverChange}
                  className='block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 file:cursor-pointer hover:file:bg-blue-100'
                />
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className='space-y-1.5'>
              <label className='block font-bold text-slate-700'>
                ภารกิจและหน้าที่รับผิดชอบ (คำอธิบายรายละเอียด)
              </label>
              <div className='rounded-xl overflow-hidden border border-slate-200 bg-white shadow-inner'>
                <ReactQuill
                  theme='snow'
                  value={content}
                  onChange={setContent}
                  modules={quillModules}
                  placeholder='กรอกรายละเอียดบทบาทของหน่วยงาน...'
                />
              </div>
            </div>

            {/* Media Management Section */}
            <div className='border-t border-slate-100 pt-4 space-y-4'>
              <div>
                <h4 className='font-bold text-slate-800 flex items-center gap-1.5'>
                  <ImageIcon className='w-4 h-4 text-slate-500' />{' '}
                  ระบบจัดการคลังสื่อ (Gallery)
                </h4>
                <p className='text-[11px] text-slate-400 mt-0.5'>
                  เพิ่มอัปโหลดรูปภาพใหม่ หรือแนบลิงก์คลิปวิดีโอจากระบบโซเชียล
                  YouTube
                </p>
              </div>

              {/* YouTube URL Input */}
              <div className='flex gap-2 bg-slate-50 p-3 border border-slate-200/60 rounded-xl items-center'>
                <input
                  type='text'
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                  placeholder='วาง YouTube Share Link เช่น https://youtu.be/xxxxx'
                  className='flex-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-400/20'
                />
                <button
                  type='button'
                  onClick={handleAddYoutubeUrl}
                  className='bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95'
                >
                  แนบวิดีโอ
                </button>
              </div>

              {/* Gallery Preview Grid */}
              {(galleryUrls.length > 0 ||
                existingGalleryUrls.length > 0 ||
                newGalleryFiles.length > 0) && (
                <div className='p-4 bg-slate-50/50 border border-slate-100 rounded-2xl grid grid-cols-4 sm:grid-cols-5 gap-3 shadow-inner max-h-48 overflow-y-auto custom-scrollbar'>
                  {/* YouTube Videos */}
                  {galleryUrls.map((url, index) => (
                    <div
                      key={`yt-${index}`}
                      className='relative aspect-square rounded-xl overflow-hidden bg-white border border-slate-200 flex flex-col items-center justify-center p-2 text-center group shadow-sm'
                    >
                      <Video className='w-6 h-6 text-rose-500 mb-0.5 shrink-0' />
                      <p className='text-[9px] text-slate-400 font-medium truncate w-full font-mono'>
                        {url.slice(-11)}
                      </p>
                      <button
                        type='button'
                        onClick={() => handleRemoveYoutubeUrl(index)}
                        className='absolute top-1 right-1 bg-slate-900/80 text-white rounded-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 shadow-sm cursor-pointer hover:bg-rose-600'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </div>
                  ))}

                  {/* Existing Images */}
                  {existingGalleryUrls.map((url, index) => (
                    <div
                      key={`img-${index}`}
                      className='relative aspect-square rounded-xl overflow-hidden bg-white border border-slate-200 group shadow-sm'
                    >
                      <img
                        src={url.startsWith('http') ? url : `${API_URL}${url}`}
                        alt='Gallery asset'
                        className='w-full h-full object-cover'
                        loading='lazy'
                      />
                      <button
                        type='button'
                        onClick={() => handleRemoveExistingImage(index)}
                        className='absolute top-1 right-1 bg-slate-900/80 text-white rounded-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 shadow-sm cursor-pointer hover:bg-rose-600'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </div>
                  ))}

                  {/* New Files */}
                  {newGalleryFiles.map(({ preview, file }, index) => (
                    <div
                      key={`new-${index}`}
                      className='relative aspect-square rounded-xl overflow-hidden bg-white border-2 border-sky-400 group shadow-sm'
                    >
                      <img
                        src={preview}
                        alt={file.name}
                        className='w-full h-full object-cover'
                      />
                      <div className='absolute bottom-0 left-0 right-0 bg-sky-500/90 text-white text-[8px] font-bold text-center py-0.5'>
                        ใหม่
                      </div>
                      <button
                        type='button'
                        onClick={() => handleRemoveNewFile(index)}
                        className='absolute top-1 right-1 bg-slate-900/80 text-white rounded-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 shadow-sm cursor-pointer hover:bg-rose-600'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New Gallery Upload */}
              <div className='space-y-1.5'>
                <label className='block text-xs font-bold text-slate-600 flex items-center gap-1'>
                  <ImageIcon className='w-3.5 h-3.5 text-sky-500' />{' '}
                  อัปโหลดภาพชุดใหม่เพิ่มเติม
                </label>
                <div className='bg-slate-50 p-3 rounded-xl border border-slate-200/80'>
                  <input
                    type='file'
                    ref={galleryInputRef}
                    multiple
                    accept='image/jpeg,image/png,image/webp'
                    onChange={handleGalleryFileChange}
                    className='block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 file:cursor-pointer hover:file:bg-sky-100'
                  />
                </div>

                {newGalleryFiles.length > 0 && (
                  <p className='text-xs font-black text-sky-600 px-1'>
                    ✨ มี {newGalleryFiles.length}{' '}
                    รูปภาพพร้อมจัดเก็บเข้าอัลบั้มหลังบันทึก
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className='px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-end items-center gap-2 shrink-0'>
            <button
              type='button'
              onClick={onClose}
              className='w-full sm:w-auto px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-xl transition-all cursor-pointer text-center active:scale-95'
            >
              ยกเลิกรายการ
            </button>
            <button
              type='submit'
              className='w-full sm:w-auto px-6 py-2.5 bg-[#185FA5] hover:bg-[#134b82] text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-blue-500/10 cursor-pointer text-center active:scale-95'
            >
              {isEditing ? 'บันทึกการแก้ไขข้อมูล' : 'ยืนยันสร้างหน่วยงาน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DepartmentFormModal
