import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { prisma } from '../lib/prisma.js'
import { validateBody } from '../lib/validate-body.js'
import { ticketQuerySchema } from '../schemas/tickets.js'

export const ticketsRouter = Router()

ticketsRouter.get('/', requireAuth, async (req, res) => {
  const params = validateBody(ticketQuerySchema, req.query, res)
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
