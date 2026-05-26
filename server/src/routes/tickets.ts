import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { prisma } from '../lib/prisma.js'

export const ticketsRouter = Router()

ticketsRouter.get('/', requireAuth, async (_req, res) => {
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
    orderBy: { createdAt: 'desc' },
  })
  res.json({ tickets })
})
