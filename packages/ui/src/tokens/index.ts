/** Pulse Design System — CSS custom property tokens.
 *  Import this constant and inject via a <style> tag or global CSS. */
export const pulseTokensCSS = `
:root {
  /* Background */
  --pulse-bg-primary: #050505;
  --pulse-bg-elevated: #111111;
  --pulse-bg-surface: #0d0d0d;
  --pulse-bg-interactive: #1a1a1a;

  /* Brand */
  --pulse-green-500: #9EFD38;
  --pulse-green-600: #7acc2d;
  --pulse-green-100: rgba(158, 253, 56, 0.1);
  --pulse-green-200: rgba(158, 253, 56, 0.2);
  --pulse-gold-500: #C9A96E;
  --pulse-gold-100: rgba(201, 169, 110, 0.1);

  /* Semantic */
  --pulse-red-500: #ff4444;
  --pulse-red-100: rgba(255, 68, 68, 0.1);
  --pulse-amber-500: #ffaa00;
  --pulse-amber-100: rgba(255, 170, 0, 0.1);
  --pulse-blue-500: #4488ff;
  --pulse-blue-100: rgba(68, 136, 255, 0.1);
  --pulse-success: #00cc88;
  --pulse-success-100: rgba(0, 204, 136, 0.1);

  /* Text */
  --pulse-text-primary: #f0f0f0;
  --pulse-text-secondary: #8a8a8a;
  --pulse-text-muted: #555555;
  --pulse-text-inverse: #050505;

  /* Borders */
  --pulse-border-subtle: rgba(255, 255, 255, 0.06);
  --pulse-border-default: rgba(255, 255, 255, 0.1);
  --pulse-border-strong: rgba(255, 255, 255, 0.2);

  /* Spacing */
  --pulse-space-1: 4px;
  --pulse-space-2: 8px;
  --pulse-space-3: 16px;
  --pulse-space-4: 24px;
  --pulse-space-5: 32px;
  --pulse-space-6: 48px;

  /* Radius */
  --pulse-radius-sm: 6px;
  --pulse-radius-md: 10px;
  --pulse-radius-lg: 16px;
  --pulse-radius-xl: 24px;
  --pulse-radius-full: 9999px;

  /* Shadows */
  --pulse-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --pulse-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --pulse-shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
  --pulse-shadow-glow: 0 0 20px rgba(158, 253, 56, 0.15);

  /* Motion */
  --pulse-ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --pulse-ease-out: cubic-bezier(0.55, 0.09, 0.68, 0.53);
  --pulse-duration-fast: 150ms;
  --pulse-duration-normal: 300ms;
  --pulse-duration-slow: 500ms;

  /* Z-index */
  --pulse-z-dropdown: 100;
  --pulse-z-sticky: 200;
  --pulse-z-modal-backdrop: 300;
  --pulse-z-modal: 400;
  --pulse-z-toast: 500;
  --pulse-z-tooltip: 600;

  /* Focus */
  --pulse-focus-ring: 0 0 0 2px var(--pulse-green-500);
  --pulse-focus-offset: 2px;
}
`;
