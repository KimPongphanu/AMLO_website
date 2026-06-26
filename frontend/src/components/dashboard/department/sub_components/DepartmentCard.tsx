// src/components/dashboard/department/sub_components/DepartmentCard.tsx
import { Edit2, FileText, Trash2 } from 'lucide-react'
import React from 'react'
import { API_URL } from '../../../../config/constants'
import type { DepartmentItem } from '../../../../type'
import GalleryStrip from './GalleryStrip'

interface DepartmentCardProps {
  department: DepartmentItem
  onEdit: (department: DepartmentItem) => void
  onDelete: (id: number) => void
}

const DepartmentCard: React.FC<DepartmentCardProps> = React.memo(
  ({ department, onEdit, onDelete }) => {
    const coverSrc = department.cover_image.startsWith('http')
      ? department.cover_image
      : `${API_URL}${department.cover_image}`

    return (
      <div className='bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:border-slate-200 transition-all duration-200'>
        <div className='relative aspect-video bg-slate-900 overflow-hidden shrink-0'>
          <img
            src={coverSrc}
            alt={department.title}
            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent' />
          <div className='absolute bottom-3 left-4 right-4'>
            <h2 className='text-base font-bold text-white line-clamp-1 drop-shadow-sm'>
              {department.title}
            </h2>
          </div>
        </div>

        <div className='p-4 flex-1 flex flex-col justify-between space-y-4 bg-white'>
          <div className='space-y-2'>
            <div className='flex items-start gap-1.5 text-slate-500'>
              <FileText className='w-4 h-4 mt-0.5 shrink-0 text-slate-400' />
              <div
                className='text-xs leading-relaxed line-clamp-3 text-slate-500 font-medium whitespace-pre-wrap html-container'
                dangerouslySetInnerHTML={{
                  __html:
                    department.content ||
                    '<span class="italic text-slate-300">ไม่ได้ระบุคำอธิบาย</span>',
                }}
              />
            </div>
            <GalleryStrip gallery={department.gallery} />
          </div>

          <div className='grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 shrink-0'>
            <button
              onClick={() => onEdit(department)}
              className='w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200/60 active:scale-95 cursor-pointer'
            >
              <Edit2 className='w-3.5 h-3.5 text-slate-500' /> แก้ไขหน่วยงาน
            </button>
            <button
              onClick={() => onDelete(department.id)}
              className='w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-rose-100/60 active:scale-95 cursor-pointer'
            >
              <Trash2 className='w-3.5 h-3.5 text-rose-500' /> ลบออก
            </button>
          </div>
        </div>
      </div>
    )
  },
)

DepartmentCard.displayName = 'DepartmentCard'

export default DepartmentCard
