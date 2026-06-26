import React, { useState } from 'react'
import { api } from '../../../../utils/api'
import { toast } from '../../../../utils/swalConfig'
import type { DashboardUser } from './BanModal'

interface UserDetailModalProps {
  isOpen: boolean
  onClose: () => void
  user: DashboardUser | null
  onBan: (u: DashboardUser) => void
  onUnban: (u: DashboardUser) => void
  onDelete: (u: DashboardUser) => void
  onForcePassword: (u: DashboardUser) => void
  onOpenRequest?: (u: DashboardUser) => void
  onRefresh?: () => void
}

// Action mode for supervisor modals
type SupervisorAction =
  | 'request'
  | 'otp-unban'
  | 'emergency'
  | 'force-logout'
  | null

const getOnlineStatus = (recentOnline: string) => {
  const diffMs = Date.now() - new Date(recentOnline).getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 10) {
    return {
      label: 'Online',
      color: 'bg-emerald-100 text-emerald-700',
      dot: 'bg-emerald-500',
    }
  } else if (diffMins < 60) {
    return {
      label: `${diffMins} นาทีที่แล้ว`,
      color: 'bg-gray-100 text-gray-600',
      dot: null,
    }
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60)
    return {
      label: `${hours} ชั่วโมงที่แล้ว`,
      color: 'bg-gray-100 text-gray-600',
      dot: null,
    }
  } else {
    const days = Math.floor(diffMins / 1440)
    return {
      label: `${days} วันที่แล้ว`,
      color: 'bg-gray-100 text-gray-500',
      dot: null,
    }
  }
}

