import { z } from 'zod'

const SORTABLE = ['subject', 'studentName', 'status', 'category', 'createdAt'] as const

export const ticketQuerySchema = z.object({
  sortBy: z.enum(SORTABLE).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})
