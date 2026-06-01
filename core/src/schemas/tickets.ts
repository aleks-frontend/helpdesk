import { z } from 'zod'

export const TicketStatus = {
  open: 'open',
  resolved: 'resolved',
  closed: 'closed',
} as const

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus]

export const TicketCategory = {
  general: 'general',
  technical: 'technical',
  refund: 'refund',
} as const

export type TicketCategory = (typeof TicketCategory)[keyof typeof TicketCategory]

export const inboundEmailSchema = z.object({
  from: z.email('A valid sender email is required.'),
  fromName: z.string().trim().optional(),
  subject: z.string().trim().min(1, 'Subject is required.'),
  body: z.string().min(1, 'Body is required.'),
})

export type InboundEmailInput = z.infer<typeof inboundEmailSchema>

export const assignTicketSchema = z.object({
  assignedAgentId: z.string().min(1).nullable(),
})

export type AssignTicketInput = z.infer<typeof assignTicketSchema>
