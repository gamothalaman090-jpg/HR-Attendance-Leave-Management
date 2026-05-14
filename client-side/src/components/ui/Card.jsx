import { cn } from '@/utils/helpers';

/**
 * Card — Versatile container with optional hover effects and glassmorphism.
 *
 * @param {'default'|'glass'|'elevated'|'outlined'|'ghost'} variant
 * @param {boolean} hoverable
 * @param {boolean} clickable
 * @param {string} padding - Tailwind padding class override
 */
const VARIANT_CLASSES = {
  default: 'bg-surface border border-border shadow-card',
  glass: 'glass-card shadow-card',
  elevated: 'bg-surface-elevated border border-border shadow-elevated',
  outlined: 'bg-transparent border border-border',
  ghost: 'bg-transparent',
};

export default function Card({
  children,
  variant = 'default',
  hoverable = false,
  clickable = false,
  padding = 'p-6',
  className,
  onClick,
  ...props
}) {
  const Component = onClick || clickable ? 'button' : 'div';

  return (
    <Component
      className={cn(
        'rounded-[16px] transition-all duration-base',
        VARIANT_CLASSES[variant],
        padding,
        hoverable && 'hover:shadow-card-hover hover:border-primary/20',
        clickable && 'cursor-pointer hover:shadow-card-hover hover:border-primary/20 active:scale-[0.98]',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * CardHeader — Top section of a card with title and optional action.
 */
export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)}>
      <div>
        <h3 className="font-heading text-h4 font-bold text-text">{title}</h3>
        {subtitle && (
          <p className="text-body-sm text-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * CardContent — Body section of a card.
 */
export function CardContent({ children, className }) {
  return <div className={cn('', className)}>{children}</div>;
}

/**
 * CardFooter — Bottom section with border-top separator.
 */
export function CardFooter({ children, className }) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-border flex items-center justify-end gap-3', className)}>
      {children}
    </div>
  );
}
