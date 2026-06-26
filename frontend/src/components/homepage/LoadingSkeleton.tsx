import ArticleCardSkeleton from './ArticleCardSkeleton'
import DepartmentSkeleton from './DepartmentSkeleton'
import HorizontalScrollSection from './HorizontalScrollSection'
import SectionHeader from './SectionHeader'

const LoadingSkeleton = () => {
  return (
    <div className='px-4 md:px-8 pb-10'>
      {/* Advertisement Section Skeleton */}
      <div className='pt-8'>
        <SectionHeader title='ข่าวประชาสัมพันธ์' viewAllLink='/advertise' />
        <HorizontalScrollSection>
          {[1, 2, 3, 4, 5].map((i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </HorizontalScrollSection>
      </div>

      {/* News Section Skeleton */}
      <div className='mt-12 md:mt-16'>
        <SectionHeader title='กิจกรรมและประกาศ' viewAllLink='/news' />
        <HorizontalScrollSection>
          {[1, 2, 3, 4, 5].map((i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </HorizontalScrollSection>
      </div>

      {/* Department Section Skeleton */}
      <div className='mt-12 md:mt-16'>
        <div className='h-8 md:h-10 bg-slate-200 rounded w-32 md:w-40 animate-pulse mb-6 md:mb-8'></div>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-4 md:gap-y-12 md:gap-x-8'>
          {[1, 2, 3, 4].map((i) => (
            <DepartmentSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoadingSkeleton
