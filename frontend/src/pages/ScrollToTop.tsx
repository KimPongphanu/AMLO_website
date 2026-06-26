import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  // ดึงค่า URL ปัจจุบันมา
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]); // [pathname] หมายความว่า "ให้ทำคำสั่งนี้ทุกครั้งที่ URL เปลี่ยน"

  return null; // Component นี้ทำหน้าที่อยู่เบื้องหลัง ไม่ต้องแสดง UI อะไรออกมา
}