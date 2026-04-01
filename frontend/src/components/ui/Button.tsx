import React from 'react';

export type ButtonVariant = 'default' | 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      isLoading = false,
      icon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]';
        case 'secondary':
          return 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]';
        case 'danger':
          return 'bg-[var(--color-error)] text-white border-[var(--color-error)] hover:opacity-90';
        case 'ghost':
          return 'bg-transparent text-[var(--color-text-primary)] border-transparent hover:bg-[var(--color-bg-secondary)]';
        default:
          return 'bg-[var(--color-bg-main)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]';
      }
    };

    const getSizeStyles = () => {
      switch (size) {
        case 'sm':
          return 'px-2 py-1 text-xs';
        case 'lg':
          return 'px-6 py-3 text-lg';
        case 'icon':
          return 'p-2 w-8 h-8';
        default:
          return 'px-4 py-2 text-sm';
      }
    };

    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-medium border rounded-[var(--radius-md)] transition-all duration-[var(--transition-fast)] disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-[1px]';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${getVariantStyles()} ${getSizeStyles()} ${className || ''}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {icon && !isLoading && <span>{icon}</span>}
        {children && <span>{children}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
