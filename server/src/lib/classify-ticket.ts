import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { prisma } from './prisma.js'
import { TicketCategory } from 'core'

const CATEGORY_LIST = Object.values(TicketCategory).join(', ')

export function classifyTicket(ticketId: string, subject: string, body: string): void {
  doClassify(ticketId, subject, body).catch((err) => {
    console.error(`[classify] Failed to classify ticket ${ticketId}:`, err)
  })
}

async function doClassify(ticketId: string, subject: string, body: string): Promise<void> {
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
}
