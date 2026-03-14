'use client';

import { useEffect } from 'react';
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().addToast('success', message),
  error: (message: string) => useToastStore.getState().addToast('error', message),
  info: (message: string) => useToastStore.getState().addToast('info', message),
  warning: (message: string) => useToastStore.getState().addToast('warning', message),
};

export function useToast() {
  return toast;
}

const typeStyles: Record<ToastType, string> = {
  success: 'border-neon-green/50 text-neon-green',
  error: 'border-neon-red/50 text-neon-red',
  info: 'border-neon-primary/50 text-neon-primary-light',
  warning: 'border-neon-gold/50 text-neon-gold',
};

const typeIcons: Record<ToastType, string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 18L18 6M6 6l12 12',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
};

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  return (
    <div
      className={`animate-slide-in-right glass-strong flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${typeStyles[item.type]}`}
    >
      <svg
        className="h-5 w-5 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={typeIcons[item.type]}
        />
      </svg>
      <span className="text-sm text-neon-text">{item.message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 shrink-0 rounded-lg p-1 text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
        aria-label="닫기"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
      {toasts.map((item) => (
        <ToastItem
          key={item.id}
          item={item}
          onDismiss={() => removeToast(item.id)}
        />
      ))}
    </div>
  );
}
