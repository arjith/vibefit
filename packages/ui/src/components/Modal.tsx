import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const sizeMap = { sm: 480, md: 640, lg: 960, full: '100%' };

export function Modal({ open, onClose, title, children, size = 'md', className = '' }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      contentRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, [open]);

  // Escape key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
    // Focus trap
    if (e.key === 'Tab' && contentRef.current) {
      const focusable = contentRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onClose]);

  const maxWidth = typeof sizeMap[size] === 'number' ? `${sizeMap[size]}px` : sizeMap[size];

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="vf-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--pulse-z-modal-backdrop, 300)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            padding: 'var(--pulse-space-3)',
          }}
        >
          <motion.div
            ref={contentRef}
            className={`vf-modal ${className}`}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              background: 'var(--pulse-bg-elevated, #111)',
              borderRadius: 'var(--pulse-radius-lg, 16px)',
              boxShadow: 'var(--pulse-shadow-lg)',
              maxWidth,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              outline: 'none',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--pulse-space-3) var(--pulse-space-4)',
              borderBottom: '1px solid var(--pulse-border-subtle, rgba(255,255,255,0.06))',
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--pulse-text-secondary, #8a8a8a)',
                  cursor: 'pointer',
                  borderRadius: 'var(--pulse-radius-sm, 6px)',
                  fontSize: 20,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: 'var(--pulse-space-4)' }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
