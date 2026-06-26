// src/pages/DashboardPage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react'

import AuditLogDashboard from '../components/dashboard/AuditLogDashboard'
import BackupDashboard from '../components/dashboard/BackupDashboard'
import BannerManagerDashboard from '../components/dashboard/BannerManagerDashboard'
import ContactRequestManager from '../components/dashboard/ContactRequestManager'
import DepartmentManagerDashboard from '../components/dashboard/department/DepartmentManagerDashboard'
import FooterManagerDashboard from '../components/dashboard/FooterManagerDashboard'
import NavBar from '../components/dashboard/NavBarComponent'
import NewsManagerDashboard from '../components/dashboard/NewsManagerDashboard'
import OverviewDashboard from '../components/dashboard/OverviewDashboard'
import PRManagerDashboard from '../components/dashboard/PRManagerDashboard'
import ProfileDashboard from '../components/dashboard/ProfileDashboard'
import ReviewManager from '../components/dashboard/ReviewManager'
import SplashPopupManager from '../components/dashboard/SplashPopupManager'
import UserManagerDashboard from '../components/dashboard/userManager/UserManagerDashboard'
import { useAuthStore } from '../stores/useAuthStore'
import SupervisorRequests from './SupervisorRequests'

type MenuId =
  | 'overview'
  | 'profile'
  | 'data-clean'
  | 'settings'
  | 'reviews'
  | 'contacts'
  | 'advertises'
  | 'user-manage'
  | 'news'
  | 'departments'
  | 'slider'
  | 'footer-settings'
  | 'splash-popup'
  | 'requests'
  | 'audit-logs'
  | 'backup'

// ---------------------------------------------------------
// Mockup Components
// ---------------------------------------------------------

const DataCleansingComponent = () => (
  <div className='bg-slate-50 border border-slate-200 p-6'>
    <h2 className='text-xl font-bold mb-4'>จัดการและทำความสะอาดข้อมูล</h2>
    <p className='text-slate-600'>ตารางข้อมูลธุรกรรม...</p>
  </div>
)

// ---------------------------------------------------------
// Menu Category Types
// ---------------------------------------------------------
interface MenuCategory {
  title: string
  icon: string
  supervisorOnly?: boolean
  items: { id: MenuId; label: string; icon: string }[]
}

const allCategories: MenuCategory[] = [
  {
    title: 'ภาพรวม',
    icon: 'fa-chart-pie',
    items: [
      { id: 'overview', label: 'ภาพรวมระบบ', icon: 'fa-chart-bar' },
      { id: 'profile', label: 'ข้อมูลส่วนตัว', icon: 'fa-user-circle' },
    ],
  },
  {
    title: 'จัดการเนื้อหา',
    icon: 'fa-edit',
    items: [
      { id: 'news', label: 'กิจกรรมและประกาศ', icon: 'fa-newspaper' },
      { id: 'advertises', label: 'ประชาสัมพันธ์', icon: 'fa-bullhorn' },
      { id: 'departments', label: 'จัดการหน่วยงาน', icon: 'fa-building' },
      { id: 'slider', label: 'Banner หน้าหลัก', icon: 'fa-image' },
      { id: 'footer-settings', label: 'จัดการ Footer', icon: 'fa-copyright' },
      {
        id: 'splash-popup',
        label: 'Popup เปิดหน้า',
        icon: 'fa-window-maximize',
      },
      { id: 'reviews', label: 'รีวิว/ความคิดเห็น', icon: 'fa-star' },
      { id: 'contacts', label: 'การติดต่อ', icon: 'fa-envelope' },
    ],
  },
  {
    title: 'ระบบ',
    icon: 'fa-cogs',
    supervisorOnly: true,
    items: [
      { id: 'user-manage', label: 'จัดการสมาชิก', icon: 'fa-users-cog' },
      { id: 'requests', label: 'คำร้อง', icon: 'fa-file-alt' },
      { id: 'audit-logs', label: 'Audit Logs', icon: 'fa-history' },
      { id: 'backup', label: 'Backup', icon: 'fa-database' },
      { id: 'settings', label: 'ตั้งค่าระบบ', icon: 'fa-cog' },
    ],
  },
]

// ---------------------------------------------------------
// Sidebar Component
// ---------------------------------------------------------
type SideBarProps = {
  activeMenu: MenuId
  setActiveMenu: (id: MenuId) => void
  isMobileOpen: boolean
  categories: MenuCategory[]
  pendingCount: number
}

