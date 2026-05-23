import { Navigate } from 'react-router'
import { authClient } from '../lib/auth-client'
import { Role } from 'core'

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return null

  const role = (session?.user as { role?: string } | undefined)?.role

  if (role !== Role.admin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
