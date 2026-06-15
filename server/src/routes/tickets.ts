import { Router } from 'express'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { requireAuth } from '../middleware/require-auth.js'
import { prisma } from '../lib/prisma.js'
import { Prisma } from '../generated/prisma/client.js'
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

  const where: Prisma.TicketWhereInput = {
    NOT: { status: { in: ['new', 'processing'] } },
    ...(status   && { status }),
    ...(category && { category }),
    ...(search   && {
      OR: [
        { subject:     { contains: search, mode: 'insensitive' } },
        { senderName:  { contains: search, mode: 'insensitive' } },
        { senderEmail: { contains: search, mode: 'insensitive' } },
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

ticketsRouter.post('/:id/summarize', requireAuth, async (req, res) => {
  const id = parseUUID(req.params.id, res, 'ticket ID')
  if (!id) return

  const ticket = await prisma.ticket.findUnique({ where: { id } })
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  const replies = await prisma.reply.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { name: true } } },
  })

  const conversationLines = replies.map((r) => {
    const label =
      r.senderType === 'ai' ? 'AI' : r.senderType === 'agent' ? (r.user?.name ?? 'Agent') : ticket.senderName
    return `${label}: ${r.body}`
  })

  const prompt = [
    `Ticket subject: ${ticket.subject}`,
    `From: ${ticket.senderName} <${ticket.senderEmail}>`,
    `Original message:\n${ticket.body}`,
    conversationLines.length > 0 ? `\nConversation:\n${conversationLines.join('\n\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  let summary: string
  try {
    const result = await generateText({
      model: openai('gpt-4.1-nano'),
      system:
        'You are a customer support assistant. Summarize the support ticket and conversation history in 2–4 concise bullet points. Cover: the customer\'s issue, any steps taken, and the current status. Be brief and factual. Return only the bullet points, no preamble.',
      prompt,
    })
    summary = result.text
  } catch (err) {
    console.error('[summarize] OpenAI error:', err)
    const message = err instanceof Error ? err.message : 'AI request failed'
    res.status(502).json({ error: message })
    return
  }

  res.json({ summary })
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

