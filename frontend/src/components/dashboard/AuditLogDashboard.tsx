// src/components/dashboard/AuditLogDashboard.tsx
import { useCallback, useEffect, useState } from 'react'
import {
  FaAmbulance,
  FaBan,
  FaBuilding,
  FaCalendarAlt,
  FaCheck,
  FaCheckCircle,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaCircle,
  FaClock,
  FaCommentDots,
  FaEdit,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaFileAlt,
  FaFilter,
  FaGlobe,
  FaGlobeAmericas,
  FaHistory,
  FaInbox,
  FaKey,
  FaLock,
  FaMapMarkerAlt,
  FaNetworkWired,
  FaNewspaper,
  FaPowerOff,
  FaQuestionCircle,
  FaSearch,
  FaServer,
  FaShieldAlt,
  FaSignInAlt,
  FaSignOutAlt,
  FaSort,
  FaSortDown,
  FaSortUp,
  FaSpinner,
  FaSyncAlt,
  FaTag,
  FaTimes,
  FaTimesCircle,
  FaTrashAlt,
  FaUnlock,
  FaUser,
  FaUserPlus,
} from 'react-icons/fa'
import { auditService, type AuditLogEntry } from '../../services/auditService'
import { useAuthStore } from '../../stores/useAuthStore'

// ── Types ──
type SortField = 'createdAt' | 'action' | 'ipAddress'
type SortOrder = 'asc' | 'desc'

type ActionFilter =
  | 'all'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'CREATE_ADMIN_SUCCESS'
  | 'BAN_ADMIN_SUCCESS'
  | 'BAN_USER_SUCCESS'
  | 'UNBAN_ADMIN_SUCCESS'
  | 'UNBAN_USER_SUCCESS'
  | 'DELETE_ADMIN_SUCCESS'
  | 'DELETE_USER_SUCCESS'
  | 'UPDATE_ADMIN_SUCCESS'
  | 'UPDATE_PROFILE_SUCCESS'
  | 'EMERGENCY_ACTION_SUCCESS'
  | 'EMERGENCY_ACTION_FAILED'
  | 'OTP_ACTION_UNBAN_SUCCESS'
  | 'OTP_ACTION_FAILED'
  | 'FORCE_LOGOUT_SUCCESS'
  | 'FORCE_LOGOUT_FAILED'
  | 'SUPERVISOR_REQUEST_CREATED'
  | 'SUPERVISOR_REQUEST_APPROVED'
  | 'SUPERVISOR_REQUEST_REJECTED'
  | 'ENABLE_2FA_SUCCESS'
  | 'DISABLE_2FA_SUCCESS'
  | 'REGENERATE_RECOVERY_KEYS'
  | 'RECOVERY_KEY_USED'
  | 'CREATE_NEWS_SUCCESS'
  | 'UPDATE_NEWS_SUCCESS'
  | 'DELETE_NEWS_SUCCESS'
  | 'CREATE_DEPARTMENT_SUCCESS'
  | 'UPDATE_DEPARTMENT_SUCCESS'
  | 'DELETE_DEPARTMENT_SUCCESS'

