import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { prisma } from './prisma.js'
import { boss } from './boss.js'
import { TicketCategory } from 'core'

interface ClassifyJobData {
  ticketId: string
  subject: string
  body: string
  senderName: string
}

interface AutoResolveJobData {
  ticketId: string
  subject: string
  body: string
  senderName: string
}

const CLASSIFY_QUEUE = 'classify-ticket'
const AUTO_RESOLVE_QUEUE = 'auto-resolve-ticket'
const CATEGORY_LIST = Object.values(TicketCategory).join(', ')

const KNOWLEDGE_BASE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'knowledge-base.md'
)

export async function sendClassifyJob(ticket: {
  id: string
  subject: string
  body: string
  senderName: string
}): Promise<void> {
  await boss.send(CLASSIFY_QUEUE, {
    ticketId: ticket.id,
    subject: ticket.subject,
    body: ticket.body,
    senderName: ticket.senderName,
  })
}

export async function startQueue(): Promise<void> {
  await boss.start()

  await boss.createQueue(CLASSIFY_QUEUE, {
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
  })

  await boss.work<ClassifyJobData>(CLASSIFY_QUEUE, async (jobs) => {
    const { ticketId, subject, body, senderName } = jobs[0]!.data

    await prisma.ticket.update({ where: { id: ticketId }, data: { status: 'processing' } })

    let text: string
    try {
      text = (await generateText({
        model: openai('gpt-4.1-nano'),
        system:
          'You are a support ticket classifier. ' +
          `Classify the ticket into exactly one of these categories: ${CATEGORY_LIST}. ` +
          'Return only the category value with no extra text.',
        prompt: `Subject: ${subject}\n\nBody:\n${body}`,
      })).text
    } catch (err) {
      console.error(`[classify] AI error for ticket ${ticketId} — escalating:`, err)
      await prisma.ticket.update({ where: { id: ticketId }, data: { status: 'open' } })
      return
    }

    const raw = text.trim().toLowerCase()
    const category = Object.values(TicketCategory).find((c) => c === raw)
    if (!category) {
      console.warn(`[classify] Unexpected category "${raw}" for ticket ${ticketId} — escalating`)
      await prisma.ticket.update({ where: { id: ticketId }, data: { status: 'open' } })
      return
    }

    await prisma.ticket.update({ where: { id: ticketId }, data: { category } })
    console.log(`[classify] Ticket ${ticketId} → ${category}`)

    await boss.send(AUTO_RESOLVE_QUEUE, { ticketId, subject, body, senderName })
  })

  await boss.createQueue(AUTO_RESOLVE_QUEUE, {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
  })

  await boss.work<AutoResolveJobData>(AUTO_RESOLVE_QUEUE, async (jobs) => {
    const { ticketId, subject, body, senderName } = jobs[0]!.data
    const customerFirstName = senderName.split(' ')[0] || senderName

    let knowledgeBase: string
    try {
      knowledgeBase = await readFile(KNOWLEDGE_BASE_PATH, 'utf-8')
    } catch (err) {
      console.error('[auto-resolve] Failed to read knowledge base — escalating:', err)
      await prisma.ticket.update({ where: { id: ticketId }, data: { status: 'open' } })
      return
    }

    let text: string
    try {
      text = (await generateText({
        model: openai('gpt-4.1-nano'),
        system: [
          'You are a customer support assistant for Code with Mosh.',
          'Knowledge base:\n\n' + knowledgeBase,
          '',
          "If you can fully answer the customer's question using ONLY the knowledge base:",
          `  Write a professional, clear, and empathetic reply addressing the customer by their first name (${customerFirstName}).`,
          '  End with this exact signature on its own line: "Code with Mosh Support"',
          '  Use plain text only.',
          'If you cannot answer from the knowledge base: respond with exactly: ESCALATE',
        ].join('\n'),
        prompt: `Ticket subject: ${subject}\n\nCustomer message:\n${body}`,
      })).text
    } catch (err) {
      console.error(`[auto-resolve] AI error for ticket ${ticketId} — escalating:`, err)
      await prisma.ticket.update({ where: { id: ticketId }, data: { status: 'open' } })
      return
    }

    const response = text.trim()

    if (response.toUpperCase().startsWith('ESCALATE')) {
      console.log(`[auto-resolve] Ticket ${ticketId} → escalated to human`)
      await prisma.ticket.update({ where: { id: ticketId }, data: { status: 'open' } })
      return
    }

    await prisma.$transaction([
      prisma.reply.create({
        data: { body: response, bodyHtml: null, senderType: 'ai', ticketId, userId: null },
      }),
      prisma.ticket.update({ where: { id: ticketId }, data: { status: 'resolved' } }),
    ])

    console.log(`[auto-resolve] Ticket ${ticketId} → resolved by AI`)
  })
}

export async function stopQueue(): Promise<void> {
  await boss.stop({ graceful: true, timeout: 30000 })
}
