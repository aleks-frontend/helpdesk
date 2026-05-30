import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TicketStatus, TicketCategory } from 'core'
import TicketsPage from './TicketsPage'
import api from '@/lib/api'
import { renderWrapper as wrapper } from '@/test/render-with-query'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn() },
}))

const mockGet = vi.mocked(api.get)

const TICKETS = [
  {
    id: '1',
    studentEmail: 'alice@university.edu',
    studentName: 'Alice Smith',
    subject: 'Cannot access course materials',
    status: TicketStatus.open,
    category: TicketCategory.technical,
    createdAt: '2026-05-28T10:00:00.000Z',
  },
  {
    id: '2',
    studentEmail: 'bob@university.edu',
    studentName: 'Bob Jones',
    subject: 'Refund request for March',
    status: TicketStatus.resolved,
    category: TicketCategory.refund,
    createdAt: '2026-05-27T08:00:00.000Z',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TicketsPage', () => {
  it('shows skeleton rows while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}))

    render(<TicketsPage />, { wrapper })

    expect(screen.getByText('Subject')).toBeInTheDocument()
    expect(screen.getByText('From')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Received')).toBeInTheDocument()

    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
  })

  it('renders a row for each ticket after data loads', async () => {
    mockGet.mockResolvedValue({ data: { tickets: TICKETS } })

    render(<TicketsPage />, { wrapper })

    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeInTheDocument())

    expect(screen.getByText('Cannot access course materials')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    expect(screen.getByText('Refund request for March')).toBeInTheDocument()
  })

  it('renders student email below student name', async () => {
    mockGet.mockResolvedValue({ data: { tickets: TICKETS } })

    render(<TicketsPage />, { wrapper })

    await waitFor(() => screen.getByText('Alice Smith'))

    expect(screen.getByText('alice@university.edu')).toBeInTheDocument()
    expect(screen.getByText('bob@university.edu')).toBeInTheDocument()
  })

  it('renders status badges', async () => {
    mockGet.mockResolvedValue({ data: { tickets: TICKETS } })

    render(<TicketsPage />, { wrapper })

    await waitFor(() => screen.getByText('open'))

    expect(screen.getByText('open')).toBeInTheDocument()
    expect(screen.getByText('resolved')).toBeInTheDocument()
  })

  it('renders category badges', async () => {
    mockGet.mockResolvedValue({ data: { tickets: TICKETS } })

    render(<TicketsPage />, { wrapper })

    await waitFor(() => screen.getByText('technical'))

    expect(screen.getByText('technical')).toBeInTheDocument()
    expect(screen.getByText('refund')).toBeInTheDocument()
  })

  it('formats createdAt as a local date string', async () => {
    mockGet.mockResolvedValue({ data: { tickets: TICKETS } })

    render(<TicketsPage />, { wrapper })

    const expected = new Date('2026-05-28T10:00:00.000Z').toLocaleDateString()
    await waitFor(() => screen.getByText(expected))

    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('shows "No tickets yet." when the tickets list is empty', async () => {
    mockGet.mockResolvedValue({ data: { tickets: [] } })

    render(<TicketsPage />, { wrapper })

    await waitFor(() => screen.getByText('No tickets yet.'))

    expect(screen.getByText('No tickets yet.')).toBeInTheDocument()
    expect(screen.queryAllByRole('cell')).toHaveLength(0)
  })

  it('shows an error message when the request fails', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'))

    render(<TicketsPage />, { wrapper })

    await waitFor(() => screen.getByText('Network Error'))

    expect(screen.getByText('Network Error')).toBeInTheDocument()
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
  })

  it('calls GET /tickets with default sort (createdAt desc) on mount', async () => {
    mockGet.mockResolvedValue({ data: { tickets: [] } })

    render(<TicketsPage />, { wrapper })

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))
    expect(mockGet).toHaveBeenCalledWith('/tickets', {
      params: { sortBy: 'createdAt', sortOrder: 'desc' },
    })
  })

  it('preserves API response order (newest first)', async () => {
    mockGet.mockResolvedValue({ data: { tickets: TICKETS } })

    render(<TicketsPage />, { wrapper })

    await waitFor(() => screen.getByText('Cannot access course materials'))

    const rows = screen.getAllByRole('row')
    const subjects = rows.map((r) => r.textContent ?? '')
    const firstIdx = subjects.findIndex((t) => t.includes('Cannot access course materials'))
    const secondIdx = subjects.findIndex((t) => t.includes('Refund request for March'))

    expect(firstIdx).toBeLessThan(secondIdx)
  })

  it('renders all three status values with correct text', async () => {
    const tickets = [
      { ...TICKETS[0], id: 'a', status: TicketStatus.open },
      { ...TICKETS[0], id: 'b', subject: 'Ticket B', status: TicketStatus.resolved },
      { ...TICKETS[0], id: 'c', subject: 'Ticket C', status: TicketStatus.closed },
    ]
    mockGet.mockResolvedValue({ data: { tickets } })

    render(<TicketsPage />, { wrapper })

    await waitFor(() => screen.getByText('open'))

    expect(screen.getByText('open')).toBeInTheDocument()
    expect(screen.getByText('resolved')).toBeInTheDocument()
    expect(screen.getByText('closed')).toBeInTheDocument()
  })

  it('renders all three category values with correct text', async () => {
    const tickets = [
      { ...TICKETS[0], id: 'a', category: TicketCategory.general },
      { ...TICKETS[0], id: 'b', subject: 'Ticket B', category: TicketCategory.technical },
      { ...TICKETS[0], id: 'c', subject: 'Ticket C', category: TicketCategory.refund },
    ]
    mockGet.mockResolvedValue({ data: { tickets } })

    render(<TicketsPage />, { wrapper })

    await waitFor(() => screen.getByText('general'))

    expect(screen.getByText('general')).toBeInTheDocument()
    expect(screen.getByText('technical')).toBeInTheDocument()
    expect(screen.getByText('refund')).toBeInTheDocument()
  })
})

