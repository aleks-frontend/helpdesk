import { z } from 'zod'
import { TicketStatus, TicketCategory } from 'core'

const SORTABLE = ['subject', 'senderName', 'status', 'category', 'createdAt'] as const

const STATUS_VALUES = Object.values(TicketStatus) as [TicketStatus, ...TicketStatus[]]
const CATEGORY_VALUES = Object.values(TicketCategory) as [TicketCategory, ...TicketCategory[]]

export const ticketQuerySchema = z.object({
  sortBy: z.enum(SORTABLE).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.enum(STATUS_VALUES).optional(),
  category: z.enum(CATEGORY_VALUES).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
})
