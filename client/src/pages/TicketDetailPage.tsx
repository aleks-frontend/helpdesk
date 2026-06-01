import { useParams, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TicketStatus, TicketCategory } from 'core'
import api from '@/lib/api'

type MessageSender = 'ai' | 'agent' | 'student'

interface Message {
  id: string
  body: string
  sender: MessageSender
  createdAt: string
}

interface TicketDetail {
  id: string
  studentEmail: string
  studentName: string
  subject: string
  body: string
  status: TicketStatus
  category: TicketCategory
  createdAt: string
  updatedAt: string
  assignedAgent: { id: string; name: string; email: string } | null
  messages: Message[]
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

function senderLabel(sender: MessageSender) {
  if (sender === 'ai') return 'AI'
  if (sender === 'agent') return 'Agent'
  return 'Student'
}

function MessageBubble({ message }: { message: Message }) {
  const isStudent = message.sender === 'student'
  return (
    <div className={`flex flex-col gap-1 ${isStudent ? 'items-start' : 'items-end'}`}>
      <span className="text-xs text-muted-foreground">{senderLabel(message.sender)}</span>
      <div
        className={`max-w-prose rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap ${
          isStudent
            ? 'bg-muted text-foreground'
            : message.sender === 'ai'
              ? 'bg-primary/10 text-foreground'
              : 'bg-primary text-primary-foreground'
        }`}
      >
        {message.body}
      </div>
      <span className="text-xs text-muted-foreground">
        {new Date(message.createdAt).toLocaleString()}
      </span>
    </div>
  )
}

function TicketDetailSkeleton() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Skeleton className="h-5 w-32" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => api.get<TicketDetail>(`/tickets/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  if (isLoading) return <TicketDetailSkeleton />

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      </div>
    )
  }

  if (!ticket) return null

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Link
        to="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground link"
      >
        <ArrowLeft className="size-4" />
        Back to tickets
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{ticket.subject}</CardTitle>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge>
            <Badge variant={categoryVariant(ticket.category)}>{ticket.category}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <p>
            <span className="text-muted-foreground">From: </span>
            <span className="font-medium">{ticket.studentName}</span>
            <span className="text-muted-foreground"> &lt;{ticket.studentEmail}&gt;</span>
          </p>
          <p className="text-muted-foreground">
            Received: {new Date(ticket.createdAt).toLocaleString()}
          </p>
          {ticket.assignedAgent && (
            <p>
              <span className="text-muted-foreground">Assigned to: </span>
              <span className="font-medium">{ticket.assignedAgent.name}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Original message</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{ticket.body}</p>
        </CardContent>
      </Card>

      {ticket.messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticket.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
