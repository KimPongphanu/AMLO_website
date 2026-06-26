
interface SearchFilterProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  availableMonths: string[];
  placeholder?: string; // เปลี่ยนคำในช่องค้นหาได้
}

export default function SearchFilter({
  searchTerm,
  setSearchTerm,
  selectedMonth,
  setSelectedMonth,
  availableMonths,
  placeholder = "ค้นหา..."
}: SearchFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
      {/* ช่องค้นหาข้อความ */}
      <div className="relative w-full sm:w-64 lg:w-80">
        <input 
          type="text" 
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm"
        />
        <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>

      {/* ช่อง Dropdown กรองเดือน */}
      <div className="relative w-full sm:w-48">
        <select 
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm appearance-none cursor-pointer"
        >
          <option value="">ทุกเดือน</option>
          {availableMonths.map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
        <svg className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </div>
  );
}