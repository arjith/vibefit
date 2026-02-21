

export interface OfflineBannerProps {
  online?: boolean;
  className?: string;
}

export function OfflineBanner({ online = true, className = '' }: OfflineBannerProps) {
  if (online) return null;

  return (
    <div
      role="alert"
      className={`vf-offline-banner ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 'var(--pulse-z-toast, 500)',
        padding: '8px 16px',
        background: 'var(--pulse-semantic-warning, #FFA502)',
        color: '#000',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      You're offline — changes will sync when reconnected
    </div>
  );
}
