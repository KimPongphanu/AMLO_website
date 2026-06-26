const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
]

export const parseThaiDateToTimestamp = (dateStr: string): number => {
  if (!dateStr) return 0
  if (dateStr.includes('T')) return new Date(dateStr).getTime()

  const parts = dateStr.split(' ')
  if (parts.length === 3) {
    const day = parseInt(parts[0])
    const month = THAI_MONTHS.indexOf(parts[1])
    let year = parseInt(parts[2])

    if (year > 2400) year -= 543
    return new Date(year, month, day).getTime()
  }
  return new Date(dateStr).getTime()
}
