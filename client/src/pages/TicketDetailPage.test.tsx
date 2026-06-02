import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TicketStatus, TicketCategory } from 'core'
import TicketDetailPage from './TicketDetailPage'
import api from '@/lib/api'
import { renderWrapper } from '@/test/render-with-query'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}))

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useParams: () => ({ id: 'ticket-123' }),
  }
})

const mockGet = vi.mocked(api.get)
const mockPatch = vi.mocked(api.patch)

const AGENT_1 = { id: 'agent-1', name: 'Alice Agent', email: 'alice@example.com' }
const AGENT_2 = { id: 'agent-2', name: 'Bob Agent', email: 'bob@example.com' }

type Sender = 'ai' | 'agent' | 'student'
type Message = { id: string; body: string; sender: Sender; createdAt: string }
type Agent = { id: string; name: string; email: string }

const BASE_TICKET: {
  id: string
  studentEmail: string
  studentName: string
  subject: string
  body: string
  status: TicketStatus
  category: TicketCategory
  assignedAgentId: string | null
  assignedAgent: Agent | null
  createdAt: string
  updatedAt: string
  messages: Message[]
} = {
  id: 'ticket-123',
  studentEmail: 'student@university.edu',
  studentName: 'Jane Student',
  subject: 'Cannot access course materials',
  body: 'Hi, I have been trying to access the course materials for the past two days but I keep getting an error.',
  status: TicketStatus.open,
  category: TicketCategory.technical,
  assignedAgentId: null,
  assignedAgent: null,
  createdAt: '2026-05-28T10:00:00.000Z',
  updatedAt: '2026-05-28T11:00:00.000Z',
  messages: [],
}

function ticketResponse(overrides: Partial<typeof BASE_TICKET> = {}) {
  return { data: { ...BASE_TICKET, ...overrides } }
}

