import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/StatCard'
import { TicketsBarChart } from '@/components/TicketsBarChart'
import { formatDuration } from '@/lib/format-duration'
import type { DashboardStats, TicketsPerDayEntry } from 'core'
import api from '@/lib/api'

export default function HomePage() {
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats').then((r) => r.data),
  })

  const chartQuery = useQuery({
    queryKey: ['dashboard-tickets-per-day'],
    queryFn: () => api.get<TicketsPerDayEntry[]>('/dashboard/tickets-per-day').then((r) => r.data),
  })

  const { data, isLoading, error } = statsQuery

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <p className="text-sm text-destructive">{(error as Error).message}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Total tickets" value={String(data?.totalTickets ?? 0)} isLoading={isLoading} />
              <StatCard label="Open tickets" value={String(data?.openTickets ?? 0)} isLoading={isLoading} />
              <StatCard
                label="Resolved by AI"
                value={String(data?.aiResolvedTickets ?? 0)}
                isLoading={isLoading}
              />
              <StatCard
                label="% resolved by AI"
                value={`${(data?.aiResolvedPercent ?? 0).toFixed(1)}%`}
                isLoading={isLoading}
              />
              <StatCard
                label="Avg. resolution time"
                value={data?.avgResolutionMs != null ? formatDuration(data.avgResolutionMs) : '—'}
                isLoading={isLoading}
              />
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Tickets per day — last 30 days</p>
            {chartQuery.error ? (
              <p className="text-sm text-destructive">{(chartQuery.error as Error).message}</p>
            ) : (
              <TicketsBarChart data={chartQuery.data ?? []} isLoading={chartQuery.isLoading} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
