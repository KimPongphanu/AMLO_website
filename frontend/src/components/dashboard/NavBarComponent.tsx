import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaBell, FaCheckCircle } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { contentService } from '../../services/contentService'
import { useAuthStore } from '../../stores/useAuthStore'
import type { CommentItem, ContactRequest } from '../../type'
import { api } from '../../utils/api'

const NOTIF_POLL_INTERVAL = 30000

const getStartOfToday = (): number => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

// ── LocalStorage helpers for "seen" notifications ──
const LS_KEY = 'amlo_seen_notifications'

interface SeenData {
  seenComments: string[]
  seenContacts: string[]
  seenRequests: string[]
}

const loadSeen = (): SeenData => {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw
      ? JSON.parse(raw)
      : { seenComments: [], seenContacts: [], seenRequests: [] }
  } catch {
    return { seenComments: [], seenContacts: [], seenRequests: [] }
  }
}

const saveSeen = (data: SeenData) => {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

// ---------------------------------------------------------
// ClockDisplay Component
// ---------------------------------------------------------
const getThaiFullDate = (date: Date): string => {
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'full',
    calendar: 'buddhist',
  }).format(date)
}

const getThaiTime = (date: Date): string => {
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

const ClockDisplay = () => {
  const [dateTime, setDateTime] = useState<Date>(new Date())
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className='hidden md:block'>
      <h6 className='text-sm md:text-base font-bold text-slate-800'>
        {getThaiFullDate(dateTime)}
      </h6>
      <p className='text-xs md:text-sm text-slate-500'>
        เวลา {getThaiTime(dateTime)} น.
      </p>
    </div>
  )
}

// ---------------------------------------------------------
// Avatar Component
// ---------------------------------------------------------
interface AvatarProps {
  name: string
  bgColor?: string
  size?: string
}

const Avatar = ({
  name,
  bgColor = 'bg-blue-600',
  size = 'w-10 h-10',
}: AvatarProps) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div
      className={`${size} ${bgColor} rounded-full flex items-center justify-center text-white font-bold text-sm border border-slate-300 flex-shrink-0`}
      aria-label={`Profile picture of ${name}`}
    >
      {initials}
    </div>
  )
}

interface NavBarProps {
  toggleMobileMenu: () => void
  onLogout: () => Promise<void>
}

