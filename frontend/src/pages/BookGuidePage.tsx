import { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Copy, Check, Trash2, ShieldCheck } from 'lucide-react';
import DOMPurify from 'dompurify';

export default function HtmlGuidePage() {
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!content || content === '<p><br></p>') return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); 
  };

  const handleClear = () => {
    const isConfirmed = window.confirm('⚠️ ยืนยันการล้างเนื้อหาทั้งหมด? เนื้อหาที่พิมพ์ไว้จะหายไปและไม่สามารถกู้คืนได้');
    if (isConfirmed) {
      setContent('');
    }
  };

  // 🌟 รวมร่าง Toolbar: มีทั้งเปลี่ยนสีข้อความ/พื้นหลัง (จาก BookGuide) และแทรกรูปภาพ (จาก PRManager)
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, false] }], // อัปเกรดให้มีหัวข้อหลายระดับ
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }], // 🎨 ฟังก์ชันเปลี่ยนสี
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'], // 🖼️ ฟังก์ชันแทรกรูปภาพ
      ['clean'] 
    ],
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 border-l-8 border-blue-600 pl-4">
              Content Editor Professional
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              ระบบจัดการเนื้อหา HTML พร้อมระบบป้องกันความปลอดภัย XSS
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold border border-green-200 shadow-sm w-fit">
            <ShieldCheck size={18} />
            Security Mode: Active (DOMPurify)
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex justify-between items-center">
                <h2 className="font-bold text-slate-700 flex items-center gap-2">
                  <span className="text-xl">✍️</span> Editor
                </h2>
                <button 
                  onClick={handleClear}
                  className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all border border-transparent hover:border-red-200"
                >
                  <Trash2 size={14} /> ล้างเนื้อหาทั้งหมด
                </button>
              </div>
              
              <div className="bg-white">
                <ReactQuill 
                  theme="snow" 
                  value={content} 
                  onChange={setContent} 
                  modules={modules}
                  placeholder="พิมพ์ข้อความของคุณที่นี่..."
                  className="h-[400px] pb-10"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sticky top-24">
            <div className="bg-[#1e1e1e] rounded-2xl shadow-md overflow-hidden relative flex flex-col h-[510px]">
              <div className="bg-[#2d2d2d] px-4 py-3 flex items-center justify-between border-b border-white/5">
                <span className="text-sm font-bold text-gray-300 flex items-center gap-2">
                  <span className="text-yellow-500">⚡</span> HTML Output
                </span>
                
                <button
                  onClick={handleCopy}
                  disabled={!content || content === '<p><br></p>'}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-bold transition-all duration-300 ${
                    copied 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                      : 'bg-blue-600 text-white hover:bg-blue-500 border border-transparent shadow-sm disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed'
                  }`}
                >
                  {copied ? (
                    <><Check size={16} /> ก๊อปปี้สำเร็จ!</>
                  ) : (
                    <><Copy size={16} /> ก๊อปปี้โค้ด</>
                  )}
                </button>
              </div>

              <div className="relative flex-grow p-5 overflow-hidden">
                {content === '' || content === '<p><br></p>' ? (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-mono text-sm text-center px-4">
                    รอรับข้อมูลจาก Editor...
                  </div>
                ) : (
                  <textarea
                    readOnly
                    value={content}
                    className="w-full h-full bg-transparent text-emerald-400 font-mono text-sm md:text-base resize-none focus:outline-none leading-relaxed custom-scrollbar"
                    spellCheck="false"
                  />
                )}
              </div>
            </div>
            
            {/* กล่อง Preview ความปลอดภัย (แสดงสิ่งที่ DOMPurify ล้างแล้ว) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                <ShieldCheck size={14} className="text-green-500" /> Sanitized Preview
              </p>
              <div 
                className="prose prose-sm max-w-none text-slate-600 line-clamp-2 html-preview-content"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} 
              />
            </div>
          </div>

        </div>
      </div>

      {/* 🌟 อัปเดต CSS เพิ่มส่วนของรูปภาพและการแสดงผล */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #6b7280; }

        .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #e2e8f0 !important; padding: 12px 16px !important; background-color: #f8fafc; }
        .ql-container.ql-snow { border: none !important; font-size: 16px !important; font-family: inherit !important; }
        .ql-editor { min-height: 350px; padding: 24px !important; color: #334155; }
        
        /* สไตล์สำหรับพรีวิว */
        .ql-editor h1 { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; color: #1e293b; }
        .ql-editor h2 { font-size: 1.75em; font-weight: bold; margin-bottom: 0.5em; color: #1e293b; }
        .ql-editor h3 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; color: #1e293b; }
        .ql-editor h4 { font-size: 1.2em; font-weight: bold; margin-bottom: 0.5em; color: #1e293b; }
        
        /* ควบคุมรูปภาพที่แทรกเข้ามาให้อยู่ในกรอบและสวยงาม */
        .ql-editor img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; border: 1px solid #e2e8f0; }
        .html-preview-content img { max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0; }
        .html-preview-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 8px; }
        .html-preview-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 8px; }
        .html-preview-content li { margin-bottom: 4px; }
      `}</style>
    </div>
  );
}