import React from 'react'

const AccessDenied: React.FC = () => (
  <div className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
    <div className='text-center bg-white p-10 rounded-xl shadow-lg max-w-md border border-gray-100'>
      <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6 text-red-600'>
        <svg
          className='w-8 h-8'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
          />
        </svg>
      </div>
      <h2 className='text-2xl font-bold text-gray-900 mb-2 font-sans'>
        ปฏิเสธการเข้าถึง
      </h2>
      <p className='text-gray-600 mb-6 text-sm'>
        คุณไม่มีสิทธิ์ในการเข้าถึงหรือตรวจสอบเนื้อหาในหน้านี้
        การพยายามเข้าถึงระบบที่ไม่ได้รับอนุญาตจะถูกบันทึกไว้ในประวัติความปลอดภัยของเซิร์ฟเวอร์
      </p>
      <a
        href='/dashboard'
        className='inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors'
      >
        กลับสู่หน้าหลักแดชบอร์ด
      </a>
    </div>
  </div>
)

export default AccessDenied
