import { useMemo } from 'react'
import type { NewsItem } from '../../type'
import { parseThaiDateToTimestamp } from '../../utils/dateUtils'
import ArticleCard from './ArticleCard'
import ArticleCardSkeleton from './ArticleCardSkeleton'
import HorizontalScrollSection from './HorizontalScrollSection'
import SectionHeader from './SectionHeader'

interface NewsSectionProps {
  title: string
  items: NewsItem[]
  basePath: string
  viewAllLink: string
  isLoading?: boolean
  skeletonCount?: number
}

const NewsSection = ({
  title,
  items,
  basePath,
  viewAllLink,
  isLoading = false,
  skeletonCount = 5,
}: NewsSectionProps) => {
  const sortedItems = useMemo(() => {
    if (!items) return []
    return [...items]
      .filter((item) => item.isShow !== false)
      .sort(
        (a, b) =>
          parseThaiDateToTimestamp(b.date) - parseThaiDateToTimestamp(a.date),
      )
  }, [items])

  if (!isLoading && sortedItems.length === 0) return null

  return (
    <div className='pt-8'>
      <SectionHeader title={title} viewAllLink={viewAllLink} />

      {isLoading ? (
        <HorizontalScrollSection>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </HorizontalScrollSection>
      ) : (
        <HorizontalScrollSection>
          {sortedItems.slice(0, 5).map((item) => (
            <ArticleCard key={item.id} item={item} basePath={basePath} />
          ))}
        </HorizontalScrollSection>
      )}
    </div>
  )
}

export default NewsSection
