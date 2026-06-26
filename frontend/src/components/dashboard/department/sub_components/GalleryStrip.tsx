// src/components/dashboard/department/sub_components/GalleryStrip.tsx
import { Video } from 'lucide-react'
import React from 'react'
import { API_URL } from '../../../../config/constants'
import type { GalleryItem } from '../../../../type'

interface GalleryStripProps {
  gallery: GalleryItem[]
}

const GalleryStrip: React.FC<GalleryStripProps> = React.memo(({ gallery }) => {
  if (!gallery || gallery.length === 0) {
    return (
      <span className='text-xs text-slate-400 font-medium'>
        ไม่มีรูป/วิดีโอในคลัง
      </span>
    )
  }

  return (
    <div className='flex gap-1 flex-wrap mt-1'>
      {gallery.slice(0, 5).map((item: GalleryItem, i: number) => (
        <div
          key={i}
          className='w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm shrink-0'
        >
          {item.type === 'image' ? (
            <img
              src={
                item.url.startsWith('http') ? item.url : `${API_URL}${item.url}`
              }
              alt={`gallery-preview-${i}`}
              className='w-full h-full object-cover'
              loading='lazy'
            />
          ) : (
            <Video className='w-4 h-4 text-rose-500' />
          )}
        </div>
      ))}
      {gallery.length > 5 && (
        <div className='w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-500 font-black shrink-0'>
          +{gallery.length - 5}
        </div>
      )}
    </div>
  )
})

GalleryStrip.displayName = 'GalleryStrip'

export default GalleryStrip
