import DOMPurify from 'dompurify'

interface SafeHtmlProps {
  html: string | null
  text: string
  className?: string
}

export function SafeHtml({ html, text, className }: SafeHtmlProps) {
  if (html) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
      />
    )
  }

  return <p className={className}>{text}</p>
}
