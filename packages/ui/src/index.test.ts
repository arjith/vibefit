import { describe, it, expect } from 'vitest';

describe('@vibefit/ui exports', () => {
  it('exports core components', async () => {
    const ui = await import('./index');
    expect(ui.Button).toBeDefined();
    expect(ui.Card).toBeDefined();
    expect(ui.Input).toBeDefined();
    expect(ui.Skeleton).toBeDefined();
    expect(ui.EmptyState).toBeDefined();
    expect(ui.ErrorState).toBeDefined();
    expect(ui.Modal).toBeDefined();
    expect(ui.Badge).toBeDefined();
    expect(ui.Toggle).toBeDefined();
    expect(ui.ProgressBar).toBeDefined();
    expect(ui.OfflineBanner).toBeDefined();
  });

  it('exports design tokens', async () => {
    const ui = await import('./index');
    expect(ui.pulseTokensCSS).toBeDefined();
    expect(typeof ui.pulseTokensCSS).toBe('string');
  });
});
