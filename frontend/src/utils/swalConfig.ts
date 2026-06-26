// src/utils/swalConfig.ts
import Swal from 'sweetalert2'

/**
 * Premium SweetAlert2 Modal — สำหรับ actions ที่ต้องตัดสินใจ
 * (ยืนยันการลบ, แบนผู้ใช้, ยกเลิก ฯลฯ)
 */
export const swal = Swal.mixin({
  confirmButtonColor: '#185FA5',
  cancelButtonColor: '#64748b',
  buttonsStyling: true,
  customClass: {
    confirmButton:
      'px-6 py-2.5 rounded-xl font-bold text-white bg-[#185FA5] hover:bg-[#134b82] transition-all duration-200 shadow-md hover:shadow-lg',
    cancelButton:
      'px-6 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all duration-200',
    title: 'text-xl font-bold text-slate-800',
    htmlContainer: 'text-sm text-slate-600 leading-relaxed',
    popup:
      'rounded-2xl border border-slate-200 shadow-2xl bg-gradient-to-b from-white to-slate-50/80 p-6',
    icon: 'border-0',
    timerProgressBar: 'bg-green-500',
  },
  showClass: {
    popup: 'animate__animated animate__fadeInUp animate__faster',
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutDown animate__faster',
  },
  allowOutsideClick: false,
})

/**
 * Premium Toast — สำหรับ notifications เล็กๆ (success, error, info)
 * ใช้กับ: Login, 2FA Verify, CRUD สำเร็จ/ล้มเหลว, OTP
 */
export const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toastEl) => {
    toastEl.addEventListener('mouseenter', Swal.stopTimer)
    toastEl.addEventListener('mouseleave', Swal.resumeTimer)
  },
  customClass: {
    popup:
      'rounded-xl shadow-lg border border-slate-100 px-4 py-3 animate__animated animate__fadeInRight animate__faster',
    title: 'text-sm font-bold text-slate-800',
    htmlContainer: 'text-xs text-slate-600',
    icon: 'border-0 text-sm',
    timerProgressBar: 'bg-green-500',
  },
})
