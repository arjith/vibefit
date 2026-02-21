import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { removeToast, type Toast, type ToastType } from '../store/toastSlice';

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
  achievement: '🏆',
  pr: '🔥',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div className={`toast-item toast-${toast.type}`} role="alert">
      <span className="toast-icon">{toast.emoji ?? TOAST_ICONS[toast.type]}</span>
      <div className="toast-content">
        <strong className="toast-title">{toast.title}</strong>
        {toast.message && <p className="toast-message">{toast.message}</p>}
      </div>
      <button className="toast-close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useSelector((s: RootState) => s.toast.toasts);
  const dispatch = useDispatch<AppDispatch>();

  const handleDismiss = useCallback(
    (id: string) => dispatch(removeToast(id)),
    [dispatch],
  );

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}
