import { Link } from 'react-router-dom'
import { API_URL } from '../../config/constants'
import type { NewsItem } from '../../type'

const ArticleCard = ({
  item,
  basePath,
}: {
  item: NewsItem
  basePath: string
}) => {
  return (
    <Link
      to={`/${basePath}/${item.id}`}
      className='shrink-0 w-[260px] md:w-[320px] h-full block group'
    >
      <div className='bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-md flex flex-col hover:shadow-xl transition-shadow h-full'>
        {/* ส่วนรูปภาพ */}
        <div className='h-[180px] md:h-[200px] w-full overflow-hidden bg-slate-100 shrink-0'>
          <img
            src={
              item.image_src?.startsWith('http')
                ? item.image_src
                : `${API_URL}${item.image_src}`
            }
            alt={item.title}
            className='w-full h-full object-cover hover:scale-105 transition-transform duration-500'
            loading='lazy'
          />
        </div>

        {/* ส่วนเนื้อหา */}
        <div className='p-4 md:p-5 flex flex-col flex-grow'>
          <p className='text-xs md:text-sm text-blue-600 font-medium mb-1'>
            {item.date?.includes('T') ? item.date.split('T')[0] : item.date}
          </p>
          <h3 className='text-base md:text-lg font-bold text-gray-800 line-clamp-2 mb-2'>
            {item.title}
          </h3>
          <p className='text-xs md:text-sm text-gray-500 line-clamp-3 mb-4'>
            {item.description}
          </p>

          {/* ส่วนปุ่ม "อ่านเพิ่มเติม" และลูกศรยืดหดตามรูปภาพ */}
          <div className='mt-auto flex items-center justify-start pt-2'>
            {/* ปรับช่องไฟตรง gap-1 เป็น gap-2 เพื่อเพิ่มระยะห่าง */}
            <div className='flex items-center gap-2 text-sm md:text-base text-blue-500 font-medium group-hover:text-blue-700 transition-colors duration-300'>
              <span>อ่านเพิ่มเติม</span>

              <svg
                className='w-3 h-3 overflow-visible'
                viewBox='0 0 10 10'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
              >
                {/* 1. เส้นตรง: ปรับแก้จุดเริ่มจาก 0.5 เป็น 2.5 เพื่อลดความยาวของเส้น (Width เล็กลง) และปรับเป็น duration-300 */}
                <path
                  d='M1 5.5h5'
                  strokeLinecap='round'
                  className='transition-all duration-300 ease-in-out opacity-0 translate-x-[-3px] group-hover:opacity-100 group-hover:translate-x-0'
                />
                {/* 2. หัวลูกศร: ปรับเป็น duration-300 เพื่อความเร็วที่กระชับขึ้น */}
                <path
                  d='M1.5 1.5l4 4-4 4'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='transition-transform duration-300 ease-in-out translate-x-[-2px] group-hover:translate-x-[2px]'
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ArticleCard
