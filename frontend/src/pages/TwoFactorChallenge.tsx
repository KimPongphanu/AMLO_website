// src/pages/TwoFactorChallenge.tsx
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import OtpInput from '../components/common/OtpInput'
import { twoFactorService } from '../services/twoFactorService'
import { useAuthStore } from '../stores/useAuthStore'
import { swal, toast } from '../utils/swalConfig'

interface LocationState {
  email: string
  twoFactorMethod: 'AUTHENTICATOR' | 'EMAIL_OTP'
  uuid: string
}

const TwoFactorChallenge = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const [otpCode, setOtpCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [localError, setLocalError] = useState('')

  const verifyUser = useAuthStore((state) => state.verifyUser)

  // Redirect if no state (direct URL access)
  useEffect(() => {
    if (!state) {
      navigate('/login', { replace: true })
    }
  }, [])

  const handleVerify = async (e?: React.FormEvent | string) => {
    // Support direct OTP value from onComplete callback
    const code = typeof e === 'string' ? e : otpCode

    if (e && typeof e !== 'string') {
      e.preventDefault()
    }
    setLocalError('')
    setError('')

    if (!code || code.length < 6) {
      setLocalError('กรุณากรอกรหัส OTP 6 หลักให้ครบ')
      return
    }

    setIsLoading(true)

    try {
      const response = await twoFactorService.verify2FALogin(code)
      if (response.success) {
        await verifyUser()

        await toast.fire({
          icon: 'success',
          title: 'ยืนยันตัวตนสำเร็จ',
          text: 'กำลังนำคุณไปยังหน้า Dashboard',
        })

        useAuthStore.getState().setLoggedIn(true)
        navigate('/dashboard', { replace: true })
      } else {
        throw new Error(response.message || 'รหัส OTP ไม่ถูกต้อง')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      setError(msg)
      setOtpCode('') // Clear OTP field on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    const result = await swal.fire({
      icon: 'question',
      title: 'ยกเลิกการยืนยันตัวตน?',
      text: 'คุณจะถูกนำกลับไปยังหน้าเข้าสู่ระบบ',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ยืนยันยกเลิก',
      cancelButtonText: 'กลับไปยืนยันต่อ',
    })

    if (result.isConfirmed) {
      navigate('/login', { replace: true })
    }
  }

  if (!state) return null

  return (
    <div className='fixed inset-0 bg-slate-50 flex items-center justify-center overflow-hidden font-sans'>
      <div className='flex flex-col items-center'>
        {/* Logo */}
        <div className='mb-8'>
          <img
            src='/Logo.png'
            alt='โลโก้ ปปง.'
            className='w-24 h-24 object-contain'
          />
        </div>

        {/* Card */}
        <div className='w-[420px] px-12 py-10 bg-white border border-slate-200 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.08),0_10px_10px_-5px_rgba(0,0,0,0.03)] rounded-2xl'>
          {/* Header */}
          <div className='flex flex-col items-center text-center mb-8'>
            <h1 className='text-2xl font-bold text-slate-800 m-0'>
              ยืนยันตัวตน
            </h1>
            <p className='text-sm text-slate-500 mt-2 leading-relaxed'>
              กรุณากรอกรหัส 6 หลักจาก
              <br />
              Google Authenticator
            </p>
          </div>

          {/* OTP Input */}
          <form onSubmit={handleVerify} className='flex flex-col w-full'>
            <div className='mb-1'>
              <OtpInput
                value={otpCode}
                onChange={(val) => {
                  setOtpCode(val)
                  setLocalError('')
                  setError('')
                }}
                onComplete={(otp) => handleVerify(otp)}
                disabled={isLoading}
                error={error || localError}
              />
            </div>

            <button
              type='submit'
              disabled={isLoading || otpCode.length !== 6}
              className={`w-full py-3.5 rounded-xl text-white text-lg font-bold transition-colors mt-8 ${
                isLoading || otpCode.length !== 6
                  ? 'bg-blue-600/50 cursor-not-allowed'
                  : 'bg-[#185FA5] hover:bg-[#134b82] cursor-pointer'
              }`}
            >
              {isLoading ? 'กำลังยืนยัน...' : 'ยืนยัน'}
            </button>
          </form>

          {/* Cancel button */}
          <div className='mt-5 text-center'>
            <button
              type='button'
              onClick={handleCancel}
              disabled={isLoading}
              className='text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer'
            >
              ยกเลิกและกลับไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className='mt-8 text-xs text-slate-400 font-medium'>
          สำนักงานป้องกันและปราบปรามการฟอกเงิน
        </p>
      </div>
    </div>
  )
}

export default TwoFactorChallenge
