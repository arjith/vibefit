import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className={`vf-input-group ${error ? 'vf-input-group--error' : ''} ${className}`}>
        <label htmlFor={inputId} className="vf-input-group__label">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className="vf-input-group__input"
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          {...props}
        />
        {error && (
          <p id={errorId} className="vf-input-group__error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="vf-input-group__hint">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
