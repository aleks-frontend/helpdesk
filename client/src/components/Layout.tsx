import { Link, useLocation, useNavigate } from 'react-router'
import { authClient } from '../lib/auth-client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Role } from 'core'

interface LayoutProps {
  children: React.ReactNode
}

function NavItem({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center px-3 py-2 text-sm rounded-md transition-colors border-l-2',
        active
          ? 'border-indigo-400 bg-white/8 text-white font-medium'
          : 'border-transparent text-sidebar-foreground hover:text-white hover:bg-white/5'
      )}
    >
      {label}
    </Link>
  )
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session } = authClient.useSession()

  const isAdmin = (session?.user as { role?: string } | undefined)?.role === Role.admin

  async function handleSignOut() {
    await authClient.signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-52 flex-shrink-0 flex flex-col bg-sidebar">
        <div className="px-5 py-4 border-b border-sidebar-border">
          <Link to="/" className="font-semibold text-white text-sm tracking-tight">
            Helpdesk
          </Link>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          <NavItem to="/" label="Dashboard" active={location.pathname === '/'} />
          <NavItem
            to="/tickets"
            label="Tickets"
            active={location.pathname.startsWith('/tickets')}
          />
          {isAdmin && (
            <NavItem to="/users" label="Users" active={location.pathname === '/users'} />
          )}
        </nav>
        <div className="px-4 py-4 border-t border-sidebar-border space-y-2">
          {session && (
            <p className="text-xs text-sidebar-foreground truncate">{session.user.name}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-sidebar-foreground hover:text-white hover:bg-white/5 px-3"
          >
            Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-h-screen overflow-x-hidden">{children}</main>
    </div>
  )
}
