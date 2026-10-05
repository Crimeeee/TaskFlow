export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-sunken ${className}`} aria-hidden="true" />;
}

/** Board placeholder so the first paint has structure instead of a spinner. */
export function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[0, 1, 2, 3].map((col) => (
        <div key={col} className="flex w-72 shrink-0 flex-col gap-3 rounded-2xl border border-line bg-sunken p-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
