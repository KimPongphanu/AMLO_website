import { Settings, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import LanguageSwitcher from '../../i18n/components/LanguageSwitcher'
import { useAuthStore } from '../../stores/useAuthStore'
import { useContentStore } from '../../stores/useContentStore'
import { useSiteStore } from '../../stores/useSiteStore'

export default function Nav() {
  const { t } = useTranslation()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mobileExpandedMenu, setMobileExpandedMenu] = useState<string | null>(
    null,
  )
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const { fontSize, setFontSize } = useSiteStore()

  const { isLoggedIn, logoutUser } = useAuthStore()
  const departmentList = useContentStore((state) => state.departmentList)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleCloseMobileMenu = () => {
    setIsMobileMenuOpen(false)
    setMobileExpandedMenu(null)
  }

  const handleLogoutClick = async () => {
    setIsAccountOpen(false)
    handleCloseMobileMenu()
    await logoutUser()
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node))
        setIsAccountOpen(false)
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      )
        setIsSettingsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const handleMouseEnterNav = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }
  const handleMouseLeaveNav = () => {
    timeoutRef.current = setTimeout(() => setActiveMenu(null), 250)
  }
  const toggleMobileSubmenu = (menu: string) =>
    setMobileExpandedMenu(mobileExpandedMenu === menu ? null : menu)

  return (
    <>
      <nav
        className='fixed top-0 left-0 w-full z-[60] transition-all duration-​1500 backdrop-blur-[25px] bg-white/80 border-b border-gray-200 shadow-sm'
        onMouseEnter={handleMouseEnterNav}
        onMouseLeave={handleMouseLeaveNav}
      >
        <div className='w-full flex items-center justify-between px-4 md:px-8 h-20 relative'>
          {/* Logo */}
          <div className='h-full py-3 flex-shrink-0 flex items-center z-20'>
            <button
              onClick={() => {
                if (window.location.pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                } else {
                  navigate('/')
                }
              }}
              className='h-full flex items-center group bg-transparent border-0 p-0 cursor-pointer'
              aria-label={t('nav.backToHome', 'กลับหน้าหลัก')}
            >
              <img
                src='/Logo.png'
                alt={t('app.logoAlt', 'โลโก้ ปปง.')}
                className='w-auto h-full group-hover:scale-105 transition-transform duration-300'
              />
              <div className='hidden sm:block w-[1.5px] h-10 bg-slate-300 mx-4 md:mx-5'></div>
              <div className='hidden sm:flex flex-col justify-center'>
                <h1 className='text-base md:text-lg font-extrabold text-slate-800 leading-tight group-hover:text-blue-700 transition-colors tracking-wide'>
                  {t('home.heroTitle')}
                </h1>
                <span className='text-xs text-slate-500 font-semibold tracking-wider mt-0.5'>
                  {t('app.title')}
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Menu */}
          <div className='hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-10 h-full font-bold text-slate-600 text-base z-10'>
            <Link
              to='/'
              className='hover:text-blue-600 transition-colors py-2 relative group'
            >
              {t('nav.home')}
              <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full'></span>
            </Link>
            <div
              className={`flex items-center cursor-pointer transition-colors py-2 relative group ${activeMenu === 'about' ? 'text-blue-600' : 'hover:text-blue-600'}`}
              onMouseEnter={() => {
                handleMouseEnterNav()
                setActiveMenu('about')
              }}
            >
              {t('nav.about')}{' '}
              <span className='ml-1.5 text-[10px] opacity-70'>▼</span>
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-blue-600 transition-all duration-300 ${activeMenu === 'about' ? 'w-full' : 'w-0 group-hover:w-full'}`}
              ></span>
            </div>
            <Link
              to='/contactform'
              className='hover:text-blue-600 transition-colors py-2 relative group'
            >
              {t('nav.contact')}
              <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full'></span>
            </Link>
          </div>

          {/* Tablet Menu */}
          <div className='hidden md:flex lg:hidden items-center gap-6 h-full font-bold text-slate-600 text-sm ml-auto mr-6 z-20'>
            <Link to='/' className='hover:text-blue-600 transition-colors'>
              {t('nav.home')}
            </Link>
            <div
              className={`flex items-center cursor-pointer transition-colors ${activeMenu === 'about' ? 'text-blue-600' : 'hover:text-blue-600'}`}
              onMouseEnter={() => {
                handleMouseEnterNav()
                setActiveMenu('about')
              }}
            >
              {t('nav.about')} <span className='ml-1 text-[10px]'>▼</span>
            </div>
            <Link
              to='/contactform'
              className='hover:text-blue-600 transition-colors'
            >
              {t('nav.contact')}
            </Link>
          </div>

          {/* Right side: LanguageSwitcher + Settings + Account */}
          <div className='flex items-center z-20 gap-2'>
            {/* LanguageSwitcher (แทนที่อันเก่า) */}
            <LanguageSwitcher />

            {/* Settings */}
            <div
              className='hidden md:flex items-center'
              ref={settingsRef}
              onMouseEnter={() => setIsSettingsOpen(true)}
              onMouseLeave={() => {
                timeoutRef.current = setTimeout(
                  () => setIsSettingsOpen(false),
                  300,
                )
              }}
            >
              <div className='relative'>
                <button
                  onMouseEnter={() => {
                    if (timeoutRef.current) clearTimeout(timeoutRef.current)
                  }}
                  aria-label={t('common.settings', 'ตั้งค่า')}
                  className='flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer outline-none'
                >
                  <Settings size={20} />
                </button>
                <div
                  onMouseEnter={() => {
                    if (timeoutRef.current) clearTimeout(timeoutRef.current)
                  }}
                  className={`absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transition-all duration-200 ${isSettingsOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
                >
                  {/* Font Size */}
                  <div className='px-5 pt-4 pb-3'>
                    <h4 className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-3'>
                      {t('common.fontSize', 'ขนาดตัวอักษร')}
                    </h4>
                    <div className='flex items-center justify-between gap-3'>
                      {(['small', 'medium', 'large'] as const).map((size) => {
                        const labels = { small: 'A-', medium: 'A', large: 'A+' }
                        return (
                          <button
                            key={size}
                            onClick={() => setFontSize(size)}
                            className={`relative shrink-0 w-[48px] h-[48px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer outline-none ${fontSize === size ? 'bg-slate-800 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                          >
                            <span
                              className={`font-bold ${size === 'small' ? 'text-sm' : size === 'medium' ? 'text-base' : 'text-lg'}`}
                            >
                              {labels[size]}
                            </span>
                            {size === 'medium' && (
                              <span className='absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center'>
                                +
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account */}
            <div className='hidden md:flex items-center' ref={accountRef}>
              {isLoggedIn ? (
                <div className='relative'>
                  <button
                    onClick={() => setIsAccountOpen(!isAccountOpen)}
                    aria-label={t('nav.accountMenu', 'เมนูบัญชี')}
                    className='flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer outline-none'
                  >
                    <User size={20} />
                    <span
                      className={`text-[10px] transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`}
                    >
                      ▼
                    </span>
                  </button>
                  <div
                    className={`absolute right-0 top-full mt-3 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-200 ${isAccountOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
                  >
                    <Link
                      to='/dashboard'
                      onClick={() => setIsAccountOpen(false)}
                      className='flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors'
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
                          d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                        />
                      </svg>
                      {t('nav.dashboard')}
                    </Link>
                    <div className='h-px bg-slate-100' />
                    <button
                      onClick={handleLogoutClick}
                      className='flex items-center gap-2.5 w-full px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer outline-none'
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
                          d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                        />
                      </svg>
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to='/login'
                  aria-label={t('nav.login')}
                  className='text-slate-600 hover:text-blue-600 transition-colors'
                >
                  <User size={20} />
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className='md:hidden flex items-center ml-4'>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className='p-2 text-slate-700 focus:outline-none'
                aria-label='Toggle Mobile Menu'
              >
                {isMobileMenuOpen ? (
                  <svg
                    className='w-6 h-6'
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
                ) : (
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 6h16M4 12h16M4 18h16'
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* About Dropdown Desktop */}
        <div
          className={`hidden md:grid absolute top-full left-0 w-full backdrop-blur-md bg-white/95 shadow-xl border-t border-slate-100 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${activeMenu === 'about' ? 'grid-rows-[1fr] opacity-100 pointer-events-auto' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}
        >
          <div className='overflow-hidden'>
            <div className='max-w-7xl mx-auto p-8 grid grid-cols-3 gap-8'>
              <div>
                <h3 className='text-slate-400 font-bold mb-4 text-xs tracking-wider uppercase'>
                  {t('nav.aboutHistory', 'ประวัติของหน่วยงาน')}
                </h3>
                <ul className='space-y-3 text-sm text-slate-700 font-medium'>
                  <li>
                    <Link
                      to='#'
                      className='hover:text-blue-600 transition-colors'
                    >
                      {t('nav.aboutHistoryDetail', 'ประวัติ')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to='#'
                      className='hover:text-blue-600 transition-colors'
                    >
                      {t('nav.aboutDuty', 'หน้าที่และอำนาจ')}
                    </Link>
                  </li>
                </ul>
              </div>
              <div className='border-l border-slate-100 pl-8'>
                <h3 className='text-slate-400 font-bold mb-4 text-xs tracking-wider uppercase'>
                  {t('nav.prActivities', 'ประชาสัมพันธ์/กิจกรรม')}
                </h3>
                <ul className='space-y-3 text-sm text-slate-700 font-medium'>
                  <li>
                    <Link
                      to='/advertise'
                      className='hover:text-blue-600 transition-colors'
                    >
                      {t('nav.pr')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to='/news'
                      className='hover:text-blue-600 transition-colors'
                    >
                      {t('nav.news')}
                    </Link>
                  </li>
                </ul>
              </div>
              <div className='border-l border-slate-100 pl-8'>
                <h3 className='text-slate-400 font-bold mb-4 text-xs tracking-wider uppercase'>
                  {t('nav.departmentStructure', 'โครงสร้างหน่วยงาน')}
                </h3>
                <ul className='space-y-3 text-sm text-slate-700 font-medium'>
                  {departmentList.map((dept) => (
                    <li key={dept.id}>
                      <Link
                        to={`/department/${dept.id}`}
                        className='hover:text-blue-600 transition-colors'
                      >
                        {dept.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Fullscreen Menu */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-white transition-transform duration-300 ease-in-out pt-20 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className='h-full overflow-y-auto px-6 py-8 pb-24'>
          <ul className='flex flex-col gap-6 text-lg font-bold text-slate-800'>
            <li className='border-b border-slate-100 pb-4'>
              <Link to='/' onClick={handleCloseMobileMenu}>
                {t('nav.home')}
              </Link>
            </li>
            <li className='border-b border-slate-100 pb-4'>
              <button
                onClick={() => toggleMobileSubmenu('about')}
                className='w-full flex justify-between items-center text-left'
              >
                {t('nav.about')}
                <span
                  className={`transform transition-transform duration-300 text-sm ${mobileExpandedMenu === 'about' ? 'rotate-180' : ''}`}
                >
                  ▼
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${mobileExpandedMenu === 'about' ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
              >
                <div className='pl-4 border-l-2 border-blue-600 space-y-6'>
                  <div>
                    <h3 className='text-slate-400 text-xs uppercase mb-2'>
                      {t('nav.aboutHistory', 'ประวัติของหน่วยงาน')}
                    </h3>
                    <ul className='space-y-3 text-sm font-medium text-slate-600'>
                      <li>
                        <Link
                          to='#'
                          onClick={handleCloseMobileMenu}
                          className='hover:text-sky-500 transition-colors'
                        >
                          {t('nav.aboutHistoryDetail', 'ประวัติ')}
                        </Link>
                      </li>
                      <li>
                        <Link
                          to='#'
                          onClick={handleCloseMobileMenu}
                          className='hover:text-sky-500 transition-colors'
                        >
                          {t('nav.aboutDuty', 'หน้าที่และอำนาจ')}
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className='text-slate-400 text-xs uppercase mb-2'>
                      {t('nav.prActivities', 'ประชาสัมพันธ์/กิจกรรม')}
                    </h3>
                    <ul className='space-y-3 text-sm font-medium text-slate-600'>
                      <li>
                        <Link
                          to='/advertise'
                          onClick={handleCloseMobileMenu}
                          className='hover:text-sky-500 transition-colors'
                        >
                          {t('nav.pr')}
                        </Link>
                      </li>
                      <li>
                        <Link
                          to='/news'
                          onClick={handleCloseMobileMenu}
                          className='hover:text-sky-500 transition-colors'
                        >
                          {t('nav.news')}
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className='text-slate-400 text-xs uppercase mb-2'>
                      {t('nav.departmentStructure', 'โครงสร้างหน่วยงาน')}
                    </h3>
                    <ul className='space-y-3 text-sm font-medium text-slate-600'>
                      {departmentList.map((dept) => (
                        <li key={dept.id}>
                          <Link
                            to={`/department/${dept.id}`}
                            onClick={handleCloseMobileMenu}
                            className='hover:text-sky-500 transition-colors'
                          >
                            {dept.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </li>
            <li className='border-b border-slate-100 pb-4'>
              <Link to='/contactform' onClick={handleCloseMobileMenu}>
                {t('nav.contact')}
              </Link>
            </li>
            <li className='pt-4 border-t border-slate-100'>
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => toggleMobileSubmenu('account')}
                    className='w-full flex justify-between items-center text-left text-slate-800'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='bg-blue-100 p-2 rounded-full text-blue-600'>
                        <User size={20} />
                      </div>
                      <span className='font-bold'>
                        {t('nav.accountManage', 'จัดการบัญชีระบบ')}
                      </span>
                    </div>
                    <span
                      className={`transform transition-transform duration-300 text-sm ${mobileExpandedMenu === 'account' ? 'rotate-180' : ''}`}
                    >
                      ▼
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${mobileExpandedMenu === 'account' ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
                  >
                    <div className='pl-4 border-l-2 border-blue-600 space-y-3'>
                      <Link
                        to='/dashboard'
                        onClick={handleCloseMobileMenu}
                        className='flex items-center justify-center w-full py-3.5 bg-blue-600 text-white rounded-xl shadow-md transition-colors font-bold text-base'
                      >
                        {t('nav.dashboard')}
                      </Link>
                      <button
                        onClick={handleLogoutClick}
                        className='flex items-center justify-center w-full py-3 bg-slate-100 text-red-500 hover:bg-red-50 border border-slate-200 rounded-xl transition-colors font-bold text-base outline-none'
                      >
                        {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  to='/login'
                  onClick={handleCloseMobileMenu}
                  className='block w-full py-3.5 bg-slate-900 text-white text-center rounded-xl shadow-md transition-colors font-bold text-lg'
                >
                  {t('nav.login')}
                </Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
