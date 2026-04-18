interface SkeletonProps {
  className?: string;
  variant?: 'shimmer' | 'neon';
}

export default function Skeleton({ className = '', variant = 'shimmer' }: SkeletonProps) {
  return (
    <div
      className={`rounded-lg ${variant === 'neon' ? 'bg-neon-surface-2 animate-pulse' : 'shimmer'} ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-neon-border bg-white p-5">
      <Skeleton className="mb-4 h-40 w-full rounded-xl" variant="neon" />
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="mb-3 h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" variant="neon" />
      ))}
    </div>
  );
}

export function PostListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neon-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`flex items-center justify-between px-5 py-4 ${i !== count - 1 ? 'border-b border-neon-border/50' : ''}`}>
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" variant="neon" />
            <Skeleton className="h-3 w-1/3" variant="neon" />
          </div>
          <div className="flex shrink-0 gap-3 ml-4">
            <Skeleton className="h-3 w-10" variant="neon" />
            <Skeleton className="h-3 w-12" variant="neon" />
          </div>
        </div>
      ))}
    </div>
  );
}
