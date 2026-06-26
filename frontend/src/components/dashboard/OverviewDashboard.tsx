// src/components/dashboard/OverviewDashboard.tsx
import { useEffect, useState } from 'react'
import {
  FaBuilding,
  FaBullhorn,
  FaEnvelope,
  FaLightbulb,
  FaNewspaper,
  FaQuestionCircle,
  FaStar,
  FaTimes,
} from 'react-icons/fa'
import { API_URL } from '../../config/constants'
import { contentService } from '../../services/contentService'
import { useAuthStore } from '../../stores/useAuthStore'
import type { SliderImage } from '../../type'
import { api } from '../../utils/api'

interface OverviewStats {
  newsCount: number
  prCount: number
  departmentCount: number
  commentCount: number
  contactCount: number
  userCount: number
}

interface RecentItem {
  id: string
  text: string
  detail: string
  time: string
  iconType: 'star' | 'envelope'
  color: string
  user?: string
}

type SliderState = SliderImage[]

const iconMap: Record<string, React.ReactNode> = {
  'fa-newspaper': <FaNewspaper className='text-white text-lg' />,
  'fa-bullhorn': <FaBullhorn className='text-white text-lg' />,
  'fa-building': <FaBuilding className='text-white text-lg' />,
  'fa-star': <FaStar className='text-white text-lg' />,
  'fa-envelope': <FaEnvelope className='text-white text-lg' />,
}

