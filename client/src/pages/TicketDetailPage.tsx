import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type TicketDetail } from 'core'
import { BackLink } from '@/components/BackLink'
import { TicketDetailSkeleton } from '@/components/TicketDetailSkeleton'
import { ReplyThread } from '@/components/ReplyThread'
import { ReplyForm } from '@/components/ReplyForm'
import { UpdateTicket } from '@/components/UpdateTicket'
import { TicketDetails } from '@/components/TicketDetails'
import { SafeHtml } from '@/components/SafeHtml'
import api from '@/lib/api'


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
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <BackLink to="/tickets">Back to tickets</BackLink>

      <div className="grid grid-cols-[1fr_260px] gap-6 items-start">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{ticket.subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <TicketDetails ticket={ticket} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Original message</CardTitle>
            </CardHeader>
            <CardContent>
              <SafeHtml html={ticket.bodyHtml} text={ticket.body} className="text-sm whitespace-pre-wrap" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ReplyThread ticket={ticket} />
              <ReplyForm ticketId={id!} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <UpdateTicket ticket={ticket} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
