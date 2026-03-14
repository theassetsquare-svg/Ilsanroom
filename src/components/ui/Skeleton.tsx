interface SkeletonProps {
  className?: string;
  variant?: 'shimmer' | 'neon';
}

export default function Skeleton({ className = '', variant = 'shimmer' }: SkeletonProps) {
  return (
    <div
      className={`rounded-lg ${variant === 'neon' ? 'neon-skeleton bg-neon-surface-2' : 'shimmer'} ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-5">
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
