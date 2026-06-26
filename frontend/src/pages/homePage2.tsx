import { useEffect, useState } from 'react'
import {
  FaArrowUp,
  FaClipboard,
  FaFacebook,
  FaLine,
  FaSearch,
  FaShareAlt,
  FaTwitter,
} from 'react-icons/fa'
import DepartmentShowcase from '../components/DepartmentShowcase'
import CommentSlider from '../components/homepage/CommentSlider'
import LoadingSkeleton from '../components/homepage/LoadingSkeleton'
import NewsSection from '../components/homepage/NewsSection'
import Slider from '../components/homepage/Slider'
import SplashPopup from '../components/homepage/SplashPopup'
import { contentService } from '../services/contentService'
import { useContentStore } from '../stores/useContentStore'
import type { BannerImage } from '../type'

const API_URL = import.meta.env.VITE_API_URL || ''

const HomePage2 = () => {
  const { prList, newsList, commentList, isLoading, fetchPublicData } =
    useContentStore()

  const [bannerImages, setBannerImages] = useState<BannerImage[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  useEffect(() => {
    fetchPublicData()
    contentService.getBanners().then((data) => setBannerImages(data))
  }, [fetchPublicData])

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.open(
        `/news?search=${encodeURIComponent(searchQuery.trim())}`,
        '_self',
      )
    }
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const text = 'สำนักงาน ปปง. - กองข่าวกรองทางการเงิน'
    switch (platform) {
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          '_blank',
        )
        break
      case 'line':
        window.open(
          `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
          '_blank',
        )
        break
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          '_blank',
        )
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        break
    }
    setShowShareMenu(false)
  }

  return (
    <div className='bg-slate-50 min-h-screen pt-0 w-full'>
      {/* Splash Popup (ถวายอาลัย/โปรโมชั่น) — แสดงวันละครั้ง */}
      <SplashPopup />

      {/* Skip to content link (Accessibility - WCAG 2.4.1) */}
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-white focus:text-blue-700 focus:font-bold focus:rounded-xl focus:shadow-xl'
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>

      {/* Top bar: Search + Language + Accessibility (มาตรฐาน 8.1, 8.3) */}
      <div className='bg-slate-800 text-white text-xs md:text-sm'>
        <div className='max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-10'>
          {/* Breadcrumb (มาตรฐาน ข้อ 6 ภาคผนวก ก) */}
          <nav
            aria-label='เส้นทางนำทาง'
            className='flex items-center gap-1 text-slate-400'
          >
            <span className='text-white'>หน้าหลัก</span>
          </nav>

          <div className='flex items-center gap-3 md:gap-4'>
            {/* Search form (มาตรฐาน 8.3) */}
            <form
              onSubmit={handleSearch}
              className='hidden md:flex items-center gap-1 bg-slate-700 rounded-lg px-2 py-1'
            >
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='ค้นหา...'
                className='w-32 lg:w-48 bg-transparent text-white text-xs placeholder-slate-400 focus:outline-none'
                aria-label='ค้นหาข้อมูลบนเว็บไซต์'
              />
              <button type='submit' aria-label='ค้นหา'>
                <FaSearch className='w-3.5 h-3.5 text-slate-400 hover:text-white' />
              </button>
            </form>

            {/* Language switcher (มาตรฐาน 8.1) */}
            <div className='flex items-center gap-1 border-r border-slate-600 pr-3'>
              <button className='px-2 py-0.5 rounded text-xs font-medium bg-white text-slate-800'>
                TH
              </button>
              <button className='px-2 py-0.5 rounded text-xs text-slate-400 hover:text-white'>
                EN
              </button>
            </div>

            {/* Font size (มาตรฐาน 8.1) */}
            <div className='hidden md:flex items-center gap-1'>
              <button
                className='text-xs text-slate-400 hover:text-white px-1'
                aria-label='ลดขนาดตัวอักษร'
              >
                A-
              </button>
              <button
                className='text-sm text-slate-400 hover:text-white px-1'
                aria-label='ขนาดตัวอักษรปกติ'
              >
                A
              </button>
              <button
                className='text-lg text-slate-400 hover:text-white px-1'
                aria-label='เพิ่มขนาดตัวอักษร'
              >
                A+
              </button>
            </div>

            {/* Accessibility link (มาตรฐาน 8.7) */}
            <a
              href='/accessibility'
              className='text-xs text-slate-400 hover:text-white hidden md:inline'
              aria-label='การเข้าถึงเว็บไซต์'
            >
              การเข้าถึง
            </a>
          </div>
        </div>
      </div>

      {/* Main Banner Slider (มาตรฐาน 4.1) */}
      <div id='main-content'>
        {bannerImages.length > 0 && (
          <div className='pb-6 bg-slate-50'>
            <Slider
              containerClassName='h-[125px] md:h-[225px] lg:h-[calc(50vh-48px)] xl:h-[50vh]'
              slides={bannerImages.map((banner) => ({
                id: banner.id,
                image: banner.image_url.startsWith('http')
                  ? banner.image_url
                  : `${API_URL}${banner.image_url}`,
                link: banner.link_url || undefined,
              }))}
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <div className='px-4 md:px-8 pb-10 max-w-7xl mx-auto'>
            {/* Mobile search (มาตรฐาน 8.3) */}
            <form
              onSubmit={handleSearch}
              className='md:hidden flex items-center gap-2 mb-6 bg-white rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm'
            >
              <FaSearch className='w-4 h-4 text-slate-400 shrink-0' />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='ค้นหาข้อมูลบนเว็บไซต์...'
                className='flex-1 bg-transparent text-sm text-slate-700 focus:outline-none'
                aria-label='ค้นหาข้อมูล'
              />
              <button
                type='submit'
                className='text-sm font-medium text-blue-600'
              >
                ค้นหา
              </button>
            </form>

            {/* Advertisement Section */}
            <NewsSection
              title='ข่าวประชาสัมพันธ์'
              items={prList}
              basePath='advertise'
              viewAllLink='/advertise'
            />

            {/* News Section */}
            <div className='mt-12 md:mt-16'>
              <NewsSection
                title='กิจกรรมและประกาศ'
                items={newsList}
                basePath='news'
                viewAllLink='/news'
              />
            </div>
          </div>

          {/* Department Showcase */}
          <div className='mt-4 md:mt-4 pb-10'>
            <DepartmentShowcase />
          </div>

          {/* Comment Slider */}
          <div className='w-full bg-gray-200'>
            <CommentSlider comments={commentList} />
          </div>

          {/* Open Data & OIT Section (มาตรฐาน 4.8, 5.3) */}
          <div className='max-w-7xl mx-auto px-4 md:px-8 py-8'>
            <div className='bg-white rounded-2xl border border-slate-200 p-6 md:p-8'>
              <h3 className='text-lg font-bold text-slate-800 mb-3'>
                ข้อมูลเปิดภาครัฐ (Open Data)
              </h3>
              <p className='text-slate-500 text-sm mb-4'>
                เผยแพร่ข้อมูลเพื่อเปิดโอกาสให้นำไปใช้ประโยชน์ได้อย่างไม่จำกัด
              </p>
              <div className='flex flex-wrap gap-3'>
                <a
                  href='/open-data'
                  className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors'
                >
                  ข้อมูลเปิดภาครัฐ
                </a>
                <a
                  href='/oit'
                  className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors'
                >
                  แบบวัด OIT
                </a>
              </div>
            </div>
          </div>

          {/* Social Share & Feedback (มาตรฐาน 7.2, 7.3) */}
          <div className='max-w-7xl mx-auto px-4 md:px-8 pb-8'>
            <div className='flex items-center justify-between flex-wrap gap-4'>
              <div className='relative'>
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className='inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors'
                >
                  <FaShareAlt className='w-4 h-4' />
                  แชร์หน้านี้
                </button>
                {showShareMenu && (
                  <div className='absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 p-2 flex gap-1 z-10'>
                    <button
                      onClick={() => handleShare('facebook')}
                      className='w-9 h-9 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-50'
                      aria-label='แชร์ไปยัง Facebook'
                    >
                      <FaFacebook className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => handleShare('line')}
                      className='w-9 h-9 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-50'
                      aria-label='แชร์ไปยัง LINE'
                    >
                      <FaLine className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className='w-9 h-9 rounded-lg flex items-center justify-center text-sky-500 hover:bg-sky-50'
                      aria-label='แชร์ไปยัง Twitter'
                    >
                      <FaTwitter className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className='w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100'
                      aria-label='คัดลอกลิงก์'
                    >
                      <FaClipboard className='w-4 h-4' />
                    </button>
                  </div>
                )}
              </div>

              <a
                href='/feedback'
                className='inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors'
              >
                แบบสำรวจความพึงพอใจ
              </a>
            </div>
          </div>
        </>
      )}

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className='fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-slate-800 text-white shadow-xl flex items-center justify-center hover:bg-slate-700 transition-colors'
          aria-label='กลับด้านบน'
        >
          <FaArrowUp className='w-5 h-5' />
        </button>
      )}
    </div>
  )
}

export default HomePage2
