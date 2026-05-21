import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateUserDialog } from './CreateUserDialog'
import api from '@/lib/api'
import { renderWrapper as wrapper } from '@/test/render-with-query'

vi.mock('@/lib/api', () => ({
  default: { post: vi.fn() },
}))

const mockPost = vi.mocked(api.post)

function renderDialog(onOpenChange = vi.fn()) {
  return {
    onOpenChange,
    ...render(<CreateUserDialog open={true} onOpenChange={onOpenChange} />, { wrapper }),
  }
}

async function fillForm(user: ReturnType<typeof userEvent.setup>, {
  name = 'Jane Smith',
  email = 'jane@example.com',
  password = 'secret123',
} = {}) {
  await user.type(screen.getByLabelText('Name'), name)
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CreateUserDialog — validation', () => {
  it('shows required errors for all empty fields on submit', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 3 characters.')).toBeInTheDocument()
      expect(screen.getByText('A valid email is required.')).toBeInTheDocument()
      expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
    })
  })

  it('shows error when name is too short', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText('Name'), 'ab')
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(screen.getByText('Name must be at least 3 characters.')).toBeInTheDocument(),
    )
  })

  it('shows error for invalid email', async () => {
    const user = userEvent.setup()
    renderDialog()

    // fireEvent.change + fireEvent.submit bypasses native HTML5 email constraint
    // validation in jsdom, letting the value reach react-hook-form / Zod as intended.
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } })
    fireEvent.submit(document.querySelector('form#create-user-form')!)

    await waitFor(() =>
      expect(screen.getByText('A valid email is required.')).toBeInTheDocument(),
    )
  })

  it('shows error when password is too short', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText('Password'), 'short')
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument(),
    )
  })

  it('sets aria-invalid on inputs that fail validation', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('does not set aria-invalid before any submit attempt', () => {
    renderDialog()

    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Password')).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('clears field error once the field becomes valid', async () => {
    const user = userEvent.setup()
    renderDialog()

    // Trigger validation
    await user.click(screen.getByRole('button', { name: 'Create user' }))
    await waitFor(() =>
      expect(screen.getByText('Name must be at least 3 characters.')).toBeInTheDocument(),
    )

    // Fix the name field
    await user.type(screen.getByLabelText('Name'), 'Jane Smith')
    await user.tab()

    await waitFor(() =>
      expect(screen.queryByText('Name must be at least 3 characters.')).not.toBeInTheDocument(),
    )
  })
})

describe('CreateUserDialog — submission', () => {
  it('calls POST /users with correct payload on valid submit', async () => {
    mockPost.mockResolvedValue({ data: { user: {} } })
    const user = userEvent.setup()
    renderDialog()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith('/users', {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'secret123',
      }),
    )
  })

  it('trims leading/trailing whitespace from name before submitting', async () => {
    mockPost.mockResolvedValue({ data: { user: {} } })
    const user = userEvent.setup()
    renderDialog()

    await fillForm(user, { name: '  Jane Smith  ' })
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith('/users', expect.objectContaining({ name: 'Jane Smith' })),
    )
  })

  it('disables the submit button and shows "Creating…" while submitting', async () => {
    let resolve: () => void
    mockPost.mockReturnValue(new Promise((r) => { resolve = () => r({ data: { user: {} } }) }))

    const user = userEvent.setup()
    renderDialog()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Creating/ })
      expect(btn).toBeDisabled()
    })

    resolve!()
  })

  it('calls onOpenChange(false) and does not show errors after successful submit', async () => {
    mockPost.mockResolvedValue({ data: { user: {} } })
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(screen.queryByText('A valid email is required.')).not.toBeInTheDocument()
  })

  it('shows server error message on API failure', async () => {
    mockPost.mockRejectedValue({ response: { data: { error: 'A user with that email already exists.' } } })
    const user = userEvent.setup()
    renderDialog()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(screen.getByText('A user with that email already exists.')).toBeInTheDocument(),
    )
  })

  it('shows generic error message when server provides no message', async () => {
    mockPost.mockRejectedValue(new Error('Network Error'))
    const user = userEvent.setup()
    renderDialog()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(screen.getByText('Failed to create user')).toBeInTheDocument(),
    )
  })

  it('does not call POST /users when form is invalid', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(screen.getByText('Name must be at least 3 characters.')).toBeInTheDocument(),
    )
    expect(mockPost).not.toHaveBeenCalled()
  })
})

describe('CreateUserDialog — reset on close', () => {
  it('clears field values and errors when the dialog is closed and reopened', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [open, setOpen] = useState(true)
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          <CreateUserDialog open={open} onOpenChange={setOpen} />
        </>
      )
    }

    const { rerender: _rerender } = render(<Harness />, { wrapper })

    // Trigger validation errors
    await user.click(screen.getByRole('button', { name: 'Create user' }))
    await waitFor(() =>
      expect(screen.getByText('Name must be at least 3 characters.')).toBeInTheDocument(),
    )

    // Type into name so the field has a value
    await user.type(screen.getByLabelText('Name'), 'Jane')

    // Close via Escape (calls handleOpenChange(false) → reset)
    await user.keyboard('{Escape}')

    // Reopen
    await user.click(screen.getByRole('button', { name: 'Open' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue('')
      expect(screen.queryByText('Name must be at least 3 characters.')).not.toBeInTheDocument()
    })
  })
})
