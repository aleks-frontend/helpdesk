import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { prisma } from './prisma.js'
import { boss } from './boss.js'
import { TicketCategory } from 'core'

interface ClassifyJobData {
  ticketId: string
  subject: string
  body: string
}

const QUEUE_NAME = 'classify-ticket'
const CATEGORY_LIST = Object.values(TicketCategory).join(', ')

export async function stopQueue(): Promise<void> {
  await boss.stop({ graceful: true, timeout: 30000 })
}

export async function sendClassifyJob(ticket: {
  id: string
  subject: string
  body: string
}): Promise<void> {
  await boss.send(QUEUE_NAME, {
    ticketId: ticket.id,
    subject: ticket.subject,
    body: ticket.body,
  })
}

export async function startQueue(): Promise<void> {
  await boss.start()

  await boss.createQueue(QUEUE_NAME, {
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
  })

  await boss.work<ClassifyJobData>(QUEUE_NAME, async (jobs) => {
    const { ticketId, subject, body } = jobs[0]!.data

    const { text } = await generateText({
      model: openai('gpt-4.1-nano'),
      system:
        'You are a support ticket classifier. ' +
        `Classify the ticket into exactly one of these categories: ${CATEGORY_LIST}. ` +
        'Return only the category value with no extra text.',
      prompt: `Subject: ${subject}\n\nBody:\n${body}`,
    })

    const raw = text.trim().toLowerCase()
    const category = Object.values(TicketCategory).find((c) => c === raw)
    if (!category) {
      console.warn(`[classify] Unexpected category "${raw}" for ticket ${ticketId}`)
      return
    }

    await prisma.ticket.update({ where: { id: ticketId }, data: { category } })
    console.log(`[classify] Ticket ${ticketId} → ${category}`)
  })
}
