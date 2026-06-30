import { Router } from 'express'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { requireAuth } from '../middleware/require-auth.js'
import { prisma } from '../lib/prisma.js'
import { validateBody } from '../lib/validate-body.js'
import { parseUUID } from '../lib/parse-uuid.js'
import { createReplySchema, polishReplySchema } from 'core'
import { sendEmailJob } from '../lib/queue.js'

export const repliesRouter = Router({ mergeParams: true })

repliesRouter.post('/polish', requireAuth, async (req, res) => {
  const ticketId = parseUUID(req.params.ticketId, res, 'ticket ID')
  if (!ticketId) return

  const data = validateBody(polishReplySchema, req.body, res)
  if (!data) return

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  const agentName = req.user!.name
  const customerFirstName = ticket.senderName.split(' ')[0]

  let text: string
  try {
    const result = await generateText({
      model: openai('gpt-4.1-nano'),
      system: `You are a customer support assistant. Improve the draft reply: make it professional, clear, and empathetic. Preserve all the original information and intent. Always address the customer by their first name (${customerFirstName}). End the reply with this signature on a new line:\n${agentName}\nhttps://aleksthecoder.com/\nReturn only the improved reply text with no preamble.`,
      prompt: `Ticket subject: ${ticket.subject}\n\nCustomer message:\n${ticket.body}\n\nDraft reply:\n${data.body}`,
    })
    text = result.text
  } catch (err) {
    console.error('[polish] OpenAI error:', err)
    const message = err instanceof Error ? err.message : 'AI request failed'
    res.status(502).json({ error: message })
    return
  }

  res.json({ body: text })
})

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

  sendEmailJob({
    to: ticket.senderEmail,
    toName: ticket.senderName,
    subject: ticket.subject,
    body: data.body,
    bodyHtml: data.bodyHtml,
  }).catch((err) => console.error('[email] Failed to enqueue reply email for ticket', ticketId, err))

  res.status(201).json(reply)
})
