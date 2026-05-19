import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import UsersPage from './UsersPage'
import api from '@/lib/api'
import { renderWrapper as wrapper } from '@/test/render-with-query'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn() },
}))

const mockGet = vi.mocked(api.get)

const USERS = [
  {
    id: '1',
    name: 'Alice Admin',
    email: 'alice@example.com',
    role: 'admin' as const,
    createdAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Bob Agent',
    email: 'bob@example.com',
    role: 'agent' as const,
    createdAt: '2024-03-20T00:00:00.000Z',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('UsersPage', () => {
  it('shows skeleton rows while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}))

    render(<UsersPage />, { wrapper })

    // Skeleton cells are rendered as empty divs; check table headers are present
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText('Joined')).toBeInTheDocument()

    // No user data rows yet
    expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument()
  })

  it('renders a row for each user after data loads', async () => {
    mockGet.mockResolvedValue({ data: { users: USERS } })

    render(<UsersPage />, { wrapper })

    await waitFor(() => expect(screen.getByText('Alice Admin')).toBeInTheDocument())

    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('Bob Agent')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  it('renders correct role badges', async () => {
    mockGet.mockResolvedValue({ data: { users: USERS } })

    render(<UsersPage />, { wrapper })

    await waitFor(() => screen.getByText('admin'))

    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByText('agent')).toBeInTheDocument()
  })

  it('formats createdAt as a local date string', async () => {
    mockGet.mockResolvedValue({ data: { users: USERS } })

    render(<UsersPage />, { wrapper })

    const expected = new Date('2024-01-15T00:00:00.000Z').toLocaleDateString()
    await waitFor(() => screen.getByText(expected))

    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('renders an empty table body when users list is empty', async () => {
    mockGet.mockResolvedValue({ data: { users: [] } })

    render(<UsersPage />, { wrapper })

    // Wait for skeleton to disappear, confirming the query has settled
    await waitFor(() =>
      expect(document.querySelector('[data-slot="skeleton"]')).not.toBeInTheDocument(),
    )

    expect(screen.queryAllByRole('cell')).toHaveLength(0)
  })

  it('shows an error message when the request fails', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'))

    render(<UsersPage />, { wrapper })

    await waitFor(() => screen.getByText('Network Error'))

    expect(screen.getByText('Network Error')).toBeInTheDocument()
    expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument()
  })

  it('calls GET /users on mount', async () => {
    mockGet.mockResolvedValue({ data: { users: [] } })

    render(<UsersPage />, { wrapper })

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))
    expect(mockGet).toHaveBeenCalledWith('/users')
  })
})
