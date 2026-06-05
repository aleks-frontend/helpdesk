import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

interface BackLinkProps {
  to: string
  children?: React.ReactNode
}

export function BackLink({ to, children = 'Go back' }: BackLinkProps) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground link">
      <ArrowLeft className="size-4" />
      {children}
    </Link>
  )
}
