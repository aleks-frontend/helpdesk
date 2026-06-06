import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TicketStatus, TicketCategory, type TicketDetail, type Reply } from 'core'
import { ReplyThread } from './ReplyThread'
import api from '@/lib/api'
import { renderWrapper as wrapper } from '@/test/render-with-query'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn() },
}))

const mockGet = vi.mocked(api.get)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_TICKET: TicketDetail = {
  id: 'ticket-1',
  senderEmail: 'student@university.edu',
  senderName: 'Jane Student',
  subject: 'Cannot access course materials',
  body: 'I keep getting an error when trying to access my course materials.',
  bodyHtml: null,
  status: TicketStatus.open,
  category: TicketCategory.technical,
  assignedAgentId: null,
  assignedAgent: null,
  createdAt: '2026-05-28T10:00:00.000Z',
  updatedAt: '2026-05-28T11:00:00.000Z',
}


function repliesResponse(replies: Reply[]) {
  return Promise.resolve({ data: replies })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReplyThread', () => {
  describe('empty state', () => {
    it('shows "No replies yet." when the replies array is empty', async () => {
      mockGet.mockImplementation(() => repliesResponse([]))

      render(<ReplyThread ticket={BASE_TICKET} />, { wrapper })

      await waitFor(() => screen.getByText('No replies yet.'))

      expect(screen.getByText('No replies yet.')).toBeInTheDocument()
    })

    it('does not render any reply bubbles when replies are empty', async () => {
      mockGet.mockImplementation(() => repliesResponse([]))

      render(<ReplyThread ticket={BASE_TICKET} />, { wrapper })

      await waitFor(() => screen.getByText('No replies yet.'))

      // The "No replies yet." paragraph should be the only meaningful content
      expect(screen.queryByText(/Jane Student/)).not.toBeInTheDocument()
      expect(screen.queryByText(/AI/)).not.toBeInTheDocument()
    })
  })

  describe('reply bubbles', () => {
    it('renders a bubble for each reply when replies exist', async () => {
      const replies: Reply[] = [
        {
          id: 1,
          body: 'I cannot log into my account.',
          bodyHtml: null,
          senderType: 'customer',
          user: null,
          createdAt: '2026-05-28T10:15:00.000Z',
        },
        {
          id: 2,
          body: 'Let me look into that for you.',
          bodyHtml: null,
          senderType: 'agent',
          user: { id: 'agent-1', name: 'Alice Agent' },
          createdAt: '2026-05-28T10:20:00.000Z',
        },
      ]

      mockGet.mockImplementation(() => repliesResponse(replies))

      render(<ReplyThread ticket={BASE_TICKET} />, { wrapper })

      await waitFor(() => screen.getByText('I cannot log into my account.'))

      expect(screen.getByText('I cannot log into my account.')).toBeInTheDocument()
      expect(screen.getByText('Let me look into that for you.')).toBeInTheDocument()
    })

    it('does not show "No replies yet." when replies exist', async () => {
      const replies: Reply[] = [
        {
          id: 1,
          body: 'Hello there.',
          bodyHtml: null,
          senderType: 'customer',
          user: null,
          createdAt: '2026-05-28T10:15:00.000Z',
        },
      ]

      mockGet.mockImplementation(() => repliesResponse(replies))

      render(<ReplyThread ticket={BASE_TICKET} />, { wrapper })

      await waitFor(() => screen.getByText('Hello there.'))

      expect(screen.queryByText('No replies yet.')).not.toBeInTheDocument()
    })

    it('renders all three reply types in a mixed conversation', async () => {
      const replies: Reply[] = [
        {
          id: 1,
          body: 'Customer question here.',
          bodyHtml: null,
          senderType: 'customer',
          user: null,
          createdAt: '2026-05-28T10:15:00.000Z',
        },
        {
          id: 2,
          body: 'AI generated answer.',
          bodyHtml: null,
          senderType: 'ai',
          user: null,
          createdAt: '2026-05-28T10:16:00.000Z',
        },
        {
          id: 3,
          body: 'Agent follow-up.',
          bodyHtml: null,
          senderType: 'agent',
          user: { id: 'agent-1', name: 'Bob Agent' },
          createdAt: '2026-05-28T10:17:00.000Z',
        },
      ]

      mockGet.mockImplementation(() => repliesResponse(replies))

      render(<ReplyThread ticket={BASE_TICKET} />, { wrapper })

      await waitFor(() => screen.getByText('Agent follow-up.'))

      expect(screen.getByText('Customer question here.')).toBeInTheDocument()
      expect(screen.getByText('AI generated answer.')).toBeInTheDocument()
      expect(screen.getByText('Agent follow-up.')).toBeInTheDocument()
    })
  })

  describe('alignment', () => {
    it('customer reply bubble has items-start class (left-aligned)', async () => {
      const replies: Reply[] = [
        {
          id: 1,
          body: 'Customer message here.',
          bodyHtml: null,
          senderType: 'customer',
          user: null,
          createdAt: '2026-05-28T10:15:00.000Z',
        },
      ]

      mockGet.mockImplementation(() => repliesResponse(replies))

      render(<ReplyThread ticket={BASE_TICKET} />, { wrapper })

      await waitFor(() => screen.getByText('Customer message here.'))

      // The wrapping flex div for a customer bubble must have items-start
      const bodyEl = screen.getByText('Customer message here.')
      const bubble = bodyEl.closest('[class*="flex"][class*="flex-col"]') as HTMLElement
      expect(bubble).not.toBeNull()
      expect(bubble.className).toContain('items-start')
      expect(bubble.className).not.toContain('items-end')
    })

    it('agent reply bubble has items-end class (right-aligned)', async () => {
      const replies: Reply[] = [
        {
          id: 1,
          body: 'Agent reply here.',
          bodyHtml: null,
          senderType: 'agent',
          user: { id: 'agent-1', name: 'Alice Agent' },
          createdAt: '2026-05-28T10:20:00.000Z',
        },
      ]

      mockGet.mockImplementation(() => repliesResponse(replies))

      render(<ReplyThread ticket={BASE_TICKET} />, { wrapper })

      await waitFor(() => screen.getByText('Agent reply here.'))

      const bodyEl = screen.getByText('Agent reply here.')
      const bubble = bodyEl.closest('[class*="flex"][class*="flex-col"]') as HTMLElement
      expect(bubble).not.toBeNull()
      expect(bubble.className).toContain('items-end')
      expect(bubble.className).not.toContain('items-start')
    })

    it('AI reply bubble has items-end class (right-aligned)', async () => {
      const replies: Reply[] = [
        {
          id: 1,
          body: 'AI generated response.',
          bodyHtml: null,
          senderType: 'ai',
          user: null,
          createdAt: '2026-05-28T10:18:00.000Z',
        },
      ]

      mockGet.mockImplementation(() => repliesResponse(replies))

      render(<ReplyThread ticket={BASE_TICKET} />, { wrapper })

      await waitFor(() => screen.getByText('AI generated response.'))

      const bodyEl = screen.getByText('AI generated response.')
      const bubble = bodyEl.closest('[class*="flex"][class*="flex-col"]') as HTMLElement
      expect(bubble).not.toBeNull()
      expect(bubble.className).toContain('items-end')
      expect(bubble.className).not.toContain('items-start')
    })
  })

  describe('sender labels', () => {
    it('shows "AI" as the label for ai-type replies', async () => {
      const replies: Reply[] = [
        {
          id: 1,
          body: 'This is an AI reply.',
          bodyHtml: null,
          senderType: 'ai',
          user: null,
          createdAt: '2026-05-28T10:18:00.000Z',
        },
      ]

      mockGet.mockImplementation(() => repliesResponse(replies))

      render(<ReplyThread ticket={BASE_TICKET} />, { wrapper })

      await waitFor(() => screen.getByText('This is an AI reply.'))

      expect(screen.getByText('AI')).toBeInTheDocument()
    })

    it("shows the user's name as the label for agent-type replies", async () => {
      const replies: Reply[] = [
        {
          id: 1,
          body: 'Hello from an agent.',
          bodyHtml: null,
          senderType: 'agent',
          user: { id: 'agent-1', name: 'Alice Agent' },
          createdAt: '2026-05-28T10:20:00.000Z',
        },
      ]

      mockGet.mockImplementation(() => repliesResponse(replies))

      render(<ReplyThread ticket={BASE_TICKET} />, { wrapper })

      await waitFor(() => screen.getByText('Hello from an agent.'))

      expect(screen.getByText('Alice Agent')).toBeInTheDocument()
    })

    it('shows "Agent" as the label for agent-type replies when user is null', async () => {
      const replies: Reply[] = [
        {
          id: 1,
          body: 'Agent reply without user.',
          bodyHtml: null,
          senderType: 'agent',
          user: null,
          createdAt: '2026-05-28T10:20:00.000Z',
        },
      ]

      mockGet.mockImplementation(() => repliesResponse(replies))

      render(<ReplyThread ticket={BASE_TICKET} />, { wrapper })

      await waitFor(() => screen.getByText('Agent reply without user.'))

      expect(screen.getByText('Agent')).toBeInTheDocument()
    })

    it("shows the ticket senderName as the label for customer-type replies", async () => {
      const replies: Reply[] = [
        {
          id: 1,
          body: 'Hello, I need help.',
          bodyHtml: null,
          senderType: 'customer',
          user: null,
          createdAt: '2026-05-28T10:15:00.000Z',
        },
      ]

      mockGet.mockImplementation(() => repliesResponse(replies))

      render(<ReplyThread ticket={BASE_TICKET} />, { wrapper })

      await waitFor(() => screen.getByText('Hello, I need help.'))

      // senderName from the ticket prop is 'Jane Student'
      expect(screen.getByText('Jane Student')).toBeInTheDocument()
    })
  })

  describe('timestamps', () => {
    it('shows a formatted createdAt timestamp on each bubble', async () => {
      const createdAt = '2026-05-28T10:30:00.000Z'
      const replies: Reply[] = [
        {
          id: 1,
          body: 'A timestamped reply.',
          bodyHtml: null,
          senderType: 'customer',
          user: null,
          createdAt,
        },
      ]

      mockGet.mockImplementation(() => repliesResponse(replies))

      render(<ReplyThread ticket={BASE_TICKET} />, { wrapper })

      await waitFor(() => screen.getByText('A timestamped reply.'))

      const expected = new Date(createdAt).toLocaleString()
      expect(screen.getByText(expected)).toBeInTheDocument()
    })

    it('shows individual timestamps for each reply bubble', async () => {
      const createdAt1 = '2026-05-28T10:30:00.000Z'
      const createdAt2 = '2026-05-28T11:45:00.000Z'
      const replies: Reply[] = [
        {
          id: 1,
          body: 'First reply.',
          bodyHtml: null,
          senderType: 'customer',
          user: null,
          createdAt: createdAt1,
        },
        {
          id: 2,
          body: 'Second reply.',
          bodyHtml: null,
          senderType: 'agent',
          user: { id: 'agent-1', name: 'Alice Agent' },
          createdAt: createdAt2,
        },
      ]

      mockGet.mockImplementation(() => repliesResponse(replies))

      render(<ReplyThread ticket={BASE_TICKET} />, { wrapper })

      await waitFor(() => screen.getByText('Second reply.'))

      expect(screen.getByText(new Date(createdAt1).toLocaleString())).toBeInTheDocument()
      expect(screen.getByText(new Date(createdAt2).toLocaleString())).toBeInTheDocument()
    })
  })

  describe('API call', () => {
    it('calls GET /tickets/:ticketId/replies with the correct ticket id', async () => {
      mockGet.mockImplementation(() => repliesResponse([]))

      render(<ReplyThread ticket={BASE_TICKET} />, { wrapper })

      await waitFor(() => screen.getByText('No replies yet.'))

      expect(mockGet).toHaveBeenCalledWith(`/tickets/${BASE_TICKET.id}/replies`)
    })
  })
})
