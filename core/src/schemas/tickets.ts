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

const STATUS_VALUES = Object.values(TicketStatus) as [TicketStatus, ...TicketStatus[]]
const CATEGORY_VALUES = Object.values(TicketCategory) as [TicketCategory, ...TicketCategory[]]

export const updateTicketSchema = z.object({
  assignedAgentId: z.string().min(1).nullable().optional(),
  status: z.enum(STATUS_VALUES).optional(),
  category: z.enum(CATEGORY_VALUES).optional(),
})

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>

export const SenderType = {
  customer: 'customer',
  agent: 'agent',
  ai: 'ai',
} as const

export type SenderType = (typeof SenderType)[keyof typeof SenderType]

export const createReplySchema = z.object({
  body: z.string().min(1, 'Reply cannot be empty').max(10000),
})

export type CreateReplyInput = z.infer<typeof createReplySchema>
