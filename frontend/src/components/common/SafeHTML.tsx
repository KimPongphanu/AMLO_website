// src/components/common/SafeHTML.tsx
import DOMPurify from 'dompurify'

export const SafeHTML = ({
  content,
  className,
}: {
  content: string
  className?: string
}) => (
  <div
    className={className}
    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
  />
)
