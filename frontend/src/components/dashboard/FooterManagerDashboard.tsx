// src/components/dashboard/FooterManagerDashboard.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FaEnvelope,
  FaEye,
  FaFacebook,
  FaFax,
  FaGlobeAmericas,
  FaLine,
  FaLink,
  FaMapMarkerAlt,
  FaPhone,
  FaSave,
  FaSpinner,
  FaTwitter,
  FaYoutube,
} from 'react-icons/fa'
import { contentService } from '../../services/contentService'
import { toast } from '../../utils/swalConfig'

// ── Default fallback values (ตรงกับ Footer.tsx) ──
const DEFAULTS: Record<string, string> = {
  address: '422 ถนนพญาไท แขวงวังใหม่ เขตปทุมวัน กรุงเทพมหานคร 10330',
  phone: '02-219-3600 ต่อ 1022, 1028',
  fax: '02-219-3902',
  email: 'webmaster@amlo.go.th',
  copyright: 'สำนักงาน ปปง. สงวนลิขสิทธิ์',
  visitor_count: '0',
}

const FIELDS = [
  { key: 'address', label: 'ที่อยู่', type: 'textarea' as const },
  { key: 'phone', label: 'เบอร์โทรศัพท์', type: 'text' as const },
  { key: 'fax', label: 'โทรสาร', type: 'text' as const },
  { key: 'email', label: 'อีเมล', type: 'text' as const },
  { key: 'copyright', label: 'ข้อความลิขสิทธิ์', type: 'text' as const },
  { key: 'visitor_count', label: 'จำนวนผู้เข้าชม', type: 'text' as const },
]

const POLICY_FIELDS = [
  { key: 'policy_website', label: 'นโยบายเว็บไซต์' },
  { key: 'policy_privacy', label: 'นโยบายคุ้มครองข้อมูลส่วนบุคคล' },
  { key: 'policy_cookies', label: 'นโยบายคุกกี้' },
  { key: 'policy_security', label: 'นโยบายความมั่นคงปลอดภัยเว็บไซต์' },
  { key: 'policy_accessibility', label: 'การเข้าถึงเว็บไซต์' },
]

const SOCIAL_FIELDS = [
  { key: 'facebook', label: 'Facebook URL' },
  { key: 'line', label: 'LINE URL' },
  { key: 'youtube', label: 'YouTube URL' },
  { key: 'twitter', label: 'Twitter/X URL' },
]