describe('TicketsPage — sorting', () => {
  it('clicking "Subject" header refetches with sortBy=subject&sortOrder=asc', async () => {
    mockGet.mockResolvedValue({ data: { tickets: TICKETS } })
    const user = userEvent.setup()

    render(<TicketsPage />, { wrapper })

    await waitFor(() => screen.getByText('Alice Smith'))

    await user.click(screen.getByRole('button', { name: /Subject/i }))

    await waitFor(() =>
      expect(mockGet).toHaveBeenLastCalledWith('/tickets', {
        params: { sortBy: 'subject', sortOrder: 'asc' },
      }),
    )
  })

  it('clicking the same header twice toggles to desc', async () => {
    mockGet.mockResolvedValue({ data: { tickets: TICKETS } })
    const user = userEvent.setup()

    render(<TicketsPage />, { wrapper })

    await waitFor(() => screen.getByText('Alice Smith'))

    await user.click(screen.getByRole('button', { name: /Subject/i }))
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/tickets', {
        params: { sortBy: 'subject', sortOrder: 'asc' },
      }),
    )

    await user.click(screen.getByRole('button', { name: /Subject/i }))
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/tickets', {
        params: { sortBy: 'subject', sortOrder: 'desc' },
      }),
    )
  })

  it('clicking "Received" header toggles from desc to asc (enableSortingRemoval: false)', async () => {
    mockGet.mockResolvedValue({ data: { tickets: TICKETS } })
    const user = userEvent.setup()

    render(<TicketsPage />, { wrapper })

    await waitFor(() => screen.getByText('Alice Smith'))

    await user.click(screen.getByRole('button', { name: /Received/i }))

    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/tickets', {
        params: { sortBy: 'createdAt', sortOrder: 'asc' },
      }),
    )
  })

  it('clicking "From" header sorts by studentName', async () => {
    mockGet.mockResolvedValue({ data: { tickets: TICKETS } })
    const user = userEvent.setup()

    render(<TicketsPage />, { wrapper })

    await waitFor(() => screen.getByText('Alice Smith'))

    await user.click(screen.getByRole('button', { name: /From/i }))

    await waitFor(() =>
      expect(mockGet).toHaveBeenLastCalledWith('/tickets', {
        params: { sortBy: 'studentName', sortOrder: 'asc' },
      }),
    )
  })
})

describe('TicketsPage — filtering', () => {
  afterEach(() => vi.useRealTimers())

  it('search input sends search param after 300 ms debounce', async () => {
    mockGet.mockResolvedValue({ data: { tickets: [] } })
    const user = userEvent.setup()

    render(<TicketsPage />, { wrapper })
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))

    await user.type(screen.getByPlaceholderText('Search...'), 'portal')

    await waitFor(
      () =>
        expect(mockGet).toHaveBeenCalledWith('/tickets', {
          params: expect.objectContaining({ search: 'portal' }),
        }),
      { timeout: 1000 },
    )
  })

  it('"Poništi" button is hidden by default and appears when a filter is active', async () => {
    mockGet.mockResolvedValue({ data: { tickets: [] } })
    const user = userEvent.setup()

    render(<TicketsPage />, { wrapper })
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))

    expect(screen.queryByRole('button', { name: /Clear/i })).not.toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Search...'), 'test')

    expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument()
  })

  it('"Poništi" button clears search and hides itself', async () => {
    mockGet.mockResolvedValue({ data: { tickets: [] } })
    const user = userEvent.setup()

    render(<TicketsPage />, { wrapper })
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))

    await user.type(screen.getByPlaceholderText('Search...'), 'portal')
    // wait for debounce
    await waitFor(
      () => expect(mockGet).toHaveBeenCalledWith('/tickets', {
        params: expect.objectContaining({ search: 'portal' }),
      }),
      { timeout: 1000 },
    )

    await user.click(screen.getByRole('button', { name: /Clear/i }))

    expect(screen.getByPlaceholderText('Search...')).toHaveValue('')
    expect(screen.queryByRole('button', { name: /Clear/i })).not.toBeInTheDocument()
  })

  it('selecting a status option adds status param', async () => {
    mockGet.mockResolvedValue({ data: { tickets: [] } })
    const user = userEvent.setup()

    render(<TicketsPage />, { wrapper })
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))

    const triggers = document.querySelectorAll('[data-slot="select-trigger"]')
    await user.click(triggers[0] as HTMLElement)
    await user.click(await screen.findByRole('option', { name: /^Open$/i }))

    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/tickets', {
        params: expect.objectContaining({ status: 'open' }),
      }),
    )
  })

  it('selecting a category option adds category param', async () => {
    mockGet.mockResolvedValue({ data: { tickets: [] } })
    const user = userEvent.setup()

    render(<TicketsPage />, { wrapper })
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))

    const triggers = document.querySelectorAll('[data-slot="select-trigger"]')
    await user.click(triggers[1] as HTMLElement)
    await user.click(await screen.findByRole('option', { name: /^Technical$/i }))

    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/tickets', {
        params: expect.objectContaining({ category: 'technical' }),
      }),
    )
  })
})
