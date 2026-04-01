import { create } from 'zustand';
import { nanoid } from 'nanoid';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: nanoid() }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearAll: () => set({ toasts: [] }),
}));

export const useToast = () => {
  const store = useToastStore();

  return {
    success: (message: string, action?: Toast['action']) =>
      store.addToast({ type: 'success', message, action }),
    error: (message: string, action?: Toast['action']) =>
      store.addToast({ type: 'error', message, action }),
    warning: (message: string, action?: Toast['action']) =>
      store.addToast({ type: 'warning', message, action }),
    info: (message: string, action?: Toast['action']) =>
      store.addToast({ type: 'info', message, action }),
    remove: store.removeToast,
    clearAll: store.clearAll,
  };
};

export default useToastStore;
