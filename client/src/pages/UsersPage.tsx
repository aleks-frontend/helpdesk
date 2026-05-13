import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'agent'
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data: { users?: User[]; error?: string }) => {
        if (data.error) throw new Error(data.error)
        setUsers(data.users ?? [])
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'primary' : 'default'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
