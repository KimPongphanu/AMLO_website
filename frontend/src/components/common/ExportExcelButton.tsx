// src/components/common/ExportExcelButton.tsx
import * as XLSX from 'xlsx'
import { toast } from '../../utils/swalConfig'

interface Column {
  key: string
  label: string
  /** Fallback value if field is empty/null/undefined */
  fallback?: string
  /** Custom formatter: (value, entireRow) => formattedValue */
  format?: (value: unknown, row: Record<string, unknown>) => string | number
}

interface ExportExcelButtonProps {
  /** Array of row data objects */
  data: Record<string, unknown>[]
  /** Column definitions: key + label + optional format/fallback */
  columns: Column[]
  /** Output filename (without extension) */
  filename?: string
  /** Button text */
  buttonText?: string
  /** Additional CSS classes for the button */
  className?: string
}

export default function ExportExcelButton({
  data,
  columns,
  filename = 'export',
  buttonText = 'Export Excel',
  className = '',
}: ExportExcelButtonProps) {
  const handleExport = () => {
    if (data.length === 0) {
      toast.fire({ icon: 'info', title: 'ไม่มีข้อมูลสำหรับ Export' })
      return
    }

    // Map rows using column definitions
    const rows = data.map((row) => {
      const mapped: Record<string, string | number> = {}
      for (const col of columns) {
        let value: string | number =
          (row[col.key] as string | number) ?? col.fallback ?? ''
        if (col.format) {
          value = col.format(row[col.key], row)
        }
        mapped[col.label] = value
      }
      return mapped
    })

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(rows)

    // Auto-size column widths based on header length + data length
    const colWidths = columns.map((col) => ({
      wch: Math.max(
        col.label.length * 2,
        ...data.map((r) => {
          const val = col.format
            ? String(col.format(r[col.key], r))
            : String(r[col.key] ?? col.fallback ?? '')
          return val.length * 1.5
        }),
      ),
    }))
    ws['!cols'] = colWidths

    // Build workbook and trigger download
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(
      wb,
      `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    )

    toast.fire({
      icon: 'success',
      title: 'Export Excel สำเร็จ',
      timer: 1500,
      showConfirmButton: false,
    })
  }

  return (
    <button
      onClick={handleExport}
      className={`bg-white border border-emerald-300 px-4 py-2.5 rounded-xl text-sm font-bold text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-2 shadow-sm cursor-pointer ${className}`}
    >
      <i className='fas fa-file-excel' />
      {buttonText}
    </button>
  )
}
