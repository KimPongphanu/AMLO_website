import { Link } from 'react-router-dom'

interface SectionHeaderProps {
  title: string
  viewAllLink: string
  viewAllText?: string
}

const SectionHeader = ({
  title,
  viewAllLink,
  viewAllText = 'ดูทั้งหมด',
}: SectionHeaderProps) => {
  return (
    <div className='flex justify-between items-end mb-6 md:mb-8'>
      <h1 className='text-3xl md:text-4xl font-bold text-slate-800'>{title}</h1>
      <Link
        to={viewAllLink}
        className='text-sm md:text-base font-medium text-blue-600 hover:text-blue-800 flex items-center transition-colors'
      >
        {viewAllText} <span className='ml-1 text-lg leading-none'>›</span>
      </Link>
    </div>
  )
}

export default SectionHeader
