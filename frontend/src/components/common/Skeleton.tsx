import { cn } from '../../utils/cn'

// Base shimmer block. Compose these into page-shaped placeholders so the
// layout doesn't visibly jump once real content arrives.
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-2', className)} />
}

export function StatCardSkeleton() {
  return (
    <div className="panel border-t-2 border-t-hairline p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="mt-3 h-8 w-16" />
      <Skeleton className="mt-2 h-3 w-24" />
    </div>
  )
}

export function ListRowSkeleton() {
  return (
    <div className="panel flex items-center gap-3 p-4">
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div data-testid="dashboard-skeleton" className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="panel p-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-4 h-48 w-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ListRowSkeleton key={i} />
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-24 w-full" />
        </div>
      </div>
    </div>
  )
}