import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorMessage } from '@/components/ui/error-message'
import api from '@/lib/api'

interface Props {
  ticketId: string
}

export function TicketSummary({ ticketId }: Props) {
  const [summary, setSummary] = useState<string | null>(null)

  const { mutate, isPending, error } = useMutation({
    mutationFn: () =>
      api.post<{ summary: string }>(`/tickets/${ticketId}/summarize`).then((r) => r.data),
    onSuccess: ({ summary }) => setSummary(summary),
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Summary</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => mutate()}
        >
          <Sparkles className="size-4" />
          {isPending ? 'Summarizing…' : summary ? 'Re-generate' : 'Summarize'}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <ErrorMessage>
            {(error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
              'Failed to generate summary'}
          </ErrorMessage>
        )}
        {summary ? (
          <p className="text-sm whitespace-pre-wrap">{summary}</p>
        ) : (
          !isPending && (
            <p className="text-sm text-muted-foreground">
              Click Summarize to generate an AI summary of this ticket and its conversation history.
            </p>
          )
        )}
      </CardContent>
    </Card>
  )
}
