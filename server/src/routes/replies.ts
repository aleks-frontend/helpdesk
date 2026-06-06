import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { prisma } from '../lib/prisma.js'
import { validateBody } from '../lib/validate-body.js'
import { parseUUID } from '../lib/parse-uuid.js'
import { createReplySchema } from 'core'

export const repliesRouter = Router({ mergeParams: true })

repliesRouter.get('/', requireAuth, async (req, res) => {
  const ticketId = parseUUID(req.params.ticketId, res, 'ticket ID')
  if (!ticketId) return

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  const replies = await prisma.reply.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true } } },
  })

  res.json(replies)
})

repliesRouter.post('/', requireAuth, async (req, res) => {
  const ticketId = parseUUID(req.params.ticketId, res, 'ticket ID')
  if (!ticketId) return

  const data = validateBody(createReplySchema, req.body, res)
  if (!data) return

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  const reply = await prisma.reply.create({
    data: { ticketId, body: data.body, bodyHtml: data.bodyHtml, senderType: 'agent', userId: req.user!.id },
    include: { user: { select: { id: true, name: true } } },
  })

  res.status(201).json(reply)
})
