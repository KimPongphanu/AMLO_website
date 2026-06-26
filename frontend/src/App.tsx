import { Suspense, lazy, useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import ScrollToTop from './pages/ScrollToTop'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicRoute from './routes/PublicRoute'
import { useAuthStore } from './stores/useAuthStore'
import { useSiteStore } from './stores/useSiteStore'
import { initGA, logPageView } from './utils/analytics'

const Home = lazy(() => import('./pages/homePage'))
const HomeV2 = lazy(() => import('./pages/homePage2'))
const MainLayout = lazy(() => import('./components/layout/MainLayout'))
const NewsDetailPage = lazy(() => import('./pages/NewsDetailPage'))
const DepartmentDetailPage = lazy(() => import('./pages/DepartDetailPage'))
const Advertise = lazy(() => import('./pages/Advertise'))
const AdvertiseDetail = lazy(() => import('./pages/Advertisedetail'))
const News = lazy(() => import('./pages/News'))
const BookGuidePage = lazy(() => import('./pages/BookGuidePage'))
const Login = lazy(() => import('./pages/LoginPage'))
const CommentForm = lazy(() => import('./components/CommentForm'))
const ContactForm = lazy(() => import('./components/ContactForm'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const TwoFactorChallenge = lazy(() => import('./pages/TwoFactorChallenge'))
const TwoFactorSetup = lazy(() => import('./pages/TwoFactorSetup'))
const SupervisorRequests = lazy(() => import('./pages/SupervisorRequests'))
const ForcePasswordResetPage = lazy(
  () => import('./pages/ForcePasswordResetPage'),
)

function App() {
  const location = useLocation()
  const verifyUser = useAuthStore((state) => state.verifyUser)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Sync font size to <html> element (CSS variable approach)
  const fontSize = useSiteStore((state) => state.fontSize)
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('font-small', 'font-medium', 'font-large')
    if (fontSize === 'small') root.classList.add('font-small')
    else if (fontSize === 'large') root.classList.add('font-large')
    else root.classList.add('font-medium')
  }, [fontSize])

  // 1. รันระบบ GA4 ครั้งแรกครั้งเดียวตอนเปิดเว็บ
  useEffect(() => {
    initGA()
  }, [])

  // 2. ส่งสถิติ Pageview ไปหา Google ทุกครั้งที่ URL (pathname) เปลี่ยนแปลง
  useEffect(() => {
    logPageView(location.pathname)
  }, [location.pathname])

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 🌟 ถ้าเพิ่ง logout — ข้าม verifyUser ให้ LoginPage จัดการ toast แทน
        if (window.location.search.includes('logout=success')) {
          setIsCheckingAuth(false)
          return
        }
        await verifyUser()
      } catch (err) {
        console.error(err)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    initAuth()
  }, [verifyUser])

  if (isCheckingAuth) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-slate-50'>
        <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  return (
    <>
      <ScrollToTop />
      <Suspense
        fallback={
          <div className='flex items-center justify-center min-h-screen bg-slate-50'>
            <h2 className='text-xl font-bold text-blue-600 animate-pulse'>
              กำลังโหลดข้อมูล...
            </h2>
          </div>
        }
      >
        <Routes>
          <Route element={<MainLayout />}>
            <Route path='/' element={<Home />} />
            <Route path='/v2' element={<HomeV2 />} />
            <Route path='/news' element={<News />} />
            <Route path='/news/:id' element={<NewsDetailPage />} />
            <Route path='/department/:id' element={<DepartmentDetailPage />} />
            <Route path='/advertise' element={<Advertise />} />
            <Route path='/advertise/:id' element={<AdvertiseDetail />} />
            <Route path='/bookguide' element={<BookGuidePage />} />
            <Route path='/commentform' element={<CommentForm />} />
            <Route path='/contactform' element={<ContactForm />} />

            <Route
              path='/login'
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
          </Route>

          <Route
            path='/dashboard'
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path='/2fa-challenge' element={<TwoFactorChallenge />} />
          <Route
            path='/2fa-setup'
            element={
              <ProtectedRoute allowedRoles={['SUPERVISOR']}>
                <TwoFactorSetup />
              </ProtectedRoute>
            }
          />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route
            path='/force-password-reset'
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR', 'USER']}>
                <ForcePasswordResetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/supervisor-requests'
            element={
              <ProtectedRoute allowedRoles={['SUPERVISOR']}>
                <SupervisorRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path='*'
            element={
              <div className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-black to-white-500 text-white'>
                <h1 className='text-4xl font-bold'>404 - ไม่พบหน้านี้</h1>
                <Link to='/' className='cursor-pointer mt-6'>
                  <div className='bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors'>
                    <h2>หน้าหลัก</h2>
                  </div>
                </Link>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
