import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'brand';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<string, { bg: string; color: string }> = {
  default: { bg: 'rgba(255,255,255,0.08)', color: 'var(--pulse-text-secondary)' },
  success: { bg: 'rgba(158,253,56,0.12)', color: 'var(--pulse-brand)' },
  warning: { bg: 'rgba(255,165,2,0.12)', color: 'var(--pulse-semantic-warning)' },
  error: { bg: 'rgba(255,71,87,0.12)', color: 'var(--pulse-semantic-error)' },
  brand: { bg: 'rgba(158,253,56,0.15)', color: 'var(--pulse-brand)' },
};

export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  const style = variantStyles[variant];
  return (
    <span
      className={`vf-badge vf-badge--${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        fontSize: size === 'sm' ? 11 : 13,
        fontWeight: 600,
        lineHeight: 1.4,
        borderRadius: 'var(--pulse-radius-full, 9999px)',
        background: style.bg,
        color: style.color,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
