import React from 'react';
import { X } from 'lucide-react';
import Toast from './ui/Toast';
import useToastStore from '../hooks/useToast';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="font-medium text-[var(--color-text-primary)]">
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors flex-shrink-0"
              aria-label="Close notification"
            >
              <X size={18} />
            </button>
          </div>
          {toast.action && (
            <div className="mt-3 flex gap-2 justify-end">
              <button
                onClick={() => {
                  toast.action?.onClick();
                  removeToast(toast.id);
                }}
                className="text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
