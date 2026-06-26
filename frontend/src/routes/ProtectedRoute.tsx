// src/routes/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  // เพิ่ม SUPERVISOR เข้าไปใน type
  allowedRoles?: ('USER' | 'ADMIN' | 'SUPERVISOR')[]
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  // 🌟 ถ้ากำลัง Logout อยู่ — รอ Hard Redirect อย่างเดียว ไม่ Navigate ซ้ำ
  if (isLoggingOut) {
    return null
  }

  console.log('[ProtectedRoute] isLoggedIn:', isLoggedIn)
  console.log('[ProtectedRoute] user:', user)
  console.log('[ProtectedRoute] allowedRoles:', allowedRoles)

  if (!isLoggedIn || !user) {
    console.log('[ProtectedRoute] Not logged in, redirect to /login')
    return <Navigate to='/login' replace />
  }

  // If user is forced to reset password, redirect to force-password-reset
  // unless they are already on that page
  if (
    user.forcePasswordReset &&
    location.pathname !== '/force-password-reset'
  ) {
    console.log('[ProtectedRoute] Force password reset required, redirecting')
    return <Navigate to='/force-password-reset' replace />
  }

  // 🌟 NEW: Force SUPERVISOR to enable 2FA before accessing any protected page
  if (
    user.role === 'SUPERVISOR' &&
    !user.twoFactorEnabled &&
    location.pathname !== '/2fa-setup'
  ) {
    console.log('[ProtectedRoute] SUPERVISOR must setup 2FA, redirecting')
    return <Navigate to='/2fa-setup' replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role
    const hasAllowedRole = allowedRoles.some((role) => {
      const match = role === userRole
      console.log(
        `[ProtectedRoute] Comparing: "${role}" === "${userRole}" => ${match}`,
      )
      return match
    })

    console.log(
      '[ProtectedRoute] user.role:',
      user.role,
      'typeof:',
      typeof user.role,
    )
    console.log('[ProtectedRoute] allowedRoles:', allowedRoles)
    console.log('[ProtectedRoute] hasAllowedRole:', hasAllowedRole)

    if (!hasAllowedRole) {
      console.log('[ProtectedRoute] Role not allowed, redirect to /')
      return <Navigate to='/' replace />
    }
  }

  console.log('[ProtectedRoute] Access granted')
  return <>{children}</>
}

export default ProtectedRoute
