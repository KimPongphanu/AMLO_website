import { useEffect, useMemo, useRef, useState } from 'react'
import { useContentStore } from '../stores/useContentStore'

// 🌟 ดึง DOMParser ออกมาด้านนอก เพื่อไม่ให้สร้างใหม่ทุกรอบใน Loop
const parser = new DOMParser()
const stripHtmlToText = (html?: string) => {
  if (!html) return 'ไม่มีข้อมูลรายละเอียด'
  const doc = parser.parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

const DepartmentShowcase = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const imageRefs = useRef<(HTMLDivElement | null)[]>([])

  const [mobileScrollProgress, setMobileScrollProgress] = useState(0)
  const mobileContainerRef = useRef<HTMLDivElement>(null)

  const departmentList = useContentStore((state) => state.departmentList)
  const departments = useMemo(() => departmentList || [], [departmentList])

  const API_URL = import.meta.env.VITE_API_URL
  const resolveImg = (url: string) =>
    url?.startsWith('/') ? `${API_URL}${url}` : url

  // ==========================================
  // 💻 Logic สำหรับ Desktop (แก้ Memory Leak)
  // ==========================================
  useEffect(() => {
    if (departments.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'))
            setActiveIndex(index)
          }
        })
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )

    // ใช้กวาดสแกน Ref ที่พร้อมใช้งานทันที ปลอดภัยกว่า setTimeout
    imageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [departments])

  const handleScrollTo = (index: number) => {
    setActiveIndex(index)
    imageRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  // ==========================================
  // 📱 Logic สำหรับ Mobile (แก้ Scroll Lag ด้วย rAF)
  // ==========================================
  useEffect(() => {
    if (departments.length === 0) return

    let ticking = false

    const handleMobileScroll = () => {
      if (!mobileContainerRef.current) return

      const rect = mobileContainerRef.current.getBoundingClientRect()
      const scrollStart = rect.top
      const scrollDistance = rect.height - window.innerHeight

      let progress = 0
      if (scrollStart <= 0) {
        if (-scrollStart > scrollDistance) {
          progress = 1
        } else {
          progress = -scrollStart / scrollDistance
        }
      }

      setMobileScrollProgress(progress)
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleMobileScroll)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    handleMobileScroll() // รันครั้งแรกตอนโหลดหน้าเว็บ

    return () => window.removeEventListener('scroll', onScroll)
  }, [departments.length])

  if (departments.length === 0) return null

  return (
    <section className='bg-transparent text-slate-800 py-8 md:py-12 font-sans relative'>
      <div className='max-w-7xl mx-auto px-6 md:px-8'>
        {/* Header Section */}
        <div className='mb-12 md:mb-20 max-w-2xl'>
          <p className='text-blue-600 font-bold tracking-widest text-xs md:text-sm uppercase mb-3'>
            โครงสร้างองค์กร
          </p>
          <h2 className='text-3xl md:text-5xl font-bold mb-6 leading-tight text-slate-900'>
            หน่วยงานภายใน ปปง.
          </h2>
          <p className='text-slate-500 text-base md:text-lg leading-relaxed'>
            องค์กรถูกขับเคลื่อนด้วย {departments.length}{' '}
            กองหลักที่ทำงานประสานกัน
            เพื่อป้องกันและปราบปรามอาชญากรรมทางการเงินอย่างมีประสิทธิภาพ
          </p>
        </div>

        {/* ส่วนแสดงผลสำหรับ DESKTOP */}
        <div className='hidden md:flex flex-row gap-10 md:gap-20 relative'>
          {/* ฝั่งซ้าย: ตัวหนังสือ */}
          <div className='w-5/12'>
            <div className='sticky top-[20vh] flex flex-col gap-6'>
              {departments.map((dept, index) => {
                const isActive = activeIndex === index
                const code = `0${index + 1}`.slice(-2)

                return (
                  <div
                    key={dept.id}
                    onClick={() => handleScrollTo(index)}
                    className={`cursor-pointer transition-all duration-500 pl-6 border-l-2 ${
                      isActive
                        ? 'border-blue-600 opacity-100'
                        : 'border-slate-200 opacity-50 hover:opacity-80'
                    }`}
                  >
                    <p className='text-xs font-bold text-blue-600 mb-1 tracking-wider uppercase'>
                      กอง {code}
                    </p>
                    <h3
                      className={`text-2xl font-bold transition-colors duration-500 ${
                        isActive ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {dept.title}
                    </h3>
                    <div
                      className={`grid transition-all duration-500 ease-in-out ${
                        isActive
                          ? 'grid-rows-[1fr] opacity-100'
                          : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className='overflow-hidden pt-3 pb-2'>
                        <div className='text-slate-500 leading-relaxed text-sm line-clamp-3 break-words'>
                          {stripHtmlToText(dept.content)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ฝั่งขวา: รูปภาพ */}
          <div className='w-7/12 flex flex-col pb-[30vh]'>
            {departments.map((dept, index) => {
              const isActive = activeIndex === index

              return (
                <div
                  key={dept.id}
                  data-index={index}
                  ref={(el) => {
                    imageRefs.current[index] = el
                  }}
                  className='mb-[25vh] last:mb-0 w-full flex items-center justify-center'
                >
                  <div
                    className={`w-full aspect-[16/10] rounded-3xl overflow-hidden relative bg-slate-100 border border-slate-200 origin-center transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                      ${
                        isActive
                          ? 'scale-100 opacity-100 shadow-2xl ring-4 ring-blue-500/10 blur-none'
                          : 'scale-[0.85] opacity-30 shadow-sm blur-[3px]'
                      }
                    `}
                  >
                    <img
                      src={resolveImg(dept.cover_image)}
                      alt={dept.title}
                      loading='lazy'
                      className='w-full h-full object-cover transition-transform duration-1000 hover:scale-105'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none' />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ส่วนแสดงผลสำหรับ MOBILE */}
      <div
        ref={mobileContainerRef}
        className='md:hidden relative w-full'
        style={{ height: `${departments.length * 100 + 100}vh` }}
      >
        <div className='sticky top-[10vh] h-[80vh] w-full overflow-hidden flex flex-col justify-center'>
          <div
            className='flex h-[62vh] items-center will-change-transform'
            style={{
              width: `${departments.length * 100}%`,
              transform: `translateX(-${mobileScrollProgress * (100 - 100 / departments.length)}%)`,
            }}
          >
            {departments.map((dept, index) => {
              const code = `0${index + 1}`.slice(-2)

              return (
                <div
                  key={dept.id}
                  className='h-full flex flex-col justify-center px-4'
                  style={{ width: `${100 / departments.length}%` }}
                >
                  <div
                    className='bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col'
                    style={{ height: '100%', maxHeight: '480px' }}
                  >
                    <div
                      className='relative shrink-0 bg-slate-200'
                      style={{ height: '52%' }}
                    >
                      <img
                        src={resolveImg(dept.cover_image)}
                        alt={dept.title}
                        className='w-full h-full object-cover'
                      />
                      <div className='absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10'>
                        กอง {code}
                      </div>
                    </div>
                    <div
                      className='p-5 flex flex-col bg-slate-50'
                      style={{
                        flex: '1 1 0',
                        minHeight: 0,
                        overflow: 'hidden',
                      }}
                    >
                      <h3 className='text-base font-bold text-slate-800 mb-2 shrink-0 truncate'>
                        {dept.title}
                      </h3>
                      <p
                        className='text-slate-500 text-sm leading-relaxed'
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {stripHtmlToText(dept.content)}
                      </p>
                      <div className='mt-auto pt-3 flex items-center text-blue-600 font-semibold text-sm shrink-0'>
                        รายละเอียด <span className='ml-1'>➔</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Indicator (ล็อกขอบเขตไม่ให้ Index หลุดขอบลำดับ Array) */}
          <div className='mt-6 flex justify-center gap-2 px-6'>
            {departments.map((_, i) => {
              const calculatedIndex = Math.round(
                mobileScrollProgress * (departments.length - 1),
              )
              const safeIndex = Math.max(
                0,
                Math.min(calculatedIndex, departments.length - 1),
              )
              const isActive = safeIndex === i

              return (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isActive ? 'w-8 bg-blue-600' : 'w-2 bg-slate-300'
                  }`}
                />
              )
            })}
          </div>
          <div className='text-center text-[10px] text-slate-400 mt-3 font-medium tracking-wide flex items-center justify-center gap-1 opacity-70'>
            <svg
              className='w-3 h-3 animate-bounce'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M19 14l-7 7m0 0l-7-7m7 7V3'
              />
            </svg>
            เลื่อนลงเพื่อดูเพิ่มเติม
          </div>
        </div>
      </div>
    </section>
  )
}

export default DepartmentShowcase
