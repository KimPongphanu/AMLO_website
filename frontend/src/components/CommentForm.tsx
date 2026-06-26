// src/components/CommentForm.tsx
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FaCommentDots,
  FaLightbulb,
  FaMousePointer,
  FaPenAlt,
  FaQuestionCircle,
  FaSpinner,
  FaStar,
  FaTimes,
} from 'react-icons/fa'
import { useContentStore } from '../stores/useContentStore'
import type { CommentFormData } from '../type'
import { toast } from '../utils/swalConfig'

const MAX_COMMENT_LENGTH = 500
const MIN_COMMENT_LENGTH = 10

const CommentForm = () => {
  const { t } = useTranslation()
  const submitUserComment = useContentStore((state) => state.submitUserComment)
  const isSubmitting = useContentStore((state) => state.isSubmittingComment)
  const contentError = useContentStore((state) => state.commentError)
  const setCommentError = useContentStore((state) => state.setCommentError)

  const [isOpen, setIsOpen] = useState(false)
  const [showTips, setShowTips] = useState(false)

  const [formData, setFormData] = useState<CommentFormData>({
    rating: 0,
    content: '',
    botField: '',
  })

  const [position, setPosition] = useState({
    x: window.innerWidth - 80,
    y: window.innerHeight - 80,
  })

  const [isDragging, setIsDragging] = useState(false)
  const [snapSide, setSnapSide] = useState('right')
  const [snapVertical, setSnapVertical] = useState('bottom')
  const dragRef = useRef({ startX: 0, startY: 0, iconX: 0, iconY: 0 })
  const iconSize = 48
  const OFFSET = 24

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth
      if (snapSide === 'right') {
        setPosition((prev) => ({ ...prev, x: screenWidth - iconSize - OFFSET }))
      } else if (snapSide === 'left') {
        setPosition((prev) => ({ ...prev, x: OFFSET }))
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [snapSide])

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      iconX: position.x,
      iconY: position.y,
    }
  }

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setPosition({
      x: dragRef.current.iconX + (clientX - dragRef.current.startX),
      y: dragRef.current.iconY + (clientY - dragRef.current.startY),
    })
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    let snapX = position.x
    let snapY = position.y

    if (position.x + iconSize / 2 < screenWidth / 2) {
      snapX = OFFSET
      setSnapSide('left')
    } else {
      snapX = screenWidth - iconSize - OFFSET
      setSnapSide('right')
    }
    if (position.y + iconSize / 2 < screenHeight / 2) {
      snapY = 88
      setSnapVertical('top')
    } else {
      snapY = screenHeight - iconSize - OFFSET
      setSnapVertical('bottom')
    }
    setPosition({ x: snapX, y: snapY })
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchmove', handleDragMove, { passive: false })
      window.addEventListener('touchend', handleDragEnd)
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchmove', handleDragMove)
      window.removeEventListener('touchend', handleDragEnd)
    }
  }, [isDragging, position])

  const handleContentChange = (val: string) => {
    setFormData((prev) => ({ ...prev, content: val }))
    if (val.trim().length > 0 && val.trim().length < MIN_COMMENT_LENGTH) {
      setCommentError(t('comment.failed'))
    } else {
      setCommentError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.rating === 0) {
      toast.fire({
        icon: 'warning',
        title: t('comment.title'),
        text: t('comment.failed'),
      })
      return
    }
    if (formData.content.trim().length < MIN_COMMENT_LENGTH) {
      toast.fire({
        icon: 'warning',
        title: t('comment.rating'),
        text: t('comment.failed'),
      })
      return
    }

    // submitUserComment takes the form data + callbacks
    await submitUserComment(formData, resetForm, setIsOpen)
  }

  const resetForm = () => {
    setFormData({ rating: 0, content: '', botField: '' })
    setIsOpen(false)
  }

  const handleOpenClick = () => {
    setIsOpen(true)
  }

  const getFormPlacementClass = () => {
    if (snapVertical === 'top' && snapSide === 'left')
      return 'top-0 left-0 origin-top-left'
    if (snapVertical === 'top' && snapSide === 'right')
      return 'top-0 right-0 origin-top-right'
    if (snapVertical === 'bottom' && snapSide === 'left')
      return 'bottom-0 left-0 origin-bottom-left'
    return 'bottom-0 right-0 origin-bottom-right'
  }

  return (
    <>
      <div
        className='fixed top-0 left-0 z-[9999] touch-none'
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging
            ? 'none'
            : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className='relative w-12 h-12'>
          <button
            onClick={handleOpenClick}
            aria-label={t('comment.title')}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className={`absolute bottom-0 right-0 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
              isDragging
                ? 'scale-105 cursor-grabbing shadow-xl'
                : 'cursor-grab hover:shadow-xl hover:scale-105 active:scale-95'
            }`}
          >
            <FaCommentDots className='w-6 h-6 text-[#1a73e8]' />
          </button>

          {/* Form Card */}
          {isOpen && (
            <div
              className={`absolute ${getFormPlacementClass()} transition-all duration-200 ${
                isOpen
                  ? 'scale-100 opacity-100 pointer-events-auto'
                  : 'scale-95 opacity-0 pointer-events-none'
              }`}
              style={{ transformOrigin: 'bottom right' }}
            >
              <div className='bg-white w-[400px] rounded-xl shadow-xl border border-[#dadce0] overflow-hidden'>
                {/* Header */}
                <div className='px-6 pt-5 pb-3 flex justify-between items-center border-b border-[#e8eaed]'>
                  <span className='text-[16px] font-semibold text-[#202124]'>
                    {t('comment.title')}
                  </span>
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={() => setShowTips(true)}
                      aria-label={t('common.search')}
                      className='w-8 h-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] transition-colors'
                    >
                      <FaQuestionCircle className='w-5 h-5' />
                    </button>
                    <button
                      onClick={resetForm}
                      aria-label={t('common.close')}
                      className='w-8 h-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] transition-colors'
                    >
                      <FaTimes className='w-5 h-5' />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form
                  onSubmit={handleSubmit}
                  className='p-6 flex flex-col gap-5'
                >
                  <div
                    className='absolute opacity-0 -z-10 h-0 w-0 overflow-hidden'
                    aria-hidden='true'
                  >
                    <input
                      type='text'
                      value={formData.botField}
                      onChange={() => {}}
                      tabIndex={-1}
                      autoComplete='off'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-[#5f6368] mb-2'>
                      {t('comment.rating')}
                    </label>
                    <div className='flex gap-1'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type='button'
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, rating: star }))
                          }
                          aria-label={`${t('comment.rating')} ${star}`}
                          className='text-2xl transition-all duration-150 hover:scale-110 active:scale-90'
                        >
                          <FaStar
                            className={
                              star <= formData.rating
                                ? 'text-amber-500'
                                : 'text-[#dadce0] hover:text-[#9aa0a6]'
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-[#5f6368] mb-2'>
                      {t('comment.message')}
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder={t('comment.message')}
                      required
                      maxLength={MAX_COMMENT_LENGTH}
                      className='w-full border border-[#dadce0] rounded-lg px-4 py-3 text-sm text-[#202124] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent resize-none h-28 transition-shadow'
                    />
                    <div className='flex justify-between items-center mt-1.5'>
                      {contentError ? (
                        <span className='text-xs text-[#d93025] font-medium'>
                          {contentError}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className='text-xs text-[#5f6368] font-medium'>
                        {formData.content.length}/{MAX_COMMENT_LENGTH}
                      </span>
                    </div>
                  </div>

                  <button
                    type='submit'
                    disabled={formData.rating === 0 || isSubmitting}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                      formData.rating === 0
                        ? 'bg-[#f1f3f4] text-[#9aa0a6] cursor-not-allowed'
                        : 'bg-[#1a73e8] text-white hover:bg-[#1557b0] active:scale-[0.98] shadow-sm'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className='flex items-center justify-center gap-2'>
                        <FaSpinner className='animate-spin h-4 w-4' />{' '}
                        {t('comment.sending')}
                      </span>
                    ) : (
                      t('comment.send')
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
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
                  {t('common.search')}
                </span>
              </div>
              <button
                onClick={() => setShowTips(false)}
                aria-label={t('common.close')}
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
                    {t('comment.rating')}
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    {t('comment.failed')}
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <FaPenAlt className='text-lg shrink-0 mt-0.5 text-[#1a73e8]' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    {t('comment.message')}
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    {t('comment.sending')}
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <FaMousePointer className='text-lg shrink-0 mt-0.5 text-[#5f6368]' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    {t('common.settings')}
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    {t('common.error')}
                  </p>
                </div>
              </div>
            </div>
            <div className='px-6 pb-4 pt-2 flex justify-end'>
              <button
                onClick={() => setShowTips(false)}
                className='px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-[#1a73e8] hover:bg-[#1557b0] active:scale-[0.97] transition-all shadow-sm'
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
    </>
  )
}

export default CommentForm
