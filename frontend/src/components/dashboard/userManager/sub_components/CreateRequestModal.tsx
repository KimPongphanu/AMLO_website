// src/components/dashboard/userManager/sub_components/CreateRequestModal.tsx
import { useState } from 'react'
import { supervisorRequestService } from '../../../../services/supervisorRequestService'
import { toast } from '../../../../utils/swalConfig'
import type { DashboardUser } from './BanModal'
import BaseModal from './BaseModal'

type ActionType = 'BAN' | 'FORCE_RESET' | 'DELETE'

interface CreateRequestModalProps {
  isOpen: boolean
  onClose: () => void
  targetUser: DashboardUser | null
  supervisorCount: number
}

const actionOptions: {
  value: ActionType
  label: string
  description: string
}[] = [
  {
    value: 'BAN',
    label: 'ระงับการใช้งาน (Ban)',
    description: 'เป้าหมายจะไม่สามารถเข้าสู่ระบบได้',
  },
  {
    value: 'FORCE_RESET',
    label: 'บังคับเปลี่ยนรหัสผ่าน',
    description: 'เป้าหมายต้องเปลี่ยนรหัสผ่านก่อนเข้าสู่ระบบครั้งถัดไป',
  },
  {
    value: 'DELETE',
    label: 'ลบบัญชี (Delete)',
    description: 'ลบบัญชีเป้าหมายถาวร ไม่สามารถกู้คืนได้',
  },
]

const CreateRequestModal = ({
  isOpen,
  onClose,
  targetUser,
}: CreateRequestModalProps) => {
  const [actionType, setActionType] = useState<ActionType>('BAN')
  const [reason, setReason] = useState('')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (!password) {
      setPasswordError('กรุณากรอกรหัสผ่าน')
      return
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setPasswordError('กรุณากรอกเหตุผลอย่างน้อย 5 ตัวอักษร')
      return
    }

    setStep('confirm')
  }

  const handleConfirm = async () => {
    if (!targetUser) return
    setIsSubmitting(true)

    try {
      const res = await supervisorRequestService.create({
        targetUuid: targetUser.uuid,
        actionType,
        reason: reason.trim(),
        password,
      })

      if (res.success) {
        await toast.fire({
          icon: 'success',
          title: 'ส่งคำร้องสำเร็จ',
          text: 'รอการอนุมัติจาก Supervisor เป้าหมาย',
        })
        handleClose()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      setPasswordError(msg)
      setStep('form')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep('form')
    setActionType('BAN')
    setReason('')
    setPassword('')
    setPasswordError('')
    onClose()
  }

  const targetLabel = targetUser
    ? `${targetUser.firstname} ${targetUser.lastname} (${targetUser.email})`
    : ''

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title='ยื่นคำร้องต่อ Supervisor'
    >
      <div className='space-y-5'>
        {/* Target Info */}
        <div className='p-3 bg-slate-50 rounded-lg border border-slate-200'>
          <p className='text-sm text-slate-600'>
            เป้าหมาย:{' '}
            <span className='font-medium text-slate-800'>{targetLabel}</span>
          </p>
        </div>

        {step === 'form' ? (
          <form onSubmit={handlePasswordSubmit} className='space-y-4'>
            {/* Action Type */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                ประเภทคำร้อง
              </label>
              <div className='space-y-2'>
                {actionOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      actionType === opt.value
                        ? 'border-[#185FA5] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type='radio'
                      name='actionType'
                      value={opt.value}
                      checked={actionType === opt.value}
                      onChange={() => setActionType(opt.value)}
                      className='mt-0.5'
                    />
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        {opt.label}
                      </p>
                      <p className='text-xs text-gray-500'>{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                เหตุผลในการดำเนินการ
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder='กรุณาระบุเหตุผลโดยละเอียด...'
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5]'
              />
            </div>

            {/* Password */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                ยืนยันตัวตนด้วยรหัสผ่าน
              </label>
              <input
                type='password'
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError('')
                }}
                placeholder='กรอกรหัสผ่านของคุณ'
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20 ${
                  passwordError ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {passwordError && (
                <p className='text-xs text-red-600 mt-1'>{passwordError}</p>
              )}
            </div>

            <div className='flex justify-end gap-3 pt-2'>
              <button
                type='button'
                onClick={handleClose}
                className='px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50'
              >
                ยกเลิก
              </button>
              <button
                type='submit'
                className='px-4 py-2 text-sm font-medium text-white bg-[#185FA5] rounded-lg hover:bg-[#134b82]'
              >
                ถัดไป
              </button>
            </div>
          </form>
        ) : (
          <div className='space-y-4'>
            <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
              <p className='text-sm text-amber-800 font-medium mb-2'>
                โปรดตรวจสอบข้อมูลก่อนยืนยัน
              </p>
              <ul className='text-sm text-amber-700 space-y-1'>
                <li>
                  • การดำเนินการ:{' '}
                  {actionOptions.find((o) => o.value === actionType)?.label}
                </li>
                <li>• เป้าหมาย: {targetLabel}</li>
                <li>• เหตุผล: {reason}</li>
              </ul>
            </div>

            {passwordError && (
              <p className='text-xs text-red-600'>{passwordError}</p>
            )}

            <div className='flex justify-end gap-3'>
              <button
                onClick={() => setStep('form')}
                disabled={isSubmitting}
                className='px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50'
              >
                แก้ไข
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  isSubmitting
                    ? 'bg-blue-600/50 cursor-not-allowed'
                    : 'bg-[#185FA5] hover:bg-[#134b82]'
                }`}
              >
                {isSubmitting ? 'กำลังส่งคำร้อง...' : 'ยืนยันส่งคำร้อง'}
              </button>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  )
}

export default CreateRequestModal
