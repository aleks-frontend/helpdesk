import { useNavigate } from 'react-router'
import { authClient } from '../lib/auth-client'
import { Button } from '@/components/ui/button'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()

  async function handleSignOut() {
    await authClient.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background px-6 py-2 flex items-center justify-between">
        <span className="font-semibold text-foreground">Helpdesk</span>
        <div className="flex items-center gap-2">
          {session && (
            <span className="text-sm text-muted-foreground">{session.user.name}</span>
          )}
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
