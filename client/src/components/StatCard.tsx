import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  label: string
  value: string
  isLoading: boolean
}

export function StatCard({ label, value, isLoading }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {isLoading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      )}
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
