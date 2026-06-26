import { useEffect, useState } from 'react'
import DepartmentShowcase from '../components/DepartmentShowcase'
import CommentSlider from '../components/homepage/CommentSlider'
import LoadingSkeleton from '../components/homepage/LoadingSkeleton'
import NewsSection from '../components/homepage/NewsSection'
import Slider from '../components/homepage/Slider'
import { contentService } from '../services/contentService'
import { useContentStore } from '../stores/useContentStore'
import type { BannerImage } from '../type'

const API_URL = import.meta.env.VITE_API_URL || ''

const HomePage = () => {
  const { prList, newsList, commentList, isLoading, fetchPublicData } =
    useContentStore()

  const [bannerImages, setBannerImages] = useState<BannerImage[]>([])

  useEffect(() => {
    fetchPublicData()
    contentService.getBanners().then((data) => setBannerImages(data))
  }, [fetchPublicData])

  return (
    <div className='bg-slate-50 min-h-screen pt-0 w-full'>
      {/* Main Banner Slider */}
      {bannerImages.length > 0 && (
        <div className='pt-16 lg:pt-0 pb-10 bg-slate-50'>
          <Slider
            slides={bannerImages.map((banner) => ({
              id: banner.id,
              image: banner.image_url.startsWith('http')
                ? banner.image_url
                : `${API_URL}${banner.image_url}`,
              link: banner.link_url || undefined,
            }))}
          />
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <div className='px-4 md:px-8 pb-10'>
            {/* Advertisement Section */}
            <NewsSection
              title='ข่าวประชาสัมพันธ์'
              items={prList}
              basePath='advertise'
              viewAllLink='/advertise'
            />

            {/* News Section */}
            <div className='mt-12 md:mt-16'>
              <NewsSection
                title='กิจกรรมและประกาศ'
                items={newsList}
                basePath='news'
                viewAllLink='/news'
              />
            </div>
          </div>

          {/* Department Showcase */}
          <div className='mt-4 md:mt-4 pb-10'>
            <DepartmentShowcase />
          </div>

          {/* Comment Slider */}
          <div className='w-full bg-gray-200 m-2'>
            <CommentSlider comments={commentList} />
          </div>
        </>
      )}
    </div>
  )
}

export default HomePage
