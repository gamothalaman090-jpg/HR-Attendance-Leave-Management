import { cn } from '@/utils/helpers';

/**
 * Spinner — Loading indicator.
 *
 * @param {'sm'|'md'|'lg'} size
 * @param {'primary'|'white'|'muted'} color
 */
const SIZE_CLASSES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-3',
};

const COLOR_CLASSES = {
  primary: 'border-primary/30 border-t-primary',
  white: 'border-white/30 border-t-white',
  muted: 'border-text-muted/30 border-t-text-muted',
};

export default function Spinner({
  size = 'md',
  color = 'primary',
  className,
  label = 'Loading',
}) {
  return (
    <div
      className={cn(
        'rounded-full animate-spin',
        SIZE_CLASSES[size],
        COLOR_CLASSES[color],
        className
      )}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * PageSpinner — Full-page centered loading state.
 */
export function PageSpinner({ message = 'Loading...' }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-body-sm text-text-muted font-medium">{message}</p>
    </div>
  );
}

/**
 * Skeleton — Content placeholder with shimmer.
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('skeleton rounded-[8px]', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * SkeletonCard — Pre-composed card skeleton.
 */
export function SkeletonCard() {
  return (
    <div className="p-6 rounded-[16px] bg-surface border border-border space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}
