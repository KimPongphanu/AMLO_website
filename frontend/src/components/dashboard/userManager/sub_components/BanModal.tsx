import { useEffect, useState } from 'react'
import { api } from '../../../../utils/api'
import BaseModal from './BaseModal'
export interface DashboardUser {
  uuid: string
  email: string
  firstname: string
  lastname: string
  role: string
  twoFactorEnabled?: boolean
  twoFactorMethod?: string
  createdAt: string
  recentOnline: string
  status?: string
}

interface BanModalProps {
  isOpen: boolean
  onClose: () => void
  selectedUser: DashboardUser | null
  actionType: 'ban' | 'unban' | 'delete'
  onSuccess: () => void
}

const BanModal: React.FC<BanModalProps> = ({
  isOpen,
  onClose,
  selectedUser,
  actionType,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [reason, setReason] = useState('')
  const [countdown, setCountdown] = useState(5)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState('')

  const actionLabels: Record<
    string,
    { title: string; verb: string; color: string; endpoint: string }
  > = {
    ban: {
      title: 'ระงับการใช้งาน',
      verb: 'ระงับ',
      color: 'red',
      endpoint: 'ban',
    },
    unban: {
      title: 'ยกเลิกระงับการใช้งาน',
      verb: 'ยกเลิกระงับ',
      color: 'amber',
      endpoint: 'unban',
    },
    delete: { title: 'ลบบัญชีผู้ใช้', verb: 'ลบ', color: 'red', endpoint: '' },
  }

  const action = actionLabels[actionType]

  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setReason('')
      setCountdown(5)
      setError('')
      setIsExecuting(false)
    }
  }, [isOpen])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (step === 3 && countdown > 0 && !isExecuting) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    } else if (step === 3 && countdown === 0 && !isExecuting) {
      handleExecute()
    }
    return () => clearTimeout(timer)
  }, [step, countdown, isExecuting])

  const handleStep1Continue = () => {
    setStep(2)
  }

  const handleStep2Confirm = () => {
    if (!reason.trim()) {
      setError('กรุณากรอกเหตุผลในการดำเนินการ')
      return
    }
    if (reason.trim().length < 5) {
      setError('เหตุผลต้องมีอย่างน้อย 5 ตัวอักษร')
      return
    }
    setError('')
    setStep(3)
    setCountdown(5)
  }

  const handleExecute = async () => {
    if (!selectedUser) return
    setIsExecuting(true)

    try {
      if (actionType === 'delete') {
        // Delete uses DELETE method
        await api(`/auth/users/${selectedUser.uuid}`, {
          method: 'DELETE',
          body: { reason, step: 3 },
        })
      } else {
        await api(`/auth/users/${selectedUser.uuid}/${action.endpoint}`, {
          method: 'PUT',
          body: { reason, step: 3 },
        })
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'การดำเนินการล้มเหลว')
      setStep(2)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  if (!isOpen || !selectedUser) return null

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${action.title} : ${selectedUser.firstname} ${selectedUser.lastname}`}
    >
      <div className='space-y-4'>
        {step === 1 && (
          <>
            <div
              className={`p-4 rounded-md border bg-${action.color}-50 border-${action.color}-200 text-${action.color}-700`}
            >
              <p className='text-sm'>
                คุณกำลังจะ<strong>{action.verb}</strong> สมาชิกชื่อ{' '}
                <strong>
                  {selectedUser.firstname} {selectedUser.lastname}
                </strong>{' '}
                ({selectedUser.email})
              </p>
              {actionType === 'delete' && (
                <p className='text-sm mt-2 font-bold'>
                  การลบไม่สามารถกู้คืนได้! ข้อมูลทั้งหมดของสมาชิกนี้จะถูกลบถาวร
                </p>
              )}
              {actionType === 'ban' && (
                <p className='text-sm mt-2'>
                  บัญชีดังกล่าวจะไม่สามารถล็อกอินเข้าสู่ระบบได้ชั่วคราว
                </p>
              )}
            </div>
            <div className='flex justify-end space-x-3 pt-4 border-t border-gray-200'>
              <button
                type='button'
                onClick={handleCancel}
                className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
              >
                ยกเลิก
              </button>
              <button
                type='button'
                onClick={handleStep1Continue}
                className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700'
              >
                ดำเนินการต่อ
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div
              className={`p-4 rounded-md border bg-${action.color}-50 border-${action.color}-200`}
            >
              <p className='text-sm font-medium text-gray-900'>
                Target: {selectedUser.firstname} {selectedUser.lastname}
              </p>
              <p className='text-sm text-gray-500'>{selectedUser.email}</p>
              <p className='text-sm text-gray-500'>Action: {action.title}</p>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                เหตุผลในการ{action.verb}
              </label>
              <textarea
                rows={3}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border ${error ? 'border-red-300' : 'border-gray-300'}`}
                placeholder='กรุณาระบุเหตุผลโดยละเอียด...'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {error && <p className='mt-1 text-xs text-red-600'>{error}</p>}
            </div>
            <div className='flex justify-end space-x-3 pt-4 border-t border-gray-200'>
              <button
                type='button'
                onClick={handleCancel}
                className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
              >
                ยกเลิก
              </button>
              <button
                type='button'
                onClick={handleStep2Confirm}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${action.color}-600 hover:bg-${action.color}-700`}
              >
                ยืนยัน
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className='p-4 rounded-md border bg-yellow-50 border-yellow-200'>
              <p className='text-sm text-yellow-800'>
                ระบบจะ{action.verb}สมาชิกนี้โดยอัตโนมัติในอีก{' '}
                <strong>{countdown}</strong> วินาที
              </p>
              <div className='mt-2 text-sm text-yellow-700'>
                <p>Action: {action.title}</p>
                <p>
                  Target: {selectedUser.firstname} {selectedUser.lastname}
                </p>
                <p>Reason: {reason}</p>
              </div>
            </div>
            {isExecuting && (
              <div className='flex justify-center items-center gap-2'>
                <div className='w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                <span className='text-sm text-gray-600'>กำลังดำเนินการ...</span>
              </div>
            )}
            <div className='flex justify-end space-x-3 pt-4 border-t border-gray-200'>
              <button
                type='button'
                onClick={handleCancel}
                disabled={isExecuting}
                className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50'
              >
                ยกเลิกเดี๋ยวนี้
              </button>
              <button
                type='button'
                disabled={true}
                className='px-4 py-2 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed'
              >
                รอ ({countdown}s)
              </button>
            </div>
          </>
        )}
      </div>
    </BaseModal>
  )
}

export default BanModal
