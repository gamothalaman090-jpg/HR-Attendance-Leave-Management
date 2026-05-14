import { forwardRef } from 'react';
import { cn } from '@/utils/helpers';

/**
 * Button — Primary interactive component.
 *
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'|'accent'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} fullWidth
 * @param {boolean} loading
 * @param {React.ReactNode} leftIcon
 * @param {React.ReactNode} rightIcon
 */
const VARIANT_CLASSES = {
  primary:
    'bg-primary text-white hover:bg-primary-light hover:shadow-glow-primary active:bg-primary-dark',
  secondary:
    'bg-secondary text-white hover:bg-secondary-light active:opacity-90',
  outline:
    'border border-border bg-transparent text-text hover:bg-surface-alt active:bg-surface',
  ghost:
    'bg-transparent text-text hover:bg-surface-alt active:bg-surface',
  danger:
    'bg-danger text-white hover:bg-danger-light active:opacity-90',
  accent:
    'bg-accent text-white hover:bg-accent-light active:bg-accent-dark',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-body-sm gap-1.5',
  md: 'px-5 py-2.5 text-body-sm gap-2',
  lg: 'px-7 py-3.5 text-body gap-2.5',
};

const ICON_SIZE = {
  sm: 14,
  md: 16,
  lg: 18,
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    className,
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-[10px] transition-all duration-base cursor-pointer select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {loading ? (
        <span
          className={cn(
            'border-2 border-current/30 border-t-current rounded-full animate-spin',
            size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
          )}
          aria-label="Loading"
        />
      ) : (
        leftIcon
      )}
      {children && <span>{children}</span>}
      {!loading && rightIcon}
    </button>
  );
});

export default Button;
