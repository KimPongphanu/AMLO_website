// src/components/dashboard/userManager/sub_components/CreateAdminModal.tsx
import React, { useCallback, useState } from 'react'
import { api } from '../../../../utils/api'

interface CreateAdminModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  supervisorCount?: number
}

interface FormState {
  firstname: string
  lastname: string
  email: string
  password: string
  role: 'ADMIN' | 'SUPERVISOR'
}

interface FormErrors {
  firstname?: string
  lastname?: string
  email?: string
  password?: string
  general?: string
}

const CreateAdminModal: React.FC<CreateAdminModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  supervisorCount = 0,
}) => {
  const canCreateSupervisor = supervisorCount < 2

  const [form, setForm] = useState<FormState>({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    role: 'ADMIN',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = useCallback(
    (name: string, value: string): string | undefined => {
      switch (name) {
        case 'firstname':
          if (!value.trim()) return 'กรุณากรอกชื่อ'
          if (value.length > 50) return 'ชื่อต้องไม่เกิน 50 ตัวอักษร'
          return undefined
        case 'lastname':
          if (!value.trim()) return 'กรุณากรอกนามสกุล'
          if (value.length > 50) return 'นามสกุลต้องไม่เกิน 50 ตัวอักษร'
          return undefined
        case 'email':
          if (!value.trim()) return 'กรุณากรอกอีเมล'
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            return 'รูปแบบอีเมลไม่ถูกต้อง'
          if (!value.includes('.go.th'))
            return 'ต้องใช้อีเมลองค์กร (.go.th) เท่านั้น'
          return undefined
        case 'password':
          if (!value) return 'กรุณากรอกรหัสผ่าน'
          if (value.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
          if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value))
            return 'ต้องมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และสามารถใช้ Special characters'
          return undefined
        default:
          return undefined
      }
    },
    [],
  )

  const handleChange = (name: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    if (name !== 'role' && errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name as keyof FormErrors]
        return next
      })
    }
    if (errors.general) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.general
        return next
      })
    }
  }

  const handleBlur = (name: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    const value = typeof form[name] === 'string' ? form[name] : ''
    const error = validateField(name, value)
    if (error && name !== 'role') {
      setErrors((prev) => ({ ...prev, [name]: error }))
    }
  }

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {}
    const fields: (keyof FormState)[] = [
      'firstname',
      'lastname',
      'email',
      'password',
    ]
    for (const field of fields) {
      const error = validateField(field, form[field] as string)
      if (error) (newErrors as Record<string, string>)[field] = error
    }
    setErrors(newErrors)
    setTouched({ firstname: true, lastname: true, email: true, password: true })
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return

    setIsLoading(true)
    try {
      await api('/auth/register', {
        method: 'POST',
        body: {
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
        },
      })
      onSuccess()
      onClose()
      setForm({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        role: 'ADMIN',
      })
      setErrors({})
      setTouched({})
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
      setErrors((prev) => ({ ...prev, general: message }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) onClose()
  }

  if (!isOpen) return null

  // Google Material Design classes
  const inputBaseClass =
    'block w-full border-0 border-b-2 border-[#dadce0] bg-transparent px-0 pb-2 pt-1 text-[#202124] placeholder:text-[#9aa0a6] focus:border-b-[#1a73e8] focus:outline-none focus:ring-0 text-sm transition-colors duration-200'
  const inputErrorClass = 'border-b-[#d93025] focus:border-b-[#d93025]'
  const labelClass = 'block text-sm font-medium text-[#5f6368] mb-1'
  const errorTextClass = 'mt-1.5 text-xs text-[#d93025]'

  return (
    <div
      className='fixed inset-0 z-50 overflow-y-auto'
      role='dialog'
      aria-modal='true'
    >
      <div className='flex items-center justify-center min-h-screen px-4 py-8'>
        <div
          className='fixed inset-0 bg-black/40 transition-opacity backdrop-blur-sm'
          onClick={handleClose}
        />
        <div className='relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#dadce0] overflow-hidden'>
          <button
            type='button'
            onClick={handleClose}
            disabled={isLoading}
            className='absolute top-4 right-4 z-20 p-1.5 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] transition-colors disabled:opacity-50'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>

          <div className='px-8 pt-8 pb-6 border-b border-[#e8eaed]'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-full bg-[#e8f0fe] flex items-center justify-center shrink-0'>
                <svg
                  className='w-5 h-5 text-[#1a73e8]'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
                  />
                </svg>
              </div>
              <div>
                <h3 className='text-lg font-semibold text-[#202124]'>
                  สร้างบัญชีผู้ดูแลระบบ
                </h3>
                <p className='text-sm text-[#5f6368] mt-0.5'>
                  สร้างบัญชีสำหรับผู้ดูแลระบบ
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='px-8 py-6 space-y-5'>
            {/* Firstname */}
            <div>
              <label className={labelClass}>
                ชื่อ <span className='text-[#d93025]'>*</span>
              </label>
              <input
                type='text'
                placeholder='กรุณากรอกชื่อ'
                value={form.firstname}
                onChange={(e) => handleChange('firstname', e.target.value)}
                onBlur={() => handleBlur('firstname')}
                disabled={isLoading}
                className={`${inputBaseClass} ${touched.firstname && errors.firstname ? inputErrorClass : ''}`}
              />
              {touched.firstname && errors.firstname && (
                <p className={errorTextClass}>{errors.firstname}</p>
              )}
            </div>

            {/* Lastname */}
            <div>
              <label className={labelClass}>
                นามสกุล <span className='text-[#d93025]'>*</span>
              </label>
              <input
                type='text'
                placeholder='กรุณากรอกนามสกุล'
                value={form.lastname}
                onChange={(e) => handleChange('lastname', e.target.value)}
                onBlur={() => handleBlur('lastname')}
                disabled={isLoading}
                className={`${inputBaseClass} ${touched.lastname && errors.lastname ? inputErrorClass : ''}`}
              />
              {touched.lastname && errors.lastname && (
                <p className={errorTextClass}>{errors.lastname}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>
                อีเมล <span className='text-[#d93025]'>*</span>
              </label>
              <input
                type='email'
                placeholder='name@domain.go.th'
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                disabled={isLoading}
                className={`${inputBaseClass} ${touched.email && errors.email ? inputErrorClass : ''}`}
              />
              {touched.email && errors.email ? (
                <p className={errorTextClass}>{errors.email}</p>
              ) : (
                <p className='mt-1.5 text-xs text-[#5f6368]'>
                  ต้องเป็นอีเมล .go.th เท่านั้น
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className={labelClass}>
                รหัสผ่าน <span className='text-[#d93025]'>*</span>
              </label>
              <input
                type='password'
                placeholder='········'
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                disabled={isLoading}
                className={`${inputBaseClass} ${touched.password && errors.password ? inputErrorClass : ''}`}
              />
              {touched.password && errors.password ? (
                <p className={errorTextClass}>{errors.password}</p>
              ) : (
                <p className='mt-1.5 text-xs text-[#5f6368]'>
                  อย่างน้อย 8 ตัว: ตัวใหญ่ + ตัวเล็ก + ตัวเลข (รองรับ Special
                  characters)
                </p>
              )}
            </div>

            {/* Role Selector */}
            <div>
              <label className={labelClass}>สิทธิ์เข้าใช้งาน</label>
              <div className='flex gap-3'>
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                    form.role === 'ADMIN'
                      ? 'border-[#1a73e8] bg-[#e8f0fe]'
                      : 'border-[#dadce0] hover:border-[#9aa0a6]'
                  }`}
                >
                  <input
                    type='radio'
                    name='role'
                    value='ADMIN'
                    checked={form.role === 'ADMIN'}
                    onChange={() => handleChange('role', 'ADMIN')}
                    className='sr-only'
                  />
                  <span className='text-sm font-medium text-[#202124]'>
                    Admin
                  </span>
                </label>
                {canCreateSupervisor && (
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                      form.role === 'SUPERVISOR'
                        ? 'border-[#1a73e8] bg-[#e8f0fe]'
                        : 'border-[#dadce0] hover:border-[#9aa0a6]'
                    }`}
                  >
                    <input
                      type='radio'
                      name='role'
                      value='SUPERVISOR'
                      checked={form.role === 'SUPERVISOR'}
                      onChange={() => handleChange('role', 'SUPERVISOR')}
                      className='sr-only'
                    />
                    <span className='text-sm font-medium text-[#202124]'>
                      Supervisor
                    </span>
                  </label>
                )}
              </div>
              {!canCreateSupervisor && (
                <p className='mt-1.5 text-xs text-[#5f6368]'>
                  มี Supervisor ครบ 2 ท่านแล้ว — สร้างได้เฉพาะ Admin
                </p>
              )}
            </div>

            {/* General error */}
            {errors.general && (
              <div className='rounded-lg bg-[#fce8e6] border border-[#f5c6c2] p-3'>
                <p className='text-sm text-[#d93025]'>{errors.general}</p>
              </div>
            )}

            {/* Actions */}
            <div className='flex items-center justify-end gap-3 pt-2'>
              <button
                type='button'
                onClick={handleClose}
                disabled={isLoading}
                className='px-4 py-2 text-sm font-medium text-[#5f6368] bg-white border border-[#dadce0] rounded-lg hover:bg-[#f1f3f4] transition-all disabled:opacity-50'
              >
                ยกเลิก
              </button>
              <button
                type='submit'
                disabled={isLoading}
                className='inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-[#1a73e8] rounded-lg hover:bg-[#1557b0] transition-all shadow-sm disabled:opacity-70'
              >
                {isLoading ? (
                  <>
                    <svg
                      className='w-4 h-4 animate-spin'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
                      />
                    </svg>
                    กำลังสร้าง...
                  </>
                ) : (
                  'สร้างบัญชี'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateAdminModal
