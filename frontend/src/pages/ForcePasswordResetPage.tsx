// src/pages/ForcePasswordResetPage.tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OtpInput from '../components/common/OtpInput'
import { useAuthStore } from '../stores/useAuthStore'
import { api } from '../utils/api'
import { toast } from '../utils/swalConfig'

const OTP_EXPIRE_SECONDS = 5 * 60 // 5 minutes

const ForcePasswordResetPage = () => {
  const navigate = useNavigate()
  const logoutUser = useAuthStore((state) => state.logoutUser)
  const user = useAuthStore((state) => state.user)

  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(true)
  const [error, setError] = useState('')
  const [otpTimer, setOtpTimer] = useState(OTP_EXPIRE_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Redirect if not logged in or no forcePasswordReset
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
  }, [user, navigate])

  // Send OTP on mount
  useEffect(() => {
    sendOtpOnMount()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer <= 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [otpTimer])

  const sendOtpOnMount = async () => {
    setIsSendingOtp(true)
    setError('')
    try {
      const res = await api<{ success: boolean; expiresInMinutes: number }>(
        '/auth/force-reset/send-otp',
        { method: 'POST' },
      )
      if (res.success) {
        setOtpTimer(res.expiresInMinutes * 60)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      setError(msg)
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    setOtp('')
    setError('')
    setOtpTimer(OTP_EXPIRE_SECONDS)
    setIsSendingOtp(true)
    try {
      const res = await api<{ success: boolean; expiresInMinutes: number }>(
        '/auth/force-reset/resend-otp',
        { method: 'POST' },
      )
      if (res.success) {
        setOtpTimer(res.expiresInMinutes * 60)
        await toast.fire({
          icon: 'success',
          title: 'ส่ง OTP ใหม่แล้ว',
          text: 'กรุณาตรวจสอบอีเมลของคุณ',
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      setError(msg)
    } finally {
      setIsSendingOtp(false)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!otp.trim()) {
      setError('กรุณากรอกรหัส OTP')
      return
    }
    if (!newPassword.trim()) {
      setError('กรุณากรอกรหัสผ่านใหม่')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      setError(
        'รหัสผ่านต้องมีอย่างน้อย 8 ตัว ประกอบด้วยตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และสามารถใช้ Special characters',
      )
      return
    }

    setIsLoading(true)

    try {
      const res = await api<{ success: boolean; message: string }>(
        '/auth/force-reset/verify',
        {
          method: 'POST',
          body: { otp, newPassword },
        },
      )

      if (res.success) {
        await toast.fire({
          icon: 'success',
          title: 'ตั้งรหัสผ่านใหม่สำเร็จ',
          text: 'กรุณาเข้าสู่ระบบอีกครั้งด้วยรหัสผ่านใหม่',
        })
        // Logout to force re-login with new password
        await logoutUser()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className='fixed inset-0 bg-slate-50 flex items-center justify-center overflow-hidden font-sans'>
      <div className='relative z-30 w-[460px] px-12 py-10 bg-white border border-slate-200 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.08),0_10px_10px_-5px_rgba(0,0,0,0.03)] rounded-2xl'>
        <div className='flex flex-col items-center text-center mb-6'>
          <img
            src='/Logo.png'
            alt='โลโก้ ปปง.'
            className='w-20 h-20 object-contain mb-4 mx-auto'
          />
          <h1 className='text-2xl font-bold text-slate-800 m-0 mb-1.5'>
            บังคับเปลี่ยนรหัสผ่าน
          </h1>
          <p className='text-sm text-slate-500 m-0'>
            ผู้ดูแลระบบได้กำหนดให้คุณต้องเปลี่ยนรหัสผ่านก่อนเข้าใช้งาน
          </p>
        </div>

        {/* Warning Banner */}
        <div className='bg-amber-50 border border-amber-200 rounded-md p-3 mb-4'>
          <p className='text-sm text-amber-700 text-center'>
            ระบบได้ส่งรหัส OTP ไปยังอีเมล <strong>{user.email}</strong> แล้ว
            กรุณาตรวจสอบอีเมลและกรอกรหัส OTP เพื่อตั้งรหัสผ่านใหม่
          </p>
        </div>

        {/* OTP Timer */}
        <div className='text-center mb-4'>
          {otpTimer > 0 ? (
            <span className='text-sm font-medium text-slate-600'>
              รหัส OTP หมดอายุใน{' '}
              <span className='text-red-500 font-bold'>
                {formatTime(otpTimer)}
              </span>
            </span>
          ) : (
            <span className='text-sm font-medium text-red-500'>
              รหัส OTP หมดอายุแล้ว กรุณาขอใหม่
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col w-full'>
          {/* OTP Field */}
          <div className='mb-4'>
            <label
              htmlFor='otp'
              className='block text-xs font-bold tracking-[0.07em] uppercase text-slate-500 mb-2'
            >
              รหัส OTP
            </label>
            <OtpInput
              value={otp}
              onChange={(val) => {
                setOtp(val)
                setError('')
              }}
              disabled={isLoading || isSendingOtp}
              error={error}
            />
          </div>

          {/* New Password Field */}
          <div className='mb-4'>
            <label
              htmlFor='newPassword'
              className='block text-xs font-bold tracking-[0.07em] uppercase text-slate-500 mb-2'
            >
              รหัสผ่านใหม่
            </label>
            <input
              id='newPassword'
              type='password'
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                setError('')
              }}
              placeholder='••••••••'
              autoComplete='new-password'
              disabled={isLoading}
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 text-base outline-none transition-colors ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
            />
          </div>

          {/* Confirm Password Field */}
          <div className='mb-4'>
            <label
              htmlFor='confirmPassword'
              className='block text-xs font-bold tracking-[0.07em] uppercase text-slate-500 mb-2'
            >
              ยืนยันรหัสผ่านใหม่
            </label>
            <input
              id='confirmPassword'
              type='password'
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setError('')
              }}
              placeholder='••••••••'
              autoComplete='new-password'
              disabled={isLoading}
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 text-base outline-none transition-colors ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
            />
          </div>

          {error && (
            <p className='text-[13px] text-red-500 font-bold text-center -mt-2 mb-3'>
              {error}
            </p>
          )}

          <button
            type='submit'
            disabled={isLoading || isSendingOtp || otpTimer <= 0}
            className={`w-full py-3.5 rounded-xl text-white text-lg font-bold transition-colors ${
              isLoading || isSendingOtp || otpTimer <= 0
                ? 'bg-blue-600/50 cursor-not-allowed'
                : 'bg-[#185FA5] hover:bg-[#134b82] cursor-pointer'
            }`}
          >
            {isLoading
              ? 'กำลังเปลี่ยนรหัสผ่าน...'
              : isSendingOtp
                ? 'กำลังส่ง OTP...'
                : 'เปลี่ยนรหัสผ่าน'}
          </button>
        </form>

        {/* Resend OTP Button */}
        <div className='mt-4 text-center'>
          <button
            type='button'
            onClick={handleResendOtp}
            disabled={isSendingOtp}
            className='text-sm text-[#185FA5] hover:text-[#134b82] hover:underline font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSendingOtp ? 'กำลังส่ง OTP...' : 'ขอรหัส OTP ใหม่'}
          </button>
        </div>

        <p className='mt-6 text-center text-xs text-slate-400 font-medium'>
          สำนักงานป้องกันและปราบปรามการฟอกเงิน
        </p>
      </div>
    </div>
  )
}

export default ForcePasswordResetPage
