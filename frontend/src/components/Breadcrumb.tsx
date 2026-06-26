import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ChevronRight, ChevronLeft } from 'lucide-react';

// 🌟 1. ดิกชันนารีแปล Path URL (ภาษาอังกฤษ) เป็นชื่อเมนู (ภาษาไทย)
const PATH_MAP: Record<string, string> = {
  'advertise': 'ประชาสัมพันธ์',
  'news': 'กิจกรรม',
  'department': 'หน่วยงาน',
};

interface BreadcrumbProps {
  title?: string; // รับแค่ชื่อเรื่องอย่างเดียว เพราะ ID ใน URL มันไม่สวย
}

export default function Breadcrumb({ title }: BreadcrumbProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🌟 2. แยก URL ออกเป็นส่วนๆ (เช่น "/advertise/1" -> ['advertise', '1'])
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <div className="mb-6 flex flex-col items-start">
      
      {/* 🌟 ปุ่มย้อนกลับ (ใช้ useNavigate อัตโนมัติ) */}
      <button 
        onClick={() => navigate(-1)} 
        className="text-lg font-medium text-slate-500 hover:text-blue-600 mb-6 flex items-center transition-colors"
      >
        <ChevronLeft size={16} className="mr-1" /> ย้อนกลับ
      </button>

      {/* 🌟 แถบ Breadcrumb */}
      <nav className="flex text-md text-slate-500 overflow-x-auto whitespace-nowrap hide-scrollbar w-full" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          
          {/* ระดับ 1: หน้าหลัก (มีเสมอ) */}
          <li className="inline-flex items-center">
            <Link to="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
              <Home size={14} className="mb-[2px]" />
              หน้าหลัก
            </Link>
          </li>

          {/* 🌟 3. Loop สร้างเส้นทางตาม URL ปัจจุบัน */}
          {pathnames.map((value, index) => {
            const isLast = index === pathnames.length - 1;
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;

            // แปลงข้อความ: 
            // - ถ้าเป็นตัวสุดท้าย (ID) ให้แสดง 'title' ที่รับมา
            // - ถ้าเป็นหมวดหมู่ ให้แปลภาษาไทยจากดิกชันนารี (ถ้าไม่มีในดิก ให้โชว์คำเดิม)
            const displayName = isLast && title ? title : (PATH_MAP[value.toLowerCase()] || value);

            return (
              <li key={to} aria-current={isLast ? "page" : undefined}>
                <div className="flex items-center text-slate-400">
                  <ChevronRight size={14} className="mx-1" />
                  
                  {isLast ? (
                    <span className="text-slate-800 font-semibold truncate max-w-[150px] md:max-w-xs">
                      {displayName}
                    </span>
                  ) : (
                    <Link to={to} className="hover:text-blue-600 transition-colors capitalize">
                      {displayName}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
          
        </ol>
      </nav>

    </div>
  );
}