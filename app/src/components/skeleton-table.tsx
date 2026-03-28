"use client";

export function SkeletonTable() {
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/30">
        {/* Header skeleton */}
        <div className="flex gap-4 border-b border-border/30 px-4 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-3 w-16 animate-pulse rounded bg-muted"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        {/* Row skeletons */}
        {Array.from({ length: 8 }).map((_, row) => (
          <div
            key={row}
            className="flex gap-4 border-b border-border/20 px-4 py-3 last:border-0"
          >
            {Array.from({ length: 6 }).map((_, col) => (
              <div
                key={col}
                className="h-3 rounded bg-muted/60 animate-pulse"
                style={{
                  width: `${40 + Math.random() * 40}px`,
                  animationDelay: `${(row * 6 + col) * 50}ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
