import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

const variantIcon: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const variantColor: Record<ToastVariant, string> = {
  success: 'var(--pulse-brand, #9EFD38)',
  error: 'var(--pulse-semantic-error, #FF4757)',
  warning: 'var(--pulse-semantic-warning, #FFA502)',
  info: 'var(--pulse-semantic-info, #3498DB)',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--pulse-space-2, 12px)',
        padding: '12px 16px',
        background: 'var(--pulse-bg-elevated, #111)',
        border: `1px solid ${variantColor[toast.variant]}33`,
        borderRadius: 'var(--pulse-radius-md, 12px)',
        boxShadow: 'var(--pulse-shadow-md)',
        minWidth: 280,
        maxWidth: 420,
        pointerEvents: 'auto',
      }}
    >
      <span style={{
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: `${variantColor[toast.variant]}1A`,
        color: variantColor[toast.variant],
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
      }}>
        {variantIcon[toast.variant]}
      </span>
      <span style={{ flex: 1, fontSize: 14, color: 'var(--pulse-text-primary, #fff)' }}>
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--pulse-text-tertiary, #555)',
          cursor: 'pointer',
          padding: 4,
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = 'info', duration = 5000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, variant, duration }]); // max 5 visible
    const timer = setTimeout(() => dismiss(id), duration);
    timersRef.current.set(id, timer);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div
          aria-label="Notifications"
          style={{
            position: 'fixed',
            bottom: 'var(--pulse-space-4, 24px)',
            right: 'var(--pulse-space-4, 24px)',
            zIndex: 'var(--pulse-z-toast, 500)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--pulse-space-2, 12px)',
            pointerEvents: 'none',
          }}
        >
          <AnimatePresence mode="popLayout">
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
