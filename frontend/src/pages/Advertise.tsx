import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SearchFilter from '../components/SearchFilter'
import { useContentStore } from '../stores/useContentStore'

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
]

const API_URL = import.meta.env.VITE_API_URL || ''

const formatThaiDate = (isoString: string) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return isoString
  const day = date.getDate()
  const month = THAI_MONTHS[date.getMonth()]
  const year = date.getFullYear() + 543
  return `${day} ${month} ${year}`
}

const HorizontalCardSkeleton = () => (
  <div className='flex flex-col md:flex-row bg-white rounded-2xl shadow-sm overflow-hidden md:h-[280px] animate-pulse'>
    <div className='w-full md:w-1/3 lg:w-80 h-56 md:h-full flex-shrink-0 bg-slate-200'></div>
    <div className='p-6 md:p-8 flex flex-col flex-grow justify-between'>
      <div>
        <div className='h-4 bg-slate-200 rounded w-24 mb-4'></div>
        <div className='h-6 md:h-8 bg-slate-200 rounded w-full mb-3'></div>
        <div className='h-6 md:h-8 bg-slate-200 rounded w-3/4 mb-6'></div>
        <div className='h-4 bg-slate-200 rounded w-full mb-2'></div>
        <div className='h-4 bg-slate-200 rounded w-5/6'></div>
      </div>
      <div className='mt-6 h-4 bg-slate-200 rounded w-32'></div>
    </div>
  </div>
)

const Advertise = () => {
  const prList = useContentStore((state) => state.prList)
  const isLoading = useContentStore((state) => state.isLoading)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value)
    setCurrentPage(1)
  }

  const visibleList = useMemo(() => {
    if (!prList) return []
    return prList.filter((item) => item.isShow !== false)
  }, [prList])

  const availableMonths = useMemo(() => {
    const months = visibleList.map((item) => {
      const d = new Date(item.date)
      return isNaN(d.getTime()) ? '' : THAI_MONTHS[d.getMonth()]
    }).filter(Boolean)
    return Array.from(new Set(months)).sort(
      (a, b) => THAI_MONTHS.indexOf(a) - THAI_MONTHS.indexOf(b),
    )
  }, [visibleList])

  const filteredData = useMemo(() => {
    return visibleList
      .filter((item) => {
        const matchesSearch =
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesMonth =
          selectedMonth === '' || 
          (!isNaN(new Date(item.date).getTime()) && THAI_MONTHS[new Date(item.date).getMonth()] === selectedMonth)
        return matchesSearch && matchesMonth
      })
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
  }, [visibleList, searchTerm, selectedMonth])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  return (
    <div className='w-full max-w-7xl mx-auto px-6 pt-32 pb-20 min-h-screen'>
      <div className='mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6'>
        <div>
          <h1 className='text-4xl font-bold text-slate-800 border-l-8 border-blue-600 pl-4'>
            ข่าวประชาสัมพันธ์
          </h1>
          <p className='text-gray-500 mt-2 text-lg'>
            ประกาศสำคัญจากสำนักงาน ปปง.
          </p>
        </div>

        {!isLoading && visibleList.length > 0 && (
          <SearchFilter
            searchTerm={searchTerm}
            setSearchTerm={handleSearchChange}
            selectedMonth={selectedMonth}
            setSelectedMonth={handleMonthChange}
            availableMonths={availableMonths}
            placeholder='ค้นหาประกาศ...'
          />
        )}
      </div>

      <div className='flex flex-col gap-6'>
        {isLoading ? (
          [1, 2, 3].map((key) => <HorizontalCardSkeleton key={key} />)
        ) : visibleList.length === 0 ? (
          <div className='text-center text-gray-500 py-10 bg-white rounded-2xl shadow-sm'>
            ไม่มีข้อมูลประชาสัมพันธ์ในขณะนี้
          </div>
        ) : filteredData.length === 0 ? (
          <div className='text-center py-16 bg-white rounded-2xl shadow-sm flex flex-col items-center'>
            <svg
              className='w-16 h-16 text-slate-300 mb-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <h3 className='text-lg font-bold text-slate-700 mb-1'>
              ไม่พบประกาศที่คุณค้นหา
            </h3>
            <p className='text-slate-500 text-sm'>
              ลองเปลี่ยนคำค้นหา หรือเลือกเดือนอื่นดูนะครับ
            </p>
            <button
              onClick={() => {
                handleSearchChange('')
                handleMonthChange('')
              }}
              className='mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors'
            >
              ล้างการค้นหา
            </button>
          </div>
        ) : (
          <>
            {currentItems.map((item) => (
              <Link
                to={`/advertise/${item.id}`}
                key={item.id}
                className='group flex flex-col md:flex-row bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 md:h-[280px]'
              >
                <div className='w-full md:w-1/3 lg:w-80 h-56 md:h-full flex-shrink-0 overflow-hidden relative bg-slate-100'>
                  <img
                    src={
                      item.image_src.startsWith('blob:')
                        ? item.image_src
                        : `${API_URL}${item.image_src}`
                    }
                    alt={item.title}
                    className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                  />
                  <div className='absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10'>
                    ประชาสัมพันธ์
                  </div>
                </div>

                <div className='p-6 md:p-8 flex flex-col flex-grow justify-between'>
                  <div>
                    <div className='text-sm text-slate-400 mb-2 font-medium'>
                      {formatThaiDate(item.date)}
                    </div>
                    <h2 className='text-xl md:text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2'>
                      {item.title}
                    </h2>
                    <p className='text-slate-600 leading-relaxed line-clamp-3'>
                      {item.description}
                    </p>
                  </div>
                  <div className='mt-6 flex items-center text-blue-600 font-semibold text-sm'>
                    อ่านรายละเอียดเพิ่มเติม
                    <svg
                      className='w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 5l7 7-7 7'
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='flex justify-center items-center gap-1.5 md:gap-2 pt-8 pb-4 flex-wrap'>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className='px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center'
                >
                  <svg
                    className='w-4 h-4 mr-1 md:hidden'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M15 19l-7-7 7-7'
                    />
                  </svg>
                  <span className='hidden md:inline'>❮ ก่อนหน้า</span>
                </button>

                <div className='flex items-center gap-1.5'>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all duration-200 ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600/20'
                            : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className='px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center'
                >
                  <span className='hidden md:inline'>ถัดไป ❯</span>
                  <svg
                    className='w-4 h-4 ml-1 md:hidden'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Advertise
