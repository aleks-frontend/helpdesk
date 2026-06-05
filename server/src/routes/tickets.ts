import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { prisma } from '../lib/prisma.js'
import { Role } from '../generated/prisma/enums.js'
import { validateBody } from '../lib/validate-body.js'
import { ticketQuerySchema } from '../schemas/tickets.js'
import { updateTicketSchema } from 'core'
import { parseUUID } from '../lib/parse-uuid.js'

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
        { subject:     { contains: search, mode: 'insensitive' as const } },
        { senderName:  { contains: search, mode: 'insensitive' as const } },
        { senderEmail: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      select: {
        id: true,
        senderEmail: true,
        senderName: true,
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

ticketsRouter.get('/:id', requireAuth, async (req, res) => {
  const id = parseUUID(req.params.id, res, 'ticket ID')
  if (!id) return

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
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
  const id = parseUUID(req.params.id, res, 'ticket ID')
  if (!id) return

  const data = validateBody(updateTicketSchema, req.body, res)
  if (!data) return

  const { assignedAgentId, status, category } = data

  if (assignedAgentId != null) {
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
    data: {
      ...(assignedAgentId !== undefined && { assignedAgentId }),
      ...(status !== undefined && { status }),
      ...(category !== undefined && { category }),
    },
  })

  res.status(204).send()
})

