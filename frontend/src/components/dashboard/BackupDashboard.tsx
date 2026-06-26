// src/components/dashboard/BackupDashboard.tsx
import { useCallback, useEffect, useState } from 'react'
import {
  FaCheckCircle,
  FaCircle,
  FaClock,
  FaDatabase,
  FaDownload,
  FaHdd,
  FaInfoCircle,
  FaLightbulb,
  FaPlusCircle,
  FaQuestionCircle,
  FaSpinner,
  FaTimes,
  FaTrashAlt,
  FaUndoAlt,
} from 'react-icons/fa'
import { api } from '../../utils/api'
import { swal, toast } from '../../utils/swalConfig'

interface BackupFile {
  filename: string
  size: number
  createdAt: string
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function BackupDashboard() {
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showTips, setShowTips] = useState(false)

  const fetchBackups = useCallback(async () => {
    try {
      const res = await api<{ success: boolean; data: BackupFile[] }>(
        '/backups',
        { method: 'GET' },
      )
      if (res?.data) setBackups(res.data)
    } catch {
      /* silent */
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBackups()
  }, [fetchBackups])

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const res = await api<{ success: boolean; message: string }>('/backups', {
        method: 'POST',
      })
      if (res?.success) {
        await toast.fire({
          icon: 'success',
          title: res.message || 'สร้าง Backup สำเร็จ',
          timer: 1500,
          showConfirmButton: false,
        })
        fetchBackups()
      }
    } catch (err) {
      toast.fire({
        icon: 'error',
        title: 'ไม่สามารถสร้าง Backup ได้',
        text: String(err),
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDownload = (filename: string) => {
    window.open(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/backups/${filename}`,
      '_blank',
    )
  }

  const handleDelete = async (filename: string) => {
    const confirm = await swal.fire({
      title: 'ลบไฟล์ Backup?',
      text: `ต้องการลบ "${filename}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    })
    if (!confirm.isConfirmed) return
    try {
      const res = await api<{ success: boolean; message: string }>(
        `/backups/${filename}`,
        { method: 'DELETE' },
      )
      if (res?.success) {
        await toast.fire({
          icon: 'success',
          title: 'ลบไฟล์สำเร็จ',
          timer: 1500,
          showConfirmButton: false,
        })
        fetchBackups()
      }
    } catch {
      toast.fire({ icon: 'error', title: 'ไม่สามารถลบไฟล์ได้' })
    }
  }

  const handleRestore = async (filename: string) => {
    const confirm1 = await swal.fire({
      title: 'กู้คืนข้อมูลจาก Backup?',
      html: `<p style="color:#ef4444;font-weight:bold">ขอมุลปจจุบันทั้งหมดจะถูกเขียนทับ!</p><p>ไฟล: ${filename}</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ยืนยันการกู้คืน',
      cancelButtonText: 'ยกเลิก',
    })
    if (!confirm1.isConfirmed) return

    const confirm2 = await swal.fire({
      title: 'ยืนยันอีกครั้ง?',
      text: 'นี่คือการดำเนินการที่อันตราย กรุณายืนยันอีกครั้ง',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'กู้คืน',
      cancelButtonText: 'ยกเลิก',
    })
    if (!confirm2.isConfirmed) return

    try {
      const res = await api<{ success: boolean; message: string }>(
        `/backups/${filename}/restore`,
        { method: 'POST' },
      )
      if (res?.success) {
        await toast.fire({
          icon: 'success',
          title: res.message || 'กู้คืนสำเร็จ',
          timer: 2000,
          showConfirmButton: false,
        })
        fetchBackups()
      }
    } catch {
      toast.fire({ icon: 'error', title: 'ไม่สามารถกู้คืนข้อมูลได้' })
    }
  }

  const latestBackup = backups[0]

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden'>
        {/* Header */}
        <div className='px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white'>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
              <FaDatabase className='text-gray-600' />
              Backup & Recovery
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
          <p className='text-sm text-gray-500 mt-1'>จัดการและกู้คืนฐานข้อมูล</p>
        </div>

        {/* Status Bar */}
        <div className='px-8 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
          <div className='flex items-center gap-4 text-sm'>
            <span className='flex items-center gap-1.5'>
              <FaCircle className='text-emerald-500 text-[8px]' />
              สถานะ: <span className='font-semibold text-gray-700'>ปกติ</span>
            </span>
            {latestBackup && (
              <>
                <span className='text-gray-300 hidden sm:inline'>|</span>
                <span className='flex items-center gap-1.5'>
                  <FaClock className='text-gray-400 text-xs' />
                  ล่าสุด:{' '}
                  <span className='font-medium text-gray-600'>
                    {formatDate(latestBackup.createdAt)}
                  </span>
                </span>
                <span className='text-gray-300 hidden sm:inline'>|</span>
                <span className='flex items-center gap-1.5'>
                  <FaHdd className='text-gray-400 text-xs' />
                  ขนาด:{' '}
                  <span className='font-medium text-gray-600'>
                    {formatSize(latestBackup.size)}
                  </span>
                </span>
              </>
            )}
          </div>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className='flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm'
          >
            <FaPlusCircle className={isCreating ? 'animate-spin' : ''} />
            {isCreating ? 'กำลังสร้าง...' : 'สร้าง Backup'}
          </button>
        </div>

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50 border-b border-gray-200'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider'>
                  ลำดับ
                </th>
                <th className='px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider'>
                  วันที่สร้าง
                </th>
                <th className='px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider'>
                  ขนาด
                </th>
                <th className='px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider'>
                  สถานะ
                </th>
                <th className='px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider'>
                  ดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className='px-6 py-12 text-center'>
                    <FaSpinner className='animate-spin text-blue-600 text-xl mx-auto' />
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className='px-6 py-12 text-center text-gray-400'
                  >
                    <FaDatabase className='text-gray-300 text-3xl mb-2 mx-auto' />
                    ยังไม่มีไฟล์ Backup
                  </td>
                </tr>
              ) : (
                backups.map((b, i) => (
                  <tr
                    key={b.filename}
                    className='hover:bg-gray-50/80 transition-colors'
                  >
                    <td className='px-6 py-4 text-sm text-gray-500 font-mono'>
                      {i + 1}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-700 font-medium'>
                      {formatDate(b.createdAt)}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600 font-mono'>
                      {formatSize(b.size)}
                    </td>
                    <td className='px-6 py-4'>
                      <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700'>
                        <FaCheckCircle /> พร้อมใช้งาน
                      </span>
                    </td>
                    <td className='px-6 py-4 text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <button
                          onClick={() => handleDownload(b.filename)}
                          className='p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors'
                          title='ดาวน์โหลด'
                        >
                          <FaDownload />
                        </button>
                        <button
                          onClick={() => handleRestore(b.filename)}
                          className='p-2 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors'
                          title='กู้คืน'
                        >
                          <FaUndoAlt />
                        </button>
                        <button
                          onClick={() => handleDelete(b.filename)}
                          className='p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors'
                          title='ลบ'
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className='px-8 py-4 bg-gray-50 border-t border-gray-200'>
          <p className='text-xs text-gray-400 flex items-center gap-1.5'>
            <FaInfoCircle />
            สร้าง Backup อัตโนมัติทุกวันเวลา 03:00 น. — เก็บไฟล์สูงสุด 14 ไฟล์
            หรือ 7 วัน
          </p>
        </div>
      </div>

      {/* Tips Popup */}
      {showTips && (
        <div
          className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/40'
          onClick={() => setShowTips(false)}
        >
          <div
            className='bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-[scaleIn_0.2s_ease-out]'
            onClick={(e) => e.stopPropagation()}
          >
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
            <div className='px-6 py-4 flex flex-col gap-4'>
              <div className='flex gap-3'>
                <FaPlusCircle className='text-lg shrink-0 mt-0.5 text-blue-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    การสร้าง Backup
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    กด "สร้าง Backup" เพื่อบันทึกข้อมูลฐานข้อมูลในขณะนั้น
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <FaUndoAlt className='text-lg shrink-0 mt-0.5 text-amber-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    การกู้คืน
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    เลือกไฟล์ Backup แล้วกดกู้คืน — ข้อมูลปัจจุบันจะถูกเขียนทับ
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <FaInfoCircle className='text-lg shrink-0 mt-0.5 text-gray-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    อัตโนมัติ
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    ระบบสร้าง Backup อัตโนมัติทุกวัน 03:00 น. เก็บสูงสุด 14 ไฟล์
                  </p>
                </div>
              </div>
            </div>
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

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