const SideBar = ({
  activeMenu,
  setActiveMenu,
  isMobileOpen,
  categories,
  pendingCount,
}: SideBarProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    categories.forEach((cat) => {
      initial[cat.title] = true
    })
    return initial
  })

  const toggleCategory = (title: string) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <aside
      className={`bg-white border-r border-slate-200 w-64 min-h-[calc(100vh-5rem)] absolute md:static top-0 left-0 z-10 transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      <nav className='p-3 flex flex-col gap-y-3'>
        {categories.map((cat) => {
          const isExpanded = expanded[cat.title] !== false
          return (
            <div key={cat.title}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat.title)}
                className='w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-100/80 hover:bg-gray-200 transition-colors cursor-pointer outline-none'
              >
                <div className='flex items-center gap-2.5'>
                  <i className={`fas ${cat.icon} text-gray-500 text-sm`} />
                  <p className='text-sm font-bold text-gray-600 uppercase tracking-wider'>
                    {cat.title}
                  </p>
                </div>
                <i
                  className={`fas fa-chevron-down text-gray-400 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                />
              </button>

              {/* Items */}
              <div
                className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-96 opacity-100 mt-0.5' : 'max-h-0 opacity-0'}`}
              >
                <div className='flex flex-col gap-y-0.5 pl-2'>
                  {cat.items.map((item) => {
                    const isActive = activeMenu === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveMenu(item.id)}
                        className={`w-full text-left px-4 py-3 text-base font-medium transition-all cursor-pointer outline-none rounded-xl flex items-center justify-between ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span className='flex items-center gap-3'>
                          <i
                            className={`fas ${item.icon} w-5 text-center text-sm ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                          />
                          {item.label}
                        </span>
                        {item.id === 'requests' && pendingCount > 0 && (
                          <span className='inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-bold text-white bg-red-500 rounded-full'>
                            {pendingCount}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

// ---------------------------------------------------------
// Dashboard Main Component
// ---------------------------------------------------------
const DashboardPage = () => {
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)

  const [activeMenu, setActiveMenu] = useState<MenuId>(() => {
    const savedMenu = sessionStorage.getItem('activeDashboardMenu')
    return (savedMenu as MenuId) || 'overview'
  })

  const user = useAuthStore((state) => state.user)
  const verifyUser = useAuthStore((state) => state.verifyUser)
  const logoutUser = useAuthStore((state) => state.logoutUser)
  const initIdleTimeout = useAuthStore((state) => state.initIdleTimeout)
  const startHeartbeat = useAuthStore((state) => state.startHeartbeat)
  const isSupervisor = useAuthStore((state) => state.isSupervisor)
  const canAccessSupervisorFeatures = useAuthStore(
    (state) => state.canAccessSupervisorFeatures,
  )

  const [isVerifyingAuth, setIsVerifyingAuth] = useState<boolean>(true)
  const [pendingCount, setPendingCount] = useState(0)

  // Fetch pending request count
  useEffect(() => {
    if (user?.role === 'SUPERVISOR') {
      import('../services/supervisorRequestService').then(
        ({ supervisorRequestService }) => {
          supervisorRequestService
            .getPending()
            .then((res) => {
              if (res.success) setPendingCount(res.data.length)
            })
            .catch(() => {})
        },
      )
    }
  }, [user])

  const filteredCategories = useMemo(() => {
    if (isSupervisor()) return allCategories
    return allCategories.filter((cat) => !cat.supervisorOnly)
  }, [isSupervisor])

  const canAccessMenu = useCallback(
    (menuId: MenuId): boolean => {
      if (isSupervisor()) return true
      const supervisorOnlyMenuIds: MenuId[] = [
        'settings',
        'user-manage',
        'requests',
        'audit-logs',
      ]
      return !supervisorOnlyMenuIds.includes(menuId)
    },
    [isSupervisor],
  )

  useEffect(() => {
    if (!canAccessMenu(activeMenu)) {
      setActiveMenu('overview')
      sessionStorage.setItem('activeDashboardMenu', 'overview')
    }
  }, [activeMenu, canAccessMenu])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!user) await verifyUser()
      } catch (error) {
        console.error('[Dashboard] Auth verification failed:', error)
      } finally {
        setIsVerifyingAuth(false)
      }
    }
    checkAuth()
  }, [user, verifyUser])

  const handleLogout = async () => {
    sessionStorage.removeItem('activeDashboardMenu')
    sessionStorage.removeItem('token')
    await logoutUser()
    window.location.href = '/login'
  }

  useEffect(() => {
    const cleanupIdleTimer = initIdleTimeout(
      15 * 60 * 1000,
    ) as unknown as () => void
    const cleanupHeartbeat = startHeartbeat()
    return () => {
      if (typeof cleanupIdleTimer === 'function') cleanupIdleTimer()
      cleanupHeartbeat()
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem('activeDashboardMenu', activeMenu)
  }, [activeMenu])

  if (isVerifyingAuth) {
    return (
      <div className='bg-slate-100 min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-600 font-medium'>
            กำลังตรวจสอบสิทธิ์เข้าใช้งาน...
          </p>
        </div>
      </div>
    )
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR')) {
    return (
      <div className='bg-slate-100 min-h-screen flex items-center justify-center'>
        <div className='bg-white rounded-2xl shadow-lg p-8 max-w-md text-center'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-8 h-8 text-red-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 15v2m0 0v2m0-2h2m-2 0H9m3-14v2m-5.7 2.3L4.93 4.93m14.14 14.14l-1.414-1.414M15 12a3 3 0 11-6 0 3 3 0 016 0z'
              />
            </svg>
          </div>
          <h2 className='text-xl font-bold text-slate-800 mb-2'>
            ไม่มีสิทธิ์เข้าถึง
          </h2>
          <p className='text-slate-500 mb-6'>
            คุณไม่มีสิทธิ์ในการเข้าถึง Dashboard นี้
          </p>
          <button
            onClick={() => (window.location.href = '/')}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    )
  }

  const renderMainContent = () => {
    switch (activeMenu) {
      case 'overview':
        return <OverviewDashboard />
      case 'profile':
        return <ProfileDashboard />
      case 'data-clean':
        return <DataCleansingComponent />
      case 'settings':
        if (!canAccessSupervisorFeatures())
          return (
            <div className='p-6 text-center text-red-600'>
              ไม่มีสิทธิ์เข้าถึง
            </div>
          )
        return (
          <div className='bg-slate-50 border border-slate-200 p-6'>
            <h2 className='text-xl font-bold mb-4'>ตั้งค่าระบบ (Settings)</h2>
          </div>
        )
      case 'user-manage':
        return user?.role === 'SUPERVISOR' ? (
          <UserManagerDashboard />
        ) : (
          <div className='p-6 text-center text-red-600'>ไม่มีสิทธิ์เข้าถึง</div>
        )
      case 'reviews':
        return <ReviewManager />
      case 'contacts':
        return <ContactRequestManager />
      case 'advertises':
        return <PRManagerDashboard />
      case 'news':
        return <NewsManagerDashboard />
      case 'departments':
        return <DepartmentManagerDashboard />
      case 'slider':
        return <BannerManagerDashboard />
      case 'footer-settings':
        return <FooterManagerDashboard />
      case 'splash-popup':
        return <SplashPopupManager />
      case 'requests':
        return <SupervisorRequests />
      case 'audit-logs':
        return <AuditLogDashboard />
      case 'backup':
        return user?.role === 'SUPERVISOR' ? (
          <BackupDashboard />
        ) : (
          <div className='p-6 text-center text-red-600'>ไม่มีสิทธิ์เข้าถึง</div>
        )
      default:
        return <div className='p-6'>อยู่ระหว่างการพัฒนา...</div>
    }
  }

  return (
    <div className='bg-slate-100 min-h-screen text-slate-800 font-sans'>
      {user.role === 'SUPERVISOR' && !user.twoFactorEnabled && (
        <div className='bg-red-500 text-white px-6 py-3 flex items-center justify-between'>
          <span className='font-medium'>
            ⚠️ คุณต้องตั้งค่า Two-Factor Authentication (2FA) ก่อนเข้าใช้งานระบบ
          </span>
          <button
            onClick={() => (window.location.href = '/2fa-setup')}
            className='bg-white text-red-600 px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-red-50 cursor-pointer'
          >
            ตั้งค่า 2FA ทันที
          </button>
        </div>
      )}
      <NavBar
        toggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
        onLogout={handleLogout}
      />
      <div className='flex relative'>
        <SideBar
          activeMenu={activeMenu}
          setActiveMenu={(id: MenuId) => {
            setActiveMenu(id)
            setIsMobileOpen(false)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          isMobileOpen={isMobileOpen}
          categories={filteredCategories}
          pendingCount={pendingCount}
        />
        <main className='flex-1 p-4 md:p-8 overflow-auto h-[calc(100vh-5rem)]'>
          <div className='max-w-7xl mx-auto'>{renderMainContent()}</div>
        </main>
        {isMobileOpen && (
          <div
            className='fixed inset-0 bg-black/20 z-0 md:hidden'
            onClick={() => setIsMobileOpen(false)}
          ></div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
