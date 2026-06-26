// src/pages/SupervisorRequests.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OtpInput from '../components/common/OtpInput'
import {
  supervisorRequestService,
  type SupervisorRequest,
} from '../services/supervisorRequestService'
import { useAuthStore } from '../stores/useAuthStore'
import { swal, toast } from '../utils/swalConfig'

type TabType = 'pending' | 'sent'

const actionLabels: Record<string, { th: string; color: string }> = {
  BAN: { th: 'ระงับการใช้งาน', color: 'red' },
  DELETE: { th: 'ลบบัญชี', color: 'red' },
  FORCE_RESET: { th: 'บังคับเปลี่ยนรหัสผ่าน', color: 'amber' },
}

const statusLabels: Record<string, { th: string; color: string }> = {
  PENDING: { th: 'รอดำเนินการ', color: 'text-amber-600 bg-amber-50' },
  APPROVED: { th: 'อนุมัติแล้ว', color: 'text-green-600 bg-green-50' },
  REJECTED: { th: 'ปฏิเสธแล้ว', color: 'text-red-600 bg-red-50' },
  EXPIRED: { th: 'หมดอายุ', color: 'text-slate-400 bg-slate-100' },
}

const SupervisorRequests = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [tab, setTab] = useState<TabType>('pending')
  const [pendingList, setPendingList] = useState<SupervisorRequest[]>([])
  const [sentList, setSentList] = useState<SupervisorRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [approveRequestId, setApproveRequestId] = useState<number | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [isApproving, setIsApproving] = useState(false)

  useEffect(() => {
    if (user?.role !== 'SUPERVISOR') {
      navigate('/dashboard', { replace: true })
      return
    }
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [pendingRes, sentRes] = await Promise.all([
        supervisorRequestService.getPending(),
        supervisorRequestService.getSent(),
      ])
      if (pendingRes.success) setPendingList(pendingRes.data)
      if (sentRes.success) setSentList(sentRes.data)
    } catch {
      toast.fire({ icon: 'error', title: 'ไม่สามารถโหลดข้อมูลคำร้องได้' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveClick = (id: number) => {
    setApproveRequestId(id)
    setOtpCode('')
    setOtpError('')
  }

  const handleConfirmApprove = async () => {
    if (!approveRequestId || !otpCode || otpCode.length < 6) {
      setOtpError('กรุณากรอกรหัส OTP 6 หลัก')
      return
    }
    setIsApproving(true)
    try {
      const res = await supervisorRequestService.approve(approveRequestId, {
        otpToken: otpCode,
      })
      if (res.success) {
        await toast.fire({ icon: 'success', title: 'ดำเนินการสำเร็จ' })
        setApproveRequestId(null)
        setOtpCode('')
        loadData()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'การดำเนินการล้มเหลว'
      setOtpError(msg)
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async (id: number) => {
    const result = await swal.fire({
      title: 'ปฏิเสธคำร้องนี้?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันปฏิเสธ',
      cancelButtonText: 'ยกเลิก',
    })
    if (!result.isConfirmed) return
    try {
      const res = await supervisorRequestService.reject(id)
      if (res.success) {
        await toast.fire({ icon: 'success', title: 'ปฏิเสธคำร้องเรียบร้อย' })
        loadData()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      await toast.fire({ icon: 'error', title: msg })
    }
  }

  if (user?.role !== 'SUPERVISOR') return null

  return (
    <div className='min-h-screen bg-slate-50 p-6 font-sans'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-2xl font-bold text-slate-800 mb-1'>
          คำร้องระหว่าง Supervisor
        </h1>
        <p className='text-sm text-slate-500 mb-6'>
          จัดการคำร้องที่ต้องได้รับการอนุมัติจาก Supervisor ท่านอื่น
        </p>

        {/* Tabs */}
        <div className='flex gap-4 border-b border-slate-200 mb-6'>
          <button
            onClick={() => setTab('pending')}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${
              tab === 'pending'
                ? 'border-[#185FA5] text-[#185FA5]'
                : 'border-transparent text-slate-500'
            }`}
          >
            รอฉันอนุมัติ ({pendingList.length})
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${
              tab === 'sent'
                ? 'border-[#185FA5] text-[#185FA5]'
                : 'border-transparent text-slate-500'
            }`}
          >
            คำร้องของฉัน ({sentList.length})
          </button>
        </div>

        {isLoading ? (
          <div className='flex justify-center py-12'>
            <div className='w-8 h-8 border-4 border-[#185FA5] border-t-transparent rounded-full animate-spin'></div>
          </div>
        ) : tab === 'pending' && pendingList.length === 0 ? (
          <div className='text-center py-12 text-slate-500'>
            ไม่มีคำร้องที่รอการอนุมัติ
          </div>
        ) : tab === 'sent' && sentList.length === 0 ? (
          <div className='text-center py-12 text-slate-500'>
            ยังไม่ได้ส่งคำร้องใดๆ
          </div>
        ) : (
          <div className='space-y-4'>
            {(tab === 'pending' ? pendingList : sentList).map((req) => (
              <div
                key={req.id}
                className='bg-white rounded-xl border border-slate-200 shadow-sm p-5'
              >
                <div className='flex justify-between items-start'>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          actionLabels[req.actionType]?.color === 'red'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {actionLabels[req.actionType]?.th || req.actionType}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusLabels[req.status]?.color || ''
                        }`}
                      >
                        {statusLabels[req.status]?.th || req.status}
                      </span>
                    </div>

                    <div className='text-sm text-slate-600'>
                      {tab === 'pending' ? (
                        <>
                          โดย:{' '}
                          <strong>
                            {req.requester?.firstname} {req.requester?.lastname}
                          </strong>{' '}
                          ({req.requester?.email})
                        </>
                      ) : (
                        <>
                          เป้าหมาย:{' '}
                          <strong>
                            {req.target?.firstname} {req.target?.lastname}
                          </strong>{' '}
                          ({req.target?.email})
                        </>
                      )}
                    </div>

                    <p className='text-sm text-slate-500'>
                      เหตุผล: {req.reason}
                    </p>

                    <p className='text-xs text-slate-400'>
                      สร้างเมื่อ:{' '}
                      {new Date(req.createdAt).toLocaleString('th-TH')}
                      {req.status === 'PENDING' && (
                        <>
                          {' '}
                          · หมดอายุ:{' '}
                          {new Date(req.expiresAt).toLocaleString('th-TH')}
                        </>
                      )}
                    </p>
                  </div>

                  {/* Action buttons */}
                  {tab === 'pending' && req.status === 'PENDING' && (
                    <div className='flex gap-2 shrink-0'>
                      <button
                        onClick={() => handleReject(req.id)}
                        className='px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors'
                      >
                        ปฏิเสธ
                      </button>
                      <button
                        onClick={() => handleApproveClick(req.id)}
                        className='px-4 py-2 text-sm font-medium text-white bg-[#185FA5] rounded-lg hover:bg-[#134b82] transition-colors'
                      >
                        อนุมัติ
                      </button>
                    </div>
                  )}
                </div>

                {/* OTP Approve Modal inline */}
                {approveRequestId === req.id && (
                  <div className='mt-4 pt-4 border-t border-slate-100'>
                    <p className='text-sm font-medium text-slate-700 mb-3'>
                      กรุณายืนยันตัวตนด้วย OTP จาก Google Authenticator
                    </p>
                    <OtpInput
                      value={otpCode}
                      onChange={(val) => {
                        setOtpCode(val)
                        setOtpError('')
                      }}
                      onComplete={(otp) => {
                        setOtpCode(otp)
                        handleConfirmApprove()
                      }}
                      disabled={isApproving}
                      error={otpError}
                    />
                    <div className='flex justify-end gap-2 mt-3'>
                      <button
                        onClick={() => setApproveRequestId(null)}
                        className='px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50'
                        disabled={isApproving}
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleConfirmApprove}
                        disabled={isApproving || otpCode.length !== 6}
                        className={`px-4 py-1.5 text-sm font-medium text-white rounded-lg transition-colors ${
                          isApproving || otpCode.length !== 6
                            ? 'bg-blue-600/50 cursor-not-allowed'
                            : 'bg-[#185FA5] hover:bg-[#134b82]'
                        }`}
                      >
                        {isApproving ? 'กำลังดำเนินการ...' : 'ยืนยันอนุมัติ'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SupervisorRequests
