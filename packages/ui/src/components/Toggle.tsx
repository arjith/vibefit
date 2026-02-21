import { useId } from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, label, disabled = false, className = '' }: ToggleProps) {
  const id = useId();

  return (
    <div className={`vf-toggle ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: 'none',
          padding: 2,
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: checked ? 'var(--pulse-brand, #9EFD38)' : 'rgba(255,255,255,0.12)',
          opacity: disabled ? 0.5 : 1,
          transition: 'background 0.2s ease',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: checked ? '#050505' : 'rgba(255,255,255,0.6)',
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
            transition: 'transform 0.2s ease, background 0.2s ease',
          }}
        />
      </button>
      {label && (
        <label htmlFor={id} style={{ fontSize: 14, color: 'var(--pulse-text-primary)', cursor: disabled ? 'not-allowed' : 'pointer' }}>
          {label}
        </label>
      )}
    </div>
  );
}
