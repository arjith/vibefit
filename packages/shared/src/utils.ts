import type { EntityState, EntityStatus } from './types';

/**
 * Create the initial entity state for any data type.
 */
export function createEntityState<T>(initialData: T): EntityState<T> {
  return {
    data: initialData,
    status: 'initial',
    error: null,
    lastFetched: null,
    retryCount: 0,
  };
}

/**
 * Check if entity data is stale (older than threshold).
 */
export function isStale(lastFetched: number | null, thresholdMs: number): boolean {
  if (lastFetched === null) return true;
  return Date.now() - lastFetched > thresholdMs;
}

/**
 * Get the next retry delay using exponential backoff.
 */
export function getRetryDelay(retryCount: number, delays: readonly number[]): number | null {
  if (retryCount >= delays.length) return null;
  return delays[retryCount];
}

/**
 * Determine if the entity is in a loading-like state.
 */
export function isLoading(status: EntityStatus): boolean {
  return status === 'loading' || status === 'initial';
}

/**
 * Determine if the entity can accept user interactions.
 */
export function isInteractive(status: EntityStatus): boolean {
  return status === 'loaded' || status === 'stale' || status === 'partial';
}

/**
 * Format duration in seconds to MM:SS display.
 */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format weight with appropriate unit.
 */
export function formatWeight(weightLb: number): string {
  return `${weightLb}lb`;
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
