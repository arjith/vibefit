
import { motion } from 'framer-motion';

export interface ProgressBarProps {
  value: number; // 0–100
  variant?: 'brand' | 'gradient' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showPercent?: boolean;
  className?: string;
}

const heightMap = { sm: 4, md: 8, lg: 12 };

const fillStyles: Record<string, string> = {
  brand: 'var(--pulse-brand, #9EFD38)',
  gradient: 'linear-gradient(90deg, var(--pulse-brand) 0%, var(--pulse-accent, #C9A96E) 100%)',
  subtle: 'rgba(255,255,255,0.3)',
};

export function ProgressBar({ value, variant = 'brand', size = 'md', label, showPercent, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const h = heightMap[size];

  return (
    <div className={`vf-progress ${className}`} style={{ width: '100%' }}>
      {(label || showPercent) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
          {label && <span style={{ color: 'var(--pulse-text-secondary)' }}>{label}</span>}
          {showPercent && <span style={{ color: 'var(--pulse-text-tertiary)' }}>{Math.round(clamped)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        style={{
          width: '100%',
          height: h,
          borderRadius: h / 2,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            height: '100%',
            borderRadius: h / 2,
            background: fillStyles[variant],
          }}
        />
      </div>
    </div>
  );
}
