import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Role, roleSchema } from 'core'
import { Button } from '@/components/ui/button'
import { ErrorMessage } from '@/components/ui/error-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import api from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
}

const baseFields = {
  name: z.string().trim().min(3, 'Name must be at least 3 characters.'),
  email: z.email('A valid email is required.'),
  role: roleSchema.optional(),
}

const createFormSchema = z.object({
  ...baseFields,
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

const editFormSchema = z.object({
  ...baseFields,
  password: z.union([
    z.string().min(8, 'Password must be at least 8 characters.'),
    z.literal(''),
  ]).optional(),
})

type FormValues = {
  name: string
  email: string
  role?: Role
  password?: string
}

export function UserDialog({ open, onOpenChange, user }: Props) {
  const isEdit = user != null
  const queryClient = useQueryClient()

  const resolver = useMemo(
    () => zodResolver(isEdit ? editFormSchema : createFormSchema),
    [isEdit],
  )

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver })

  useEffect(() => {
    if (open) {
      reset(isEdit
        ? { name: user.name, email: user.email, role: user.role, password: '' }
        : { name: '', email: '', password: '' }
      )
    }
  }, [open, user, isEdit, reset])

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (isEdit) {
        const payload: Record<string, unknown> = { name: data.name, email: data.email, role: data.role }
        if (data.password) payload.password = data.password
        return api.patch(`/users/${user.id}`, payload)
      }
      return api.post('/users', { name: data.name, email: data.email, password: data.password })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onOpenChange(false)
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        `Failed to ${isEdit ? 'update' : 'create'} user`
      setError('root', { message })
    },
  })

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit user' : 'Create user'}</DialogTitle>
        </DialogHeader>
        <form
          id="user-form"
          onSubmit={handleSubmit(async (data) => {
            try { await mutation.mutateAsync(data) } catch { /* handled by onError */ }
          })}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-name">Name</Label>
            <Input id="user-name" placeholder="Jane Smith" aria-invalid={!!errors.name} {...register('name')} />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" type="email" placeholder="jane@example.com" aria-invalid={!!errors.email} {...register('email')} />
            {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
          </div>
          {isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-role">Role</Label>
              <select
                id="user-role"
                {...register('role')}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={Role.agent}>{Role.agent}</option>
                <option value={Role.admin}>{Role.admin}</option>
              </select>
              {errors.role && <ErrorMessage>{errors.role.message}</ErrorMessage>}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-password">Password</Label>
            <Input
              id="user-password"
              type="password"
              placeholder={isEdit ? 'Leave blank to keep current password' : '••••••••'}
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && <ErrorMessage>{errors.password.message}</ErrorMessage>}
          </div>
          {errors.root && <ErrorMessage>{errors.root.message}</ErrorMessage>}
        </form>
        <DialogFooter showCloseButton>
          <Button type="submit" form="user-form" disabled={isSubmitting}>
            {isEdit
              ? (isSubmitting ? 'Saving…' : 'Save changes')
              : (isSubmitting ? 'Creating…' : 'Create user')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
