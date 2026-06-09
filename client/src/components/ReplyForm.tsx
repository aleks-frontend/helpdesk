import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ErrorMessage } from '@/components/ui/error-message'
import { createReplySchema } from 'core'
import api from '@/lib/api'

type ReplyFormValues = z.infer<typeof createReplySchema>

interface Props {
  ticketId: string
}

export function ReplyForm({ ticketId }: Props) {
  const queryClient = useQueryClient()

  const form = useForm<ReplyFormValues>({
    resolver: zodResolver(createReplySchema),
    defaultValues: { body: '' },
  })

  const sendMutation = useMutation({
    mutationFn: (values: ReplyFormValues) =>
      api.post(`/tickets/${ticketId}/replies`, values).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replies', ticketId] })
      form.reset()
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to send reply'
      form.setError('root', { message })
    },
  })

  const polishMutation = useMutation({
    mutationFn: (body: string) =>
      api.post<{ body: string }>(`/tickets/${ticketId}/replies/polish`, { body }).then((r) => r.data),
    onSuccess: ({ body }) => {
      form.setValue('body', body, { shouldDirty: true })
    },
  })

  const isBusy = sendMutation.isPending || polishMutation.isPending

  return (
    <form
      id="reply-form"
      className="space-y-2 pt-2 border-t"
      onSubmit={form.handleSubmit((values) => sendMutation.mutate(values))}
    >
      {form.formState.errors.root && (
        <ErrorMessage>{form.formState.errors.root.message}</ErrorMessage>
      )}
      <Textarea
        placeholder="Write a reply…"
        rows={3}
        aria-invalid={!!form.formState.errors.body}
        {...form.register('body')}
      />
      {form.formState.errors.body && (
        <ErrorMessage>{form.formState.errors.body.message}</ErrorMessage>
      )}
      {polishMutation.error && (
        <ErrorMessage>
          {(polishMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            'Failed to polish reply'}
        </ErrorMessage>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={() => polishMutation.mutate(form.getValues('body'))}
        >
          {polishMutation.isPending ? 'Polishing…' : 'Polish'}
        </Button>
        <Button type="submit" form="reply-form" size="sm" disabled={isBusy}>
          {sendMutation.isPending ? 'Sending…' : 'Send reply'}
        </Button>
      </div>
    </form>
  )
}
