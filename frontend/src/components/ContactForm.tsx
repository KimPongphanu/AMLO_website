import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FaEnvelope,
  FaLightbulb,
  FaPenAlt,
  FaPhone,
  FaQuestionCircle,
  FaSpinner,
  FaTimes,
  FaUser,
} from 'react-icons/fa'
import { useContentStore } from '../stores/useContentStore'
import type { ContactFormData } from '../type'

export default function ContactForm() {
  const { t } = useTranslation()
  // Bind centralized layout state parameters and triggers from content store
  const submitContactForm = useContentStore((state) => state.submitContactForm)
  const isSubmitting = useContentStore((state) => state.isSubmittingContact)
  const errors = useContentStore((state) => state.contactErrors)
  const clearContactErrors = useContentStore(
    (state) => state.clearContactErrors,
  )

  const [showTips, setShowTips] = useState(false)

  const cardStyle =
    'w-full max-w-[600px] bg-white rounded-2xl m-10 p-8 border border-gray-200 shadow-lg mx-auto mt-25'
  const requireStyle =
    'after:ml-[3px] after:text-red-500 after:content-["*"] text-sm font-medium text-gray-700'

  const getInputStyle = (hasError?: boolean, isTextarea: boolean = false) =>
    `border rounded-md w-full px-3 py-2 focus:outline-none focus:ring-1 transition-colors ${
      isTextarea ? '' : 'pr-10'
    } ${
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }`

  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    telNumber: '',
    preferredContact: '',
    message: '',
    botField: '',
  })

  const maxLength = 500

  // Flush remaining validation error styling artifacts on component destruction
  useEffect(() => {
    return () => clearContactErrors()
  }, [clearContactErrors])

  const formatPhoneNumber = (value: string) => {
    if (!value) return value
    if (value.length < 4) return value
    if (value.length < 7) return `${value.slice(0, 3)} ${value.slice(3)}`
    return `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6, 10)}`
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    if (name === 'telNumber') {
      const rawValue = value.replace(/\D/g, '')
      if (rawValue.length > 10) return
      setFormData((prev) => ({ ...prev, [name]: rawValue }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleClear = (name: keyof ContactFormData) => {
    setFormData((prev) => ({ ...prev, [name]: '' }))
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      telNumber: '',
      preferredContact: '',
      message: '',
      botField: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitContactForm(formData, resetForm)
  }

  return (
    <article className={cardStyle}>
      <form onSubmit={handleSubmit} noValidate>
        <div
          className='absolute opacity-0 -z-10 h-0 w-0 overflow-hidden'
          aria-hidden='true'
        >
          <label htmlFor='botField'>{t('contact.failed')}</label>
          <input
            type='text'
            name='botField'
            id='botField'
            tabIndex={-1}
            value={formData.botField}
            onChange={handleChange}
            autoComplete='off'
          />
        </div>

        <div className='flex items-center justify-center gap-2 mb-6'>
          <p className='text-xl font-bold text-gray-800'>
            {t('contact.title')}
          </p>
          <button
            type='button'
            onClick={() => setShowTips(true)}
            aria-label='ดูวิธีการใช้งาน'
            className='w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors'
          >
            <FaQuestionCircle className='w-5 h-5' />
          </button>
        </div>

        <div className='grid grid-cols-12 gap-5'>
          <div className='col-span-12 md:col-span-6'>
            <label htmlFor='firstName' className={requireStyle}>
              {t('contact.firstName')}
            </label>
            <div className='relative mt-1'>
              <input
                type='text'
                name='firstName'
                id='firstName'
                value={formData.firstName}
                maxLength={100}
                onChange={handleChange}
                className={getInputStyle(!!errors.firstName)}
                disabled={isSubmitting}
              />
              {formData.firstName && !isSubmitting && (
                <button
                  type='button'
                  onClick={() => handleClear('firstName')}
                  className='absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none rounded-full hover:bg-gray-100 transition-colors'
                >
                  <FaTimes />
                </button>
              )}
            </div>
            {errors.firstName && (
              <p className='text-red-500 text-xs mt-1'>{errors.firstName}</p>
            )}
          </div>

          <div className='col-span-12 md:col-span-6'>
            <label htmlFor='lastName' className={requireStyle}>
              {t('contact.lastName')}
            </label>
            <div className='relative mt-1'>
              <input
                type='text'
                name='lastName'
                id='lastName'
                maxLength={100}
                value={formData.lastName}
                onChange={handleChange}
                className={getInputStyle(!!errors.lastName)}
                disabled={isSubmitting}
              />
              {formData.lastName && !isSubmitting && (
                <button
                  type='button'
                  onClick={() => handleClear('lastName')}
                  className='absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none rounded-full hover:bg-gray-100 transition-colors'
                >
                  <FaTimes />
                </button>
              )}
            </div>
            {errors.lastName && (
              <p className='text-red-500 text-xs mt-1'>{errors.lastName}</p>
            )}
          </div>

          <div className='col-span-12 md:col-span-6'>
            <label htmlFor='email' className={requireStyle}>
              {t('contact.email')}
            </label>
            <div className='relative mt-1'>
              <input
                type='email'
                name='email'
                id='email'
                maxLength={254}
                value={formData.email}
                onChange={handleChange}
                className={getInputStyle(!!errors.email)}
                disabled={isSubmitting}
              />
              {formData.email && !isSubmitting && (
                <button
                  type='button'
                  onClick={() => handleClear('email')}
                  className='absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none rounded-full hover:bg-gray-100 transition-colors'
                >
                  <FaTimes />
                </button>
              )}
            </div>
            {errors.email && (
              <p className='text-red-500 text-xs mt-1'>{errors.email}</p>
            )}
          </div>

          <div className='col-span-12 md:col-span-6'>
            <label htmlFor='telNumber' className={requireStyle}>
              {t('contact.phone')}
            </label>
            <div className='relative mt-1'>
              <input
                type='tel'
                name='telNumber'
                id='telNumber'
                maxLength={12}
                value={formatPhoneNumber(formData.telNumber)}
                onChange={handleChange}
                placeholder='0XX XXX XXXX'
                className={getInputStyle(!!errors.telNumber)}
                disabled={isSubmitting}
              />
              {formData.telNumber && !isSubmitting && (
                <button
                  type='button'
                  onClick={() => handleClear('telNumber')}
                  className='absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none rounded-full hover:bg-gray-100 transition-colors'
                >
                  <FaTimes />
                </button>
              )}
            </div>
            {errors.telNumber && (
              <p className='text-red-500 text-xs mt-1'>{errors.telNumber}</p>
            )}
          </div>

          <div className='col-span-12'>
            <p className={requireStyle}>
              {t('contact.preferredContactQuestion')}
            </p>
            <div className='flex gap-x-6 mt-2'>
              <label
                className={`flex items-center gap-x-2 ${isSubmitting ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              >
                <input
                  type='radio'
                  name='preferredContact'
                  value='email'
                  checked={formData.preferredContact === 'email'}
                  onChange={handleChange}
                  className='w-4 h-4 text-blue-600'
                  disabled={isSubmitting}
                />
                <span className='text-gray-700'>
                  {t('contact.contactByEmail')}
                </span>
              </label>
              <label
                className={`flex items-center gap-x-2 ${isSubmitting ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              >
                <input
                  type='radio'
                  name='preferredContact'
                  value='tel'
                  checked={formData.preferredContact === 'tel'}
                  onChange={handleChange}
                  className='w-4 h-4 text-blue-600'
                  disabled={isSubmitting}
                />
                <span className='text-gray-700'>
                  {t('contact.contactByPhone')}
                </span>
              </label>
            </div>
            {errors.preferredContact && (
              <p className='text-red-500 text-xs mt-1'>
                {errors.preferredContact}
              </p>
            )}
          </div>

          <div className='col-span-12'>
            <label
              htmlFor='message'
              className='text-sm font-medium text-gray-700'
            >
              {t('contact.message')}
            </label>
            <div className='relative mt-1'>
              <textarea
                name='message'
                id='message'
                value={formData.message}
                onChange={handleChange}
                placeholder={t('contact.messagePlaceholder')}
                className={`h-[150px] resize-none pr-10 ${getInputStyle(!!errors.message, true)}`}
                maxLength={maxLength}
                disabled={isSubmitting}
              />
              {formData.message && !isSubmitting && (
                <button
                  type='button'
                  onClick={() => handleClear('message')}
                  className='absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none rounded-full hover:bg-gray-100 transition-colors'
                >
                  <FaTimes />
                </button>
              )}
            </div>
            <div className='flex justify-between items-start mt-1'>
              <div className='flex-1'>
                {errors.message && (
                  <p className='text-red-500 text-xs'>{errors.message}</p>
                )}
              </div>
              <p className='text-right text-sm text-gray-500'>
                {formData.message.length}/{maxLength}
              </p>
            </div>
          </div>

          <div className='col-span-12 flex justify-center mt-4'>
            <button
              type='submit'
              disabled={isSubmitting}
              className={`w-[300px] font-medium p-3 rounded-md transition-colors shadow-sm flex items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {isSubmitting ? (
                <span className='flex items-center justify-center gap-2'>
                  <FaSpinner className='animate-spin h-5 w-5' />
                  {t('contact.sending')}
                </span>
              ) : (
                t('contact.send')
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Tips Popup — Material-style Dialog */}
      {showTips && (
        <div
          className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/40'
          onClick={() => setShowTips(false)}
        >
          <div
            className='bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-[scaleIn_0.2s_ease-out]'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className='flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#e8eaed]'>
              <div className='flex items-center gap-2'>
                <FaLightbulb className='text-xl text-amber-500' />
                <span className='text-[16px] font-semibold text-[#202124]'>
                  Tips การกรอกข้อมูล
                </span>
              </div>
              <button
                onClick={() => setShowTips(false)}
                aria-label='ปิด Tips'
                className='w-8 h-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] transition-colors'
              >
                <FaTimes className='w-5 h-5' />
              </button>
            </div>

            {/* Body */}
            <div className='px-6 py-4 flex flex-col gap-4'>
              {/* Tip: Name */}
              <div className='flex gap-3'>
                <FaUser className='text-lg shrink-0 mt-0.5 text-blue-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    ชื่อ-นามสกุล
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    กรอกชื่อจริงและนามสกุลของคุณ
                  </p>
                </div>
              </div>

              {/* Tip: Email */}
              <div className='flex gap-3'>
                <FaEnvelope className='text-lg shrink-0 mt-0.5 text-gray-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>อีเมล</p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    กรอกอีเมลที่สามารถติดต่อกลับได้
                  </p>
                </div>
              </div>

              {/* Tip: Phone */}
              <div className='flex gap-3'>
                <FaPhone className='text-lg shrink-0 mt-0.5 text-green-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    เบอร์โทรศัพท์
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    กรอกเบอร์โทรศัพท์ 10 หลัก (0XX XXX XXXX)
                  </p>
                </div>
              </div>

              {/* Tip: Message */}
              <div className='flex gap-3'>
                <FaPenAlt className='text-lg shrink-0 mt-0.5 text-[#1a73e8]' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>ข้อความ</p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    พิมพ์รายละเอียดข้อความของคุณ สูงสุด {maxLength} ตัวอักษร
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className='px-6 pb-4 pt-2 flex justify-end'>
              <button
                onClick={() => setShowTips(false)}
                className='px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm'
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframes for scaleIn animation */}
      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </article>
  )
}
