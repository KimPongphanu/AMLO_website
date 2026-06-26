// src/components/dashboard/UserProfileManagerDashboard.tsx

import React, { useEffect, useMemo, useState } from 'react'
import {
  FaLightbulb,
  FaQuestionCircle,
  FaTimes,
  FaUsersCog,
} from 'react-icons/fa'
import { authService, type UserItem } from '../../../services/authService'
import { useAuthStore } from '../../../stores/useAuthStore'
import { api } from '../../../utils/api'
import { toast } from '../../../utils/swalConfig'

// --- Import Sub-Components & Modals ---
import AccessDenied from './sub_components/AccessDenied'
import BanModal, { type DashboardUser } from './sub_components/BanModal'
import CreateAdminModal from './sub_components/CreateAdminModal'
import CreateRequestModal from './sub_components/CreateRequestModal'
import PasswordModal from './sub_components/PasswordModal'
import TableSkeleton from './sub_components/TableSkeleton'
import UserAuditLog from './sub_components/UserAuditLog'
import UserDetailModal from './sub_components/UserDetailModal'
import UserTable from './sub_components/UserTable'

// Role filter options - Added SUPERVISOR for filtering
export type RoleFilter = 'ALL' | 'ADMIN' | 'USER' | 'SUPERVISOR'

