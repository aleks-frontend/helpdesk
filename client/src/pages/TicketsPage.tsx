import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type SortingState } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TicketsTable } from '@/components/TicketsTable'
import { TicketStatus, TicketCategory } from 'core'
import api from '@/lib/api'

interface Ticket {
  id: string
  studentEmail: string
  studentName: string
  subject: string
  status: TicketStatus
  category: TicketCategory
  createdAt: string
}

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | ''>('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const sortBy = sorting[0]?.id ?? 'createdAt'
  const sortOrder = (sorting[0]?.desc ?? true) ? 'desc' : 'asc'
  const hasFilters = !!statusFilter || !!categoryFilter || !!searchInput

  function clearFilters() {
    setStatusFilter('')
    setCategoryFilter('')
    setSearchInput('')
    setSearch('')
  }

  const { data: tickets = [], isLoading, error } = useQuery({
    queryKey: ['tickets', sortBy, sortOrder, statusFilter, categoryFilter, search],
    queryFn: () =>
      api.get<{ tickets: Ticket[] }>('/tickets', {
        params: {
          sortBy,
          sortOrder,
          ...(statusFilter   && { status: statusFilter }),
          ...(categoryFilter && { category: categoryFilter }),
          ...(search         && { search }),
        },
      }).then((r) => r.data.tickets),
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <CardTitle>Tickets</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-8 w-48"
            />
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as TicketStatus | '')}
            >
              <SelectTrigger className="h-8 w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value={TicketStatus.open}>Open</SelectItem>
                <SelectItem value={TicketStatus.resolved}>Resolved</SelectItem>
                <SelectItem value={TicketStatus.closed}>Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as TicketCategory | '')}
            >
              <SelectTrigger className="h-8 w-44">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                <SelectItem value={TicketCategory.general}>General</SelectItem>
                <SelectItem value={TicketCategory.technical}>Technical</SelectItem>
                <SelectItem value={TicketCategory.refund}>Refund</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <TicketsTable
            tickets={tickets}
            isLoading={isLoading}
            error={error as Error | null}
            sorting={sorting}
            onSortingChange={setSorting}
          />
        </CardContent>
      </Card>
    </div>
  )
}
