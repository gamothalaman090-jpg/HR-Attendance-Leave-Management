import { cn } from '@/utils/helpers';

/**
 * Badge — Status indicator pill.
 *
 * @param {'primary'|'success'|'danger'|'warning'|'info'|'accent'|'secondary'|'muted'} variant
 * @param {'sm'|'md'} size
 * @param {boolean} dot — Show a pulsing dot indicator
 */
const VARIANT_CLASSES = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning dark:bg-warning/15',
  info: 'bg-info/10 text-info',
  accent: 'bg-accent/10 text-accent',
  secondary: 'bg-secondary/10 text-secondary',
  muted: 'bg-surface-alt text-text-muted',
};

const DOT_CLASSES = {
  primary: 'bg-primary',
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
  accent: 'bg-accent',
  secondary: 'bg-secondary',
  muted: 'bg-text-muted',
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-caption',
};

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className,
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-pill select-none',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full animate-pulse',
            DOT_CLASSES[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}
