import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/require-auth.js'
import { prisma } from '../lib/prisma.js'
import { validateBody } from '../lib/validate-body.js'

export const ticketsRouter = Router()

const SORTABLE = ['subject', 'studentName', 'status', 'category', 'createdAt'] as const

const sortSchema = z.object({
  sortBy: z.enum(SORTABLE).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

ticketsRouter.get('/', requireAuth, async (req, res) => {
  const params = validateBody(sortSchema, req.query, res)
  if (!params) return
  const { sortBy, sortOrder } = params
  const tickets = await prisma.ticket.findMany({
    select: {
      id: true,
      studentEmail: true,
      studentName: true,
      subject: true,
      status: true,
      category: true,
      createdAt: true,
    },
    orderBy: { [sortBy]: sortOrder },
  })
  res.json({ tickets })
})
