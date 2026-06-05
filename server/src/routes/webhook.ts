import { Router } from 'express'
import { timingSafeEqual } from 'crypto'
import { prisma } from '../lib/prisma.js'
import { validateBody } from '../lib/validate-body.js'
import { inboundEmailSchema } from 'core'

export const webhookRouter = Router()

webhookRouter.post('/email', async (req, res) => {
  const secret = process.env.WEBHOOK_SECRET
  if (secret) {
    const provided = req.headers['x-webhook-secret']
    if (typeof provided !== 'string') {
      res.status(401).json({ error: 'Missing X-Webhook-Secret header.' })
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

  const data = validateBody(inboundEmailSchema, req.body, res)
  if (!data) return

  const { from, fromName, subject, body } = data

  const normalizedSubject = subject.replace(/^(re|fwd?):\s*/i, '').trim()

  const existingTicket = await prisma.ticket.findFirst({
    where: {
      senderEmail: from,
      status: 'open',
      subject: { equals: normalizedSubject, mode: 'insensitive' },
    },
  })

  if (existingTicket) {
    await prisma.reply.create({
      data: {
        body,
        senderType: 'customer',
        ticketId: existingTicket.id,
        userId: null,
      },
    })
    res.status(200).json({ ticket: existingTicket })
    return
  }

  const ticket = await prisma.ticket.create({
    data: {
      senderEmail: from,
      senderName: fromName ?? from,
      subject,
      body,
      replies: { create: { body, senderType: 'customer', userId: null } },
    },
    select: { id: true, senderEmail: true, subject: true, createdAt: true },
  })

  res.status(201).json({ ticket })
})
