import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function TicketDetailSkeleton() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Skeleton className="h-5 w-32" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-7 w-44" />
        </CardContent>
      </Card>
    </div>
  )
}
