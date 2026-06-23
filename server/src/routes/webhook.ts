import { Router } from 'express'
import { timingSafeEqual } from 'crypto'
import multer from 'multer'
import Parse from '@sendgrid/inbound-mail-parser'
import { prisma } from '../lib/prisma.js'
import { sendClassifyJob } from '../lib/queue.js'
import { getAiAgentId } from '../lib/ai-agent.js'

export const webhookRouter = Router()

// SendGrid sends multipart/form-data — parse it in memory (no disk writes)
const upload = multer({ storage: multer.memoryStorage() })

/** Extracts email and display name from "Name <email@example.com>" or "email@example.com" */
function parseFrom(from: string): { email: string; name: string | undefined } {
  const match = from.match(/^(.*?)\s*<([^>]+)>$/)
  if (match) {
    const name = match[1]!.trim()
    return { email: match[2]!.trim(), name: name || undefined }
  }
  return { email: from.trim(), name: undefined }
}

webhookRouter.post('/email', upload.any(), async (req, res) => {
  const secret = process.env.WEBHOOK_SECRET
  if (secret) {
    const provided = req.headers['x-webhook-secret'] || req.query.secret
    if (typeof provided !== 'string') {
      res.status(401).json({ error: 'Missing webhook secret.' })
      return
    }
    const a = Buffer.from(provided)
    const b = Buffer.from(secret)
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      res.status(401).json({ error: 'Invalid webhook secret.' })
      return
    }
  } else {
    console.warn('[webhook] WEBHOOK_SECRET is not set — secret check skipped.')
  }

  const parse = new Parse({ keys: ['from', 'subject', 'text', 'html'] }, req as never)
  const fields = parse.keyValues() as {
    from?: string
    subject?: string
    text?: string
    html?: string
  }

  const { from: rawFrom, subject, text, html } = fields

  if (!rawFrom || !subject || !text) {
    res.status(400).json({ error: 'Missing required fields: from, subject, text.' })
    return
  }

  const { email: from, name: fromName } = parseFrom(rawFrom)

  if (!from) {
    res.status(400).json({ error: 'Could not parse sender email.' })
    return
  }

  const body = text
  const bodyHtml = html || undefined

  const normalizedSubject = subject.replace(/^(re|fwd?):\s*/i, '').trim()

  const existingTicket = await prisma.ticket.findFirst({
    where: {
      senderEmail: from,
      status: { in: ['new', 'processing', 'open'] },
      subject: { equals: normalizedSubject, mode: 'insensitive' },
    },
  })

  if (existingTicket) {
    await prisma.reply.create({
      data: {
        body,
        bodyHtml,
        senderType: 'customer',
        ticketId: existingTicket.id,
        userId: null,
      },
    })
    res.status(200).json({ ticket: existingTicket })
    return
  }

  const aiAgentId = await getAiAgentId()

  const ticket = await prisma.ticket.create({
    data: {
      senderEmail: from,
      senderName: fromName ?? from,
      subject,
      body,
      bodyHtml,
      assignedAgentId: aiAgentId,
      replies: { create: { body, bodyHtml, senderType: 'customer', userId: null } },
    },
    select: { id: true, senderEmail: true, subject: true, createdAt: true },
  })

  sendClassifyJob({ id: ticket.id, subject, body, senderName: fromName ?? from }).catch(console.error)

  res.status(201).json({ ticket })
})
