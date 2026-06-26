import { useEffect, useMemo, useState } from 'react'

const CARD_HEIGHT = 168

interface Comment {
  id: string | number
  msg: string
  star: number
  isShow: boolean
}

interface CommentSliderProps {
  comments: Comment[]
}

const CommentSlider = ({ comments }: CommentSliderProps) => {
  const [commentOffset, setCommentOffset] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(true)

  const publishedComments = useMemo(() => {
    return comments?.filter((c) => c.isShow) || []
  }, [comments])

  useEffect(() => {
    if (!isTransitioning) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsTransitioning(true))
      })
    }
  }, [isTransitioning])

  useEffect(() => {
    const commentsCount = publishedComments.length
    if (commentsCount <= 1) return

    if (commentOffset === commentsCount + 1) {
      const timer = setTimeout(() => {
        setIsTransitioning(false)
        setCommentOffset(1)
      }, 700)
      return () => clearTimeout(timer)
    }

    if (commentOffset >= commentsCount + 1) {
      const timer = setTimeout(() => {
        setIsTransitioning(false)
        setCommentOffset(1)
      }, 700)
      return () => clearTimeout(timer)
    }

    if (commentOffset <= 0) {
      const timer = setTimeout(() => {
        setIsTransitioning(false)
        setCommentOffset(commentsCount)
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [commentOffset, publishedComments])

  const handleNext = () => {
    if (publishedComments.length <= 1) return
    if (commentOffset > publishedComments.length || commentOffset === 0) return

    setIsTransitioning(true)
    setCommentOffset((prev) => prev + 1)
  }

  const handlePrev = () => {
    if (publishedComments.length <= 1) return
    if (commentOffset <= 0 || commentOffset > publishedComments.length) return

    setIsTransitioning(true)
    setCommentOffset((prev) => prev - 1)
  }

  if (publishedComments.length === 0) return null

  return (
    <div className='py-20 w-full overflow-hidden'>
      <div className='max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start'>
        {/* Left: Heading */}
        <div className='lg:col-span-5 lg:sticky lg:top-24'>
          <p className='text-sm font-semibold text-blue-500 uppercase tracking-widest mb-3'>
            เสียงตอบรับจากผู้ใช้งาน
          </p>
          <h2 className='text-3xl md:text-4xl font-bold text-slate-800 mb-6 leading-tight'>
            ระบบบริการ
            <br />
            <span className='text-blue-500'>อิเล็กทรอนิกส์</span>
          </h2>
          <p className='text-slate-500 leading-relaxed text-sm md:text-base'>
            ความคิดเห็นและประสบการณ์จริงจากผู้ใช้งานระบบบริการของเรา
            ทุกเสียงสะท้อนคือแรงผลักดันสำคัญให้เราพัฒนาอย่างไม่หยุดยั้ง
          </p>
        </div>

        {/* Right: Vertical slider */}
        <div className='lg:col-span-7 flex flex-row gap-4'>
          {/* Slider container */}
          <div
            className='flex-1 overflow-hidden'
            style={{ height: `${CARD_HEIGHT * 1.35}px` }}
          >
            <div
              style={{
                transform: `translateY(-${commentOffset * CARD_HEIGHT}px)`,
                transition: isTransitioning
                  ? 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
                  : 'none',
              }}
            >
              {[
                publishedComments[publishedComments.length - 1],
                ...publishedComments,
                publishedComments[0],
              ].map((comment, idx) => (
                <div
                  key={`${comment.id}-${idx}`}
                  style={{
                    height: `${CARD_HEIGHT - 8}px`,
                    marginBottom: '8px',
                  }}
                  className='bg-[#1a1a1a] px-6 py-5 rounded-2xl border border-white/5 flex flex-col justify-center shrink-0'
                >
                  <div className='flex items-center gap-3 mb-3'>
                    <div className='w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold shrink-0'>
                      {idx === 0
                        ? publishedComments.length
                        : idx === publishedComments.length + 1
                          ? 1
                          : idx}
                    </div>
                    <div className='flex gap-0.5'>
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 fill-current ${i < comment.star ? 'text-yellow-400' : 'text-slate-600'}`}
                          viewBox='0 0 20 20'
                        >
                          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className='text-slate-300 text-sm leading-relaxed line-clamp-2'>
                    &ldquo;{comment.msg}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className='flex flex-col gap-2 justify-center shrink-0'>
            <button
              onClick={handlePrev}
              className='w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-all active:scale-90'
              aria-label='Previous comment'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M5 15l7-7 7 7'
                />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className='w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-all active:scale-90'
              aria-label='Next comment'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommentSlider
