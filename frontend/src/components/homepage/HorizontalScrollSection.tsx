import React from 'react'

interface HorizontalScrollSectionProps {
  children: React.ReactNode
  className?: string
}

const HorizontalScrollSection = ({
  children,
  className = '',
}: HorizontalScrollSectionProps) => {
  return (
    <div
      className={`w-full p-4 md:p-8 rounded-2xl md:rounded-3xl flex gap-4 md:gap-6 overflow-x-auto bg-white shadow-sm hide-scrollbar items-stretch ${className}`}
    >
      {children}
    </div>
  )
}

export default HorizontalScrollSection
