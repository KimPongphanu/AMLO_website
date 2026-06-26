// src/pages/RecoveryLogin.tsx
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { twoFactorService } from '../services/twoFactorService'
import { api } from '../utils/api'
import { toast } from '../utils/swalConfig'

const RecoveryLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const stateEmail = (location.state as { email?: string })?.email || ''

  const [email, setEmail] = useState(stateEmail)
  const [recoveryKey, setRecoveryKey] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [step, setStep] = useState<'recovery' | 'password'>('recovery')
  const [isLoading, setIsLoading] = useState(false)

  const handleUseRecoveryKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await twoFactorService.useRecoveryKey(email, recoveryKey)

      if (response.success && response.data?.resetToken) {
        setResetToken(response.data.resetToken)
        await toast.fire({
          icon: 'success',
          title: 'ยืนยัน Recovery Key สำเร็จ',
          text: 'กรุณาตั้งรหัสผ่านใหม่',
        })
        setStep('password')
      } else {
        throw new Error(response.message || 'Recovery Key ไม่ถูกต้อง')
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Recovery Key ไม่ถูกต้อง'
      await toast.fire({
        icon: 'error',
        title: 'ยืนยันล้มเหลว',
        text: message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (newPassword !== confirmPassword) {
      await toast.fire({
        icon: 'error',
        title: 'รหัสผ่านไม่ตรงกัน',
        text: 'กรุณากรอกรหัสผ่านให้ตรงกัน',
      })
      setIsLoading(false)
      return
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      await toast.fire({
        icon: 'error',
        title: 'รหัสผ่านไม่ตรงตามเงื่อนไข',
        text: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัว ประกอบด้วยตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และสามารถใช้ Special characters',
      })
      setIsLoading(false)
      return
    }

    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: { email, resetToken, newPassword },
      })

      await toast.fire({
        icon: 'success',
        title: 'ตั้งรหัสผ่านสำเร็จ',
        text: 'กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
      })
      navigate('/login', { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      await toast.fire({
        icon: 'error',
        title: 'ไม่สามารถตั้งรหัสผ่านได้',
        text: message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-slate-50 flex items-center justify-center overflow-hidden font-sans'>
      <div className='w-[420px] px-12 py-10 bg-white border border-slate-200 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.08)] rounded-2xl'>
        <div className='flex flex-col items-center text-center mb-6'>
          <img
            src='/Logo.png'
            alt='โลโก้ ปปง.'
            className='w-20 h-20 object-contain mb-4'
          />
          <h1 className='text-2xl font-bold text-slate-800 m-0'>
            กู้คืนการเข้าสู่ระบบ
          </h1>
          <p className='text-sm text-slate-500 mt-1'>
            {step === 'recovery'
              ? 'กรุณากรอกอีเมลและ Recovery Key'
              : 'กรุณาตั้งรหัสผ่านใหม่'}
          </p>
        </div>

        {step === 'recovery' && (
          <form
            onSubmit={handleUseRecoveryKey}
            className='flex flex-col w-full'
          >
            <div className='mb-4'>
              <label
                htmlFor='email'
                className='block text-xs font-bold tracking-[0.07em] uppercase text-slate-500 mb-2'
              >
                อีเมล
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='email@amlo.go.th'
                required
                disabled={!!stateEmail}
                className={`w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-base outline-none focus:border-blue-500 transition-colors ${stateEmail ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              {stateEmail && (
                <p className='text-xs text-slate-400 mt-1'>
                  อีเมลจากหน้า Login
                </p>
              )}
            </div>
            <div className='mb-6'>
              <label
                htmlFor='recoveryKey'
                className='block text-xs font-bold tracking-[0.07em] uppercase text-slate-500 mb-2'
              >
                Recovery Key
              </label>
              <input
                id='recoveryKey'
                type='text'
                value={recoveryKey}
                onChange={(e) => setRecoveryKey(e.target.value)}
                placeholder='XXXX-XXXX-XXXX-XXXX'
                required
                className='w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-base outline-none focus:border-blue-500 transition-colors'
              />
            </div>
            <button
              type='submit'
              disabled={isLoading || !email.trim() || !recoveryKey.trim()}
              className={`w-full py-3.5 rounded-xl text-white text-lg font-bold transition-colors ${
                isLoading || !email.trim() || !recoveryKey.trim()
                  ? 'bg-blue-600/50 cursor-not-allowed'
                  : 'bg-[#185FA5] hover:bg-[#134b82] cursor-pointer'
              }`}
            >
              {isLoading ? 'กำลังยืนยัน...' : 'ยืนยัน Recovery Key'}
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleResetPassword} className='flex flex-col w-full'>
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
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder='••••••••'
                required
                className='w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-base outline-none focus:border-blue-500 transition-colors'
              />
            </div>
            <div className='mb-6'>
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
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='••••••••'
                required
                className='w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-base outline-none focus:border-blue-500 transition-colors'
              />
            </div>
            <p className='text-xs text-slate-400 mb-4'>
              รหัสผ่านต้องมีอย่างน้อย 8 ตัว ประกอบด้วยตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก
              ตัวเลข และสามารถใช้ Special characters
            </p>
            <button
              type='submit'
              disabled={isLoading || !newPassword || !confirmPassword}
              className={`w-full py-3.5 rounded-xl text-white text-lg font-bold transition-colors ${
                isLoading || !newPassword || !confirmPassword
                  ? 'bg-blue-600/50 cursor-not-allowed'
                  : 'bg-[#185FA5] hover:bg-[#134b82] cursor-pointer'
              }`}
            >
              {isLoading ? 'กำลังบันทึก...' : 'ตั้งรหัสผ่านใหม่'}
            </button>
          </form>
        )}

        <button
          onClick={() => navigate('/login')}
          className='w-full mt-4 py-2.5 rounded-xl text-[#185FA5] text-sm font-bold border border-[#185FA5] hover:bg-blue-50 transition-colors cursor-pointer'
        >
          กลับไปหน้าเข้าสู่ระบบ
        </button>
      </div>
    </div>
  )
}

export default RecoveryLogin
