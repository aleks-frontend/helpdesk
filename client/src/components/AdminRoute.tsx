import { Navigate } from 'react-router'
import { authClient } from '../lib/auth-client'

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return null

  const role = (session?.user as { role?: string } | undefined)?.role

  if (role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
