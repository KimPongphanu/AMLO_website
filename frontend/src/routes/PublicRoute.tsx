import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore' // ปรับเปลี่ยน Path ตามโครงสร้างโปรเจกต์จริง

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const user = useAuthStore((state) => state.user)

  // 2. หากระบวนการโหลดเสร็จแล้วพบว่าไม่มี Session หรือ Token ถูกลบ/หมดอายุ ค่อยส่งกลับหน้า Login
  if (isLoggedIn && user) {
    return <Navigate to='/dashboard' replace />
  }

  return <>{children}</>
}
export default PublicRoute
