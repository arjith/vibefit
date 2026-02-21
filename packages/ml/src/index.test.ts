import { describe, it, expect } from 'vitest';
import { ML_VERSION, heuristicAdherencePrediction, SEQUENCE_LENGTH, FEATURE_COUNT } from './index';

describe('@vibefit/ml', () => {
  it('exports ML_VERSION', () => {
    expect(ML_VERSION).toBe('0.1.0');
  });

  it('exports model constants', () => {
    expect(SEQUENCE_LENGTH).toBeGreaterThan(0);
    expect(FEATURE_COUNT).toBeGreaterThan(0);
  });

  it('heuristic prediction returns valid result', () => {
    const result = heuristicAdherencePrediction({
      completionRate: 0.8,
      streakDays: 14,
      avgRpe: 7,
      avgMood: 4,
      missedLastWeek: 0,
    });
    expect(result).toHaveProperty('probability');
    expect(result).toHaveProperty('riskLevel');
    expect(result.probability).toBeGreaterThanOrEqual(0);
    expect(result.probability).toBeLessThanOrEqual(1);
  });
});
