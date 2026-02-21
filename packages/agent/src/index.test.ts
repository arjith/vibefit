import { describe, it, expect } from 'vitest';
import { AGENT_VERSION } from './index';

describe('@vibefit/agent', () => {
  it('exports version', () => {
    expect(AGENT_VERSION).toBe('0.1.0');
  });
});