export default function OverviewDashboard() {
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState<OverviewStats>({
    newsCount: 0,
    prCount: 0,
    departmentCount: 0,
    commentCount: 0,
    contactCount: 0,
    userCount: 0,
  })
  const [recentComments, setRecentComments] = useState<RecentItem[]>([])
  const [recentContacts, setRecentContacts] = useState<RecentItem[]>([])
  const [slides, setSlides] = useState<SliderState>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTips, setShowTips] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsRes, prRes, deptRes, commentsRes, contactsRes, sliderRes] =
          await Promise.all([
            contentService.getNews('NEWS', 1),
            contentService.getNews('PR', 1),
            contentService.getDepartments(),
            contentService.getComments(),
            api<{ success: boolean; data?: unknown[] }>('/contact', {
              method: 'GET',
            }).catch(() => ({ success: false, data: [] })),
            contentService.getSlider(),
          ])

        const extractData = (res: unknown) =>
          Array.isArray(res) ? res : (res as { data?: unknown[] })?.data || []
        setStats({
          newsCount: extractData(newsRes).length,
          prCount: extractData(prRes).length,
          departmentCount: extractData(deptRes).length,
          commentCount: extractData(commentsRes).length,
          contactCount:
            (contactsRes as { data?: unknown[] })?.data?.length || 0,
          userCount: 0,
        })
        setSlides(sliderRes || [])

        const comments = (
          extractData(commentsRes) as {
            id: string
            msg: string
            star: number
            createdAt: string
          }[]
        )
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime(),
          )
          .slice(0, 5)
        setRecentComments(
          comments.map((c) => ({
            id: c.id,
            text: c.msg || '',
            detail: `${'⭐'.repeat(c.star || 0)}`,
            time: timeAgo(c.createdAt),
            iconType: 'star' as const,
            color: c.star >= 4 ? 'text-amber-500' : 'text-gray-400',
          })),
        )

        const contacts = (
          (
            contactsRes as {
              data?: {
                id: string
                first_name: string
                last_name: string
                message: string
                created_at: string
              }[]
            }
          )?.data || []
        )
          .sort(
            (a, b) =>
              new Date(b.created_at || 0).getTime() -
              new Date(a.created_at || 0).getTime(),
          )
          .slice(0, 5)
        setRecentContacts(
          contacts.map((c) => ({
            id: c.id,
            text: `${c.first_name || ''} ${c.last_name || ''}`,
            detail: c.message || '',
            time: timeAgo(c.created_at),
            iconType: 'envelope' as const,
            color: 'text-blue-500',
          })),
        )
      } catch {
        /* silent */
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-400 font-medium'>
            กำลังโหลดข้อมูล...
          </p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      icon: 'fa-newspaper',
      label: 'ข่าว/กิจกรรม',
      value: stats.newsCount,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      icon: 'fa-bullhorn',
      label: 'ประชาสัมพันธ์',
      value: stats.prCount,
      gradient: 'from-violet-500 to-violet-600',
    },
    {
      icon: 'fa-building',
      label: 'หน่วยงาน',
      value: stats.departmentCount,
      gradient: 'from-indigo-500 to-indigo-600',
    },
    {
      icon: 'fa-star',
      label: 'รีวิว',
      value: stats.commentCount,
      gradient: 'from-amber-500 to-amber-600',
    },
    {
      icon: 'fa-envelope',
      label: 'ติดต่อ',
      value: stats.contactCount,
      gradient: 'from-emerald-500 to-emerald-600',
    },
  ]

  return (
    <div className='max-w-6xl mx-auto space-y-8'>
      {/* ─── Slider Preview ─── */}
      {slides.length > 0 && (
        <section className='hidden md:block w-full'>
          <div className='flex flex-row w-full justify-between gap-2 overflow-hidden'>
            {slides.map((slide) => {
              const src = slide.image_url.startsWith('http')
                ? slide.image_url
                : `${API_URL}${slide.image_url}`
              return (
                <div key={slide.id} className='flex-1 min-w-0'>
                  <img
                    src={src}
                    alt='Slide'
                    className='w-full h-auto aspect-video object-cover rounded-md'
                  />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ─── Welcome ─── */}
      <section>
        <div className='flex items-center justify-between gap-3 mb-1'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold text-gray-900'>ภาพรวมระบบ</h1>
            <span className='px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100'>
              {user?.role === 'SUPERVISOR' ? 'Supervisor' : 'Admin'}
            </span>
          </div>
          <button
            type='button'
            onClick={() => setShowTips(true)}
            aria-label='ดูวิธีการใช้งาน'
            className='w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors'
          >
            <FaQuestionCircle className='w-5 h-5' />
          </button>
        </div>
        <p className='text-sm text-gray-500'>
          สวัสดี{' '}
          <span className='font-semibold text-gray-700'>{user?.firstname}</span>{' '}
          — ภาพรวมเนื้อหาทั้งหมดในระบบ
        </p>
      </section>

      {/* ─── Stat Cards ─── */}
      <section className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
        {statCards.map((card) => (
          <div
            key={card.label}
            className='bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5'
          >
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} shadow-sm flex items-center justify-center shrink-0`}
            >
              {iconMap[card.icon]}
            </div>
            <div>
              <p className='text-2xl font-bold text-gray-900'>{card.value}</p>
              <p className='text-[11px] font-medium text-gray-500 uppercase tracking-wider'>
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ─── Recent Activity ─── */}
      <section className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Comments */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
          <div className='px-5 py-4 border-b border-gray-50 flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <div className='w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center'>
                <FaStar className='text-amber-500 text-xs' />
              </div>
              <span className='text-sm font-bold text-gray-800'>
                รีวิวล่าสุด
              </span>
            </div>
            <span className='text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md font-medium'>
              {recentComments.length} รายการ
            </span>
          </div>
          <div className='divide-y divide-gray-50'>
            {recentComments.length === 0 ? (
              <p className='px-5 py-10 text-sm text-gray-400 text-center'>
                ยังไม่มีรีวิว
              </p>
            ) : (
              recentComments.map((item) => (
                <div
                  key={item.id}
                  className='px-5 py-3.5 hover:bg-gray-50/80 transition-colors'
                >
                  <div className='flex items-start gap-3'>
                    <div className='w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5'>
                      <FaStar className={`${item.color} text-[10px]`} />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm text-gray-700 line-clamp-2 leading-snug'>
                        {item.text}
                      </p>
                      <p className='text-xs text-gray-400 mt-1'>
                        {item.detail}
                      </p>
                    </div>
                    <span className='text-[11px] text-gray-400 shrink-0 whitespace-nowrap'>
                      {item.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contacts */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
          <div className='px-5 py-4 border-b border-gray-50 flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <div className='w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center'>
                <FaEnvelope className='text-blue-500 text-xs' />
              </div>
              <span className='text-sm font-bold text-gray-800'>
                ติดต่อล่าสุด
              </span>
            </div>
            <span className='text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md font-medium'>
              {recentContacts.length} รายการ
            </span>
          </div>
          <div className='divide-y divide-gray-50'>
            {recentContacts.length === 0 ? (
              <p className='px-5 py-10 text-sm text-gray-400 text-center'>
                ยังไม่มีคำร้อง
              </p>
            ) : (
              recentContacts.map((item) => (
                <div
                  key={item.id}
                  className='px-5 py-3.5 hover:bg-gray-50/80 transition-colors'
                >
                  <div className='flex items-start gap-3'>
                    <div className='w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5'>
                      <FaEnvelope className={`${item.color} text-[10px]`} />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-medium text-gray-700 truncate'>
                        {item.text}
                      </p>
                      <p className='text-xs text-gray-400 mt-1 line-clamp-2 leading-snug'>
                        {item.detail}
                      </p>
                    </div>
                    <span className='text-[11px] text-gray-400 shrink-0 whitespace-nowrap'>
                      {item.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <div className='text-center pb-4'>
        <p className='text-[11px] text-gray-400'>
          ข้อมูลอัปเดตล่าสุดเมื่อโหลดหน้านี้ ·{' '}
          <span className='font-medium'>
            {new Date().toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </p>
      </div>

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
                <FaStar className='text-lg shrink-0 mt-0.5 text-amber-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    ภาพรวมระบบ
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    แสดงสถิติและข้อมูลล่าสุดของเนื้อหาทั้งหมดในระบบ
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <FaEnvelope className='text-lg shrink-0 mt-0.5 text-blue-500' />
                <div>
                  <p className='text-sm font-medium text-[#202124]'>
                    กิจกรรมล่าสุด
                  </p>
                  <p className='text-sm text-[#5f6368] leading-relaxed'>
                    ดูรีวิวและข้อความติดต่อล่าสุดที่เข้ามาในระบบ
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

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'เมื่อกี้'
  if (mins < 60) return `${mins} นาที`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ชม.`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} วัน`
  return new Date(dateStr).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  })
}
