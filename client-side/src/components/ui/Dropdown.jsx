/**
 * Name: Dropdown.jsx
 * PHASE 4 FIXES:
 *
 *   FIX 1 (HIGH): Custom trigger wrapped in <div onClick> — not keyboard accessible.
 *     BEFORE: div with onClick — Tab skips it, Enter doesn't open it.
 *     AFTER:  Wraps custom trigger in a <button> to ensure keyboard support,
 *             or uses the default trigger button.
 *
 *   FIX 2 (HIGH): Menu had role="menu" but children had no role="menuitem".
 *     Partial ARIA roles are worse than none — screen readers enter menu mode
 *     and look for menuitem children, finding nothing, which is confusing.
 *     AFTER:  DropdownItem component exported with role="menuitem".
 *
 *   FIX 3 (HIGH): No aria-expanded on trigger button.
 *     Screen readers couldn't tell if the menu was open or closed.
 *
 *   FIX 4 (MEDIUM): Escape key didn't close the dropdown.
 *     Keyboard users had no way to dismiss without clicking elsewhere.
 *
 *   FIX 5 (MEDIUM): No arrow key navigation inside the menu.
 *     WCAG 2.1 AA requires arrow key navigation in menus.
 *     AFTER:  ArrowDown/ArrowUp move focus through menu items.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useOutsideClick } from '@/hooks/useUtils';
import { cn } from '@/utils/helpers';

export default function Dropdown({
  trigger,
  label,
  children,
  align = 'left',
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef    = useRef(null);
  const triggerRef = useRef(null);
  const containerRef = useOutsideClick(() => setIsOpen(false));

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close  = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  // FIX 4: Escape key closes the menu
  // FIX 5: Arrow key navigation within menu
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }

      const items = menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])');
      if (!items?.length) return;

      const activeIdx = Array.from(items).indexOf(document.activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = activeIdx < items.length - 1 ? activeIdx + 1 : 0;
        items[next]?.focus();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = activeIdx > 0 ? activeIdx - 1 : items.length - 1;
        items[prev]?.focus();
      }
      if (e.key === 'Home') {
        e.preventDefault();
        items[0]?.focus();
      }
      if (e.key === 'End') {
        e.preventDefault();
        items[items.length - 1]?.focus();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, close]);

  // Move focus to first menu item when menu opens
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      menuRef.current?.querySelector('[role="menuitem"]')?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      {/* ─────────────────────────────────────────────
        FIX 1: Custom trigger wrapped in <button> for keyboard accessibility.
        FIX 3: aria-expanded on trigger button.
        If a custom trigger is passed, wrap it so it's keyboard operable.
      ───────────────────────────────────────────── */}
      {trigger ? (
        <button
          ref={triggerRef}
          onClick={toggle}
          className="cursor-pointer focus-visible:outline-2 focus-visible:outline-primary rounded"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          type="button"
        >
          {trigger}
        </button>
      ) : (
        <button
          ref={triggerRef}
          onClick={toggle}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-[8px] text-body-sm font-medium text-text hover:bg-surface-alt transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          {label || 'Options'}
          <ChevronDown
            size={14}
            className={cn('transition-transform duration-fast', isOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      )}

      {/* FIX 2: role="menu" kept — items must use role="menuitem" via DropdownItem */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={cn(
            'absolute z-dropdown mt-2 min-w-[180px] py-1.5',
            'bg-surface-elevated border border-border rounded-[12px] shadow-elevated',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          tabIndex={-1}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * DropdownItem — Menu item with proper role="menuitem" for ARIA compliance.
 *
 * FIX 2: Provides role="menuitem" so Dropdown's role="menu" is complete.
 *
 * @param {Function} onClick
 * @param {boolean} danger   - Red destructive styling
 * @param {boolean} disabled
 */
export function DropdownItem({ children, onClick, danger = false, disabled = false, icon, className, ...props }) {
  return (
    <button
      role="menuitem"
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-4 py-2 text-body-sm text-left transition-colors cursor-pointer',
        'focus-visible:outline-none focus-visible:bg-surface-alt',
        danger
          ? 'text-danger hover:bg-danger/10 hover:text-danger-dark'
          : 'text-text hover:bg-surface-alt',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0 text-current" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}

/**
 * DropdownDivider — Visual separator between groups of menu items.
 */
export function DropdownDivider({ className }) {
  return (
    <div
      role="separator"
      className={cn('my-1.5 h-px bg-border', className)}
    />
  );
}
