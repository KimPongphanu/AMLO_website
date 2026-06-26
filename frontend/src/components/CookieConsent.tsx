import { useState, useEffect, useRef } from 'react';

export default function CookieConsent() {
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasAcceptedCookies = localStorage.getItem('hasAcceptedCookies');
    if (!hasAcceptedCookies) {
      setIsBannerVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setIsBannerVisible(false);
    setIsModalVisible(false);
    localStorage.setItem('hasAcceptedCookies', 'accepted');
  };

  const handleReject = () => {
    setIsBannerVisible(false);
    setIsModalVisible(false);
    localStorage.setItem('hasAcceptedCookies', 'rejected');
  };

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      // Allow a 10px threshold for scrolling
      if (Math.ceil(scrollTop + clientHeight) >= scrollHeight - 10) {
        setIsScrolledToBottom(true);
      }
    }
  };

  // If content is small and doesn't need scrolling, enable button automatically
  useEffect(() => {
    if (isModalVisible && contentRef.current) {
      const { scrollHeight, clientHeight } = contentRef.current;
      if (scrollHeight <= clientHeight) {
        setIsScrolledToBottom(true);
      }
    }
  }, [isModalVisible]);

  if (!isBannerVisible && !isModalVisible) return null;

  return (
    <>
      {/* 🌟 Banner ขนาดเล็ก มุมซ้ายล่าง */}
      {isBannerVisible && !isModalVisible && (
        <div className="fixed bottom-6 left-6 z-[9998] w-[90vw] max-w-[400px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden border border-gray-100">
           <div className="p-6">
             <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-50 p-2 rounded-lg text-blue-600 border border-blue-100 flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                   </svg>
                </span>
                <h3 className="text-lg font-bold text-slate-800">นโยบายการจัดเก็บข้อมูล</h3>
             </div>
             <p className="text-slate-600 text-sm leading-relaxed mb-5 font-medium">
               เว็บไซต์นี้มีการใช้งานคุกกี้ (Cookies) และจัดเก็บข้อมูลจราจรทางคอมพิวเตอร์ (รวมถึง IP Address) เพื่อความปลอดภัยและเพิ่มประสิทธิภาพในการให้บริการตามกฎหมาย หากท่านใช้งานเว็บไซต์ต่อ ถือว่าท่านรับทราบและยินยอมตามนโยบายของเรา
             </p>
             <div className="flex flex-col gap-2">
                <div className="flex gap-2 w-full">
                  <button onClick={handleAccept} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold transition-colors text-sm shadow-sm">ยอมรับทั้งหมด</button>
                  <button onClick={handleReject} className="w-full bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 py-2.5 rounded-xl font-bold transition-colors text-sm">ปฏิเสธ</button>
                </div>
                <button onClick={() => setIsModalVisible(true)} className="w-full text-blue-600 hover:text-blue-800 underline py-2 font-semibold transition-colors text-sm mt-1">อ่านรายละเอียดเพิ่มเติม</button>
             </div>
           </div>
        </div>
      )}

      {/* 🌟 Popup ใหญ่ พื้นหลังเบลอ */}
      {isModalVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg md:text-xl font-bold text-slate-800">นโยบายการใช้คุกกี้และการจัดเก็บข้อมูลจราจรทางคอมพิวเตอร์</h2>
              <button onClick={() => setIsModalVisible(false)} className="text-slate-400 hover:text-slate-600 transition-colors ml-4 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Body (Scrollable) */}
            <div 
              ref={contentRef}
              onScroll={handleScroll}
              className="px-6 py-6 overflow-y-auto flex-1 prose prose-sm md:prose-base max-w-none text-slate-600"
            >
              <p>
                สำนักงานป้องกันและปราบปรามการฟอกเงิน (ปปง.) มีความจำเป็นต้องใช้คุกกี้และเทคโนโลยีที่คล้ายคลึงกัน รวมถึงการจัดเก็บข้อมูลการเข้าใช้งานของท่าน เพื่อให้เว็บไซต์สามารถทำงานได้อย่างมีประสิทธิภาพและมีความปลอดภัยสูงสุด
              </p>
              
              <h3 className="text-slate-800 font-bold mt-6 mb-2">1. ข้อมูลที่เราจัดเก็บ (รวมถึง IP Address)</h3>
              <p>
                เมื่อท่านเข้าใช้งานเว็บไซต์ ระบบจะทำการเก็บบันทึกข้อมูลจราจรทางคอมพิวเตอร์ (Log Files) ของท่านโดยอัตโนมัติ ซึ่งรวมถึง <strong>หมายเลขไอพี (IP Address)</strong>, ชนิดของเบราว์เซอร์, วันเวลาที่เข้าเยี่ยมชม และพฤติกรรมการใช้งานทั่วไป
              </p>
              
              <h3 className="text-slate-800 font-bold mt-6 mb-2">2. วัตถุประสงค์และระยะเวลาในการจัดเก็บ</h3>
              <p>เราจัดเก็บข้อมูล IP Address และคุกกี้ที่จำเป็น ด้วยวัตถุประสงค์เพื่อ:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>รักษาความมั่นคงปลอดภัยของระบบสารสนเทศ ป้องกันการเข้าถึงโดยมิชอบ</li>
                <li>ปฏิบัติตาม <strong>พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์</strong> และกฎหมายอื่นที่เกี่ยวข้อง</li>
                <li>ข้อมูลดังกล่าวจะถูกเก็บรักษาไว้ในระบบความปลอดภัยสูง เป็นระยะเวลา <strong>180 วัน</strong> นับจากวันที่ท่านเข้าใช้งาน ก่อนจะถูกทำลายทิ้งตามมาตรฐานรักษาความปลอดภัย</li>
              </ul>
              
              <h3 className="text-slate-800 font-bold mt-6 mb-2">3. การใช้งานคุกกี้ประเภทอื่นๆ</h3>
              <p>
                นอกเหนือจากข้อมูลที่จำเป็นตามกฎหมายแล้ว เว็บไซต์อาจมีการใช้คุกกี้เพื่อจดจำการตั้งค่า (Preferences) หรือวัดผลประสิทธิภาพ (Analytics) เพื่อนำมาพัฒนาเว็บไซต์ให้ตอบโจทย์ผู้ใช้งานมากยิ่งขึ้น ซึ่งท่านสามารถเลือกให้ความยินยอมหรือปฏิเสธคุกกี้ในส่วนนี้ได้
              </p>
              <p className="text-xs text-slate-400 italic mt-4">
                (หมายเหตุ: การปฏิเสธคุกกี้ที่ไม่จำเป็น จะไม่ส่งผลกระทบต่อการจัดเก็บข้อมูล IP Address ที่ต้องดำเนินการตามกฎหมาย)
              </p>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-xl text-blue-800 text-sm font-medium text-center">
                กรุณาเลื่อนลงมาจนสุดเพื่อเปิดใช้งานปุ่มยอมรับ
              </div>
            </div>

            {/* Footer / Buttons */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={handleReject} 
                className="px-6 py-2.5 rounded-xl font-bold transition-colors text-sm bg-white border-2 border-slate-200 hover:bg-slate-100 text-slate-600 order-2 sm:order-1"
              >
                ปฏิเสธคุกกี้ทั่วไป
              </button>
              <button 
                onClick={handleAccept} 
                disabled={!isScrolledToBottom}
                className={`px-6 py-2.5 rounded-xl font-bold transition-all text-sm shadow-sm order-1 sm:order-2 ${
                  isScrolledToBottom 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
                }`}
              >
                ยอมรับทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
