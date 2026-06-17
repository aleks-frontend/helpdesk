import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { DashboardStats, TicketsPerDayEntry } from 'core'
import HomePage from './HomePage'
import api from '@/lib/api'
import { renderWrapper as wrapper } from '@/test/render-with-query'

// Recharts renders SVG that JSDOM doesn't fully support — stub the chart component.
vi.mock('@/components/TicketsBarChart', () => ({
  TicketsBarChart: ({ isLoading }: { isLoading: boolean }) =>
    isLoading ? <div data-testid="chart-skeleton" /> : <div data-testid="chart" />,
}))

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn() },
}))

const mockGet = vi.mocked(api.get)

const STATS: DashboardStats = {
  totalTickets: 42,
  openTickets: 7,
  aiResolvedTickets: 30,
  aiResolvedPercent: 71.4,
  avgResolutionMs: 5 * 60 * 60 * 1000 + 12 * 60 * 1000,
}

const CHART_DATA: TicketsPerDayEntry[] = [
  { date: '2026-06-01', count: 3 },
  { date: '2026-06-02', count: 5 },
]

function setupMocks(statsData = STATS, chartData: TicketsPerDayEntry[] = CHART_DATA) {
  mockGet.mockImplementation((url: string) => {
    if (url === '/dashboard/stats') return Promise.resolve({ data: statsData })
    if (url === '/dashboard/tickets-per-day') return Promise.resolve({ data: chartData })
    return Promise.reject(new Error(`Unexpected URL: ${url}`))
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('HomePage', () => {
  it('shows skeletons while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}))

    render(<HomePage />, { wrapper })

    expect(screen.getByText('Total tickets')).toBeInTheDocument()
    expect(screen.queryByText('42')).not.toBeInTheDocument()
    expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument()
  })

  it('renders the stats once loaded', async () => {
    setupMocks()

    render(<HomePage />, { wrapper })

    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument())

    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('71.4%')).toBeInTheDocument()
    expect(screen.getByText('5h 12m')).toBeInTheDocument()
  })

  it('renders the chart section once chart data loads', async () => {
    setupMocks()

    render(<HomePage />, { wrapper })

    await waitFor(() => expect(screen.getByTestId('chart')).toBeInTheDocument())
    expect(screen.getByText('Tickets per day — last 30 days')).toBeInTheDocument()
  })

  it('renders a dash when there is no resolution time data yet', async () => {
    setupMocks({ ...STATS, avgResolutionMs: null })

    render(<HomePage />, { wrapper })

    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument())

    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows an error message when the stats request fails', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/dashboard/stats') return Promise.reject(new Error('Network error'))
      return Promise.resolve({ data: [] })
    })

    render(<HomePage />, { wrapper })

    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument())
  })
})
