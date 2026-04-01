import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  prefix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, prefix, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {(prefix || icon) && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
              {prefix || icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-bg-main)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] ${
              (prefix || icon) ? 'pl-9' : ''
            } ${error ? 'border-[var(--color-error)]' : ''} ${className || ''}`}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-[var(--color-error)] mt-1">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