export default function FooterManagerDashboard() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const fetchSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await contentService.getSiteSettings()
      setSettings(data)
    } catch {
      toast.fire({
        icon: 'error',
        title: 'โหลดข้อมูลไม่สำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const allFields = [...FIELDS, ...POLICY_FIELDS, ...SOCIAL_FIELDS]
      // ส่งเฉพาะ field ที่มีค่า (ไม่ส่ง "" ไปทับ DB)
      const payload = allFields
        .map((f) => ({
          key: f.key,
          value: settings[f.key] || '',
        }))
        .filter((item) => item.value !== '')

      // ถ้าทุก field ว่าง → ไม่ส่งอะไรเลย
      if (payload.length === 0) {
        toast.fire({ icon: 'info', title: 'ไม่มีข้อมูลที่เปลี่ยนแปลง' })
        return
      }

      await contentService.updateSiteSettings(payload)
      toast.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch {
      toast.fire({ icon: 'error', title: 'ไม่สามารถบันทึกได้' })
    } finally {
      setIsSaving(false)
    }
  }

  const s = (key: string) => settings[key] ?? ''
  const display = (key: string): string => s(key) || DEFAULTS[key] || ''

  const scrollToPreview = () => {
    setShowPreview(true)
    setTimeout(
      () =>
        previewRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        }),
      100,
    )
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <FaSpinner className='w-8 h-8 animate-spin text-gray-400' />
      </div>
    )
  }

  return (
    <div className='space-y-6 max-w-4xl'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-slate-800'>จัดการ Footer</h2>
          <p className='text-slate-500 text-sm mt-1'>
            แก้ไขข้อมูล Footer, นโยบาย และ Social Media
          </p>
        </div>
        <button
          onClick={scrollToPreview}
          className='px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5'
        >
          <FaEye /> ดูตัวอย่าง
        </button>
      </div>

      {/* ── Contact Info ── */}
      <section className='bg-white rounded-xl border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold text-gray-800 mb-4'>
          ข้อมูลติดต่อ
        </h3>
        <div className='space-y-4'>
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={s(field.key)}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  rows={3}
                  placeholder={DEFAULTS[field.key] || ''}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
                />
              ) : (
                <input
                  value={s(field.key)}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={DEFAULTS[field.key] || ''}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
                />
              )}
              {DEFAULTS[field.key] && !s(field.key) && (
                <p className='text-[10px] text-gray-400 mt-1'>
                  ค่าเริ่มต้น: {DEFAULTS[field.key]}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Policy Links ── */}
      <section className='bg-white rounded-xl border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold text-gray-800 mb-4'>
          ลิงก์นโยบาย
        </h3>
        <div className='space-y-4'>
          {POLICY_FIELDS.map((field) => (
            <div key={field.key}>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                {field.label}
              </label>
              <div className='flex items-center gap-2 border border-gray-300 rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-300'>
                <FaLink className='w-3.5 h-3.5 text-gray-400 shrink-0' />
                <input
                  value={s(field.key)}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder='https://example.com/policy'
                  className='w-full py-2 text-sm focus:outline-none bg-transparent'
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Social Media ── */}
      <section className='bg-white rounded-xl border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold text-gray-800 mb-4'>
          Social Media
        </h3>
        <div className='space-y-4'>
          {SOCIAL_FIELDS.map((field) => (
            <div key={field.key}>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                {field.label}
              </label>
              <div className='flex items-center gap-2 border border-gray-300 rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-300'>
                <FaLink className='w-3.5 h-3.5 text-gray-400 shrink-0' />
                <input
                  value={s(field.key)}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder='https://facebook.com/...'
                  className='w-full py-2 text-sm focus:outline-none bg-transparent'
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Save Buttons ── */}
      <div className='flex justify-end gap-3'>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className='flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all disabled:bg-slate-300 disabled:cursor-not-allowed'
        >
          {isSaving ? (
            <>
              <FaSpinner className='w-4 h-4 animate-spin' /> กำลังบันทึก...
            </>
          ) : (
            <>
              <FaSave className='w-4 h-4' /> บันทึกการเปลี่ยนแปลง
            </>
          )}
        </button>
      </div>

      {/* ── Live Preview ── */}
      {showPreview && (
        <div
          ref={previewRef}
          className='bg-white rounded-xl border border-gray-200 p-6'
        >
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-800'>
              ตัวอย่าง Footer
            </h3>
            <button
              onClick={() => setShowPreview(false)}
              className='text-sm text-gray-400 hover:text-gray-600'
            >
              ซ่อน
            </button>
          </div>
          <div className='bg-slate-900 text-slate-300 rounded-lg p-6 text-sm space-y-4'>
            {/* Contact Info */}
            <div className='flex items-start gap-2'>
              <FaMapMarkerAlt className='w-4 h-4 mt-0.5 shrink-0 text-blue-400' />
              <span>{display('address')}</span>
            </div>
            <div className='flex items-center gap-2'>
              <FaPhone className='w-3.5 h-3.5 shrink-0 text-blue-400' />
              <span>{display('phone')}</span>
            </div>
            <div className='flex items-center gap-2'>
              <FaFax className='w-3.5 h-3.5 shrink-0 text-blue-400' />
              <span>{display('fax')}</span>
            </div>
            <div className='flex items-center gap-2'>
              <FaEnvelope className='w-3.5 h-3.5 shrink-0 text-blue-400' />
              <a
                href={`mailto:${display('email')}`}
                className='hover:text-white underline underline-offset-2'
              >
                {display('email')}
              </a>
            </div>

            {/* Social */}
            <div className='flex items-center gap-2 pt-2'>
              {s('facebook') && (
                <FaFacebook className='w-4 h-4 text-blue-500' />
              )}
              {s('line') && <FaLine className='w-4 h-4 text-green-500' />}
              {s('youtube') && <FaYoutube className='w-4 h-4 text-red-500' />}
              {s('twitter') && <FaTwitter className='w-4 h-4 text-sky-500' />}
              {!s('facebook') &&
                !s('line') &&
                !s('youtube') &&
                !s('twitter') && (
                  <span className='text-gray-500 text-xs'>
                    (ยังไม่มี Social Media)
                  </span>
                )}
            </div>

            {/* Policy Links */}
            <div className='border-t border-slate-800 pt-3 grid grid-cols-1 md:grid-cols-2 gap-2'>
              {POLICY_FIELDS.map((pf) => (
                <a
                  key={pf.key}
                  href={s(pf.key) || '#'}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={`text-xs inline-flex items-center gap-1 ${s(pf.key) ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 cursor-default'}`}
                >
                  <FaGlobeAmericas className='w-3 h-3' /> {pf.label}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <div className='border-t border-slate-800 pt-3 text-xs text-slate-500 flex justify-between'>
              <span>
                &copy; {new Date().getFullYear()} {display('copyright')}
              </span>
              <span>ผู้เข้าชม: {display('visitor_count')} คน</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
