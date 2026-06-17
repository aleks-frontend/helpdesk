import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import type { TicketsPerDayEntry } from 'core'

interface Props {
  data: TicketsPerDayEntry[]
  isLoading: boolean
}

/** Formats an ISO date "YYYY-MM-DD" as a short label, e.g. "Jun 1". */
function shortDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day!)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function TicketsBarChart({ data, isLoading }: Props) {
  if (isLoading) return <Skeleton className="h-48 w-full" />

  // Show every 5th label to avoid crowding on the 30-day x-axis.
  const tickFormatter = (iso: string, index: number) =>
    index % 5 === 0 ? shortDate(iso) : ''

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={tickFormatter}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [value, 'Tickets']}
          labelFormatter={(iso) => (typeof iso === 'string' ? shortDate(iso) : '')}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--card-foreground)',
          }}
          cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
        />
        <Bar dataKey="count" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}
