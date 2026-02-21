import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, children, disabled, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`vf-button vf-button--${variant} vf-button--${size} ${loading ? 'vf-button--loading' : ''} ${className}`}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <span className="vf-button__spinner" aria-hidden="true" />
        ) : null}
        <span className={loading ? 'vf-button__content--hidden' : ''}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
