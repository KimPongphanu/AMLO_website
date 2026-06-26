import React from 'react'
import type { DashboardUser } from './BanModal'
import BaseModal from './BaseModal'

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  selectedUser: DashboardUser | null
  onSubmit: () => void
}

const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  selectedUser,
  onSubmit,
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title='แจ้งเตือนระบบ: บังคับรีเซ็ตรหัสผ่าน'
    >
      {selectedUser && (
        <div className='space-y-4'>
          <div className='bg-amber-50 border border-amber-200 rounded-md p-4'>
            <div className='flex'>
              <div className='ml-3 text-sm text-amber-700'>
                <h3 className='font-medium text-amber-800 mb-1'>
                  โปรดตรวจสอบข้อตกลงความปลอดภัย
                </h3>
                <p>
                  ระบบจะทำการระงับรหัสผ่านเดิมของคุณ{' '}
                  <strong>
                    {selectedUser.firstname} {selectedUser.lastname}
                  </strong>{' '}
                  ทันที
                  โดยการเข้าระบบครั้งต่อไปผู้ใช้จะถูกบังคับให้ตั้งรหัสผ่านใหม่ผ่านระบบเมลลิงก์ส่วนตัว
                </p>
              </div>
            </div>
          </div>
          <div className='flex justify-end space-x-3 pt-4 border-t border-gray-200'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              ยกเลิก
            </button>
            <button
              type='button'
              onClick={onSubmit}
              className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700'
            >
              ส่งอีเมลรีเซ็ตรหัสผ่าน
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  )
}

export default PasswordModal
