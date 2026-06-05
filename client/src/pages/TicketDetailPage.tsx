import { useParams, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { TicketStatus, TicketCategory, createReplySchema } from 'core'
import api from '@/lib/api'

type SenderType = 'customer' | 'agent' | 'ai'

interface Reply {
  id: number
  body: string
  senderType: SenderType
  user: { id: string; name: string } | null
  createdAt: string
}

interface Agent {
  id: string
  name: string
  email: string
}

interface TicketDetail {
  id: string
  senderEmail: string
  senderName: string
  subject: string
  body: string
  status: TicketStatus
  category: TicketCategory
  assignedAgentId: string | null
  assignedAgent: Agent | null
  createdAt: string
  updatedAt: string
}

type UpdatePayload = {
  assignedAgentId?: string | null
  status?: TicketStatus
  category?: TicketCategory
}

type ReplyFormValues = z.infer<typeof createReplySchema>

function replyLabel(reply: Reply, senderName: string): string {
  if (reply.senderType === 'ai') return 'AI'
  if (reply.senderType === 'agent') return reply.user?.name ?? 'Agent'
  return senderName
}

function ReplyBubble({ reply, senderName }: { reply: Reply; senderName: string }) {
  const isCustomer = reply.senderType === 'customer'
  return (
    <div className={`flex flex-col gap-1 ${isCustomer ? 'items-start' : 'items-end'}`}>
      <span className="text-xs text-muted-foreground">{replyLabel(reply, senderName)}</span>
      <div
        className={`max-w-prose rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap ${
          isCustomer
            ? 'bg-muted text-foreground'
            : reply.senderType === 'ai'
              ? 'bg-primary/10 text-foreground'
              : 'bg-primary text-primary-foreground'
        }`}
      >
        {reply.body}
      </div>
      <span className="text-xs text-muted-foreground">
        {new Date(reply.createdAt).toLocaleString()}
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

  const { data: replies = [] } = useQuery({
    queryKey: ['replies', id],
    queryFn: () => api.get<Reply[]>(`/tickets/${id}/replies`).then((r) => r.data),
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

  const replyForm = useForm<ReplyFormValues>({
    resolver: zodResolver(createReplySchema),
    defaultValues: { body: '' },
  })

  const replyMutation = useMutation({
    mutationFn: (values: ReplyFormValues) =>
      api.post(`/tickets/${id}/replies`, values).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replies', id] })
      replyForm.reset()
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to send reply'
      replyForm.setError('root', { message })
    },
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
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <Link
        to="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground link"
      >
        <ArrowLeft className="size-4" />
        Back to tickets
      </Link>

      <div className="grid grid-cols-[1fr_260px] gap-6 items-start">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{ticket.subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p>
                <span className="text-muted-foreground">From: </span>
                <span className="font-medium">{ticket.senderName}</span>
                <span className="text-muted-foreground"> &lt;{ticket.senderEmail}&gt;</span>
              </p>
              <p className="text-muted-foreground">
                Received: {new Date(ticket.createdAt).toLocaleString()}
              </p>
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {replies.length > 0 ? (
                replies.map((reply) => (
                  <ReplyBubble key={reply.id} reply={reply} senderName={ticket.senderName} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No replies yet.</p>
              )}

              <form
                id="reply-form"
                className="space-y-2 pt-2 border-t"
                onSubmit={replyForm.handleSubmit((values) => replyMutation.mutate(values))}
              >
                {replyForm.formState.errors.root && (
                  <p className="text-xs text-destructive">
                    {replyForm.formState.errors.root.message}
                  </p>
                )}
                <Textarea
                  placeholder="Write a reply…"
                  rows={3}
                  aria-invalid={!!replyForm.formState.errors.body}
                  {...replyForm.register('body')}
                />
                {replyForm.formState.errors.body && (
                  <p className="text-xs text-destructive">
                    {replyForm.formState.errors.body.message}
                  </p>
                )}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    form="reply-form"
                    size="sm"
                    disabled={replyMutation.isPending}
                  >
                    {replyMutation.isPending ? 'Sending…' : 'Send reply'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Status</span>
              <Select value={ticket.status} onValueChange={handleStatus} disabled={isPending}>
                <SelectTrigger className="h-8 w-full">
                  <span className="flex flex-1 text-left text-sm capitalize truncate">{ticket.status}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TicketStatus.open}>Open</SelectItem>
                  <SelectItem value={TicketStatus.resolved}>Resolved</SelectItem>
                  <SelectItem value={TicketStatus.closed}>Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Category</span>
              <Select value={ticket.category} onValueChange={handleCategory} disabled={isPending}>
                <SelectTrigger className="h-8 w-full">
                  <span className="flex flex-1 text-left text-sm capitalize truncate">{ticket.category}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TicketCategory.general}>General</SelectItem>
                  <SelectItem value={TicketCategory.technical}>Technical</SelectItem>
                  <SelectItem value={TicketCategory.refund}>Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Assigned to</span>
              <Select
                value={ticket.assignedAgentId ?? ''}
                onValueChange={handleAssign}
                disabled={isPending}
              >
                <SelectTrigger className="h-8 w-full">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
