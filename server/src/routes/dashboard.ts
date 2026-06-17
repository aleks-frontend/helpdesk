import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { prisma } from '../lib/prisma.js'
import type { DashboardStats, TicketsPerDayEntry } from 'core'
import { TicketStatus } from '../generated/prisma/enums.js'

export const dashboardRouter = Router()

const DONE_STATUSES: TicketStatus[] = ['resolved', 'closed']

dashboardRouter.get('/stats', requireAuth, async (_req, res) => {
  const [totalTickets, openTickets, aiResolvedTickets, doneTickets] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: 'open' } }),
    // Resolved (or later closed) entirely by the auto-resolve pipeline: an AI reply exists
    // and no human agent ever replied to the ticket.
    prisma.ticket.count({
      where: {
        status: { in: DONE_STATUSES },
        replies: { some: { senderType: 'ai' } },
        NOT: { replies: { some: { senderType: 'agent' } } },
      },
    }),
    prisma.ticket.findMany({
      where: { status: { in: DONE_STATUSES } },
      select: { createdAt: true, updatedAt: true },
    }),
  ])

  const aiResolvedPercent = totalTickets > 0 ? (aiResolvedTickets / totalTickets) * 100 : 0

  const avgResolutionMs =
    doneTickets.length > 0
      ? doneTickets.reduce((sum, t) => sum + (t.updatedAt.getTime() - t.createdAt.getTime()), 0) /
        doneTickets.length
      : null

  const stats: DashboardStats = {
    totalTickets,
    openTickets,
    aiResolvedTickets,
    aiResolvedPercent,
    avgResolutionMs,
  }

  res.json(stats)
})

dashboardRouter.get('/tickets-per-day', requireAuth, async (_req, res) => {
  // Aggregate ticket counts grouped by UTC calendar day over the past 30 days.
  // Raw SQL is necessary because Prisma's groupBy does not support date-level truncation.
  const rows = await prisma.$queryRaw<{ date: Date; count: number }[]>`
    SELECT
      DATE("createdAt" AT TIME ZONE 'UTC') AS date,
      COUNT(*)::int                         AS count
    FROM ticket
    WHERE "createdAt" >= NOW() - INTERVAL '30 days'
    GROUP BY DATE("createdAt" AT TIME ZONE 'UTC')
    ORDER BY date
  `

  // Build a full 30-day series, filling zeros for days with no tickets.
  const byDate = new Map(rows.map((r) => [r.date.toISOString().slice(0, 10), r.count]))

  const series: TicketsPerDayEntry[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
    const key = d.toISOString().slice(0, 10)
    series.push({ date: key, count: byDate.get(key) ?? 0 })
  }

  res.json(series)
})
