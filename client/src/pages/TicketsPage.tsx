import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type SortingState } from '@tanstack/react-table'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

interface Ticket {
  id: string
  senderEmail: string
  senderName: string
  subject: string
  status: TicketStatus
  category: TicketCategory
  createdAt: string
}

interface TicketsResponse {
  tickets: Ticket[]
  total: number
  page: number
  pageSize: number
}

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | ''>('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const sortBy = sorting[0]?.id ?? 'createdAt'
  const sortOrder = (sorting[0]?.desc ?? true) ? 'desc' : 'asc'
  const hasFilters = !!statusFilter || !!categoryFilter || !!searchInput

  function handleSortingChange(updater: SortingState | ((prev: SortingState) => SortingState)) {
    setSorting(updater)
    setPage(1)
  }

  function handleStatusChange(v: string | null) {
    setStatusFilter((v ?? '') as TicketStatus | '')
    setPage(1)
  }

  function handleCategoryChange(v: string | null) {
    setCategoryFilter((v ?? '') as TicketCategory | '')
    setPage(1)
  }

  function handlePageSizeChange(v: string | null) {
    setPageSize(Number(v ?? 10) as PageSize)
    setPage(1)
  }

  function clearFilters() {
    setStatusFilter('')
    setCategoryFilter('')
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['tickets', sortBy, sortOrder, statusFilter, categoryFilter, search, page, pageSize],
    queryFn: () =>
      api.get<TicketsResponse>('/tickets', {
        params: {
          sortBy,
          sortOrder,
          ...(statusFilter   && { status: statusFilter }),
          ...(categoryFilter && { category: categoryFilter }),
          ...(search         && { search }),
          page,
          pageSize,
        },
      }).then((r) => r.data),
  })

  const tickets = data?.tickets ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Tickets</h1>
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-8 w-48"
            />
            <Select
              value={statusFilter}
              onValueChange={handleStatusChange}
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
              onValueChange={handleCategoryChange}
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
            onSortingChange={handleSortingChange}
          />
          {!isLoading && !error && (
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page</span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {total > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({total} tickets)
                  </span>
                )}
              </div>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
