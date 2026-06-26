// src/components/dashboard/department/DepartmentManagerDashboard.tsx
import { Folder, Grid, HelpCircle, List, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FaBuilding,
  FaLightbulb,
  FaQuestionCircle,
  FaTimes,
} from 'react-icons/fa'
import { useDashboardStore } from '../../../stores/useDashboardStore'
import type { DepartmentItem, ViewMode } from '../../../type/department'
import DepartmentCard from './sub_components/DepartmentCard'
import DepartmentFormModal from './sub_components/DepartmentFormModal'
import DepartmentList from './sub_components/DepartmentList'

const SCROLLBAR_STYLES = `
  .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .animate-fade-in { animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
  @keyframes modalFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`

export default function DepartmentManagerDashboard() {
  const departmentList = useDashboardStore((state) => state.departmentList)
  const fetchDepartments = useDashboardStore((state) => state.fetchDepartments)
  const departmentLoading = useDashboardStore(
    (state) => state.departmentLoading,
  )
  const deleteDepartment = useDashboardStore((state) => state.deleteDepartment)

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  const [showTips, setShowTips] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingDepartment, setEditingDepartment] =
    useState<DepartmentItem | null>(null)

  const filteredDepartments = useMemo<DepartmentItem[]>(() => {
    const cleanSearch = searchTerm.toLowerCase().trim()
    if (!cleanSearch) return departmentList

    return departmentList.filter(
      (item: DepartmentItem) =>
        item.title.toLowerCase().includes(cleanSearch) ||
        (item.content && item.content.toLowerCase().includes(cleanSearch)),
    )
  }, [departmentList, searchTerm])

  const handleOpenAddModal = useCallback((): void => {
    setEditingDepartment(null)
    setIsModalOpen(true)
  }, [])

  const handleOpenEditModal = useCallback((dept: DepartmentItem): void => {
    setEditingDepartment(dept)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback((): void => {
    setIsModalOpen(false)
    setEditingDepartment(null)
  }, [])

  const handleDeleteClick = useCallback(
    async (id: number): Promise<void> => {
      const Swal = (await import('sweetalert2')).default
      const result = await Swal.fire({
        title: 'ยืนยันการลบหน่วยงาน?',
        text: 'ข้อมูลภาควิชาและอัลบั้มภาพทั้งหมดจะถูกทำลายถาวร',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ยืนยันการลบ',
        cancelButtonText: 'ยกเลิก',
      })

      if (!result.isConfirmed) return

      Swal.fire({
        title: 'กำลังประมวลผล...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      })

      const success = await deleteDepartment(id)
      if (success) {
        Swal.fire({
          icon: 'success',
          title: 'ลบข้อมูลสำเร็จ',
          timer: 1500,
          showConfirmButton: false,
        })
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถลบข้อมูลจากฐานข้อมูลได้',
          confirmButtonColor: '#dc2626',
        })
      }
    },
    [deleteDepartment],
  )

  return (
    <div className='p-4 md:p-6 max-w-7xl mx-auto space-y-6 font-sans antialiased text-slate-800'>
      {/* Top Banner Control Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm'>
        <div className='flex items-center gap-4'>
          <div className='p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0'>
            <Folder className='w-6 h-6' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-xl font-bold text-slate-900 tracking-tight'>
                จัดการโครงสร้างหน่วยงานภายใน
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
            <p className='text-sm text-slate-500 mt-0.5'>
              เพิ่ม แก้ไข
              หรือลบข้อมูลหน่วยงานพร้อมทั้งคลังภาพและวิดีโอสื่อประชาสัมพันธ์
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAddModal}
          className='w-full sm:w-auto bg-[#185FA5] hover:bg-[#134b82] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95'
        >
          <Plus className='w-4 h-4' /> เพิ่มหน่วยงานใหม่
        </button>
      </div>

      {/* Filter and View Selection Strip */}
      <div className='flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm gap-4'>
        <input
          type='text'
          placeholder='ค้นหาด้วยชื่อหรือรายละเอียดหน่วยงาน...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full sm:w-80 px-4 py-2 text-sm border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium'
        />
        <div className='flex bg-slate-100 p-1 rounded-xl items-center border border-slate-200/40 shrink-0 select-none'>
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Grid className='w-4 h-4' />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <List className='w-4 h-4' />
          </button>
        </div>
      </div>

      {/* Grid Content rendering block */}
      {departmentLoading ? (
        <div className='flex flex-col justify-center items-center h-64 gap-3 bg-white border border-slate-100 rounded-2xl shadow-sm'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600' />
          <p className='text-sm text-slate-400 font-medium'>
            กำลังเตรียมคลังข้อมูลโครงสร้าง...
          </p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className='flex flex-col justify-center items-center h-64 gap-2 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400'>
          <HelpCircle className='w-12 h-12 text-slate-300' />
          <p className='font-bold text-slate-700'>ไม่พบข้อมูลหน่วยงาน</p>
          <p className='text-xs text-slate-400'>
            ทดลองเปลี่ยนคำค้นหา หรือกดปุ่มระบบสร้างหน่วยงานใหม่ด้านบน
          </p>
        </div>
      ) : viewMode === 'card' ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredDepartments.map((dept: DepartmentItem) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        <DepartmentList
          departments={filteredDepartments}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Add & Edit Modal Sheet Component */}
      {isModalOpen && (
        <DepartmentFormModal
          department={editingDepartment}
          onClose={handleCloseModal}
        />
      )}

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
                <FaBuilding className='text-lg shrink-0 mt-0.5 text-blue-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    การจัดการหน่วยงาน
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    เพิ่ม แก้ไข หรือลบข้อมูลหน่วยงาน พร้อมทั้งคลังภาพและวิดีโอ
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

      <style>{`${SCROLLBAR_STYLES}
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
