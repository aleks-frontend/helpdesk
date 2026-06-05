import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { TicketStatus, TicketCategory } from 'core'
import api from '@/lib/api'
import type { TicketDetail } from '@/pages/TicketDetailPage'

interface Agent {
  id: string
  name: string
  email: string
}

type UpdatePayload = {
  assignedAgentId?: string | null
  status?: TicketStatus
  category?: TicketCategory
}

interface UpdateTicketProps {
  ticket: TicketDetail
}

export function UpdateTicket({ ticket }: UpdateTicketProps) {
  const queryClient = useQueryClient()

  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.get<{ users: Agent[] }>('/users/agents').then((r) => r.data),
  })
  const agents = agentsData?.users ?? []

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: UpdatePayload) =>
      api.patch(`/tickets/${ticket.id}`, payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] }),
  })

  return (
    <>
      <div className="space-y-1.5">
        <span className="text-xs text-muted-foreground">Status</span>
        <Select value={ticket.status} onValueChange={(v) => mutate({ status: v as TicketStatus })} disabled={isPending}>
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
        <Select value={ticket.category} onValueChange={(v) => mutate({ category: v as TicketCategory })} disabled={isPending}>
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
          onValueChange={(v) => mutate({ assignedAgentId: v || null })}
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
    </>
  )
}
