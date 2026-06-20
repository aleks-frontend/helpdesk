import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Role } from 'core'
import { UserDialog } from '@/components/UserDialog'
import { DeleteUserDialog } from '@/components/DeleteUserDialog'
import { UsersTable } from '@/components/UsersTable'
import api from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

export default function UsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<{ users: User[] }>('/users').then((r) => r.data.users),
  })

  function openCreate() {
    setEditingUser(null)
    setDialogOpen(true)
  }

  function openEdit(user: User) {
    setEditingUser(user)
    setDialogOpen(true)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Users</h1>
        <Button size="sm" onClick={openCreate}>
          <PlusIcon />
          Create user
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <UsersTable
            users={users}
            isLoading={isLoading}
            error={error as Error | null}
            onEdit={openEdit}
            onDelete={(user) => setDeletingUser(user)}
          />
        </CardContent>
      </Card>

      <UserDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingUser(null)
        }}
        user={editingUser}
      />
      <DeleteUserDialog
        user={deletingUser}
        open={deletingUser !== null}
        onOpenChange={(open) => { if (!open) setDeletingUser(null) }}
      />
    </div>
  )
}
