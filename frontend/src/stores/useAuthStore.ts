import { create } from 'zustand'
import { authService } from '../services/authService'
import type { UserProfile } from '../type'
import { swal } from '../utils/swalConfig'

interface AuthState {
  // --- States ---
  user: UserProfile | null
  isLoggedIn: boolean
  isLoading: boolean
  isLoggingOut: boolean // NEW: Flag to block ProtectedRoute during logout
  error: string | null

  // --- Role Checking Helpers ---
  isAdmin: () => boolean
  isSupervisor: () => boolean // NEW: Check if user is SUPERVISOR
  canAccessSupervisorFeatures: () => boolean // NEW: Only SUPERVISOR can access
  canAccessAdminFeatures: () => boolean // NEW: ADMIN or SUPERVISOR can access

  // --- Actions ---
  setLoggedIn: (status: boolean) => void
  verifyUser: () => Promise<void>
  loginUser: (payload: Record<string, unknown>) => Promise<boolean>
  logoutUser: () => Promise<void>
  initIdleTimeout: (idleTimeMs?: number) => () => void
  startHeartbeat: () => () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // =========================================================================
  // INITIAL STATES & SETTERS
  // =========================================================================
  setLoggedIn: (status: boolean) => set({ isLoggedIn: status }),
  user: null,
  isLoggedIn: false,
  isLoading: true,
  isLoggingOut: false, // NEW
  error: null,

  /**
   * Check if current user has ADMIN role
   * @returns {boolean} true if user role is ADMIN
   */
  isAdmin: () => {
    const user = get().user
    return user?.role === 'ADMIN'
  },

  /**
   * NEW: Check if current user has SUPERVISOR role
   * @returns {boolean} true if user role is SUPERVISOR
   */
  isSupervisor: () => {
    const user = get().user
    return user?.role === 'SUPERVISOR'
  },

  /**
   * NEW: Check if current user can access Supervisor-only features
   * Only users with SUPERVISOR role can access these features
   * @returns {boolean} true only for SUPERVISOR
   */
  canAccessSupervisorFeatures: () => {
    const user = get().user
    return user?.role === 'SUPERVISOR'
  },

  /**
   * NEW: Check if current user can access Admin-level features
   * Both ADMIN and SUPERVISOR roles can access these features
   * @returns {boolean} true for ADMIN or SUPERVISOR
   */
  canAccessAdminFeatures: () => {
    const user = get().user
    return user?.role === 'ADMIN' || user?.role === 'SUPERVISOR'
  },

  // =========================================================================
  // AUTHENTICATION ACTIONS
  // =========================================================================

  /**
   * Verify current user session with backend
   * Checks if the stored cookie/token is still valid
   */
  verifyUser: async () => {
    set({ isLoading: true })
    try {
      const response = (await authService.getMe()) as {
        success: boolean
        user?: UserProfile
      }

      if (response.success && response.user) {
        set({ isLoggedIn: true, user: response.user })
      } else {
        set({ isLoggedIn: false, user: null })
      }
    } catch {
      set({ isLoggedIn: false, user: null })
    } finally {
      set({ isLoading: false })
    }
  },

  /**
   * Authenticate user with email and password
   * @param credentials - Object containing email and password
   * @returns {Promise<boolean>} true if login successful
   */
  loginUser: async (credentials) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.login(credentials)

      if (response.success) {
        if (response.user) {
          set({ user: response.user, isLoggedIn: true, error: null })
        } else {
          await get().verifyUser()
        }
        return true
      }

      set({ error: response.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
      return false
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      set({ error: errorMessage })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  /**
   * Logout user and clear all sessions
   * Clears client storage, invalidates backend session, and redirects to login
   */
  logoutUser: async () => {
    // 0. ยก Flag ป้องกัน ProtectedRoute redirect ซ้ำ
    set({ isLoggingOut: true })

    // 1. Clear local state และ session
    authService.clearLocalSession()

    // 2. Fire-and-forget API call (ไม่รอ response)
    authService.logout().catch(() => {})

    // 3. Clear state และ redirect ไปหน้า login ทันที พร้อม query param ให้ LoginPage แสดง toast
    set({ user: null, isLoggedIn: false, isLoading: false })
    window.location.href = '/login?logout=success'
  },

  // =========================================================================
  // SECURITY & AUTOMATION ACTIONS
  // =========================================================================

  /**
   * Start heartbeat interval to keep session alive
   * Sends POST /auth/heartbeat every 5 minutes to update recentOnline timestamp
   * @returns {() => void} Cleanup function to clear interval
   */
  startHeartbeat: () => {
    const INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

    // Send initial ping immediately
    authService.ping()

    const intervalId = setInterval(() => {
      // Only ping if still logged in
      if (get().isLoggedIn) {
        authService.ping()
      } else {
        clearInterval(intervalId)
      }
    }, INTERVAL_MS)

    return () => clearInterval(intervalId)
  },

  /**
   * Initialize idle timeout monitoring
   * Automatically logs out user after period of inactivity
   * Shows warning 60 seconds before logout
   * @param idleTimeMs - Time in milliseconds before logout (default: 15 minutes)
   * @returns {() => void} Cleanup function to remove event listeners
   */
  initIdleTimeout: (idleTimeMs = 15 * 60 * 1000) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let warningId: ReturnType<typeof setTimeout> | null = null
    let isWarningOpen = false
    const warningTimeMs = 60 * 1000 // Show warning 60 seconds before logout

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (warningId) clearTimeout(warningId)

      if (swal.isVisible() && isWarningOpen) {
        swal.close()
        isWarningOpen = false
      }

      // 1. Schedule warning dialog before session expires
      warningId = setTimeout(
        () => {
          let timerInterval: ReturnType<typeof setInterval>
          isWarningOpen = true

          swal
            .fire({
              title: 'เซสชันของคุณกำลังจะหมดอายุ',
              html: 'ระบบจะออกจากระบบอัตโนมัติใน <b></b> วินาที เนื่องจากไม่มีการใช้งาน',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'ฉันยังใช้งานอยู่',
              cancelButtonText: 'ออกจากระบบ',
              confirmButtonColor: '#3b82f6',
              cancelButtonColor: '#ef4444',
              timer: warningTimeMs,
              timerProgressBar: true,
              allowOutsideClick: false,
              didOpen: () => {
                const b = swal.getHtmlContainer()?.querySelector('b')
                timerInterval = setInterval(() => {
                  if (b) {
                    const timeLeft = swal.getTimerLeft()
                    b.textContent = timeLeft
                      ? Math.ceil(timeLeft / 1000).toString()
                      : '0'
                  }
                }, 100)
              },
              willClose: () => {
                clearInterval(timerInterval)
                isWarningOpen = false
              },
            })
            .then((result) => {
              if (result.isConfirmed) {
                resetTimer() // User is active, reset timer
              } else if (
                result.dismiss === swal.DismissReason.timer ||
                result.isDismissed
              ) {
                get().logoutUser() // Timeout or user cancelled -> logout
              }
            })
        },
        Math.max(0, idleTimeMs - warningTimeMs),
      )

      // 2. Schedule forced logout after full idle time
      timeoutId = setTimeout(() => {
        swal.close()
        get().logoutUser()
      }, idleTimeMs)
    }

    // Track user activity events
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
    ]
    const handleEvent = () => resetTimer()

    events.forEach((event) => document.addEventListener(event, handleEvent))
    resetTimer()

    // Return cleanup function to remove event listeners
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (warningId) clearTimeout(warningId)
      events.forEach((event) =>
        document.removeEventListener(event, handleEvent),
      )
    }
  },
}))
