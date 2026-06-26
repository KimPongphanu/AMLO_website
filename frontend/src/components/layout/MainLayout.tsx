// src/pages/MainLayout.tsx
import { Outlet } from 'react-router-dom'

import CommentForm from '../CommentForm'
import CookieConsent from '../CookieConsent'
import ScrollToTopButton from '../ScrollToTopButton'
import Footer from './Footer'
import Nav from './Nav'

const MainLayout = () => {
  return (
    <div className='min-h-screen w-full relative flex flex-col'>
      <Nav />

      <main className='flex-grow'>
        <Outlet />
      </main>
      <Footer />

      {/* 🌟 3. แสดงปุ่ม CommentForm ตลอดเวลาสำหรับผู้ใช้งานทั่วไป (Public Feedback) */}
      <CommentForm />

      <ScrollToTopButton />
      <CookieConsent />
    </div>
  )
}

export default MainLayout
