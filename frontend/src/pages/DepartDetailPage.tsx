import DOMPurify from 'dompurify'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumb from '../components/Breadcrumb'
import { useContentStore } from '../stores/useContentStore'

import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

// ════════════════════════════════════════════════════════════
//  SECTION 1 — HELPER & TYPES
// ════════════════════════════════════════════════════════════
const getYouTubeId = (url = '') => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=|shorts\/))([^?&\s]{11})/,
  )
  return match ? match[1] : null
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const resolveUrl = (url: string) =>
  url?.startsWith('/') ? `${API_URL}${url}` : url

interface YouTubePlayer {
  destroy: () => void
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  mute: () => void
  unMute: () => void
  setVolume: (volume: number) => void
  isMuted: () => boolean
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        options: unknown,
      ) => YouTubePlayer
      PlayerState: {
        PLAYING: number
        ENDED: number
        PAUSED: number
        BUFFERING: number
        CUED: number
      }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

// ════════════════════════════════════════════════════════════
//  SECTION 2 — โหลด YouTube IFrame API script
// ════════════════════════════════════════════════════════════
const loadYTScript = () =>
  new Promise<void>((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve()
      return
    }
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
  })

const FALLBACK_MS = 15000

// ════════════════════════════════════════════════════════════
//  SECTION 3 — COMPONENT: YouTubeSlide
// ════════════════════════════════════════════════════════════
const YouTubeSlide = ({
  url,
  isActive,
  onVideoEnded,
  isOnlySlide = false,
}: {
  url: string
  isActive: boolean
  onVideoEnded: () => void
  isOnlySlide?: boolean
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const onEndedRef = useRef(onVideoEnded)
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playingRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)

  const videoId = getYouTubeId(url)

  useEffect(() => {
    onEndedRef.current = onVideoEnded
  }, [onVideoEnded])

  const clearFallback = () => {
    if (fallbackRef.current) clearTimeout(fallbackRef.current)
  }

  const startFallback = useCallback(() => {
    clearFallback()
    fallbackRef.current = setTimeout(() => {
      onEndedRef.current?.()
    }, FALLBACK_MS)
  }, [])

  useEffect(() => {
    if (!videoId || !containerRef.current) return

    if (!isActive) {
      clearFallback()
      try {
        playerRef.current?.destroy()
      } catch {
        /* ignore */
      }
      playerRef.current = null
      containerRef.current.innerHTML = ''
      return
    }

    let cancelled = false
    startFallback()

    loadYTScript().then(() => {
      if (cancelled || !containerRef.current) return

      const target = document.createElement('div')
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(target)

      playerRef.current = new window.YT.Player(target, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          mute: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          playsinline: 1,
          disablekb: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          loop: isOnlySlide ? 1 : 0,
          playlist: isOnlySlide && videoId ? videoId : undefined,
        },
        events: {
          onReady: (e: { target: YouTubePlayer }) => {
            if (cancelled) return
            e.target.unMute()
            e.target.setVolume(50)
            e.target.playVideo()
          },
          onStateChange: (e: { data: number; target: YouTubePlayer }) => {
            if (cancelled) return
            const S = window.YT.PlayerState

            if (e.data === S.PLAYING) {
              clearFallback()
              playingRef.current = true
              setIsPlaying(true)
            } else if (e.data === S.ENDED) {
              clearFallback()
              playingRef.current = false
              setIsPlaying(false)
              if (!isOnlySlide) {
                e.target.seekTo(0, true)
                e.target.pauseVideo()
              }
              onEndedRef.current?.()
            } else if (e.data === S.PAUSED) {
              setIsPlaying(false)
            }
          },
          onError: () => {
            if (cancelled) return
            clearFallback()
            onEndedRef.current?.()
          },
        },
      })
    })

    return () => {
      cancelled = true
      clearFallback()
    }
  }, [isActive, videoId, startFallback])

  useEffect(
    () => () => {
      clearFallback()
      try {
        playerRef.current?.destroy()
      } catch {
        /* ignore */
      }
      playerRef.current = null
    },
    [],
  )

  const togglePlay = () => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }

  const toggleMute = () => {
    if (!playerRef.current) return
    if (isMuted) {
      playerRef.current.unMute()
      playerRef.current.setVolume(50)
      setIsMuted(false)
    } else {
      playerRef.current.mute()
      setIsMuted(true)
    }
  }

  if (!videoId) return null

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          background: 'transparent',
          pointerEvents: 'all',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: 'default',
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div
        className='absolute bottom-4 left-4 z-20 flex gap-3'
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={togglePlay}
          className='bg-black/60 hover:bg-black/80 text-white w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-sm transition-all shadow-lg'
        >
          {isPlaying ? (
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
              <path d='M6 19h4V5H6v14zm8-14v14h4V5h-4z' />
            </svg>
          ) : (
            <svg
              className='w-5 h-5 ml-1'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M8 5v14l11-7z' />
            </svg>
          )}
        </button>

        <button
          onClick={toggleMute}
          className='bg-black/60 hover:bg-black/80 text-white w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-sm transition-all shadow-lg'
        >
          {isMuted ? (
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2'
              />
            </svg>
          ) : (
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z'
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  SECTION 4 — MAIN PAGE COMPONENT
// ════════════════════════════════════════════════════════════
const DepartmentDetailPage = () => {
  const { id } = useParams()

  // ดึงข้อมูลและฟังก์ชันจาก Zustand Store
  const departmentList = useContentStore((state) => state.departmentList)
  const isLoading = useContentStore((state) => state.isLoading)
  const fetchPublicData = useContentStore((state) => state.fetchPublicData)

  // ✨ จัดการดึงข้อมูลใหม่เมื่อผู้ใช้รีเฟรชหน้าจอ (ข้อมูลใน Store หาย)
  useEffect(() => {
    if (!departmentList || departmentList.length === 0) {
      fetchPublicData()
    }
  }, [departmentList, fetchPublicData])

  const department = departmentList?.find((dept) => dept.id === Number(id))
  const swiperRef = useRef<SwiperType | null>(null)

  const hasMultipleSlides = (department?.gallery?.length || 0) > 1
  const isOnlySlide = (department?.gallery?.length || 0) === 1

  const handleVideoEnded = useCallback(() => {
    swiperRef.current?.slideNext()
    swiperRef.current?.autoplay.start()
  }, [])

  const handleSlideChange = useCallback(
    (swiper: SwiperType) => {
      const item = department?.gallery?.[swiper.realIndex]
      if (!item) return

      if (item.type === 'video') {
        swiper.autoplay.stop()
      } else {
        swiper.autoplay.start()
      }
    },
    [department],
  )

  const handleAutoplayStart = useCallback(
    (swiper: SwiperType) => {
      const item = department?.gallery?.[swiper.realIndex]
      if (item?.type === 'video') {
        swiper.autoplay.stop()
      }
    },
    [department],
  )

  const handleSwiperInit = useCallback(
    (swiper: SwiperType) => {
      swiperRef.current = swiper
      const firstItem = department?.gallery?.[0]
      if (firstItem?.type === 'video') {
        swiper.autoplay.stop()
      }
    },
    [department],
  )

  // ✨ ปรับปรุงเงื่อนไขสิทธิ์: จะแสดง Spinner โหลดก็ต่อเมื่อระบบกำลัง Fetch และข้อมูลในอาเรย์หลักยังไม่มีเท่านั้น
  if (isLoading && (!departmentList || departmentList.length === 0)) {
    return (
      <div className='w-full flex justify-center items-center h-screen bg-slate-50'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600'></div>
      </div>
    )
  }

  if (!department) {
    return (
      <div className='pt-32 text-center text-2xl font-bold text-red-500 min-h-screen'>
        ไม่พบข้อมูลหน่วยงานนี้
      </div>
    )
  }

  return (
    <div className='bg-slate-50 min-h-screen pt-24 pb-16 px-4 md:px-8'>
      <div className='max-w-4xl mx-auto bg-white rounded-3xl shadow-md overflow-hidden border border-slate-200'>
        {/* ส่วน Slider / Cover (อยู่ด้านบนสุดของ Card) */}
        <div className='w-full h-[250px] md:h-[450px] bg-black'>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation={hasMultipleSlides}
            pagination={{ clickable: true }}
            loop={hasMultipleSlides}
            allowTouchMove={hasMultipleSlides}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            onSwiper={handleSwiperInit}
            onSlideChange={handleSlideChange}
            onAutoplayStart={handleAutoplayStart}
            className='w-full h-full'
          >
            {department.gallery?.map((item, index) => (
              <SwiperSlide
                key={index}
                className='w-full h-full flex justify-center items-center bg-black'
              >
                {({ isActive }) =>
                  item.type === 'video' ? (
                    <YouTubeSlide
                      url={item.url}
                      isActive={isActive}
                      onVideoEnded={handleVideoEnded}
                      isOnlySlide={isOnlySlide}
                    />
                  ) : (
                    <img
                      src={resolveUrl(item.url)}
                      alt={`ภาพประกอบ ${department.title} - ${index + 1}`}
                      className='w-full h-full object-cover'
                    />
                  )
                }
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* ส่วนเนื้อหา */}
        <div className='p-6 md:p-12'>
          {/* Breadcrumb ไว้บนสุดของเนื้อหา */}
          <Breadcrumb title={department.title} />

          {/* ชื่อหน่วยงาน */}
          <h1 className='text-2xl md:text-4xl font-bold text-slate-800 mb-6 leading-snug'>
            {department.title}
          </h1>

          {/* เส้นคั่น */}
          <hr className='border-slate-100 mb-8' />

          {/* เนื้อหา HTML / Description */}
          {department.content ? (
            <div
              className='prose prose-lg max-w-none text-slate-600 leading-relaxed text-base md:text-lg ql-rendered'
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(department.content),
              }}
            />
          ) : (
            <div className='text-lg text-gray-700 leading-relaxed whitespace-pre-line'>
              ยินดีต้อนรับเข้าสู่ <strong>{department.title}</strong>
              <br />
              <br />
              ไม่มีข้อมูลโครงสร้างและหน้าที่รับผิดชอบในขณะนี้
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DepartmentDetailPage
