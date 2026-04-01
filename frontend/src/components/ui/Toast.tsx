import React from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, action, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => onClose(id), 3000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return 'border-l-[var(--color-success)]';
      case 'error':
        return 'border-l-[var(--color-error)]';
      case 'warning':
        return 'border-l-[var(--color-warning)]';
      case 'info':
        return 'border-l-[var(--color-info)]';
      default:
        return '';
    }
  };

  return (
    <div
      className={`min-w-[300px] p-4 bg-[var(--color-bg-main)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border-l-4 ${getTypeColor()} animate-slide-in`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-[var(--color-text-primary)]">{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] whitespace-nowrap"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
