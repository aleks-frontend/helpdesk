import {
  type SortingState,
  type OnChangeFn,
  type Column,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Link } from 'react-router'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TicketStatus, TicketCategory } from 'core'
import { cn } from '@/lib/utils'

interface Ticket {
  id: string
  senderEmail: string
  senderName: string
  subject: string
  status: TicketStatus
  category: TicketCategory
  createdAt: string
}

function statusVariant(status: TicketStatus) {
  if (status === TicketStatus.open) return 'warning'
  if (status === TicketStatus.resolved) return 'success'
  return 'default'
}

function statusRowClass(status: TicketStatus) {
  if (status === TicketStatus.open) return 'border-l-[3px] border-l-amber-400'
  if (status === TicketStatus.resolved) return 'border-l-[3px] border-l-emerald-500'
  return 'border-l-[3px] border-l-slate-200'
}

function categoryVariant(category: TicketCategory) {
  if (category === TicketCategory.technical) return 'primary'
  if (category === TicketCategory.refund) return 'warning'
  return 'default'
}

function SortIcon({ column }: { column: Column<Ticket> }) {
  if (!column.getCanSort()) return null
  if (column.getIsSorted() === 'asc') return <ChevronUp className="size-3.5" />
  if (column.getIsSorted() === 'desc') return <ChevronDown className="size-3.5" />
  return <ChevronsUpDown className="size-3.5 opacity-50" />
}

const columnHelper = createColumnHelper<Ticket>()

const columns = [
  columnHelper.accessor('subject', {
    header: 'Subject',
    cell: (info) => (
      <Link
        to={`/tickets/${info.row.original.id}`}
        className="font-medium link pl-3 block"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('senderName', {
    header: 'From',
    cell: (info) => (
      <div className="flex flex-col">
        <span className="text-sm text-foreground">{info.getValue()}</span>
        <span className="text-xs text-muted-foreground">{info.row.original.senderEmail}</span>
      </div>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => (
      <Badge variant={statusVariant(info.getValue())}>{info.getValue()}</Badge>
    ),
  }),
  columnHelper.accessor('category', {
    header: 'Category',
    cell: (info) => (
      <Badge variant={categoryVariant(info.getValue())}>{info.getValue()}</Badge>
    ),
  }),
  columnHelper.accessor('createdAt', {
    header: 'Received',
    cell: (info) => (
      <span className="text-muted-foreground">
        {new Date(info.getValue()).toLocaleDateString()}
      </span>
    ),
  }),
]

function TicketTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subject</TableHead>
          <TableHead>From</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Received</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

interface Props {
  tickets: Ticket[]
  isLoading: boolean
  error: Error | null
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
}

export function TicketsTable({ tickets, isLoading, error, sorting, onSortingChange }: Props) {
  const table = useReactTable({
    data: tickets,
    columns,
    manualSorting: true,
    enableSortingRemoval: false,
    state: { sorting },
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) return <TicketTableSkeleton />
  if (error) return <p className="text-sm text-destructive">{error.message}</p>
  if (tickets.length === 0) return <p className="text-sm text-muted-foreground py-4 text-center">No tickets yet.</p>

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.column.getCanSort() ? (
                  <button
                    className="flex items-center gap-1 cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <SortIcon column={header.column} />
                  </button>
                ) : (
                  flexRender(header.column.columnDef.header, header.getContext())
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className={cn(statusRowClass(row.original.status))}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