function agentsResponse(agents = [AGENT_1, AGENT_2]) {
  return { data: { users: agents } }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TicketDetailPage', () => {
  describe('loading state', () => {
    it('renders skeleton while ticket query is pending', () => {
      mockGet.mockReturnValue(new Promise(() => {}))

      render(<TicketDetailPage />, { wrapper: renderWrapper })

      expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
      expect(screen.queryByText('Cannot access course materials')).not.toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows error message when ticket query fails', async () => {
      mockGet.mockImplementation((url: string) => {
        if (url === '/tickets/ticket-123') return Promise.reject(new Error('Failed to fetch ticket'))
        return agentsResponse() as any
      })

      render(<TicketDetailPage />, { wrapper: renderWrapper })

      await waitFor(() => screen.getByText('Failed to fetch ticket'))

      expect(screen.getByText('Failed to fetch ticket')).toBeInTheDocument()
      expect(screen.queryByText('Cannot access course materials')).not.toBeInTheDocument()
    })
  })

  describe('ticket details', () => {
    beforeEach(() => {
      mockGet.mockImplementation((url: string) => {
        if (url === '/tickets/ticket-123') return Promise.resolve(ticketResponse())
        return Promise.resolve(agentsResponse())
      })
    })

    it('renders ticket subject', async () => {
      render(<TicketDetailPage />, { wrapper: renderWrapper })

      await waitFor(() => screen.getByText('Cannot access course materials'))

      expect(screen.getByText('Cannot access course materials')).toBeInTheDocument()
    })

    it('renders status badge', async () => {
      render(<TicketDetailPage />, { wrapper: renderWrapper })

      await waitFor(() => screen.getByText('open'))

      expect(screen.getByText('open')).toBeInTheDocument()
    })

    it('renders category badge', async () => {
      render(<TicketDetailPage />, { wrapper: renderWrapper })

      await waitFor(() => screen.getByText('technical'))

      expect(screen.getByText('technical')).toBeInTheDocument()
    })

    it('renders student name and email', async () => {
      render(<TicketDetailPage />, { wrapper: renderWrapper })

      await waitFor(() => screen.getByText('Jane Student'))

      expect(screen.getByText('Jane Student')).toBeInTheDocument()
      expect(screen.getByText(/student@university\.edu/)).toBeInTheDocument()
    })

    it('renders received date formatted as locale string', async () => {
      render(<TicketDetailPage />, { wrapper: renderWrapper })

      const expected = new Date('2026-05-28T10:00:00.000Z').toLocaleString()
      await waitFor(() => screen.getByText(`Received: ${expected}`))

      expect(screen.getByText(`Received: ${expected}`)).toBeInTheDocument()
    })

    it('renders the original message body', async () => {
      render(<TicketDetailPage />, { wrapper: renderWrapper })

      await waitFor(() => screen.getByText(BASE_TICKET.body))

      expect(screen.getByText(BASE_TICKET.body)).toBeInTheDocument()
    })

    it('renders "Back to tickets" link pointing to /tickets', async () => {
      render(<TicketDetailPage />, { wrapper: renderWrapper })

      await waitFor(() => screen.getByText('Back to tickets'))

      const link = screen.getByRole('link', { name: /Back to tickets/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/tickets')
    })
  })

  describe('conversation / messages', () => {
    it('does not render conversation card when messages array is empty', async () => {
      mockGet.mockImplementation((url: string) => {
        if (url === '/tickets/ticket-123') return Promise.resolve(ticketResponse({ messages: [] }))
        return Promise.resolve(agentsResponse())
      })

      render(<TicketDetailPage />, { wrapper: renderWrapper })

      await waitFor(() => screen.getByText('Original message'))

      expect(screen.queryByText('Conversation')).not.toBeInTheDocument()
    })

    it('renders conversation card when messages exist', async () => {
      const messages = [
        {
          id: 'msg-1',
          body: 'Hello, I need help with my account.',
          sender: 'student' as const,
          createdAt: '2026-05-28T10:30:00.000Z',
        },
        {
          id: 'msg-2',
          body: 'Sure, I can help you with that.',
          sender: 'agent' as const,
          createdAt: '2026-05-28T11:00:00.000Z',
        },
      ]

      mockGet.mockImplementation((url: string) => {
        if (url === '/tickets/ticket-123') return Promise.resolve(ticketResponse({ messages }))
        return Promise.resolve(agentsResponse())
      })

      render(<TicketDetailPage />, { wrapper: renderWrapper })

      await waitFor(() => screen.getByText('Conversation'))

      expect(screen.getByText('Conversation')).toBeInTheDocument()
      expect(screen.getByText('Hello, I need help with my account.')).toBeInTheDocument()
      expect(screen.getByText('Sure, I can help you with that.')).toBeInTheDocument()
    })

    it('renders correct sender labels in message bubbles', async () => {
      const messages = [
        {
          id: 'msg-1',
          body: 'Student message',
          sender: 'student' as const,
          createdAt: '2026-05-28T10:30:00.000Z',
        },
        {
          id: 'msg-2',
          body: 'AI reply',
          sender: 'ai' as const,
          createdAt: '2026-05-28T10:31:00.000Z',
        },
        {
          id: 'msg-3',
          body: 'Agent message',
          sender: 'agent' as const,
          createdAt: '2026-05-28T10:32:00.000Z',
        },
      ]

      mockGet.mockImplementation((url: string) => {
        if (url === '/tickets/ticket-123') return Promise.resolve(ticketResponse({ messages }))
        return Promise.resolve(agentsResponse())
      })

      render(<TicketDetailPage />, { wrapper: renderWrapper })

      await waitFor(() => screen.getByText('Conversation'))

      expect(screen.getByText('Student')).toBeInTheDocument()
      expect(screen.getByText('AI')).toBeInTheDocument()
      expect(screen.getByText('Agent')).toBeInTheDocument()
    })
  })

  describe('agent assignment', () => {
    it('shows "Unassigned" in select trigger when no agent is assigned', async () => {
      mockGet.mockImplementation((url: string) => {
        if (url === '/tickets/ticket-123')
          return Promise.resolve(ticketResponse({ assignedAgentId: null, assignedAgent: null }))
        return Promise.resolve(agentsResponse())
      })

      render(<TicketDetailPage />, { wrapper: renderWrapper })

      await waitFor(() => screen.getByText('Unassigned'))

      expect(screen.getByText('Unassigned')).toBeInTheDocument()
    })

    it('shows assigned agent name in select trigger when agent is assigned', async () => {
      mockGet.mockImplementation((url: string) => {
        if (url === '/tickets/ticket-123')
          return Promise.resolve(
            ticketResponse({ assignedAgentId: AGENT_1.id, assignedAgent: AGENT_1 }),
          )
        return Promise.resolve(agentsResponse())
      })

      render(<TicketDetailPage />, { wrapper: renderWrapper })

      await waitFor(() => screen.getByText('Alice Agent'))

      // The trigger renders the name directly as a span, not via SelectValue
      expect(screen.getByText('Alice Agent')).toBeInTheDocument()
    })

    it('fires PATCH mutation when a new agent is selected', async () => {
      mockGet.mockImplementation((url: string) => {
        if (url === '/tickets/ticket-123') return Promise.resolve(ticketResponse())
        return Promise.resolve(agentsResponse())
      })
      mockPatch.mockResolvedValue({ data: {} })

      const user = userEvent.setup()
      render(<TicketDetailPage />, { wrapper: renderWrapper })

      await waitFor(() => screen.getByText('Unassigned'))

      const trigger = document.querySelector('[data-slot="select-trigger"]') as HTMLElement
      await user.click(trigger)

      await user.click(await screen.findByRole('option', { name: 'Alice Agent' }))

      await waitFor(() =>
        expect(mockPatch).toHaveBeenCalledWith('/tickets/ticket-123', {
          assignedAgentId: AGENT_1.id,
        }),
      )
    })

    it('select is disabled while mutation is in flight', async () => {
      mockGet.mockImplementation((url: string) => {
        if (url === '/tickets/ticket-123') return Promise.resolve(ticketResponse())
        return Promise.resolve(agentsResponse())
      })
      // Never resolves — keeps mutation in pending state
      mockPatch.mockReturnValue(new Promise(() => {}))

      const user = userEvent.setup()
      render(<TicketDetailPage />, { wrapper: renderWrapper })

      await waitFor(() => screen.getByText('Unassigned'))

      const trigger = document.querySelector('[data-slot="select-trigger"]') as HTMLElement
      await user.click(trigger)
      await user.click(await screen.findByRole('option', { name: 'Alice Agent' }))

      // Wait for mutation to be in-flight
      await waitFor(() => expect(mockPatch).toHaveBeenCalled())

      const disabledTrigger = document.querySelector('[data-slot="select-trigger"]') as HTMLElement
      expect(disabledTrigger).toBeDisabled()
    })
  })
})
