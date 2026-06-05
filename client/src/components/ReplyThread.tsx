import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { TicketDetail } from '@/pages/TicketDetailPage'

type SenderType = 'customer' | 'agent' | 'ai'

interface Reply {
  id: number
  body: string
  senderType: SenderType
  user: { id: string; name: string } | null
  createdAt: string
}

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

interface ReplyThreadProps {
  ticket: TicketDetail
}

export function ReplyThread({ ticket }: ReplyThreadProps) {
  const { data: replies = [] } = useQuery({
    queryKey: ['replies', ticket.id],
    queryFn: () => api.get<Reply[]>(`/tickets/${ticket.id}/replies`).then((r) => r.data),
  })

  if (replies.length === 0) {
    return <p className="text-sm text-muted-foreground">No replies yet.</p>
  }

  return (
    <>
      {replies.map((reply) => (
        <ReplyBubble key={reply.id} reply={reply} senderName={ticket.senderName} />
      ))}
    </>
  )
}
