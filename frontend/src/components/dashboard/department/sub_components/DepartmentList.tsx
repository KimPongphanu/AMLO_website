// src/components/dashboard/department/sub_components/DepartmentList.tsx
import React from 'react'
import type { DepartmentItem } from '../../../../type'
import DepartmentRow from './DepartmentRow'

interface DepartmentListProps {
  departments: DepartmentItem[]
  onEdit: (department: DepartmentItem) => void
  onDelete: (id: number) => void
}

const DepartmentList: React.FC<DepartmentListProps> = React.memo(
  ({ departments, onEdit, onDelete }) => {
    return (
      <div className='bg-white border border-slate-100 shadow-sm rounded-2xl divide-y divide-slate-100 overflow-hidden'>
        {departments.map((dept: DepartmentItem) => (
          <DepartmentRow
            key={dept.id}
            department={dept}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    )
  },
)

DepartmentList.displayName = 'DepartmentList'

export default DepartmentList
