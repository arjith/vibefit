

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ width, height = 16, borderRadius = 'var(--pulse-radius-sm)', className = '' }: SkeletonProps) {
  return (
    <div
      className={`vf-skeleton ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`vf-skeleton-card ${className}`} aria-hidden="true">
      <Skeleton height={200} borderRadius="var(--pulse-radius-lg) var(--pulse-radius-lg) 0 0" />
      <div style={{ padding: 'var(--pulse-space-3)' }}>
        <Skeleton width="60%" height={20} />
        <Skeleton width="40%" height={14} />
        <div style={{ display: 'flex', gap: 'var(--pulse-space-2)', marginTop: 'var(--pulse-space-2)' }}>
          <Skeleton width={60} height={24} borderRadius="var(--pulse-radius-full)" />
          <Skeleton width={80} height={24} borderRadius="var(--pulse-radius-full)" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`vf-skeleton-grid ${className}`} aria-label="Loading content" role="status">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
