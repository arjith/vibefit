import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'achievement' | 'pr';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  emoji?: string;
  duration?: number; // ms, default 5000
}

interface ToastState {
  toasts: Toast[];
}

const initialState: ToastState = { toasts: [] };

let toastCounter = 0;

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    addToast(state, action: PayloadAction<Omit<Toast, 'id'>>) {
      state.toasts.push({ ...action.payload, id: `toast-${++toastCounter}` });
      // Cap at 5 visible toasts
      if (state.toasts.length > 5) state.toasts.shift();
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts(state) {
      state.toasts = [];
    },
  },
});

export const { addToast, removeToast, clearToasts } = toastSlice.actions;
export default toastSlice.reducer;
