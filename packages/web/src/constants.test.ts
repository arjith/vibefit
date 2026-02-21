import { describe, it, expect } from 'vitest';
import { MUSCLE_GROUPS, EQUIPMENT_OPTIONS, FITNESS_GOALS, STALE_AFTER_MS } from '@vibefit/shared';

describe('shared constants integration', () => {
  it('MUSCLE_GROUPS has id/label structure', () => {
    expect(MUSCLE_GROUPS.length).toBeGreaterThan(0);
    for (const mg of MUSCLE_GROUPS) {
      expect(mg).toHaveProperty('id');
      expect(mg).toHaveProperty('label');
    }
  });

  it('EQUIPMENT_OPTIONS has id/label/emoji', () => {
    expect(EQUIPMENT_OPTIONS.length).toBeGreaterThan(0);
    for (const eq of EQUIPMENT_OPTIONS) {
      expect(eq).toHaveProperty('id');
      expect(eq).toHaveProperty('label');
      expect(eq).toHaveProperty('emoji');
    }
  });

  it('FITNESS_GOALS has all required fields', () => {
    expect(FITNESS_GOALS.length).toBeGreaterThan(0);
    for (const g of FITNESS_GOALS) {
      expect(g).toHaveProperty('id');
      expect(g).toHaveProperty('label');
      expect(g).toHaveProperty('emoji');
      expect(g).toHaveProperty('description');
    }
  });

  it('STALE_AFTER_MS is 5 minutes', () => {
    expect(STALE_AFTER_MS).toBe(300000);
  });
});
