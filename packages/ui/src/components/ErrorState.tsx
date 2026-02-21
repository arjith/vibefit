import { useCallback } from 'react';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  retryCount = 0,
  maxRetries = 3,
  className = '',
}: ErrorStateProps) {
  const canRetry = onRetry && retryCount < maxRetries;

  const handleRetry = useCallback(() => {
    if (canRetry) onRetry();
  }, [canRetry, onRetry]);

  return (
    <div className={`vf-error-state ${className}`} role="alert">
      <div className="vf-error-state__icon" aria-hidden="true">⚠</div>
      <h3 className="vf-error-state__title">{title}</h3>
      <p className="vf-error-state__message">{message}</p>
      {canRetry && (
        <button className="vf-button vf-button--secondary vf-button--md" onClick={handleRetry}>
          {retryLabel} {retryCount > 0 ? `(${retryCount}/${maxRetries})` : ''}
        </button>
      )}
      {onRetry && retryCount >= maxRetries && (
        <p className="vf-error-state__exhausted">
          Please check your connection and try again later.
        </p>
      )}
    </div>
  );
}
