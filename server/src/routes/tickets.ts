import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { prisma } from '../lib/prisma.js'
import { validateBody } from '../lib/validate-body.js'
import { ticketQuerySchema } from '../schemas/tickets.js'

export const ticketsRouter = Router()

ticketsRouter.get('/', requireAuth, async (req, res) => {
  const params = validateBody(ticketQuerySchema, req.query, res)
  if (!params) return
  const { sortBy, sortOrder, status, category, search } = params

  const where = {
    ...(status   && { status }),
    ...(category && { category }),
    ...(search   && {
      OR: [
        { subject:      { contains: search, mode: 'insensitive' as const } },
        { studentName:  { contains: search, mode: 'insensitive' as const } },
        { studentEmail: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

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
    where,
    orderBy: { [sortBy]: sortOrder },
  })
  res.json({ tickets })
})
