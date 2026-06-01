import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { prisma } from '../lib/prisma.js'
import { Role } from '../generated/prisma/enums.js'
import { validateBody } from '../lib/validate-body.js'
import { ticketQuerySchema } from '../schemas/tickets.js'
import { assignTicketSchema } from 'core'

export const ticketsRouter = Router()

ticketsRouter.get('/', requireAuth, async (req, res) => {
  const params = validateBody(ticketQuerySchema, req.query, res)
  if (!params) return
  const { sortBy, sortOrder, status, category, search, page, pageSize } = params

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

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
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
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ticket.count({ where }),
  ])

  res.json({ tickets, total, page, pageSize })
})

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

ticketsRouter.get('/:id', requireAuth, async (req, res) => {
  const id = String(req.params.id)
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: 'Invalid ticket ID' })
    return
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      assignedAgent: { select: { id: true, name: true, email: true } },
    },
  })

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  res.json(ticket)
})

ticketsRouter.patch('/:id', requireAuth, async (req, res) => {
  const id = String(req.params.id)
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: 'Invalid ticket ID' })
    return
  }

  const data = validateBody(assignTicketSchema, req.body, res)
  if (!data) return

  const { assignedAgentId } = data

  if (assignedAgentId !== null) {
    const agent = await prisma.user.findUnique({ where: { id: assignedAgentId } })
    if (!agent || agent.deletedAt || agent.role !== Role.agent) {
      res.status(400).json({ error: 'Invalid agent.' })
      return
    }
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } })
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  await prisma.ticket.update({
    where: { id },
    data: { assignedAgentId },
  })

  res.status(204).send()
})
