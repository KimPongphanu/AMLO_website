import type { DashboardUser } from './BanModal'

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

interface UserTableProps {
  filteredUsers: DashboardUser[]
  onRowClick: (u: DashboardUser) => void
}

const UserTable: React.FC<UserTableProps> = ({ filteredUsers, onRowClick }) => {
  return (
    <table className='min-w-full divide-y divide-gray-200'>
      <thead className='bg-gray-50'>
        <tr>
          <th
            scope='col'
            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
          >
            ชื่อ-นามสกุล
          </th>
          <th
            scope='col'
            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
          >
            อีเมลติดต่อ
          </th>
          <th
            scope='col'
            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
          >
            สิทธิ์เข้าใช้งาน
          </th>
          <th
            scope='col'
            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
          >
            สถานะ
          </th>
          <th
            scope='col'
            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
          >
            ใช้งานล่าสุด
          </th>
        </tr>
      </thead>
      <tbody className='bg-white divide-y divide-gray-200'>
        {filteredUsers.map((u) => (
          <tr
            key={u.uuid}
            onClick={() => onRowClick(u)}
            className='hover:bg-blue-50 transition-colors duration-150 cursor-pointer'
          >
            <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
              {u.firstname} {u.lastname}
            </td>
            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
              {u.email}
            </td>
            <td className='px-6 py-4 whitespace-nowrap'>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  u.role === 'ADMIN'
                    ? 'bg-indigo-100 text-indigo-800'
                    : u.role === 'SUPERVISOR'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {u.role === 'ADMIN'
                  ? 'Admin'
                  : u.role === 'SUPERVISOR'
                    ? 'Supervisor'
                    : 'User'}
              </span>
            </td>
            <td className='px-6 py-4 whitespace-nowrap'>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  u.status === 'Inactive'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {u.status === 'Inactive' ? 'ถูกระงับ' : 'ปกติ'}
              </span>
            </td>
            <td className='px-6 py-4 whitespace-nowrap'>
              {(() => {
                const status = getOnlineStatus(u.recentOnline)
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                  >
                    {status.dot && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`}
                      />
                    )}
                    {status.label}
                  </span>
                )
              })()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default UserTable
