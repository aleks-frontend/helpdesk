export interface DashboardStats {
  totalTickets: number
  openTickets: number
  aiResolvedTickets: number
  aiResolvedPercent: number
  avgResolutionMs: number | null
}

export interface TicketsPerDayEntry {
  /** ISO date string, e.g. "2026-06-17" */
  date: string
  count: number
}
