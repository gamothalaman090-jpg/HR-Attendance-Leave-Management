import { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useOutsideClick } from '@/hooks/useUtils';
import { cn } from '@/utils/helpers';

/**
 * Dropdown — Trigger + floating menu.
 *
 * @param {React.ReactNode} trigger - Custom trigger element
 * @param {string} label - Text label for default trigger button
 * @param {'left'|'right'} align
 */
export default function Dropdown({
  trigger,
  label,
  children,
  align = 'left',
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useOutsideClick(() => setIsOpen(false));

  const handleToggle = () => setIsOpen((prev) => !prev);

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      {/* Trigger */}
      {trigger ? (
        <div onClick={handleToggle} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          onClick={handleToggle}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-[8px] text-body-sm font-medium text-text hover:bg-surface-alt transition-colors cursor-pointer"
        >
          {label || 'Options'}
          <ChevronDown
            size={14}
            className={cn('transition-transform duration-fast', isOpen && 'rotate-180')}
          />
        </button>
      )}

      {/* Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-dropdown mt-2 min-w-[180px] py-1.5',
            'bg-surface-elevated border border-border rounded-[12px] shadow-elevated',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * DropdownItem — Menu item.
 */
export function DropdownItem({
  children,
  onClick,
  icon,
  danger = false,
  disabled = false,
  className,
}) {
  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-left transition-colors cursor-pointer',
        danger
          ? 'text-danger hover:bg-danger/10'
          : 'text-text hover:bg-surface-alt',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon && <span className="text-text-muted shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

/**
 * DropdownDivider — Visual separator.
 */
export function DropdownDivider() {
  return <div className="my-1.5 border-t border-border" role="separator" />;
}
