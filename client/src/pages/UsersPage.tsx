import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreateUserDialog } from '@/components/CreateUserDialog'
import { UsersTable } from '@/components/UsersTable'
import api from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'agent'
  createdAt: string
}

export default function UsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<{ users: User[] }>('/users').then((r) => r.data.users),
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Users</CardTitle>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <PlusIcon />
            Create user
          </Button>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} isLoading={isLoading} error={error as Error | null} />
        </CardContent>
      </Card>

      <CreateUserDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
