// src/pages/AuditLog.tsx
import { useEffect, useState } from 'react'
import { auditService, type AuditLogEntry } from '../services/auditService'
import { useAuthStore } from '../stores/useAuthStore'

type ActionFilter =
  | 'all'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'CREATE_ADMIN_SUCCESS'
  | 'BAN_ADMIN_SUCCESS'
  | 'UNBAN_ADMIN_SUCCESS'
  | 'DELETE_ADMIN_SUCCESS'
  | 'UPDATE_ADMIN_SUCCESS'

const actionLabels: Record<string, string> = {
  LOGIN_SUCCESS: 'Login Success',
  LOGIN_FAILED: 'Login Failed',
  LOGOUT: 'Logout',
  CREATE_ADMIN_SUCCESS: 'Admin Created',
  BAN_ADMIN_SUCCESS: 'Admin Banned',
  UNBAN_ADMIN_SUCCESS: 'Admin Unbanned',
  DELETE_ADMIN_SUCCESS: 'Admin Deleted',
  UPDATE_ADMIN_SUCCESS: 'Admin Updated',
  CREATE_NEWS_SUCCESS: 'News Created',
  UPDATE_NEWS_SUCCESS: 'News Updated',
  CREATE_DEPARTMENT_SUCCESS: 'Department Created',
  UPDATE_DEPARTMENT_SUCCESS: 'Department Updated',
  DELETE_DEPARTMENT_SUCCESS: 'Department Deleted',
  ENABLE_2FA_SUCCESS: '2FA Enabled',
  DISABLE_2FA_SUCCESS: '2FA Disabled',
  REGENERATE_RECOVERY_KEYS: 'Recovery Keys Regenerated',
  RECOVERY_KEY_USED: 'Recovery Key Used',
}

const actionColors: Record<string, string> = {
  LOGIN_SUCCESS: 'text-green-700 bg-green-100',
  LOGIN_FAILED: 'text-red-700 bg-red-100',
  LOGOUT: 'text-gray-700 bg-gray-100',
  CREATE_ADMIN_SUCCESS: 'text-blue-700 bg-blue-100',
  BAN_ADMIN_SUCCESS: 'text-red-700 bg-red-100',
  UNBAN_ADMIN_SUCCESS: 'text-green-700 bg-green-100',
  DELETE_ADMIN_SUCCESS: 'text-red-700 bg-red-100',
  UPDATE_ADMIN_SUCCESS: 'text-yellow-700 bg-yellow-100',
  CREATE_NEWS_SUCCESS: 'text-purple-700 bg-purple-100',
  UPDATE_NEWS_SUCCESS: 'text-purple-700 bg-purple-100',
  CREATE_DEPARTMENT_SUCCESS: 'text-indigo-700 bg-indigo-100',
  UPDATE_DEPARTMENT_SUCCESS: 'text-indigo-700 bg-indigo-100',
  DELETE_DEPARTMENT_SUCCESS: 'text-red-700 bg-red-100',
  ENABLE_2FA_SUCCESS: 'text-green-700 bg-green-100',
  DISABLE_2FA_SUCCESS: 'text-yellow-700 bg-yellow-100',
  REGENERATE_RECOVERY_KEYS: 'text-orange-700 bg-orange-100',
  RECOVERY_KEY_USED: 'text-red-700 bg-red-100',
}

export default function AuditLog() {
  const { user } = useAuthStore()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user?.role !== 'SUPERVISOR') {
      setIsLoading(false)
      return
    }
    fetchLogs()
  }, [user])

  useEffect(() => {
    filterLogs()
  }, [logs, actionFilter, searchTerm])

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const data = await auditService.getAuditLogs(200)
      setLogs(data.data)
    } catch (err) {
      setError('Failed to load audit logs')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const filterLogs = () => {
    let result = [...logs]

    if (actionFilter !== 'all') {
      result = result.filter((log) => log.action === actionFilter)
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (log) =>
          log.action.toLowerCase().includes(term) ||
          (log.details && log.details.toLowerCase().includes(term)) ||
          (log.user?.email && log.user.email.toLowerCase().includes(term)) ||
          log.ipAddress.includes(term),
      )
    }

    setFilteredLogs(result)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getActionColor = (action: string): string => {
    return actionColors[action] || 'text-gray-700 bg-gray-100'
  }

  const getActionLabel = (action: string): string => {
    return actionLabels[action] || action.replace(/_/g, ' ')
  }

  if (user?.role !== 'SUPERVISOR') {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='p-8 text-center bg-white rounded-lg shadow-md'>
          <h2 className='text-xl font-bold text-red-600'>Access Denied</h2>
          <p className='mt-2 text-gray-600'>
            Supervisor privileges required to view audit logs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Audit Logs</h1>
        <p className='text-sm text-gray-500 mt-1'>
          Track all user actions and system events
        </p>
      </div>

      <div className='mb-6 flex flex-col sm:flex-row gap-4'>
        <div className='flex-1'>
          <input
            type='text'
            placeholder='Search by action, details, email, or IP...'
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as ActionFilter)}
          >
            <option value='all'>All Actions</option>
            <option value='LOGIN_SUCCESS'>Login Success</option>
            <option value='LOGIN_FAILED'>Login Failed</option>
            <option value='LOGOUT'>Logout</option>
            <option value='CREATE_ADMIN_SUCCESS'>Admin Created</option>
            <option value='BAN_ADMIN_SUCCESS'>Admin Banned</option>
            <option value='UNBAN_ADMIN_SUCCESS'>Admin Unbanned</option>
            <option value='DELETE_ADMIN_SUCCESS'>Admin Deleted</option>
            <option value='UPDATE_ADMIN_SUCCESS'>Admin Updated</option>
            <option value='ENABLE_2FA_SUCCESS'>2FA Enabled</option>
            <option value='DISABLE_2FA_SUCCESS'>2FA Disabled</option>
            <option value='RECOVERY_KEY_USED'>Recovery Key Used</option>
          </select>
        </div>
        <button
          onClick={fetchLogs}
          className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200'
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className='mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg'>
          {error}
        </div>
      )}

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className='text-center py-12 bg-white rounded-lg shadow'>
          <p className='text-gray-500'>No audit logs found</p>
        </div>
      ) : (
        <div className='bg-white shadow overflow-hidden rounded-lg'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Time
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Action
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    User
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    IP Address
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono'>
                      {formatDate(log.createdAt)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}
                      >
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {log.user
                        ? `${log.user.firstname} ${log.user.lastname}`
                        : 'System / Public'}
                      {log.user && (
                        <div className='text-xs text-gray-500'>
                          {log.user.email}
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500'>
                      {log.ipAddress}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500 max-w-md truncate'>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='px-6 py-3 bg-gray-50 border-t border-gray-200'>
            <p className='text-sm text-gray-500'>
              Showing {filteredLogs.length} of {logs.length} entries
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
