// src/components/dashboard/ContactRequestManager.tsx
import { useEffect, useMemo, useState } from 'react'
import {
  FaCalendarAlt,
  FaCheck,
  FaCheckCircle,
  FaChevronDown,
  FaCircle,
  FaClock,
  FaCommentDots,
  FaComments,
  FaEdit,
  FaEnvelope,
  FaHashtag,
  FaInbox,
  FaLightbulb,
  FaList,
  FaPaperPlane,
  FaPhone,
  FaPhoneAlt,
  FaQuestionCircle,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaUndo,
  FaUser,
} from 'react-icons/fa'
import { useDashboardStore } from '../../stores/useDashboardStore'
import type { ContactRequest } from '../../type'
import ExportExcelButton from '../common/ExportExcelButton'

interface GroupedContacts {
  key: string
  items: ContactRequest[]
}

export default function ContactRequestManager() {
  const contacts = useDashboardStore((state) => state.contacts)
  const fetchAllContacts = useDashboardStore((state) => state.contacts.fetchAll)
  useEffect(() => {
    fetchAllContacts()
  }, [fetchAllContacts])

  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<
    'ทั้งหมด' | 'ยังไม่ตอบกลับ' | 'ตอบกลับแล้ว'
  >('ทั้งหมด')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set())
  const [showTips, setShowTips] = useState(false)

  const groupedData = useMemo<GroupedContacts[]>(() => {
    const groups: Record<string, ContactRequest[]> = {}
    const filtered = contacts.data.filter((item: ContactRequest) => {
      const fullName = `${item.firstName} ${item.lastName}`.toLowerCase()
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.message.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus =
        statusFilter === 'ทั้งหมด' || item.status === statusFilter
      return matchesSearch && matchesStatus
    })
    filtered.forEach((item: ContactRequest) => {
      const key = item.email.toLowerCase()
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })
    return Object.entries(groups).map(([key, items]) => ({
      key,
      items: items.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      ),
    }))
  }, [contacts.data, searchTerm, statusFilter])

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleDetail = (id: string) => {
    setExpandedDetails((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleReplyToggle = async (
    id: string,
    currentStatus: string,
  ): Promise<void> => {
    const { swal } = await import('../../utils/swalConfig')
    const newStatus =
      currentStatus === 'ตอบกลับแล้ว' ? 'ยังไม่ตอบกลับ' : 'ตอบกลับแล้ว'
    const confirm = await swal.fire({
      title: `เปลี่ยนสถานะเป็น "${newStatus}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
    })
    if (!confirm.isConfirmed) return
    try {
      const { api } = await import('../../utils/api')
      const res = await api<{ success: boolean }>(`/contact/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      if (res?.success) {
        await fetchAllContacts()
      }
    } catch {
      /* silent */
    }
  }

  const renderDetailView = (item: ContactRequest) => {
    const isExpanded = expandedDetails.has(item.id)
    const isGroupItem =
      item.preferredContact === 'email' || item.preferredContact === 'tel'
    return (
      <div
        key={item.id}
        className={`border border-slate-100 rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'shadow-sm' : ''}`}
      >
        <div
          className='flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors'
          onClick={() => toggleDetail(item.id)}
        >
          <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shrink-0 border border-blue-200'>
            <FaEnvelope className='text-blue-500 text-sm' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-xs text-slate-400 font-medium mt-0.5'>
              <FaUser className='text-slate-300 mr-1 inline' />
              {item.firstName} {item.lastName}
              {(isGroupItem || item.email) && (
                <>
                  <FaCircle className='text-[4px] text-slate-300 mx-1.5 align-middle inline' />
                  <FaPhone className='text-slate-300 mr-1 inline' />
                  {item.telNumber}
                </>
              )}
            </p>
            <span className='bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded-md font-extrabold uppercase tracking-wide border border-blue-100 inline-flex items-center gap-1 mt-1'>
              <FaComments className='text-[9px]' />
              {groupedData.find((g) => g.items.some((i) => i.id === item.id))
                ?.items.length || 0}
            </span>
          </div>
          <FaChevronDown
            className={`text-slate-400 transition-transform duration-200 shrink-0 mt-1 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>

        {isExpanded && (
          <div className='px-4 pb-4 space-y-3 border-t border-slate-100 pt-3'>
            <div className='flex flex-wrap gap-4 text-xs'>
              <span className='text-xs font-bold text-slate-500 whitespace-nowrap font-mono bg-white border border-slate-200 px-2 py-0.5 rounded inline-flex items-center gap-1'>
                <FaCalendarAlt className='text-slate-300' />
                {new Date(item.createdAt || '').toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className='text-[10px] text-slate-400 font-mono uppercase font-semibold shrink-0 select-all inline-flex items-center gap-1'>
                <FaHashtag className='text-[8px]' />
                {item.id.slice(0, 8)}
              </span>
            </div>

            <div className='flex gap-2'>
              <div className='w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center'>
                <FaUser className='text-blue-500 text-xs' />
              </div>
              <div className='w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center'>
                <FaPhone className='text-emerald-500 text-xs' />
              </div>
            </div>

            <div className='flex gap-3 text-xs'>
              {item.preferredContact === 'email' && (
                <span className='inline-flex items-center gap-1 text-blue-600 font-medium'>
                  <FaEnvelope className='text-blue-400' />
                  อีเมล
                </span>
              )}
              {item.preferredContact === 'tel' && (
                <span className='inline-flex items-center gap-1 text-emerald-600 font-medium'>
                  <FaPhoneAlt className='text-emerald-400' />
                  โทรศัพท์
                </span>
              )}
            </div>

            <div>
              <div className='w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center'>
                <FaCommentDots className='text-amber-500 text-xs' />
              </div>
              <p className='mt-1 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap'>
                {item.message}
              </p>
              <p className='flex items-center gap-1.5 text-xs text-slate-400 mt-2'>
                <FaPaperPlane className='text-slate-300' />
                ส่งเมื่อ:{' '}
                {new Date(item.createdAt || '').toLocaleString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {item.updatedAt && (
                <p className='flex items-center gap-1.5 text-xs text-slate-400 mt-1'>
                  <FaEdit className='text-slate-300' />
                  แก้ไขล่าสุด:{' '}
                  {new Date(item.updatedAt).toLocaleString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>

            <div className='pt-1'>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleReplyToggle(item.id, item.status)
                }}
                className={`text-xs font-bold px-4 py-2 rounded-lg border transition-colors inline-flex items-center gap-1.5 ${
                  item.status === 'ตอบกลับแล้ว'
                    ? 'text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100'
                    : 'text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                {item.status === 'ตอบกลับแล้ว' ? (
                  <>
                    <FaUndo /> เปลี่ยนเป็นยังไม่ตอบ
                  </>
                ) : (
                  <>
                    <FaCheck /> บันทึก "ตอบกลับแล้ว"
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='max-w-5xl mx-auto space-y-6'>
      {/* ---- Header ---- */}
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <h1 className='text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2'>
          <FaInbox className='text-blue-600' />
          รายการข้อความติดต่อกลับ
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

      {/* ---- Filters ---- */}
      <div className='flex items-center gap-3 flex-wrap'>
        <div className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white shadow-sm'>
          {['ทั้งหมด', 'ตอบกลับแล้ว', 'ยังไม่ตอบกลับ'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as typeof statusFilter)}
              className={`text-xs font-semibold px-3 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {status === 'ทั้งหมด' && <FaList className='inline mr-1' />}
              {status === 'ตอบกลับแล้ว' && (
                <FaCheckCircle className='inline mr-1' />
              )}
              {status === 'ยังไม่ตอบกลับ' && (
                <FaClock className='inline mr-1' />
              )}
              {status}
            </button>
          ))}
        </div>

        <div className='relative w-full md:w-80'>
          <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm' />
          <input
            type='text'
            placeholder='ค้นหาชื่อ อีเมล หรือข้อความ...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
        </div>

        <ExportExcelButton
          data={contacts.data as any}
          filename='contact_requests'
        />
      </div>

      {/* ---- Loading ---- */}
      {contacts.loading && (
        <div className='p-12 text-center text-slate-500 font-medium flex flex-col items-center justify-center gap-3'>
          <FaSpinner className='animate-spin text-blue-600 text-2xl' />
          กำลังดึงข้อมูลความคืบหน้าล่าสุด...
        </div>
      )}

      {/* ---- Empty ---- */}
      {!contacts.loading && groupedData.length === 0 && (
        <div className='p-12 text-center text-slate-400 font-medium'>
          <FaInbox className='text-slate-300 text-3xl mb-3 block mx-auto' />
          ไม่พบข้อมูลรายการข้อความที่ระบุตามเงื่อนไขในขณะนี้
        </div>
      )}

      {/* ---- Groups ---- */}
      {!contacts.loading &&
        groupedData.map((group) => {
          const isGroupExpanded = expandedGroups.has(group.key)
          return (
            <div
              key={group.key}
              className='bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden'
            >
              <div
                className='flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors'
                onClick={() => toggleGroup(group.key)}
              >
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shrink-0 border border-blue-200'>
                    <FaEnvelope className='text-blue-500 text-sm' />
                  </div>
                  <div>
                    <p className='text-sm font-bold text-slate-800'>
                      {group.items[0].firstName} {group.items[0].lastName}
                    </p>
                    <p className='text-xs text-slate-400 font-medium mt-0.5'>
                      <FaUser className='text-slate-300 mr-1 inline' />
                      {group.items[0].firstName} {group.items[0].lastName}
                      <FaCircle className='text-[4px] text-slate-300 mx-1.5 align-middle inline' />
                      <FaPhone className='text-slate-300 mr-1 inline' />
                      {group.items[0].telNumber}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <span className='bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded-md font-extrabold uppercase tracking-wide border border-blue-100 inline-flex items-center gap-1'>
                    <FaComments className='text-[9px]' />
                    {group.items.length}
                  </span>
                  <FaChevronDown
                    className={`text-slate-400 transition-transform duration-200 ${isGroupExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>
              {isGroupExpanded && (
                <div className='p-4 space-y-3'>
                  {group.items.map((item) => renderDetailView(item))}
                </div>
              )}
            </div>
          )
        })}

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
                <FaEnvelope className='text-lg shrink-0 mt-0.5 text-blue-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    การจัดกลุ่ม
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    ข้อความจะถูกจัดกลุ่มตามอีเมลผู้ส่งเพื่อให้ติดตามประวัติได้ง่าย
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <FaCheckCircle className='text-lg shrink-0 mt-0.5 text-emerald-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    การตอบกลับ
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    คลิกที่รายการเพื่อดูรายละเอียด จากนั้นกด "บันทึก"
                    เพื่อเปลี่ยนสถานะ
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