const NavBar: React.FC<NavBarProps> = ({ toggleMobileMenu, onLogout }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [expandedNotifView, setExpandedNotifView] = useState<
    'none' | 'contacts' | 'reviews' | 'requests'
  >('none')

  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const { user } = useAuthStore()

  const [contacts, setContacts] = useState<ContactRequest[]>([])
  const [comments, setComments] = useState<CommentItem[]>([])
  const [pendingRequests, setPendingRequests] = useState<unknown[]>([])
  const [seen, setSeen] = useState<SeenData>(loadSeen)

  // ── Persist seen to localStorage ──
  const updateSeen = (updater: (prev: SeenData) => SeenData) => {
    setSeen((prev) => {
      const next = updater(prev)
      saveSeen(next)
      return next
    })
  }

  // ── Navigate to dashboard menu ──
  const navigateTo = (menuId: string) => {
    sessionStorage.setItem('activeDashboardMenu', menuId)
    window.location.reload()
  }

  // ── Auto-fetch notifications ──
  const fetchNotifications = useCallback(async () => {
    try {
      const promises: Promise<unknown>[] = [
        api<{ success: boolean; data?: ContactRequest[] }>('/contact', {
          method: 'GET',
        }).catch(() => ({ success: false })),
        contentService.getComments(),
      ]
      // Supervisor: fetch pending requests
      if (user?.role === 'SUPERVISOR') {
        promises.push(
          api<{ success: boolean; data?: unknown[] }>(
            '/supervisor-request/pending',
            { method: 'GET' },
          ).catch(() => ({ success: false, data: [] })),
        )
      }
      const [contactRes, commentRes, requestsRes] = await Promise.all(promises)

      if (
        contactRes &&
        'data' in (contactRes as object) &&
        (contactRes as { data?: ContactRequest[] }).data
      )
        setContacts((contactRes as { data: ContactRequest[] }).data)
      const commentData = Array.isArray(commentRes)
        ? commentRes
        : ((commentRes as Record<string, unknown>)?.data as
            | CommentItem[]
            | undefined)
      if (commentData) setComments(commentData)
      if (
        requestsRes &&
        'data' in (requestsRes as object) &&
        (requestsRes as { data?: unknown[] }).data
      )
        setPendingRequests((requestsRes as { data: unknown[] }).data)
    } catch {
      /* silent */
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, NOTIF_POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // ── Compute today's items ──
  const startOfToday = getStartOfToday()

  const todayContacts = useMemo(
    () =>
      contacts.filter((c) => new Date(c.createdAt).getTime() >= startOfToday),
    [contacts, startOfToday],
  )
  const todayComments = useMemo(
    () =>
      comments.filter((c) => new Date(c.createdAt).getTime() >= startOfToday),
    [comments, startOfToday],
  )
  const todayRequests = useMemo(
    () =>
      pendingRequests.filter(
        (r: any) => new Date(r.createdAt || 0).getTime() >= startOfToday,
      ),
    [pendingRequests, startOfToday],
  )

  // ── Unseen counts (excluding seen) ──
  const unreadComments = useMemo(
    () => todayComments.filter((c) => !seen.seenComments.includes(c.id)),
    [todayComments, seen.seenComments],
  )
  const unreadContacts = useMemo(
    () => todayContacts.filter((c) => !seen.seenContacts.includes(c.id)),
    [todayContacts, seen.seenContacts],
  )
  const unreadRequests = useMemo(
    () =>
      todayRequests.filter(
        (r: unknown) =>
          !seen.seenRequests.includes((r as { id: number }).id.toString()),
      ),
    [todayRequests, seen.seenRequests],
  )

  const totalNew =
    unreadComments.length + unreadContacts.length + unreadRequests.length
  const hasAnyToday =
    todayContacts.length + todayComments.length + todayRequests.length > 0

  // Sorted lists
  const latestContacts = useMemo(
    () =>
      [...todayContacts].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [todayContacts],
  )
  const latestReviews = useMemo(
    () => [...todayComments].reverse(),
    [todayComments],
  )

  const currentUser = {
    firstName: user?.firstname || 'Guest',
    lastName: user?.lastname || 'User',
    role: user?.role || 'Admin',
  }
  const fullName = `${currentUser.firstName} ${currentUser.lastName}`.trim()

  // ── Close on click outside ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const targetNode = e.target as Node
      if (userMenuRef.current && !userMenuRef.current.contains(targetNode))
        setIsUserMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(targetNode)) {
        setIsNotifOpen(false)
        setExpandedNotifView('none')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogoutClick = async () => {
    setIsUserMenuOpen(false)
    await onLogout()
  }

  return (
    <header className='bg-white h-20 border-b border-slate-200 flex justify-between items-center px-4 md:px-6 sticky top-0 z-20'>
      <div className='flex items-center gap-x-4 md:gap-x-6'>
        <button
          onClick={toggleMobileMenu}
          className='md:hidden p-2 border border-slate-300 bg-slate-50 active:bg-slate-200 cursor-pointer'
          aria-label='Toggle menu'
        >
          <svg
            className='w-6 h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='square'
              strokeLinejoin='miter'
              strokeWidth='2'
              d='M4 6h16M4 12h16M4 18h16'
            />
          </svg>
        </button>
        <Link to='/'>
          <img
            src='https://www.amlo.go.th/amlo-intranet/images/banners/logo-m.jpg'
            alt='AMLO Logo'
            className='h-12 w-auto object-contain'
          />
        </Link>
        <hr className='hidden md:block w-[2px] h-10 bg-slate-300 border-0' />
        <ClockDisplay />
      </div>

      <div className='flex items-center gap-x-6'>
        {/* Notifications */}
        <div className='relative' ref={notifRef}>
          <button
            className='relative cursor-pointer p-1 hover:bg-slate-100 rounded-full transition-colors'
            aria-label='Notifications'
            onClick={() => {
              setIsNotifOpen(!isNotifOpen)
              // Flow 1: เปิด bell → mark ความคิดเห็นทั้งหมดว่าอ่านแล้ว
              if (!isNotifOpen && unreadComments.length > 0) {
                updateSeen((prev) => ({
                  ...prev,
                  seenComments: [
                    ...prev.seenComments,
                    ...unreadComments.map((c) => c.id),
                  ],
                }))
              }
            }}
          >
            <FaBell className='text-slate-700 text-xl' />
            {totalNew > 0 && (
              <span className='absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 border-2 border-white rounded-full text-[9px] font-bold text-white px-1'>
                {totalNew > 99 ? '99+' : totalNew}
              </span>
            )}
          </button>

          <div
            className={`absolute right-0 top-full mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-200 ${isNotifOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
          >
            <div className='px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center'>
              <h6 className='text-sm font-bold text-slate-800'>การแจ้งเตือน</h6>
              <span className='text-[10px] font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full'>
                วันนี้ {totalNew} · รวม{' '}
                {contacts.length + comments.length + pendingRequests.length}
              </span>
            </div>

            <div className='max-h-96 overflow-y-auto p-2'>
              {!hasAnyToday ? (
                <div className='py-10 text-center text-slate-400'>
                  <FaCheckCircle className='text-slate-300 text-3xl mb-3 block mx-auto' />
                  <p className='text-sm font-medium'>
                    ไม่มีการแจ้งเตือนในวันนี้
                  </p>
                </div>
              ) : (
                <>
                  {/* Contacts */}
                  {(expandedNotifView === 'none' ||
                    expandedNotifView === 'contacts') &&
                    todayContacts.length > 0 && (
                      <div className='mb-2'>
                        <div className='px-2 py-1 flex items-center gap-2'>
                          <span className='text-xs font-bold text-slate-500'>
                            ติดต่อ
                          </span>
                          <hr className='flex-1 border-slate-200' />
                        </div>
                        {latestContacts
                          .slice(0, expandedNotifView === 'contacts' ? 5 : 2)
                          .map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                // Flow 2: คลิก item → mark รายการนี้ว่าอ่านแล้ว
                                updateSeen((prev) => ({
                                  ...prev,
                                  seenContacts: prev.seenContacts.includes(
                                    item.id,
                                  )
                                    ? prev.seenContacts
                                    : [...prev.seenContacts, item.id],
                                }))
                                navigateTo('contacts')
                              }}
                              className='px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors'
                            >
                              <p className='text-sm text-slate-800 truncate font-medium'>
                                {item.message}
                              </p>
                              <p className='text-[10px] text-slate-400 mt-0.5'>
                                {item.firstName} {item.lastName}
                              </p>
                            </div>
                          ))}
                        {expandedNotifView === 'none' &&
                          todayContacts.length > 2 && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedNotifView('contacts')
                              }}
                              className='px-3 py-1.5 text-xs text-center text-blue-500 font-medium cursor-pointer hover:bg-blue-50 rounded-lg'
                            >
                              +{todayContacts.length - 2} เพิ่มเติม
                            </div>
                          )}
                        {expandedNotifView === 'contacts' && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedNotifView('none')
                            }}
                            className='px-3 py-1.5 text-xs text-center text-slate-500 font-medium cursor-pointer hover:bg-slate-100 rounded-lg'
                          >
                            แสดงน้อยลง
                          </div>
                        )}
                      </div>
                    )}

                  {/* Reviews */}
                  {(expandedNotifView === 'none' ||
                    expandedNotifView === 'reviews') &&
                    todayComments.length > 0 && (
                      <div className='mb-2'>
                        <div className='px-2 py-1 flex items-center gap-2'>
                          <span className='text-xs font-bold text-slate-500'>
                            ความคิดเห็น
                          </span>
                          <hr className='flex-1 border-slate-200' />
                        </div>
                        {latestReviews
                          .slice(0, expandedNotifView === 'reviews' ? 5 : 2)
                          .map((item) => (
                            <div
                              key={item.id}
                              onClick={() => navigateTo('reviews')}
                              className='px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors'
                            >
                              <p className='text-sm text-slate-800 truncate font-medium'>
                                {item.msg}
                              </p>
                              <p className='text-[10px] text-slate-400 mt-0.5'>
                                {item.star} ดาว
                              </p>
                            </div>
                          ))}
                        {expandedNotifView === 'none' &&
                          todayComments.length > 2 && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedNotifView('reviews')
                              }}
                              className='px-3 py-1.5 text-xs text-center text-blue-500 font-medium cursor-pointer hover:bg-blue-50 rounded-lg'
                            >
                              +{todayComments.length - 2} เพิ่มเติม
                            </div>
                          )}
                        {expandedNotifView === 'reviews' && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedNotifView('none')
                            }}
                            className='px-3 py-1.5 text-xs text-center text-slate-500 font-medium cursor-pointer hover:bg-slate-100 rounded-lg'
                          >
                            แสดงน้อยลง
                          </div>
                        )}
                      </div>
                    )}

                  {/* Supervisor Requests */}
                  {user?.role === 'SUPERVISOR' &&
                    (expandedNotifView === 'none' ||
                      expandedNotifView === 'requests') &&
                    todayRequests.length > 0 && (
                      <div className='mb-2'>
                        <div className='px-2 py-1 flex items-center gap-2'>
                          <span className='text-xs font-bold text-slate-500'>
                            📋 คำร้อง
                          </span>
                          <hr className='flex-1 border-slate-200' />
                        </div>
                        {todayRequests
                          .slice(0, expandedNotifView === 'requests' ? 5 : 2)
                          .map((item: unknown) => {
                            const req = item as {
                              id: number
                              actionType: string
                              reason: string
                              requester?: {
                                firstname: string
                                lastname: string
                              }
                            }
                            return (
                              <div
                                key={req.id}
                                onClick={() => {
                                  updateSeen((prev) => ({
                                    ...prev,
                                    seenRequests: prev.seenRequests.includes(
                                      req.id.toString(),
                                    )
                                      ? prev.seenRequests
                                      : [
                                          ...prev.seenRequests,
                                          req.id.toString(),
                                        ],
                                  }))
                                  navigateTo('requests')
                                }}
                                className='px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors'
                              >
                                <p className='text-sm text-slate-800 truncate font-medium'>
                                  {req.actionType} — {req.reason}
                                </p>
                                <p className='text-[10px] text-slate-400 mt-0.5'>
                                  โดย {req.requester?.firstname}{' '}
                                  {req.requester?.lastname}
                                </p>
                              </div>
                            )
                          })}
                        {expandedNotifView === 'none' &&
                          todayRequests.length > 2 && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedNotifView('requests')
                              }}
                              className='px-3 py-1.5 text-xs text-center text-blue-500 font-medium cursor-pointer hover:bg-blue-50 rounded-lg'
                            >
                              +{todayRequests.length - 2} เพิ่มเติม
                            </div>
                          )}
                        {expandedNotifView === 'requests' && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedNotifView('none')
                            }}
                            className='px-3 py-1.5 text-xs text-center text-slate-500 font-medium cursor-pointer hover:bg-slate-100 rounded-lg'
                          >
                            แสดงน้อยลง
                          </div>
                        )}
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>

        <hr className='w-[2px] h-8 bg-slate-200 border-0' />

        {/* User Menu */}
        <div className='relative' ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className='flex items-center gap-x-3 cursor-pointer hover:opacity-80 transition-opacity outline-none'
            aria-label='User menu'
          >
            <div
              className='hidden sm:flex flex-col items-center justify-center w-36 md:w-48'
              title={fullName.length > 20 ? fullName : undefined}
            >
              <h6 className='text-sm font-bold text-slate-800 truncate w-full text-center'>
                {currentUser.firstName} {currentUser.lastName}
              </h6>
              <p className='text-xs text-slate-500 text-center'>
                {currentUser.role}
              </p>
            </div>
            <Avatar name={fullName} />
            <span
              className={`text-[10px] text-slate-500 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
            >
              ▼
            </span>
          </button>

          <div
            className={`absolute right-0 top-full mt-3 w-52 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-200 ${isUserMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
          >
            <div className='px-4 py-3 border-b border-slate-100'>
              <p className='text-xs font-bold text-slate-800'>{fullName}</p>
              <p className='text-xs text-slate-400 mt-0.5'>
                {currentUser.role}
              </p>
            </div>
            <button
              onClick={handleLogoutClick}
              className='flex items-center gap-2.5 w-full px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer outline-none'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='w-4 h-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                />
              </svg>
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default NavBar
