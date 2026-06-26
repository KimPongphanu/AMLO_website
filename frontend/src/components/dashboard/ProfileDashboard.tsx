// src/components/dashboard/ProfileDashboard.tsx
import { useState } from 'react'
import {
  FaEnvelope,
  FaExclamationCircle,
  FaInfoCircle,
  FaLightbulb,
  FaQuestionCircle,
  FaSave,
  FaSpinner,
  FaTimes,
  FaUndo,
  FaUser,
  FaUserCircle,
} from 'react-icons/fa'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../stores/useAuthStore'
import { toast } from '../../utils/swalConfig'

const roleBadge: Record<string, { label: string; color: string }> = {
  SUPERVISOR: { label: 'ผู้ดูแลระบบสูงสุด', color: 'bg-red-100 text-red-800' },
  ADMIN: { label: 'ผู้ดูแลระบบ', color: 'bg-indigo-100 text-indigo-800' },
  USER: { label: 'ผู้ใช้ทั่วไป', color: 'bg-gray-100 text-gray-800' },
}

export default function ProfileDashboard() {
  const user = useAuthStore((state) => state.user)
  const verifyUser = useAuthStore((state) => state.verifyUser)

  const [firstname, setFirstname] = useState(user?.firstname || '')
  const [lastname, setLastname] = useState(user?.lastname || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showTips, setShowTips] = useState(false)

  const avatarChar = (user?.firstname?.charAt(0) || '?').toUpperCase()
  const roleInfo = user
    ? roleBadge[user.role] || roleBadge.USER
    : roleBadge.USER

  const hasChanges =
    firstname !== user?.firstname || lastname !== user?.lastname

  const handleReset = () => {
    setFirstname(user?.firstname || '')
    setLastname(user?.lastname || '')
    setError('')
  }

  const handleSave = async () => {
    if (!firstname.trim() || !lastname.trim()) {
      setError('กรุณากรอกชื่อและนามสกุล')
      return
    }
    if (firstname.length > 50 || lastname.length > 50) {
      setError('ชื่อหรือนามสกุลต้องไม่เกิน 50 ตัวอักษร')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      await authService.updateProfile({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
      })
      await verifyUser()
      await toast.fire({
        icon: 'success',
        title: 'อัปเดตข้อมูลส่วนตัวสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถบันทึกข้อมูลได้')
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className='max-w-2xl mx-auto'>
      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden'>
        {/* Header */}
        <div className='px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white'>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
              <FaUserCircle className='text-blue-600' />
              ข้อมูลส่วนตัว
            </h1>
            <button
              type='button'
              onClick={() => setShowTips(true)}
              aria-label='ดูวิธีการใช้งาน'
              className='w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors'
            >
              <FaQuestionCircle className='w-5 h-5' />
            </button>
          </div>
          <p className='text-sm text-gray-500 mt-1'>
            จัดการข้อมูลส่วนตัวของคุณ
          </p>
        </div>

        {/* Avatar + Email Section */}
        <div className='px-8 pt-8 pb-6 border-b border-gray-100'>
          <div className='flex items-center gap-5'>
            <div className='w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-md shrink-0'>
              {avatarChar}
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                {user.firstname} {user.lastname}
              </h2>
              <p className='text-sm text-gray-500'>{user.email}</p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1.5 ${roleInfo.color}`}
              >
                {roleInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className='px-8 py-6 space-y-5'>
          {/* Email (readonly) */}
          <div>
            <label className='block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5'>
              <FaEnvelope className='text-gray-400 mr-1.5 inline' />
              อีเมล
            </label>
            <input
              type='email'
              value={user.email}
              disabled
              className='block w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed'
            />
          </div>

          {/* Firstname */}
          <div>
            <label className='block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5'>
              <FaUser className='text-gray-400 mr-1.5 inline' />
              ชื่อ <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={firstname}
              onChange={(e) => {
                setFirstname(e.target.value)
                setError('')
                if (e.target.value.length >= 50) {
                  toast.fire({
                    icon: 'warning',
                    title: 'ความยาวชื่อเกินขีดจำกัด (สูงสุด 50 ตัวอักษร)',
                    timer: 2000,
                    showConfirmButton: false,
                  })
                }
              }}
              placeholder='กรุณากรอกชื่อ'
              maxLength={50}
              className='block w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
            />
          </div>

          {/* Lastname */}
          <div>
            <label className='block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5'>
              <FaUser className='text-gray-400 mr-1.5 inline' />
              นามสกุล <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={lastname}
              onChange={(e) => {
                setLastname(e.target.value)
                setError('')
                if (e.target.value.length >= 50) {
                  toast.fire({
                    icon: 'warning',
                    title: 'ความยาวนามสกุลเกินขีดจำกัด (สูงสุด 50 ตัวอักษร)',
                    timer: 2000,
                    showConfirmButton: false,
                  })
                }
              }}
              placeholder='กรุณากรอกนามสกุล'
              maxLength={50}
              className='block w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
            />
          </div>

          {/* Error */}
          {error && (
            <div className='p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-1.5'>
              <FaExclamationCircle className='shrink-0' />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className='flex items-center justify-end gap-3 pt-2'>
            <button
              onClick={handleReset}
              disabled={isSaving || !hasChanges}
              className='px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors inline-flex items-center gap-1.5'
            >
              <FaUndo />
              รีเซ็ต
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className='px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm inline-flex items-center gap-1.5'
            >
              {isSaving ? (
                <>
                  <FaSpinner className='animate-spin' />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <FaSave />
                  บันทึก
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Footer */}
        <div className='px-8 py-4 bg-gray-50 border-t border-gray-200'>
          <p className='text-xs text-gray-400 flex items-center gap-1'>
            <FaInfoCircle className='shrink-0' />
            เฉพาะชื่อและนามสกุลเท่านั้นที่แก้ไขได้
            หากต้องการเปลี่ยนอีเมลหรือรหัสผ่าน กรุณาติดต่อ Supervisor
          </p>
        </div>
      </div>

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
                  Tips การใช้งาน
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
                    สามารถแก้ไขชื่อและนามสกุลได้ สูงสุด 50 ตัวอักษร
                  </p>
                </div>
              </div>

              {/* Tip: Save */}
              <div className='flex gap-3'>
                <FaSave className='text-lg shrink-0 mt-0.5 text-green-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    การบันทึก
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    กด "บันทึก" เพื่ออัปเดตข้อมูล หรือ "รีเซ็ต"
                    เพื่อยกเลิกการเปลี่ยนแปลง
                  </p>
                </div>
              </div>

              {/* Tip: Limitations */}
              <div className='flex gap-3'>
                <FaInfoCircle className='text-lg shrink-0 mt-0.5 text-[#5f6368]' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>ข้อจำกัด</p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    เฉพาะชื่อและนามสกุลเท่านั้นที่แก้ไขได้
                    อีเมลและรหัสผ่านต้องติดต่อ Supervisor
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
    </div>
  )
}
