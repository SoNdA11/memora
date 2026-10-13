interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-3 animate-fade-in" aria-hidden="true">
      <Skeleton className="h-3.5 w-1/3 rounded-md" />
      <Skeleton className="h-3 w-1/2 rounded-md" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-5/6 rounded-md" />
        <Skeleton className="h-3 w-4/6 rounded-md" />
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="card p-5 space-y-3 animate-fade-in" aria-hidden="true">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 animate-fade-in" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
              <div className="flex gap-1.5 pt-0.5">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in" aria-hidden="true">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-3 w-56 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 card p-5 space-y-4">
          <Skeleton className="h-4 w-36 rounded-md" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5 space-y-3">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="card p-5 space-y-3">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ReviewSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in" aria-hidden="true">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-2 flex-1 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Question card */}
      <div className="card p-6 space-y-6">
        {/* Subject + topic */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>

        {/* Question text */}
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
        </div>

        {/* Alternatives */}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 flex-1 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