const actionConfig: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  LOGIN_SUCCESS: {
    label: 'Login สำเร็จ',
    icon: <FaSignInAlt />,
    color: 'border-green-400 text-green-700 bg-green-50',
  },
  LOGIN_FAILED: {
    label: 'Login ล้มเหลว',
    icon: <FaExclamationTriangle />,
    color: 'border-red-400 text-red-700 bg-red-50',
  },
  LOGOUT: {
    label: 'ออกจากระบบ',
    icon: <FaSignOutAlt />,
    color: 'border-gray-400 text-gray-600 bg-gray-50',
  },
  CREATE_ADMIN_SUCCESS: {
    label: 'สร้าง Admin',
    icon: <FaUserPlus />,
    color: 'border-blue-400 text-blue-700 bg-blue-50',
  },
  BAN_ADMIN_SUCCESS: {
    label: 'แบน Admin',
    icon: <FaBan />,
    color: 'border-red-400 text-red-700 bg-red-50',
  },
  BAN_USER_SUCCESS: {
    label: 'แบนผู้ใช้',
    icon: <FaBan />,
    color: 'border-red-400 text-red-700 bg-red-50',
  },
  UNBAN_ADMIN_SUCCESS: {
    label: 'ปลดแบน Admin',
    icon: <FaCheckCircle />,
    color: 'border-green-400 text-green-700 bg-green-50',
  },
  UNBAN_USER_SUCCESS: {
    label: 'ปลดแบนผู้ใช้',
    icon: <FaCheckCircle />,
    color: 'border-green-400 text-green-700 bg-green-50',
  },
  DELETE_ADMIN_SUCCESS: {
    label: 'ลบ Admin',
    icon: <FaTrashAlt />,
    color: 'border-red-400 text-red-700 bg-red-50',
  },
  DELETE_USER_SUCCESS: {
    label: 'ลบผู้ใช้',
    icon: <FaTrashAlt />,
    color: 'border-red-400 text-red-700 bg-red-50',
  },
  UPDATE_ADMIN_SUCCESS: {
    label: 'อัปเดต Admin',
    icon: <FaEdit />,
    color: 'border-blue-400 text-blue-700 bg-blue-50',
  },
  UPDATE_PROFILE_SUCCESS: {
    label: 'อัปเดตโปรไฟล์',
    icon: <FaEdit />,
    color: 'border-blue-400 text-blue-700 bg-blue-50',
  },
  CREATE_NEWS_SUCCESS: {
    label: 'สร้างข่าว',
    icon: <FaNewspaper />,
    color: 'border-purple-400 text-purple-700 bg-purple-50',
  },
  UPDATE_NEWS_SUCCESS: {
    label: 'อัปเดตข่าว',
    icon: <FaEdit />,
    color: 'border-purple-400 text-purple-700 bg-purple-50',
  },
  DELETE_NEWS_SUCCESS: {
    label: 'ลบข่าว',
    icon: <FaTrashAlt />,
    color: 'border-red-400 text-red-700 bg-red-50',
  },
  CREATE_DEPARTMENT_SUCCESS: {
    label: 'สร้างหน่วยงาน',
    icon: <FaBuilding />,
    color: 'border-indigo-400 text-indigo-700 bg-indigo-50',
  },
  UPDATE_DEPARTMENT_SUCCESS: {
    label: 'อัปเดตหน่วยงาน',
    icon: <FaEdit />,
    color: 'border-indigo-400 text-indigo-700 bg-indigo-50',
  },
  DELETE_DEPARTMENT_SUCCESS: {
    label: 'ลบหน่วยงาน',
    icon: <FaTrashAlt />,
    color: 'border-red-400 text-red-700 bg-red-50',
  },
  ENABLE_2FA_SUCCESS: {
    label: 'เปิด 2FA',
    icon: <FaShieldAlt />,
    color: 'border-green-400 text-green-700 bg-green-50',
  },
  DISABLE_2FA_SUCCESS: {
    label: 'ปิด 2FA',
    icon: <FaShieldAlt />,
    color: 'border-yellow-400 text-yellow-700 bg-yellow-50',
  },
  REGENERATE_RECOVERY_KEYS: {
    label: 'สร้าง Keys ใหม่',
    icon: <FaKey />,
    color: 'border-orange-400 text-orange-700 bg-orange-50',
  },
  RECOVERY_KEY_USED: {
    label: 'ใช้ Recovery Key',
    icon: <FaKey />,
    color: 'border-red-400 text-red-700 bg-red-50',
  },
  EMERGENCY_ACTION_SUCCESS: {
    label: 'ฉุกเฉินสำเร็จ',
    icon: <FaAmbulance />,
    color: 'border-green-400 text-green-700 bg-green-50',
  },
  EMERGENCY_ACTION_FAILED: {
    label: 'ฉุกเฉินล้มเหลว',
    icon: <FaExclamationCircle />,
    color: 'border-red-400 text-red-700 bg-red-50',
  },
  OTP_ACTION_UNBAN_SUCCESS: {
    label: 'ปลดแบน OTP',
    icon: <FaUnlock />,
    color: 'border-green-400 text-green-700 bg-green-50',
  },
  OTP_ACTION_FAILED: {
    label: 'OTP ผิด',
    icon: <FaTimesCircle />,
    color: 'border-red-400 text-red-700 bg-red-50',
  },
  FORCE_LOGOUT_SUCCESS: {
    label: 'Force Logout',
    icon: <FaPowerOff />,
    color: 'border-orange-400 text-orange-700 bg-orange-50',
  },
  FORCE_LOGOUT_FAILED: {
    label: 'Force Logout ล้ม',
    icon: <FaTimesCircle />,
    color: 'border-red-400 text-red-700 bg-red-50',
  },
  SUPERVISOR_REQUEST_CREATED: {
    label: 'สร้างคำร้อง',
    icon: <FaFileAlt />,
    color: 'border-blue-400 text-blue-700 bg-blue-50',
  },
  SUPERVISOR_REQUEST_APPROVED: {
    label: 'อนุมัติคำร้อง',
    icon: <FaCheck />,
    color: 'border-green-400 text-green-700 bg-green-50',
  },
  SUPERVISOR_REQUEST_REJECTED: {
    label: 'ปฏิเสธคำร้อง',
    icon: <FaTimes />,
    color: 'border-red-400 text-red-700 bg-red-50',
  },
}

