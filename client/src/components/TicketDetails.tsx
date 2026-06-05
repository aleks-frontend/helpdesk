import type { TicketDetail } from '@/pages/TicketDetailPage'

interface TicketDetailsProps {
  ticket: TicketDetail
}

export function TicketDetails({ ticket }: TicketDetailsProps) {
  return (
    <>
      <p>
        <span className="text-muted-foreground">From: </span>
        <span className="font-medium">{ticket.senderName}</span>
        <span className="text-muted-foreground"> &lt;{ticket.senderEmail}&gt;</span>
      </p>
      <p className="text-muted-foreground">
        Received: {new Date(ticket.createdAt).toLocaleString()}
      </p>
    </>
  )
}
