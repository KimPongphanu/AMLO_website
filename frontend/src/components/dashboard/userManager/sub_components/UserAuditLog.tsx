import { useEffect, useState } from 'react'
import {
  auditService,
  type AuditLogEntry,
} from '../../../../services/auditService'
import type { DashboardUser } from './BanModal'

interface UserAuditLogProps {
  user: DashboardUser
  onBack: () => void
}

const UserAuditLog: React.FC<UserAuditLogProps> = ({ user, onBack }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await auditService.getLogs(user.uuid)
        setLogs(response)
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
  }, [user.uuid])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className='flex flex-col h-[calc(100vh-320px)] bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200'>
      <div className='px-6 py-4 flex items-center bg-gray-50 border-b border-gray-200 shrink-0'>
        <button
          onClick={onBack}
          className='inline-flex items-center justify-center w-8 h-8 mr-4 text-gray-500 bg-white border border-gray-300 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors'
          title='ย้อนกลับ'
        >
          <svg
            className='w-4 h-4'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M10 19l-7-7m0 0l7-7m-7 7h18'
            />
          </svg>
        </button>
        <h3 className='text-lg leading-6 font-medium text-gray-900'>
          ประวัติการทำงาน (Audit Logs) :{' '}
          <span className='font-semibold text-indigo-600'>
            {user.firstname} {user.lastname}
          </span>
        </h3>
      </div>

      <div className='flex-1 overflow-y-auto p-0'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-white sticky top-0 shadow-sm z-10'>
            <tr>
              <th
                scope='col'
                className='px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                วันเวลา
              </th>
              <th
                scope='col'
                className='px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                การกระทำ
              </th>
              <th
                scope='col'
                className='px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                IP Address
              </th>
              <th
                scope='col'
                className='px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                รายละเอียด
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-100'>
            {isLoading ? (
              <tr>
                <td
                  colSpan={4}
                  className='px-6 py-12 text-center text-sm text-gray-500'
                >
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={4}
                  className='px-6 py-12 text-center text-sm text-red-500'
                >
                  {error}
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className='px-6 py-12 text-center text-sm text-gray-500'
                >
                  ไม่พบประวัติการทำงานของบัญชีนี้
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {formatDate(log.createdAt)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        log.action.includes('FAILED') ||
                        log.action.includes('BAN') ||
                        log.action.includes('DELETE')
                          ? 'text-red-700 bg-red-100'
                          : log.action.includes('CREATE')
                            ? 'text-green-700 bg-green-100'
                            : 'text-gray-700 bg-gray-100'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono'>
                    {log.ipAddress}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {log.details || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserAuditLog
