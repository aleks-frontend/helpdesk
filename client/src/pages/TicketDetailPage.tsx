import { useParams, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { TicketStatus, TicketCategory } from 'core'
import api from '@/lib/api'

type MessageSender = 'ai' | 'agent' | 'student'

interface Message {
  id: string
  body: string
  sender: MessageSender
  createdAt: string
}

interface Agent {
  id: string
  name: string
  email: string
}

interface TicketDetail {
  id: string
  studentEmail: string
  studentName: string
  subject: string
  body: string
  status: TicketStatus
  category: TicketCategory
  assignedAgentId: string | null
  assignedAgent: Agent | null
  createdAt: string
  updatedAt: string
  messages: Message[]
}

type UpdatePayload = {
  assignedAgentId?: string | null
  status?: TicketStatus
  category?: TicketCategory
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
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-7 w-44" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => api.get<TicketDetail>(`/tickets/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.get<{ users: Agent[] }>('/users/agents').then((r) => r.data),
  })
  const agents = agentsData?.users ?? []

  const updateMutation = useMutation({
    mutationFn: (payload: UpdatePayload) =>
      api.patch(`/tickets/${id}`, payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket', id] }),
  })

  function handleAssign(value: string | null) {
    updateMutation.mutate({ assignedAgentId: value || null })
  }

  function handleStatus(value: string | null) {
    if (value) updateMutation.mutate({ status: value as TicketStatus })
  }

  function handleCategory(value: string | null) {
    if (value) updateMutation.mutate({ category: value as TicketCategory })
  }

  if (isLoading) return <TicketDetailSkeleton />

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      </div>
    )
  }

  if (!ticket) return null

  const isPending = updateMutation.isPending

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
        </CardHeader>
        <CardContent className="text-sm">
          <div className="grid grid-cols-2 gap-x-8">
            <div className="space-y-2">
              <p>
                <span className="text-muted-foreground">From: </span>
                <span className="font-medium">{ticket.studentName}</span>
                <span className="text-muted-foreground"> &lt;{ticket.studentEmail}&gt;</span>
              </p>
              <p className="text-muted-foreground">
                Received: {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="grid grid-cols-[max-content_1fr] items-center gap-x-3 gap-y-2">
              <span className="text-muted-foreground">Status:</span>
              <Select value={ticket.status} onValueChange={handleStatus} disabled={isPending}>
                <SelectTrigger className="h-7 w-44">
                  <span className="flex flex-1 text-left text-sm capitalize truncate">{ticket.status}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TicketStatus.open}>Open</SelectItem>
                  <SelectItem value={TicketStatus.resolved}>Resolved</SelectItem>
                  <SelectItem value={TicketStatus.closed}>Closed</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">Category:</span>
              <Select value={ticket.category} onValueChange={handleCategory} disabled={isPending}>
                <SelectTrigger className="h-7 w-44">
                  <span className="flex flex-1 text-left text-sm capitalize truncate">{ticket.category}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TicketCategory.general}>General</SelectItem>
                  <SelectItem value={TicketCategory.technical}>Technical</SelectItem>
                  <SelectItem value={TicketCategory.refund}>Refund</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">Assigned to:</span>
              <Select
                value={ticket.assignedAgentId ?? ''}
                onValueChange={handleAssign}
                disabled={isPending}
              >
                <SelectTrigger className="h-7 w-44">
                  <span className={`flex flex-1 text-left text-sm truncate ${!ticket.assignedAgent ? 'text-muted-foreground' : ''}`}>
                    {ticket.assignedAgent?.name ?? 'Unassigned'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
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
