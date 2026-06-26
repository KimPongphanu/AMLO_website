import React from 'react'

const TableSkeleton: React.FC = () => (
  <div className='animate-pulse p-6 space-y-4'>
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className='flex items-center space-x-4 py-4 border-b border-gray-100'
      >
        <div className='h-4 bg-gray-200 rounded w-16'></div>
        <div className='flex-1 space-y-2'>
          <div className='h-4 bg-gray-200 rounded w-3/4'></div>
        </div>
        <div className='h-4 bg-gray-200 rounded w-48'></div>
        <div className='h-6 bg-gray-200 rounded-full w-16'></div>
        <div className='h-4 bg-gray-200 rounded w-24'></div>
        <div className='flex space-x-2'>
          <div className='h-8 w-8 bg-gray-200 rounded-full'></div>
          <div className='h-8 w-8 bg-gray-200 rounded-full'></div>
        </div>
      </div>
    ))}
  </div>
)

export default TableSkeleton
