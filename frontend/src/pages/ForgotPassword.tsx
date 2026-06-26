// src/pages/ForgotPassword.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OtpInput from '../components/common/OtpInput'
import { twoFactorService } from '../services/twoFactorService'
import { api } from '../utils/api'

type Step = 'email' | 'verify' | 'success'
type Role = 'ADMIN' | 'SUPERVISOR' | null
type VerifyMethod = 'otp' | 'recovery'

const ForgotPassword = () => {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>(null)
  const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>('otp')
  const [otp, setOtp] = useState('')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // ─── Recovery Key formatter: auto AAAA-BBBB-CCCC-DDDD ───
  const formatRecoveryKey = (raw: string): string => {
    // Remove everything except A-Z, 0-9 → uppercase → max 16 chars
    const clean = raw
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 16)
    // Insert dash every 4 chars
    const parts: string[] = []
    for (let i = 0; i < clean.length; i += 4) {
      parts.push(clean.slice(i, i + 4))
    }
    return parts.join('-')
  }

  const handleRecoveryKeyChange = (value: string) => {
    const formatted = formatRecoveryKey(value)
    setRecoveryKey(formatted)
    setError('')
  }

  const getRawRecoveryKey = (): string => {
    return recoveryKey.replace(/-/g, '')
  }

  // ── Step 1: Check email ──
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setError('')

    try {
      const res = await twoFactorService.checkEmail(email.trim())

      if (!res.found) {
        setError('ไม่พบอีเมลนี้ในระบบ')
        setIsLoading(false)
        return
      }

      setRole(res.role as Role)

      // Auto-send OTP for Admin only (Supervisor uses 2FA)
      if (res.role !== 'SUPERVISOR') {
        await twoFactorService.requestEmailOTP(email.trim())
      }

      setStep('verify')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 2: Verify & Reset ──
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (role === 'ADMIN') {
      if (!otp || otp.length !== 6) {
        setError('กรุณากรอกรหัส OTP 6 หลัก')
        return
      }
    }

    if (role === 'SUPERVISOR') {
      if (verifyMethod === 'otp' && (!otp || otp.length !== 6)) {
        setError('กรุณากรอกรหัส 2FA 6 หลัก')
        return
      }
      if (verifyMethod === 'recovery' && getRawRecoveryKey().length !== 16) {
        setError('กรุณากรอก Recovery Key ให้ครบ 16 ตัวอักษร')
        return
      }
    }

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      setError(
        'รหัสผ่านต้องมีอย่างน้อย 8 ตัว ประกอบด้วยตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข',
      )
      return
    }

    setIsLoading(true)

    try {
      if (role === 'SUPERVISOR' && verifyMethod === 'recovery') {
        const recoveryRes = await twoFactorService.useRecoveryKey(
          email.trim(),
          getRawRecoveryKey(),
        )

        if (recoveryRes.success && recoveryRes.data?.resetToken) {
          const token = recoveryRes.data.resetToken
          await api('/auth/reset-password', {
            method: 'POST',
            body: { email: email.trim(), resetToken: token, newPassword },
          })
        } else {
          throw new Error(recoveryRes.message || 'Recovery Key ไม่ถูกต้อง')
        }
      } else if (role === 'SUPERVISOR' && verifyMethod === 'otp') {
        await api('/auth/reset-password', {
          method: 'POST',
          body: { email: email.trim(), totp: otp, newPassword },
        })
      } else {
        await api('/auth/reset-password', {
          method: 'POST',
          body: { email: email.trim(), otp, newPassword },
        })
      }

      setStep('success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      setError(message)
      setOtp('')
      setRecoveryKey('')
      setNewPassword('')
      setConfirmPassword('')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: 'email' as Step, label: 'อีเมล' },
      { key: 'verify' as Step, label: 'ยืนยัน' },
      { key: 'success' as Step, label: 'สำเร็จ' },
    ]
    const currentIndex = steps.findIndex((s) => s.key === step)

    return (
      <div className='flex items-center justify-center gap-2 mb-8'>
        {steps.map((s, index) => (
          <div key={s.key} className='flex items-center gap-2'>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                index < currentIndex
                  ? 'bg-emerald-500 text-white'
                  : index === currentIndex
                    ? 'bg-[#185FA5] text-white'
                    : 'bg-slate-200 text-slate-400'
              }`}
            >
              {index < currentIndex ? '✓' : index + 1}
            </div>
            <span
              className={`text-sm font-medium ${index <= currentIndex ? 'text-[#185FA5]' : 'text-slate-400'}`}
            >
              {s.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 ${index < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'}`}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderLoading = () => (
    <div className='flex flex-col items-center justify-center py-12'>
      <div className='w-10 h-10 border-4 border-[#185FA5] border-t-transparent rounded-full animate-spin' />
      <p className='text-sm text-slate-500 mt-4'>กำลังดำเนินการ...</p>
    </div>
  )

  const renderError = () => {
    if (!error) return null
    return (
      <div className='p-3 bg-red-50 border border-red-200 rounded-xl mb-4'>
        <p className='text-sm text-red-700 flex items-center gap-2'>
          <span className='text-lg'>⚠️</span>
          {error}
        </p>
      </div>
    )
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
            {step === 'email' && 'ลืมรหัสผ่าน'}
            {step === 'verify' && 'ตั้งรหัสผ่านใหม่'}
            {step === 'success' && 'ดำเนินการสำเร็จ'}
          </h1>
          <p className='text-sm text-slate-500 mt-1'>
            {step === 'email' && 'กรุณากรอกอีเมลที่ลงทะเบียนไว้'}
            {step === 'verify' &&
              role === 'SUPERVISOR' &&
              'ยืนยันตัวตนและตั้งรหัสผ่านใหม่'}
            {step === 'verify' &&
              role !== 'SUPERVISOR' &&
              'กรอกรหัส OTP และตั้งรหัสผ่านใหม่'}
            {step === 'success' && 'รหัสผ่านของคุณถูกตั้งเรียบร้อยแล้ว'}
          </p>
        </div>

        {renderStepIndicator()}

        {/* STEP 1: EMAIL */}
        {step === 'email' &&
          (isLoading ? (
            renderLoading()
          ) : (
            <form onSubmit={handleCheckEmail} className='flex flex-col w-full'>
              <div className='mb-6'>
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
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder='email@amlo.go.th'
                  required
                  autoFocus
                  className='w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-base outline-none focus:border-blue-500 transition-colors'
                />
              </div>
              {renderError()}
              <button
                type='submit'
                disabled={!email.trim()}
                className={`w-full py-3.5 rounded-xl text-white text-lg font-bold transition-colors ${!email.trim() ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-[#185FA5] hover:bg-[#134b82] cursor-pointer'}`}
              >
                ดำเนินการต่อ
              </button>
            </form>
          ))}

        {/* STEP 2: VERIFY */}
        {step === 'verify' &&
          (isLoading ? (
            renderLoading()
          ) : (
            <form
              onSubmit={handleVerifyAndReset}
              className='flex flex-col w-full'
            >
              <div className='mb-4 text-center'>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${role === 'SUPERVISOR' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
                >
                  {role === 'SUPERVISOR' ? 'Supervisor' : 'Admin'}
                </span>
              </div>

              {role === 'SUPERVISOR' && (
                <div className='mb-4'>
                  <label className='block text-xs font-bold tracking-[0.07em] uppercase text-slate-500 mb-2'>
                    วิธีการยืนยันตัวตน
                  </label>
                  <div className='flex gap-2'>
                    <button
                      type='button'
                      onClick={() => {
                        setVerifyMethod('otp')
                        setRecoveryKey('')
                        setError('')
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${verifyMethod === 'otp' ? 'border-[#185FA5] bg-blue-50 text-[#185FA5]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      2FA (Authenticator)
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        setVerifyMethod('recovery')
                        setOtp('')
                        setError('')
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${verifyMethod === 'recovery' ? 'border-[#185FA5] bg-blue-50 text-[#185FA5]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      Recovery Key
                    </button>
                  </div>
                </div>
              )}

              {(role !== 'SUPERVISOR' || verifyMethod === 'otp') && (
                <div className='mb-4'>
                  <label className='block text-xs font-bold tracking-[0.07em] uppercase text-slate-500 mb-2'>
                    {role === 'SUPERVISOR' ? 'รหัส 2FA' : 'รหัส OTP'}
                  </label>
                  <OtpInput
                    value={otp}
                    onChange={(val) => {
                      setOtp(val)
                      setError('')
                    }}
                  />
                </div>
              )}

              {/* Recovery Key — auto format XXXX-XXXX-XXXX-XXXX */}
              {role === 'SUPERVISOR' && verifyMethod === 'recovery' && (
                <div className='mb-4'>
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
                    onChange={(e) => handleRecoveryKeyChange(e.target.value)}
                    onKeyDown={(e) => {
                      // Handle backspace when cursor is right after a dash
                      if (e.key === 'Backspace') {
                        const input = e.currentTarget
                        const cursorPos = input.selectionStart || 0
                        const val = input.value
                        if (cursorPos > 0 && val[cursorPos - 1] === '-') {
                          e.preventDefault()
                          const beforeDash = val.slice(0, cursorPos - 1)
                          const afterDash = val.slice(cursorPos)
                          handleRecoveryKeyChange(beforeDash + afterDash)
                          setTimeout(() => {
                            input.setSelectionRange(
                              cursorPos - 1,
                              cursorPos - 1,
                            )
                          }, 0)
                        }
                      }
                    }}
                    placeholder='AAAA-BBBB-CCCC-DDDD'
                    maxLength={19}
                    className='w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-base outline-none focus:border-blue-500 transition-colors font-mono tracking-wider uppercase'
                  />
                  <p className='text-xs text-slate-400 mt-1.5'>
                    Recovery Key 16 ตัวอักษร — ระบบจะเติม - ให้อัตโนมัติ
                  </p>
                </div>
              )}

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
                  required
                  className='w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-base outline-none focus:border-blue-500 transition-colors'
                />
              </div>

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
                  required
                  className='w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-base outline-none focus:border-blue-500 transition-colors'
                />
              </div>

              <p className='text-xs text-slate-400 mb-4'>
                รหัสผ่านต้องมีอย่างน้อย 8 ตัว ประกอบด้วยตัวพิมพ์ใหญ่
                ตัวพิมพ์เล็ก ตัวเลข
              </p>

              {renderError()}

              <button
                type='submit'
                disabled={
                  (role !== 'SUPERVISOR' && otp.length !== 6) ||
                  (role === 'SUPERVISOR' &&
                    verifyMethod === 'otp' &&
                    otp.length !== 6) ||
                  (role === 'SUPERVISOR' &&
                    verifyMethod === 'recovery' &&
                    getRawRecoveryKey().length !== 16) ||
                  !newPassword ||
                  !confirmPassword
                }
                className={`w-full py-3.5 rounded-xl text-white text-lg font-bold transition-colors ${!newPassword || !confirmPassword ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-[#185FA5] hover:bg-[#134b82] cursor-pointer'}`}
              >
                ตั้งรหัสผ่านใหม่
              </button>
            </form>
          ))}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && (
          <div className='flex flex-col items-center w-full'>
            <div className='w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4'>
              <span className='text-3xl text-emerald-600'>✓</span>
            </div>
            <h2 className='text-lg font-bold text-slate-800 mb-2'>
              ตั้งรหัสผ่านสำเร็จ!
            </h2>
            <p className='text-sm text-slate-500 text-center mb-6'>
              รหัสผ่านของคุณถูกตั้งเรียบร้อยแล้ว
              <br />
              กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className='w-full py-3.5 rounded-xl text-white text-lg font-bold bg-[#185FA5] hover:bg-[#134b82] cursor-pointer transition-colors'
            >
              ไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        )}

        {step !== 'success' && (
          <button
            onClick={() => navigate('/login')}
            className='w-full mt-4 py-2.5 rounded-xl text-[#185FA5] text-sm font-bold border border-[#185FA5] hover:bg-blue-50 transition-colors cursor-pointer'
          >
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
