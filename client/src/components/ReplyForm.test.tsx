import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReplyForm } from './ReplyForm'
import api from '@/lib/api'
import { renderWrapper as wrapper } from '@/test/render-with-query'

vi.mock('@/lib/api', () => ({
  default: { post: vi.fn() },
}))

const mockPost = vi.mocked(api.post)

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderForm(ticketId = 'ticket-1') {
  const user = userEvent.setup()
  render(<ReplyForm ticketId={ticketId} />, { wrapper })
  return user
}

async function typeReply(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByPlaceholderText('Write a reply…'), text)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReplyForm', () => {
  describe('rendering', () => {
    it('renders the textarea and both buttons', () => {
      renderForm()

      expect(screen.getByPlaceholderText('Write a reply…')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Polish' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Send reply' })).toBeInTheDocument()
    })

    it('Polish button renders before Send reply button', () => {
      renderForm()

      const buttons = screen.getAllByRole('button')
      const polishIndex = buttons.findIndex((b) => b.textContent === 'Polish')
      const sendIndex = buttons.findIndex((b) => b.textContent === 'Send reply')
      expect(polishIndex).toBeLessThan(sendIndex)
    })
  })

  describe('send reply', () => {
    it('POSTs to /tickets/:id/replies with the typed body', async () => {
      mockPost.mockResolvedValue({ data: {} })
      const user = renderForm('ticket-42')

      await typeReply(user, 'Hello there')
      await user.click(screen.getByRole('button', { name: 'Send reply' }))

      await waitFor(() =>
        expect(mockPost).toHaveBeenCalledWith('/tickets/ticket-42/replies', {
          body: 'Hello there',
        }),
      )
    })

    it('clears the textarea after a successful send', async () => {
      mockPost.mockResolvedValue({ data: {} })
      const user = renderForm()

      await typeReply(user, 'My reply text')
      await user.click(screen.getByRole('button', { name: 'Send reply' }))

      await waitFor(() =>
        expect((screen.getByPlaceholderText('Write a reply…') as HTMLTextAreaElement).value).toBe(''),
      )
    })

    it('shows "Sending…" while the send mutation is in flight', async () => {
      mockPost.mockReturnValue(new Promise(() => {}))
      const user = renderForm()

      await typeReply(user, 'Hello')
      await user.click(screen.getByRole('button', { name: 'Send reply' }))

      await waitFor(() => screen.getByRole('button', { name: 'Sending…' }))
      expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled()
    })

    it('disables the Polish button while send is in flight', async () => {
      mockPost.mockReturnValue(new Promise(() => {}))
      const user = renderForm()

      await typeReply(user, 'Hello')
      await user.click(screen.getByRole('button', { name: 'Send reply' }))

      await waitFor(() => expect(screen.getByRole('button', { name: 'Polish' })).toBeDisabled())
    })

    it('shows a root error message when the send request fails', async () => {
      mockPost.mockRejectedValue({ response: { data: { error: 'Server exploded' } } })
      const user = renderForm()

      await typeReply(user, 'Hello')
      await user.click(screen.getByRole('button', { name: 'Send reply' }))

      await waitFor(() => screen.getByText('Server exploded'))
      expect(screen.getByText('Server exploded')).toBeInTheDocument()
    })

    it('shows a fallback error when the send response has no error field', async () => {
      mockPost.mockRejectedValue(new Error('network failure'))
      const user = renderForm()

      await typeReply(user, 'Hello')
      await user.click(screen.getByRole('button', { name: 'Send reply' }))

      await waitFor(() => screen.getByText('Failed to send reply'))
      expect(screen.getByText('Failed to send reply')).toBeInTheDocument()
    })

    it('shows a validation error when submitting an empty body', async () => {
      const user = renderForm()

      await user.click(screen.getByRole('button', { name: 'Send reply' }))

      await waitFor(() => screen.getByText('Reply cannot be empty'))
      expect(screen.getByText('Reply cannot be empty')).toBeInTheDocument()
      expect(mockPost).not.toHaveBeenCalled()
    })
  })

  describe('Polish button', () => {
    it('POSTs to /tickets/:id/replies/polish with the current body', async () => {
      mockPost.mockResolvedValue({ data: { body: 'Polished text' } })
      const user = renderForm('ticket-99')

      await typeReply(user, 'rough draft')
      await user.click(screen.getByRole('button', { name: 'Polish' }))

      await waitFor(() =>
        expect(mockPost).toHaveBeenCalledWith('/tickets/ticket-99/replies/polish', {
          body: 'rough draft',
        }),
      )
    })

    it('replaces the textarea content with the polished body on success', async () => {
      mockPost.mockResolvedValue({ data: { body: 'This is the polished version.' } })
      const user = renderForm()

      await typeReply(user, 'rough draft')
      await user.click(screen.getByRole('button', { name: 'Polish' }))

      await waitFor(() =>
        expect((screen.getByPlaceholderText('Write a reply…') as HTMLTextAreaElement).value).toBe(
          'This is the polished version.',
        ),
      )
    })

    it('shows "Polishing…" while the polish mutation is in flight', async () => {
      mockPost.mockReturnValue(new Promise(() => {}))
      const user = renderForm()

      await typeReply(user, 'draft')
      await user.click(screen.getByRole('button', { name: 'Polish' }))

      await waitFor(() => screen.getByRole('button', { name: 'Polishing…' }))
      expect(screen.getByRole('button', { name: 'Polishing…' })).toBeDisabled()
    })

    it('disables the Send reply button while polishing', async () => {
      mockPost.mockReturnValue(new Promise(() => {}))
      const user = renderForm()

      await typeReply(user, 'draft')
      await user.click(screen.getByRole('button', { name: 'Polish' }))

      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Send reply' })).toBeDisabled(),
      )
    })

    it('shows the API error message when polishing fails', async () => {
      mockPost.mockRejectedValue({ response: { data: { error: 'AI unavailable' } } })
      const user = renderForm()

      await typeReply(user, 'draft')
      await user.click(screen.getByRole('button', { name: 'Polish' }))

      await waitFor(() => screen.getByText('AI unavailable'))
      expect(screen.getByText('AI unavailable')).toBeInTheDocument()
    })

    it('shows a fallback error when the polish response has no error field', async () => {
      mockPost.mockRejectedValue(new Error('network failure'))
      const user = renderForm()

      await typeReply(user, 'draft')
      await user.click(screen.getByRole('button', { name: 'Polish' }))

      await waitFor(() => screen.getByText('Failed to polish reply'))
      expect(screen.getByText('Failed to polish reply')).toBeInTheDocument()
    })

    it('does not clear the textarea when polishing fails', async () => {
      mockPost.mockRejectedValue({ response: { data: { error: 'AI unavailable' } } })
      const user = renderForm()

      await typeReply(user, 'my original draft')
      await user.click(screen.getByRole('button', { name: 'Polish' }))

      await waitFor(() => screen.getByText('AI unavailable'))
      expect((screen.getByPlaceholderText('Write a reply…') as HTMLTextAreaElement).value).toBe(
        'my original draft',
      )
    })
  })
})