const getAvatarColor = (firstname: string) => {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
    'from-cyan-500 to-cyan-600',
  ]
  return colors[firstname.charCodeAt(0) % colors.length]
}

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return {
        label: 'ผู้ดูแลระบบ',
        className: 'bg-indigo-100 text-indigo-800',
      }
    case 'SUPERVISOR':
      return { label: 'ผู้ดูแลสูงสุด', className: 'bg-red-100 text-red-800' }
    default:
      return { label: 'ผู้ใช้ทั่วไป', className: 'bg-gray-100 text-gray-800' }
  }
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  onClose,
  user,
  onBan,
  onUnban,
  onDelete,
  onForcePassword,
  onOpenRequest,
  onRefresh,
}) => {
  // State for supervisor action modals
  const [actionMode, setActionMode] = useState<SupervisorAction>(null)
  const [otpCode, setOtpCode] = useState('')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [reason, setReason] = useState('')
  const [emergencyAction, setEmergencyAction] = useState<
    'BAN' | 'DELETE' | 'FORCE_RESET'
  >('FORCE_RESET')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setActionMode(null)
      setOtpCode('')
      setRecoveryKey('')
      setReason('')
      setError('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  // OTP Unban handler
  const handleOTPUnban = async () => {
    if (!user || !otpCode || otpCode.length !== 6 || !reason.trim()) {
      setError('กรุณากรอก OTP 6 หลักและเหตุผล')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      await api(`/auth/users/${user.uuid}/otp-action`, {
        method: 'POST',
        body: { otpToken: otpCode, reason: reason.trim() },
      })
      await toast.fire({
        icon: 'success',
        title: 'ปลดระงับการใช้งานสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      })
      setActionMode(null)
      onRefresh?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'การดำเนินการล้มเหลว')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Force Logout handler
  const handleForceLogout = async () => {
    if (!user || !otpCode || otpCode.length !== 6 || !reason.trim()) {
      setError('กรุณากรอก OTP 6 หลักและเหตุผล')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      await api(`/auth/users/${user.uuid}/force-logout`, {
        method: 'POST',
        body: { otpToken: otpCode, reason: reason.trim() },
      })
      await toast.fire({
        icon: 'success',
        title: 'บังคับออกจากระบบสำเร็จ',
        text: `${user.firstname} ${user.lastname} ถูกเตะออกจากระบบแล้ว`,
        timer: 1500,
        showConfirmButton: false,
      })
      setActionMode(null)
      setOtpCode('')
      setReason('')
      onRefresh?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'การดำเนินการล้มเหลว')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Emergency handler
  const handleEmergency = async () => {
    if (!user || !recoveryKey.trim() || !reason.trim()) {
      setError('กรุณากรอก Recovery Key และเหตุผล')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      await api('/auth/emergency-action', {
        method: 'POST',
        body: {
          targetUuid: user.uuid,
          recoveryKey: recoveryKey.trim(),
          action: emergencyAction,
          reason: reason.trim(),
        },
      })
      const actionLabels: Record<string, string> = {
        BAN: 'ระงับบัญชี',
        DELETE: 'ลบบัญชี',
        FORCE_RESET: 'เปลี่ยนรหัสผ่าน',
      }
      await toast.fire({
        icon: 'success',
        title: 'ดำเนินการฉุกเฉินสำเร็จ',
        text: `${actionLabels[emergencyAction]} — 2FA ถูกปิด, Recovery Key ถูกใช้แล้ว, Revoke Sessions`,
        timer: 2000,
        showConfirmButton: false,
      })
      setActionMode(null)
      onRefresh?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'การดำเนินการล้มเหลว')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !user) return null

  const onlineStatus = getOnlineStatus(user.recentOnline)
  const roleBadge = getRoleBadge(user.role)
  const avatarChar = (user.firstname?.charAt(0) || '?').toUpperCase()
  const avatarColor = getAvatarColor(user.firstname || '')
  const isBanned = user.status === 'Inactive'
  const isSupervisorTarget = user.role === 'SUPERVISOR'

  const handleAction = (action: string) => {
    if (isSupervisorTarget && onOpenRequest) {
      // For supervisor, use the new action system
      if (action === 'request') {
        onOpenRequest(user)
        onClose()
      } else if (action === 'otp-unban') {
        setActionMode('otp-unban')
      } else if (action === 'emergency') {
        setActionMode('emergency')
      } else if (action === 'force-logout') {
        setActionMode('force-logout')
      }
      return
    }
    onClose()
    setTimeout(() => {
      if (action === 'ban') {
        if (isBanned) onUnban(user)
        else onBan(user)
      } else if (action === 'delete') onDelete(user)
      else if (action === 'force') onForcePassword(user)
    }, 150)
  }

  return (
    <div
      className='fixed inset-0 z-50 overflow-y-auto'
      role='dialog'
      aria-modal='true'
    >
      <div className='flex items-center justify-center min-h-screen px-4 py-8'>
        <div
          className='fixed inset-0 bg-black/40 transition-opacity backdrop-blur-sm'
          onClick={onClose}
        />
        <div className='relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 z-20 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors'
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

          <div className='p-8'>
            <div className='flex items-center gap-5 mb-8'>
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0`}
              >
                {avatarChar}
              </div>
              <div className='min-w-0'>
                <h2 className='text-xl font-bold text-gray-900 truncate'>
                  {user.firstname} {user.lastname}
                </h2>
                <p className='text-sm text-gray-500 truncate'>{user.email}</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1.5 ${roleBadge.className}`}
                >
                  {roleBadge.label}
                </span>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-x-8 gap-y-5 mb-8 bg-gray-50 rounded-xl p-5'>
              <div>
                <label className='block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1'>
                  รหัส UUID
                </label>
                <p className='text-sm font-mono text-gray-900 break-all'>
                  {user.uuid || '-'}
                </p>
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1'>
                  สถานะ 2FA
                </label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {user.twoFactorEnabled
                    ? '✅ ยืนยันแล้ว'
                    : '❌ ยังไม่ได้ตั้งค่า'}
                </span>
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1'>
                  สถานะ
                </label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isBanned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                >
                  {isBanned ? 'ถูกระงับ' : 'ปกติ'}
                </span>
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1'>
                  ใช้งานล่าสุด
                </label>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${onlineStatus.color}`}
                >
                  {onlineStatus.dot && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${onlineStatus.dot} animate-pulse`}
                    />
                  )}
                  {onlineStatus.label}
                </span>
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1'>
                  วันที่ลงทะเบียน
                </label>
                <p className='text-sm text-gray-900'>
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '-'}
                </p>
              </div>
            </div>

            {/* Action Modals for Supervisor */}
            {actionMode === 'otp-unban' && (
              <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/40'>
                <div className='bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4'>
                  <h3 className='text-lg font-bold text-gray-900 mb-4'>
                    🔓 ปลดแบน Supervisor ด้วย OTP
                  </h3>
                  <p className='text-sm text-gray-600 mb-4'>
                    ยืนยันตัวตนด้วย OTP จาก Google Authenticator ของคุณ
                  </p>
                  <div className='mb-4'>
                    <label className='block text-xs font-medium text-gray-500 mb-1'>
                      OTP 6 หลัก
                    </label>
                    <input
                      type='text'
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, ''))
                        setError('')
                      }}
                      className='block w-full px-3 py-2 text-center text-lg font-mono tracking-[0.5em] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500'
                      placeholder='------'
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className='mb-4'>
                    <label className='block text-xs font-medium text-gray-500 mb-1'>
                      เหตุผล
                    </label>
                    <textarea
                      rows={2}
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value)
                        setError('')
                      }}
                      className='block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm'
                      placeholder='ระบุเหตุผลในการปลดแบน...'
                      disabled={isSubmitting}
                    />
                  </div>
                  {error && (
                    <p className='text-sm text-red-600 mb-3'>{error}</p>
                  )}
                  <div className='flex justify-end gap-3'>
                    <button
                      onClick={() => setActionMode(null)}
                      disabled={isSubmitting}
                      className='px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50'
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleOTPUnban}
                      disabled={
                        isSubmitting || otpCode.length !== 6 || !reason.trim()
                      }
                      className='px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50'
                    >
                      {isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันปลดแบน'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {actionMode === 'force-logout' && (
              <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/40'>
                <div className='bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4'>
                  <h3 className='text-lg font-bold text-orange-600 mb-4'>
                    🔒 บังคับออกจากระบบด้วย OTP
                  </h3>
                  <p className='text-sm text-gray-600 mb-4'>
                    ยืนยันตัวตนด้วย OTP จาก Google Authenticator
                    ของคุณเพื่อบังคับ{' '}
                    <strong>
                      {user?.firstname} {user?.lastname}
                    </strong>{' '}
                    ออกจากระบบ
                  </p>
                  <div className='mb-4'>
                    <label className='block text-xs font-medium text-gray-500 mb-1'>
                      OTP 6 หลัก
                    </label>
                    <input
                      type='text'
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, ''))
                        setError('')
                      }}
                      className='block w-full px-3 py-2 text-center text-lg font-mono tracking-[0.5em] border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500'
                      placeholder='------'
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className='mb-4'>
                    <label className='block text-xs font-medium text-gray-500 mb-1'>
                      เหตุผล
                    </label>
                    <textarea
                      rows={2}
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value)
                        setError('')
                      }}
                      className='block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm'
                      placeholder='ระบุเหตุผลในการบังคับออกจากระบบ...'
                      disabled={isSubmitting}
                    />
                  </div>
                  {error && (
                    <p className='text-sm text-red-600 mb-3'>{error}</p>
                  )}
                  <div className='flex justify-end gap-3'>
                    <button
                      onClick={() => {
                        setActionMode(null)
                        setOtpCode('')
                        setReason('')
                      }}
                      disabled={isSubmitting}
                      className='px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50'
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleForceLogout}
                      disabled={
                        isSubmitting || otpCode.length !== 6 || !reason.trim()
                      }
                      className='px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50'
                    >
                      {isSubmitting
                        ? 'กำลังดำเนินการ...'
                        : 'ยืนยันบังคับออกจากระบบ'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {actionMode === 'emergency' && (
              <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/40'>
                <div className='bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4'>
                  <h3 className='text-lg font-bold text-red-600 mb-4'>
                    🚨 ดำเนินการฉุกเฉิน
                  </h3>
                  <p className='text-sm text-gray-600 mb-4'>
                    ใช้ Recovery Key ของ{' '}
                    <strong>
                      {user?.firstname} {user?.lastname}
                    </strong>{' '}
                    เพื่อดำเนินการฉุกเฉิน (Key จะถูกใช้ครั้งเดียว)
                  </p>
                  <div className='mb-4'>
                    <label className='block text-xs font-medium text-gray-500 mb-1'>
                      เลือกการดำเนินการ
                    </label>
                    <select
                      value={emergencyAction}
                      onChange={(e) =>
                        setEmergencyAction(
                          e.target.value as 'BAN' | 'DELETE' | 'FORCE_RESET',
                        )
                      }
                      disabled={isSubmitting}
                      className='block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm'
                    >
                      <option value='BAN'>🚫 ระงับบัญชี (Ban)</option>
                      <option value='DELETE'>🗑️ ลบบัญชี (Delete)</option>
                      <option value='FORCE_RESET'>
                        🔑 เปลี่ยนรหัสผ่าน (Force Reset)
                      </option>
                    </select>
                  </div>
                  <div className='mb-4'>
                    <label className='block text-xs font-medium text-gray-500 mb-1'>
                      Recovery Key (ของเป้าหมาย)
                    </label>
                    <input
                      type='text'
                      value={recoveryKey}
                      onChange={(e) => {
                        setRecoveryKey(e.target.value)
                        setError('')
                      }}
                      className='block w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500'
                      placeholder='XXXXXXXX'
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className='mb-4'>
                    <label className='block text-xs font-medium text-gray-500 mb-1'>
                      เหตุผล
                    </label>
                    <textarea
                      rows={2}
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value)
                        setError('')
                      }}
                      className='block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm'
                      placeholder='ระบุเหตุผลฉุกเฉิน...'
                      disabled={isSubmitting}
                    />
                  </div>
                  {error && (
                    <p className='text-sm text-red-600 mb-3'>{error}</p>
                  )}
                  <div className='flex justify-end gap-3'>
                    <button
                      onClick={() => setActionMode(null)}
                      disabled={isSubmitting}
                      className='px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50'
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleEmergency}
                      disabled={
                        isSubmitting || !recoveryKey.trim() || !reason.trim()
                      }
                      className='px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50'
                    >
                      {isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันดำเนินการ'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className='flex flex-wrap gap-3 pt-4 border-t border-gray-200'>
              {isSupervisorTarget ? (
                <>
                  <div className='w-full p-3 bg-amber-50 border border-amber-200 rounded-lg mb-2'>
                    <p className='text-xs font-medium text-amber-700'>
                      ⚠️ Supervisor — เลือกวิธีดำเนินการ
                    </p>
                    <p className='text-xs text-amber-600 mt-0.5'>
                      Force Logout = OTP ของคุณ | ปลดแบน = OTP ของคุณ | ฉุกเฉิน
                      = Recovery Key ของเป้าหมาย
                    </p>
                  </div>
                  <button
                    onClick={() => handleAction('request')}
                    className='inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm bg-[#185FA5] hover:bg-[#134b82] text-white'
                  >
                    📋 ยื่นคำร้อง
                  </button>
                  <button
                    onClick={() => handleAction('force-logout')}
                    className='inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm bg-orange-500 hover:bg-orange-600 text-white'
                  >
                    🔒 Force Logout (OTP)
                  </button>
                  {isBanned && (
                    <button
                      onClick={() => handleAction('otp-unban')}
                      className='inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm bg-emerald-500 hover:bg-emerald-600 text-white'
                    >
                      🔓 ปลดแบน (OTP)
                    </button>
                  )}
                  {!isBanned && (
                    <button
                      onClick={() => handleAction('emergency')}
                      className='inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm bg-red-500 hover:bg-red-600 text-white'
                    >
                      🚨 ฉุกเฉิน
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleAction('ban')}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${isBanned ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                  >
                    {isBanned ? 'ปลดระงับการใช้งาน' : 'ระงับการใช้งาน'}
                  </button>
                  <button
                    onClick={() => handleAction('delete')}
                    className='inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm bg-white text-red-600 border border-red-300 hover:bg-red-50'
                  >
                    ลบบัญชี
                  </button>
                  <button
                    onClick={() => handleAction('force')}
                    className='inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm bg-amber-500 hover:bg-amber-600 text-white'
                  >
                    เปลี่ยนรหัสผ่าน
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDetailModal
