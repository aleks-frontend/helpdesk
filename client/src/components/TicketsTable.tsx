import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TicketStatus, TicketCategory } from 'core'

interface Ticket {
  id: string
  studentEmail: string
  studentName: string
  subject: string
  status: TicketStatus
  category: TicketCategory
  createdAt: string
}

function statusVariant(status: TicketStatus) {
  if (status === TicketStatus.open) return 'primary'
  if (status === TicketStatus.resolved) return 'success'
  return 'default'
}

function categoryVariant(category: TicketCategory) {
  if (category === TicketCategory.technical) return 'primary'
  if (category === TicketCategory.refund) return 'warning'
  return 'default'
}

function TicketTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subject</TableHead>
          <TableHead>From</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Received</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

interface Props {
  tickets: Ticket[]
  isLoading: boolean
  error: Error | null
}

export function TicketsTable({ tickets, isLoading, error }: Props) {
  if (isLoading) return <TicketTableSkeleton />
  if (error) return <p className="text-sm text-destructive">{error.message}</p>
  if (tickets.length === 0) return <p className="text-sm text-muted-foreground py-4 text-center">No tickets yet.</p>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subject</TableHead>
          <TableHead>From</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Received</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id}>
            <TableCell className="font-medium text-foreground">{ticket.subject}</TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm text-foreground">{ticket.studentName}</span>
                <span className="text-xs text-muted-foreground">{ticket.studentEmail}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={categoryVariant(ticket.category)}>{ticket.category}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(ticket.createdAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