// ── Helpers ──
const TH =
  'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-800 transition-colors border-b border-gray-200'
const TD = 'px-4 py-3.5 whitespace-nowrap text-sm'

const formatTimeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'เมื่อสักครู่'
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} ชม. ที่แล้ว`
  const days = Math.floor(hrs / 24)
  return `${days} วันก่อน`
}

const formatDateTH = (dateStr: string): string => {
  const d = new Date(dateStr)
  const months = [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.',
  ]
  const year = d.getFullYear() + 543
  return `${d.getDate()} ${months[d.getMonth()]} ${year}`
}

const formatDateTimeFull = (dateStr: string): string => {
  const d = new Date(dateStr)
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const getAction = (action: string) =>
  actionConfig[action] || {
    label: action.replace(/_/g, ' '),
    icon: <FaCircle className='text-xs' />,
    color: 'border-gray-300 text-gray-600 bg-gray-50',
  }

// ── Main Component ──
export default function AuditLogDashboard() {
  const { user } = useAuthStore()

  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit, setLimit] = useState(50)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)

  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const [showFilter, setShowFilter] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [ipFilter, setIpFilter] = useState('')

  const fetchLogs = useCallback(async () => {
    if (user?.role !== 'SUPERVISOR') return
    setIsLoading(true)
    setError('')
    try {
      let url = `/audit?page=${page}&limit=${limit}&sort=${sortField}&order=${sortOrder}`
      if (actionFilter !== 'all')
        url += `&action=${encodeURIComponent(actionFilter)}`
      if (searchTerm.trim())
        url += `&q=${encodeURIComponent(searchTerm.trim())}`
      if (dateFrom) url += `&dateFrom=${encodeURIComponent(dateFrom)}`
      if (dateTo) url += `&dateTo=${encodeURIComponent(dateTo)}`
      if (regionFilter.trim())
        url += `&region=${encodeURIComponent(regionFilter.trim())}`
      if (ipFilter.trim())
        url += `&serverIp=${encodeURIComponent(ipFilter.trim())}`
      const { data, pagination } = await auditService.fetchRaw(url)
      setLogs(data)
      setTotal(pagination.total)
      setTotalPages(pagination.totalPages)
    } catch {
      setError('ไม่สามารถโหลด Audit Logs ได้')
    } finally {
      setIsLoading(false)
    }
  }, [
    user,
    page,
    limit,
    sortField,
    sortOrder,
    actionFilter,
    searchTerm,
    dateFrom,
    dateTo,
    regionFilter,
    ipFilter,
  ])

  useEffect(() => {
    if (user?.role !== 'SUPERVISOR') {
      setIsLoading(false)
      return
    }
    fetchLogs()
  }, [fetchLogs, user])

  useEffect(() => {
    setPage(1)
  }, [
    actionFilter,
    searchTerm,
    limit,
    dateFrom,
    dateTo,
    regionFilter,
    ipFilter,
  ])

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortOrder((p) => (p === 'desc' ? 'asc' : 'desc'))
    else {
      setSortField(f)
      setSortOrder('desc')
    }
  }
  const sortIcon = (f: SortField) => {
    if (sortField !== f) return <FaSort className='text-gray-300 text-[10px]' />
    return sortOrder === 'desc' ? (
      <FaSortDown className='text-blue-600' />
    ) : (
      <FaSortUp className='text-blue-600' />
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setActionFilter('all')
    setDateFrom('')
    setDateTo('')
    setRegionFilter('')
    setIpFilter('')
    setPage(1)
  }

  if (user?.role !== 'SUPERVISOR') {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='p-8 text-center'>
          <FaLock className='text-4xl text-red-400 mb-4 mx-auto' />
          <h2 className='text-lg font-bold text-red-600'>ไม่มีสิทธิ์เข้าถึง</h2>
          <p className='mt-1 text-sm text-gray-400'>
            เฉพาะ Supervisor เท่านั้น
          </p>
        </div>
      </div>
    )
  }

  const activeFilters = [
    actionFilter !== 'all',
    dateFrom,
    dateTo,
    regionFilter,
    ipFilter,
  ].filter(Boolean).length
  const hasAnyFilter = activeFilters > 0 || searchTerm.trim().length > 0

  return (
    <div className='p-4 md:p-6 max-w-[1400px] mx-auto font-sans'>
      {/* ── Header ── */}
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h1 className='text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2'>
            <FaHistory className='text-blue-600' /> Audit Logs
          </h1>
          <p className='text-xs md:text-sm text-gray-400 mt-0.5'>
            บันทึกการดำเนินการ · {total.toLocaleString()} รายการ
          </p>
        </div>
        <button className='w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100'>
          <FaQuestionCircle className='w-4 h-4' />
        </button>
      </div>

      {/* ── Search + Filter Bar ── */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden'>
        <div className='p-3 md:p-4 flex flex-col md:flex-row gap-3'>
          <div className='flex-1 relative'>
            <FaSearch className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs' />
            <input
              type='text'
              placeholder='ค้นหา action, email, IP, ภูมิภาค...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50'
            />
          </div>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowFilter((p) => !p)}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors inline-flex items-center gap-1.5 ${showFilter ? 'text-blue-600 bg-blue-50 border-blue-300' : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-100'}`}
            >
              <FaFilter /> ฟิลเตอร์
              {activeFilters > 0 && (
                <span className='ml-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold'>
                  {activeFilters}
                </span>
              )}
              {showFilter ? (
                <FaChevronUp className='text-[10px]' />
              ) : (
                <FaChevronDown className='text-[10px]' />
              )}
            </button>
            <button
              onClick={fetchLogs}
              className='px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 inline-flex items-center gap-1.5'
            >
              <FaSyncAlt /> รีเฟรช
            </button>
          </div>
        </div>

        {/* ── Filter Panel ── */}
        {showFilter && (
          <div className='border-t border-gray-200 bg-gray-50/70 p-3 md:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
            <div>
              <label className='block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1'>
                <FaTag className='text-[10px]' /> Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) =>
                  setActionFilter(e.target.value as ActionFilter)
                }
                className='w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
              >
                <option value='all'>ทั้งหมด</option>
                {Object.entries(actionConfig).map(([k, c]) => (
                  <option key={k} value={k}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1'>
                <FaCalendarAlt className='text-[10px]' /> วันที่เริ่มต้น
              </label>
              <input
                type='date'
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className='w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1'>
                <FaCalendarAlt className='text-[10px]' /> วันที่สิ้นสุด
              </label>
              <input
                type='date'
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className='w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1'>
                <FaMapMarkerAlt className='text-[10px]' /> ภูมิภาค
              </label>
              <input
                type='text'
                placeholder='Thailand, Bangkok...'
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className='w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1'>
                <FaServer className='text-[10px]' /> Server IP
              </label>
              <input
                type='text'
                placeholder='172.17.x.x...'
                value={ipFilter}
                onChange={(e) => setIpFilter(e.target.value)}
                className='w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
              />
            </div>
            <div className='sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-1'>
              <button
                onClick={clearFilters}
                className='px-4 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100'
              >
                ล้างทั้งหมด
              </button>
              <button
                onClick={fetchLogs}
                className='px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700'
              >
                ใช้ฟิลเตอร์
              </button>
            </div>
          </div>
        )}

        {/* ── Active filter chips ── */}
        {hasAnyFilter && !showFilter && (
          <div className='px-3 pb-3 md:px-4 md:pb-4 flex flex-wrap gap-1.5'>
            <span className='text-[10px] text-gray-400 self-center'>
              ตัวกรอง:
            </span>
            {actionFilter !== 'all' && (
              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border border-blue-200 bg-blue-50 text-blue-700'>
                <FaTag className='text-[8px]' />{' '}
                {actionConfig[actionFilter]?.label || actionFilter}
                <button
                  onClick={() => setActionFilter('all')}
                  className='ml-0.5 hover:text-blue-900'
                >
                  <FaTimes />
                </button>
              </span>
            )}
            {dateFrom && (
              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border border-gray-200 bg-gray-50 text-gray-600'>
                <FaCalendarAlt className='text-[8px]' /> จาก {dateFrom}
                <button
                  onClick={() => setDateFrom('')}
                  className='ml-0.5 hover:text-gray-900'
                >
                  <FaTimes />
                </button>
              </span>
            )}
            {dateTo && (
              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border border-gray-200 bg-gray-50 text-gray-600'>
                <FaCalendarAlt className='text-[8px]' /> ถึง {dateTo}
                <button
                  onClick={() => setDateTo('')}
                  className='ml-0.5 hover:text-gray-900'
                >
                  <FaTimes />
                </button>
              </span>
            )}
            {regionFilter && (
              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border border-gray-200 bg-gray-50 text-gray-600'>
                <FaMapMarkerAlt className='text-[8px]' /> {regionFilter}
                <button
                  onClick={() => setRegionFilter('')}
                  className='ml-0.5 hover:text-gray-900'
                >
                  <FaTimes />
                </button>
              </span>
            )}
            {ipFilter && (
              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border border-gray-200 bg-gray-50 text-gray-600'>
                <FaServer className='text-[8px]' /> {ipFilter}
                <button
                  onClick={() => setIpFilter('')}
                  className='ml-0.5 hover:text-gray-900'
                >
                  <FaTimes />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className='mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-1.5'>
          <FaExclamationCircle /> {error}
        </div>
      )}

      {isLoading ? (
        <div className='flex justify-center py-20'>
          <FaSpinner className='w-8 h-8 text-blue-500 animate-spin' />
        </div>
      ) : logs.length === 0 ? (
        <div className='text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200'>
          <FaInbox className='text-4xl text-gray-300 mb-3 mx-auto' />
          <p className='text-gray-500'>ไม่พบ Audit Logs</p>
          {hasAnyFilter && (
            <button
              onClick={clearFilters}
              className='mt-3 text-sm text-blue-600 hover:text-blue-800 underline'
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Desktop Table ── */}
          <div className='hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-100'>
                <thead>
                  <tr className='bg-gray-50/80'>
                    <th className={TH} onClick={() => handleSort('createdAt')}>
                      <span className='inline-flex items-center gap-1.5'>
                        <FaClock className='text-gray-400 text-[10px]' /> เวลา
                        {sortIcon('createdAt')}
                      </span>
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200'>
                      <span className='inline-flex items-center gap-1.5'>
                        <FaTag className='text-gray-400 text-[10px]' /> Action
                      </span>
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200'>
                      <span className='inline-flex items-center gap-1.5'>
                        <FaUser className='text-gray-400 text-[10px]' /> ผู้ใช้
                      </span>
                    </th>
                    <th className={TH} onClick={() => handleSort('ipAddress')}>
                      <span className='inline-flex items-center gap-1.5'>
                        <FaGlobe className='text-gray-400 text-[10px]' /> IP
                        {sortIcon('ipAddress')}
                      </span>
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200'>
                      <span className='inline-flex items-center gap-1.5'>
                        <FaGlobeAmericas className='text-gray-400 text-[10px]' />{' '}
                        ภูมิภาค
                      </span>
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200'>
                      <span className='inline-flex items-center gap-1.5'>
                        <FaCommentDots className='text-gray-400 text-[10px]' />{' '}
                        รายละเอียด
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-50'>
                  {logs.map((log, idx) => {
                    const ac = getAction(log.action)
                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-blue-50/50 transition-colors cursor-pointer`}
                      >
                        <td className={`${TD} text-gray-500 font-mono`}>
                          <div className='text-xs'>
                            {formatDateTH(log.createdAt)}
                          </div>
                          <div className='text-[11px] text-gray-400'>
                            {formatTimeAgo(log.createdAt)}
                          </div>
                        </td>
                        <td className={TD}>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${ac.color}`}
                          >
                            {ac.icon}
                            {ac.label}
                          </span>
                        </td>
                        <td className={TD}>
                          {log.user ? (
                            <div>
                              <span className='font-medium text-gray-800 text-sm'>
                                {log.user.firstname} {log.user.lastname}
                              </span>
                              <div className='text-xs text-gray-400'>
                                {log.user.email}
                              </div>
                            </div>
                          ) : (
                            <span className='text-gray-400 text-sm'>
                              System / สาธารณะ
                            </span>
                          )}
                        </td>
                        <td className={`${TD} font-mono text-xs`}>
                          <div className='text-gray-700'>{log.ipAddress}</div>
                          <div
                            className='text-[10px] text-gray-400'
                            title={log.serverIp}
                          >
                            <FaServer className='inline mr-0.5' />
                            {log.serverIp || '-'}
                          </div>
                        </td>
                        <td className={`${TD} text-xs`}>
                          {log.region ? (
                            <span className='inline-flex items-center gap-1'>
                              <FaGlobeAmericas className='text-blue-400 text-[10px]' />
                              <span
                                className='text-gray-600 truncate max-w-[120px] block'
                                title={log.region}
                              >
                                {log.region}
                              </span>
                            </span>
                          ) : (
                            <span className='text-gray-400'>-</span>
                          )}
                        </td>
                        <td
                          className={`${TD} text-gray-500 text-xs max-w-[180px] truncate`}
                        >
                          {log.details || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile Cards ── */}
          <div className='md:hidden space-y-2.5'>
            {logs.map((log) => {
              const ac = getAction(log.action)
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className='bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer overflow-hidden'
                >
                  <div className='flex items-center justify-between px-4 pt-3 pb-1.5'>
                    <div className='flex items-center gap-2 text-xs text-gray-400'>
                      <FaClock className='text-[10px]' />
                      <span className='font-mono'>
                        {formatDateTH(log.createdAt)}
                      </span>
                      <span className='text-gray-300'>·</span>
                      <span>{formatTimeAgo(log.createdAt)}</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${ac.color}`}
                    >
                      {ac.icon}
                      {ac.label}
                    </span>
                  </div>
                  <div className='px-4 pb-1 flex items-center gap-2 text-sm'>
                    <FaUser className='text-gray-400 text-[10px] shrink-0' />
                    {log.user ? (
                      <>
                        <span className='font-medium text-gray-800 truncate'>
                          {log.user.firstname} {log.user.lastname}
                        </span>
                        <span className='text-xs text-gray-400 hidden sm:inline'>
                          {log.user.email}
                        </span>
                      </>
                    ) : (
                      <span className='text-gray-400'>System / สาธารณะ</span>
                    )}
                  </div>
                  <div className='px-4 pb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
                    <span className='inline-flex items-center gap-1 text-gray-600'>
                      <FaGlobe className='text-gray-400 text-[10px]' />{' '}
                      {log.ipAddress}
                    </span>
                    <span className='inline-flex items-center gap-1 text-gray-400'>
                      <FaServer className='text-[10px]' /> {log.serverIp || '-'}
                    </span>
                    {log.region && (
                      <span className='inline-flex items-center gap-1 text-gray-500'>
                        <FaGlobeAmericas className='text-[10px] text-blue-400' />{' '}
                        {log.region}
                      </span>
                    )}
                  </div>
                  {log.details && (
                    <div className='px-4 pb-3 text-xs text-gray-400 truncate border-t border-gray-50 pt-2'>
                      <FaCommentDots className='inline mr-1 text-[10px]' />
                      {log.details}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Pagination ── */}
          <div className='flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white rounded-b-xl border border-gray-200 mt-3 gap-3'>
            <div className='flex items-center gap-3'>
              <p className='text-xs text-gray-500'>
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)} จาก{' '}
                {total.toLocaleString()} รายการ
              </p>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className='px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500'
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className='flex items-center gap-1'>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className='px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1'
              >
                <FaChevronLeft className='text-[10px]' /> ก่อนหน้า
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .map((p, idx, arr) => (
                  <span key={p} className='inline-flex items-center'>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className='px-1 text-gray-300 text-xs'>...</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${p === page ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-100'}`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className='px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1'
              >
                ถัดไป <FaChevronRight className='text-[10px]' />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Detail Modal ── */}
      {selectedLog && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'
          onClick={() => setSelectedLog(null)}
        >
          <div
            className='bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
              <h2 className='text-base font-bold text-gray-800 flex items-center gap-2'>
                <FaHistory className='text-blue-600' /> รายละเอียด
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className='p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              >
                <FaTimes />
              </button>
            </div>
            <div className='px-6 py-5 space-y-4'>
              {[
                {
                  icon: <FaClock />,
                  label: 'เวลา',
                  value: formatDateTimeFull(selectedLog.createdAt),
                },
                {
                  icon: <FaTag />,
                  label: 'Action',
                  value: (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getAction(selectedLog.action).color}`}
                    >
                      {getAction(selectedLog.action).icon}
                      {getAction(selectedLog.action).label}
                    </span>
                  ),
                },
                {
                  icon: <FaUser />,
                  label: 'ผู้ใช้',
                  value: selectedLog.user ? (
                    <>
                      <span className='font-medium'>
                        {selectedLog.user.firstname} {selectedLog.user.lastname}
                      </span>
                      <div className='text-xs text-gray-400'>
                        {selectedLog.user.email}
                      </div>
                    </>
                  ) : (
                    <span className='text-gray-400'>System / สาธารณะ</span>
                  ),
                },
                {
                  icon: <FaGlobe />,
                  label: 'IP สาธารณะ',
                  value: (
                    <span className='font-mono text-sm'>
                      {selectedLog.ipAddress}
                    </span>
                  ),
                },
                {
                  icon: <FaServer />,
                  label: 'IP เซิร์ฟเวอร์',
                  value: (
                    <span className='font-mono text-sm text-gray-400'>
                      {selectedLog.serverIp || '-'}
                    </span>
                  ),
                },
                {
                  icon: <FaGlobeAmericas />,
                  label: 'ภูมิภาค',
                  value: (
                    <span className='text-sm'>{selectedLog.region || '-'}</span>
                  ),
                },
                {
                  icon: <FaNetworkWired />,
                  label: 'อุปกรณ์',
                  value: (
                    <span className='text-sm break-words'>
                      {selectedLog.userAgent || '-'}
                    </span>
                  ),
                },
                {
                  icon: <FaCommentDots />,
                  label: 'รายละเอียด',
                  value: (
                    <p className='text-sm text-gray-700 whitespace-pre-wrap leading-relaxed'>
                      {selectedLog.details || '-'}
                    </p>
                  ),
                },
              ].map((item, i) => (
                <div key={i}>
                  <div className='flex items-start gap-3'>
                    <div className='w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5'>
                      <span className='text-gray-500 text-[10px]'>
                        {item.icon}
                      </span>
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='text-[11px] font-medium text-gray-500 uppercase tracking-wider'>
                        {item.label}
                      </p>
                      <div className='mt-0.5'>{item.value}</div>
                    </div>
                  </div>
                  {i < 7 && <hr className='mt-3 border-gray-100' />}
                </div>
              ))}
            </div>
            <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end'>
              <button
                onClick={() => setSelectedLog(null)}
                className='px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100'
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
