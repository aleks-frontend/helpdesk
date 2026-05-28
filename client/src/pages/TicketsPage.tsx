import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TicketsTable } from '@/components/TicketsTable'
import { TicketStatus, TicketCategory } from 'core'
import api from '@/lib/api'

interface Ticket {
  id: string
  studentEmail: string
  studentName: string
  subject: string
  status: TicketStatus
  category: TicketCategory
  createdAt: string
}

export default function TicketsPage() {
  const { data: tickets = [], isLoading, error } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => api.get<{ tickets: Ticket[] }>('/tickets').then((r) => r.data.tickets),
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketsTable
            tickets={tickets}
            isLoading={isLoading}
            error={error as Error | null}
          />
        </CardContent>
      </Card>
    </div>
  )
}
