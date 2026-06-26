// src/components/dashboard/department/sub_components/DepartmentRow.tsx
import { Edit2, Trash2 } from 'lucide-react'
import React from 'react'
import { API_URL } from '../../../../config/constants'
import type { DepartmentItem } from '../../../../type'
import GalleryStrip from './GalleryStrip'

interface DepartmentRowProps {
  department: DepartmentItem
  onEdit: (department: DepartmentItem) => void
  onDelete: (id: number) => void
}

const DepartmentRow: React.FC<DepartmentRowProps> = React.memo(
  ({ department, onEdit, onDelete }) => {
    const coverSrc = department.cover_image.startsWith('http')
      ? department.cover_image
      : `${API_URL}${department.cover_image}`

    return (
      <div className='p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white hover:bg-slate-50/60 transition-colors'>
        <div className='flex items-center gap-4 min-w-0'>
          <img
            src={coverSrc}
            alt={department.title}
            className='w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-100 shadow-sm'
          />
          <div className='min-w-0'>
            <h3 className='font-bold text-slate-900 truncate text-sm'>
              {department.title}
            </h3>
            <GalleryStrip gallery={department.gallery} />
          </div>
        </div>
        <div className='flex gap-2 w-full sm:w-auto shrink-0'>
          <button
            onClick={() => onEdit(department)}
            className='flex-1 sm:flex-none px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-200/40 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95'
          >
            <Edit2 className='w-3 h-3' /> แก้ไข
          </button>
          <button
            onClick={() => onDelete(department.id)}
            className='flex-1 sm:flex-none px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-lg border border-rose-200/40 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95'
          >
            <Trash2 className='w-3 h-3' /> ลบ
          </button>
        </div>
      </div>
    )
  },
)

DepartmentRow.displayName = 'DepartmentRow'

export default DepartmentRow