const UserProfileManagerDashboard: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user)
  const isAuthLoading = useAuthStore((state) => state.isLoading)

  const [users, setUsers] = useState<DashboardUser[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showTips, setShowTips] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')

  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null)
  const [viewingAuditUser, setViewingAuditUser] =
    useState<DashboardUser | null>(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false)
  const [isBanModalOpen, setIsBanModalOpen] = useState<boolean>(false)
  const [banActionType, setBanActionType] = useState<
    'ban' | 'unban' | 'delete'
  >('ban')
  const [detailUser, setDetailUser] = useState<DashboardUser | null>(null)
  const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] =
    useState<boolean>(false)
  const [requestTarget, setRequestTarget] = useState<DashboardUser | null>(null)

  const [rowsPerPage, setRowsPerPage] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isAutoRows, setIsAutoRows] = useState<boolean>(true)

  useEffect(() => {
    if (!isAutoRows) return
    const calculateRows = () => {
      const availableHeight = window.innerHeight - 440
      const rowHeight = 73
      const calculated = Math.max(1, Math.floor(availableHeight / rowHeight))
      setRowsPerPage(calculated)
    }
    calculateRows()
    window.addEventListener('resize', calculateRows)
    return () => window.removeEventListener('resize', calculateRows)
  }, [isAutoRows])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter])

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser || currentUser.role !== 'SUPERVISOR') {
        setIsLoading(false)
        return
      }
      try {
        setIsLoading(true)
        setError(null)
        const response = await authService.getUsers()
        if (response.success && response.data) {
          const mappedUsers: DashboardUser[] = response.data.map(
            (u: UserItem) => ({
              uuid: u.uuid,
              email: u.email,
              firstname: u.firstname,
              lastname: u.lastname,
              role: u.role,
              status: u.status,
              twoFactorEnabled: u.twoFactorEnabled,
              twoFactorMethod: u.twoFactorMethod,
              createdAt: u.createdAt,
              recentOnline: u.recentOnline,
            }),
          )
          setUsers(mappedUsers)
        } else {
          setError('ไม่สามารถดึงข้อมูลผู้ใช้งานจากระบบได้')
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูลผู้ใช้งาน')
        console.error('Fetch Users Error:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUsers()
  }, [currentUser])

  const supervisorCount = useMemo(
    () => users.filter((u) => u.role === 'SUPERVISOR').length,
    [users],
  )

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const fullName = `${u.firstname} ${u.lastname}`.toLowerCase()
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        searchTerm === '' ||
        fullName.includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, searchTerm, roleFilter])

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages)
  }

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    return filteredUsers.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredUsers, currentPage, rowsPerPage])

  const handleOpenPasswordModal = (u: DashboardUser) => {
    setSelectedUser(u)
    setIsPasswordModalOpen(true)
  }

  const handleOpenBanModal = (u: DashboardUser) => {
    setSelectedUser(u)
    setBanActionType('ban')
    setIsBanModalOpen(true)
  }
  const handleOpenUnbanModal = (u: DashboardUser) => {
    setSelectedUser(u)
    setBanActionType('unban')
    setIsBanModalOpen(true)
  }
  const handleOpenDeleteModal = (u: DashboardUser) => {
    setSelectedUser(u)
    setBanActionType('delete')
    setIsBanModalOpen(true)
  }
  const handleOpenDetail = (u: DashboardUser) => {
    setDetailUser(u)
  }

  const handleCloseDetail = () => {
    setDetailUser(null)
  }

  const handleOpenRequest = (u: DashboardUser) => {
    setRequestTarget(u)
  }

  const handleCloseRequest = () => {
    setRequestTarget(null)
  }

  const handleForceResetPassword = async () => {
    if (!selectedUser) return
    try {
      await api(`/auth/users/${selectedUser.uuid}/force-reset`, {
        method: 'POST',
      })
      await toast.fire({
        icon: 'success',
        title: 'บังคับรีเซ็ตรหัสผ่านสำเร็จ',
        text: `ระบบได้ส่ง OTP ไปที่อีเมล ${selectedUser.email} และระงับเซสชันเดิมเรียบร้อย`,
        confirmButtonColor: '#185FA5',
      })
    } catch (err) {
      await toast.fire({
        icon: 'error',
        title: 'ไม่สามารถรีเซ็ตรหัสผ่านได้',
        text: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
        confirmButtonColor: '#185FA5',
      })
    }
    setIsPasswordModalOpen(false)
  }

  const handleCreateAdmin = () => {
    setIsCreateAdminModalOpen(true)
  }

  const handleCreateAdminSuccess = () => {
    toast.fire({
      icon: 'success',
      title: 'สร้าง Admin สำเร็จ!',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    })
    handleRefreshUsers()
  }

  const handleRefreshUsers = async () => {
    if (!currentUser || currentUser.role !== 'SUPERVISOR') return
    try {
      const response = await authService.getUsers()
      if (response.success && response.data) {
        const mappedUsers: DashboardUser[] = response.data.map(
          (u: UserItem) => ({
            uuid: u.uuid,
            email: u.email,
            firstname: u.firstname,
            lastname: u.lastname,
            role: u.role,
            status: u.status,
            twoFactorEnabled: u.twoFactorEnabled,
            twoFactorMethod: u.twoFactorMethod,
            createdAt: u.createdAt,
            recentOnline: u.recentOnline,
          }),
        )
        setUsers(mappedUsers)
      }
    } catch {
      /* silent fail */
    }
  }

  const handleBanSuccess = () => {
    const actionLabel =
      banActionType === 'ban'
        ? 'ระงับการใช้งาน'
        : banActionType === 'unban'
          ? 'ปลดระงับการใช้งาน'
          : 'ลบบัญชี'

    toast.fire({
      icon: 'success',
      title: `${actionLabel} สำเร็จ!`,
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    })
    handleRefreshUsers()
  }

  if (isAuthLoading) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-gray-500 font-medium animate-pulse'>
          กำลังตรวจสอบสิทธิ์เข้าใช้งานระบบ...
        </div>
      </div>
    )
  }

  if (!currentUser || currentUser.role !== 'SUPERVISOR') {
    return <AccessDenied />
  }

  return (
    <div className='bg-slate-50 rounded-xl shadow-sm overflow-hidden'>
      <header className='bg-white shadow-sm border-b border-gray-200 shrink-0'>
        <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-2xl font-bold text-gray-900 font-sans'>
                  จัดการข้อมูลสมาชิก (Supervisor Only)
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
              <p className='mt-1 text-sm text-gray-500'>
                สิทธิ์สำหรับผู้ดูแลระบบสูงสุดในการควบคุม ตรวจสอบ
                และบริหารจัดการบัญชีผู้ใช้ทั้งหมดในระบบ
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              <button
                onClick={handleCreateAdmin}
                className='px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors shadow-sm'
              >
                + สร้าง Admin
              </button>
              <span className='text-sm text-gray-600'>
                ผู้เข้าใช้ระบบ:{' '}
                <span className='font-semibold'>
                  {currentUser.firstname} {currentUser.lastname}
                </span>
              </span>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                {currentUser.role === 'SUPERVISOR'
                  ? 'ผู้ดูแลระบบสูงสุด (Supervisor)'
                  : 'ผู้ดูแลระบบ'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full'>
        {viewingAuditUser ? (
          <UserAuditLog
            user={viewingAuditUser}
            onBack={() => setViewingAuditUser(null)}
          />
        ) : (
          <>
            <div className='mb-8 flex flex-col sm:flex-row gap-4'>
              <div className='relative flex-1'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <svg
                    className='w-5 h-5 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                </div>
                <input
                  type='text'
                  placeholder='ค้นหาด้วยชื่อ นามสกุล หรืออีเมล...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                />
              </div>
              <div className='relative'>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                  className='block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md appearance-none bg-white'
                >
                  <option value='ALL'>เลือกประเภทสิทธิ์ทั้งหมด</option>
                  <option value='ADMIN'>แอดมิน (Admin)</option>
                  <option value='USER'>ผู้ใช้งานทั่วไป (User)</option>
                  <option value='SUPERVISOR'>
                    ผู้ดูแลระบบสูงสุด (Supervisor)
                  </option>
                </select>
              </div>
            </div>

            {error && (
              <div className='rounded-md bg-red-50 p-4 mb-8 border border-red-200'>
                <div className='flex'>
                  <div className='ml-3'>
                    <h3 className='text-sm font-medium text-red-800'>
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div className='flex flex-col h-[calc(100vh-400px)] bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200'>
              <div className='flex-1 overflow-x-auto overflow-y-auto'>
                {isLoading ? (
                  <TableSkeleton />
                ) : filteredUsers.length === 0 ? (
                  <div className='px-6 py-12 text-center text-gray-500'>
                    ไม่พบข้อมูลผู้ใช้งานที่ตรงตามเงื่อนไขการค้นหา
                  </div>
                ) : (
                  <UserTable
                    filteredUsers={paginatedUsers}
                    onRowClick={handleOpenDetail}
                  />
                )}
              </div>
              <div className='bg-gray-50 px-6 py-3 flex items-center justify-end border-t border-gray-200 text-sm text-gray-600 shrink-0 select-none'>
                <div className='flex items-center space-x-6'>
                  <div className='flex items-center space-x-1 border-r border-gray-300 pr-6'>
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className='p-1.5 rounded text-gray-500 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed'
                      title='หน้าแรก'
                    >
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M11 19l-7-7 7-7m8 14l-7-7 7-7'
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className='p-1.5 rounded text-gray-500 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed'
                      title='หน้าก่อนหน้า'
                    >
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M15 19l-7-7 7-7'
                        />
                      </svg>
                    </button>
                  </div>
                  <div className='font-medium text-gray-700 border-r border-gray-300 pr-6'>
                    {currentPage}{' '}
                    <span className='text-gray-400 font-normal mx-1'>of</span>{' '}
                    {totalPages}
                  </div>
                  <div className='flex items-center space-x-2 border-r border-gray-300 pr-6'>
                    <div className='relative'>
                      <select
                        value={isAutoRows ? 'auto' : rowsPerPage}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === 'auto') setIsAutoRows(true)
                          else {
                            setIsAutoRows(false)
                            setRowsPerPage(Number(val))
                            setCurrentPage(1)
                          }
                        }}
                        className='bg-transparent text-gray-700 border-none focus:ring-0 cursor-pointer appearance-none outline-none font-medium text-sm pr-6 pl-2 py-1 hover:bg-gray-200 rounded transition-colors'
                      >
                        <option value='auto'>Auto ({rowsPerPage} rows)</option>
                        <option value={5}>5 rows per page</option>
                        <option value={10}>10 rows per page</option>
                        <option value={25}>25 rows per page</option>
                        <option value={50}>50 rows per page</option>
                      </select>
                    </div>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className='p-1.5 rounded text-gray-500 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed'
                      title='หน้าถัดไป'
                    >
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M9 5l7 7-7 7'
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className='p-1.5 rounded text-gray-500 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed'
                      title='หน้าสุดท้าย'
                    >
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M13 5l7 7-7 7M5 5l7 7-7 7'
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

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
                <FaUsersCog className='text-lg shrink-0 mt-0.5 text-blue-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    การจัดการสมาชิก
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    จัดการบัญชีผู้ใช้ทั้งหมดในระบบ ดูรายละเอียด แบน หรือสร้าง
                    Admin ใหม่
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

      <CreateAdminModal
        isOpen={isCreateAdminModalOpen}
        onClose={() => setIsCreateAdminModalOpen(false)}
        onSuccess={handleCreateAdminSuccess}
        supervisorCount={supervisorCount}
      />
      <UserDetailModal
        isOpen={detailUser !== null}
        onClose={handleCloseDetail}
        user={detailUser}
        onBan={handleOpenBanModal}
        onUnban={handleOpenUnbanModal}
        onDelete={handleOpenDeleteModal}
        onForcePassword={handleOpenPasswordModal}
        onOpenRequest={handleOpenRequest}
        onRefresh={handleRefreshUsers}
      />
      <CreateRequestModal
        isOpen={requestTarget !== null}
        onClose={handleCloseRequest}
        targetUser={requestTarget}
        supervisorCount={supervisorCount}
      />
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        selectedUser={selectedUser}
        onSubmit={handleForceResetPassword}
      />
      <BanModal
        isOpen={isBanModalOpen}
        onClose={() => setIsBanModalOpen(false)}
        selectedUser={selectedUser}
        actionType={banActionType}
        onSuccess={handleBanSuccess}
      />
    </div>
  )
}

export default UserProfileManagerDashboard
