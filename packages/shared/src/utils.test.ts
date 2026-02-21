import { describe, it, expect } from 'vitest';
import {
  createEntityState,
  isStale,
  getRetryDelay,
  isLoading,
  isInteractive,
  formatDuration,
  formatWeight,
  clamp,
} from './utils';

describe('createEntityState', () => {
  it('creates initial state with correct defaults', () => {
    const state = createEntityState<string[]>([]);
    expect(state.data).toEqual([]);
    expect(state.status).toBe('initial');
    expect(state.error).toBeNull();
    expect(state.lastFetched).toBeNull();
    expect(state.retryCount).toBe(0);
  });

  it('preserves the initial data type', () => {
    const state = createEntityState({ items: [1, 2, 3], total: 3 });
    expect(state.data.items).toEqual([1, 2, 3]);
    expect(state.data.total).toBe(3);
  });
});

describe('isStale', () => {
  it('returns true when lastFetched is null', () => {
    expect(isStale(null, 5000)).toBe(true);
  });

  it('returns false when data is fresh', () => {
    expect(isStale(Date.now(), 5000)).toBe(false);
  });

  it('returns true when data exceeds threshold', () => {
    const fiveMinutesAgo = Date.now() - 6 * 60 * 1000;
    expect(isStale(fiveMinutesAgo, 5 * 60 * 1000)).toBe(true);
  });
});

describe('getRetryDelay', () => {
  const delays = [1000, 2000, 4000] as const;

  it('returns first delay for retry 0', () => {
    expect(getRetryDelay(0, delays)).toBe(1000);
  });

  it('returns second delay for retry 1', () => {
    expect(getRetryDelay(1, delays)).toBe(2000);
  });

  it('returns null when retries exhausted', () => {
    expect(getRetryDelay(3, delays)).toBeNull();
  });
});

describe('isLoading', () => {
  it('returns true for initial and loading', () => {
    expect(isLoading('initial')).toBe(true);
    expect(isLoading('loading')).toBe(true);
  });

  it('returns false for other states', () => {
    expect(isLoading('loaded')).toBe(false);
    expect(isLoading('error')).toBe(false);
    expect(isLoading('empty')).toBe(false);
  });
});

describe('isInteractive', () => {
  it('returns true for loaded, stale, partial', () => {
    expect(isInteractive('loaded')).toBe(true);
    expect(isInteractive('stale')).toBe(true);
    expect(isInteractive('partial')).toBe(true);
  });

  it('returns false for non-interactive states', () => {
    expect(isInteractive('initial')).toBe(false);
    expect(isInteractive('loading')).toBe(false);
    expect(isInteractive('error')).toBe(false);
    expect(isInteractive('offline')).toBe(false);
  });
});

describe('formatDuration', () => {
  it('formats seconds to MM:SS', () => {
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(3661)).toBe('61:01');
    expect(formatDuration(5)).toBe('0:05');
  });
});

describe('formatWeight', () => {
  it('appends lb suffix', () => {
    expect(formatWeight(135)).toBe('135lb');
    expect(formatWeight(0)).toBe('0lb');
  });
});

describe('clamp', () => {
  it('clamps value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});
