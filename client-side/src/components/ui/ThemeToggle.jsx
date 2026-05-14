import { useRef, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/helpers';
import gsap from 'gsap';

/**
 * ThemeToggle — Animated dark/light mode switch with GSAP rotation.
 *
 * @param {'sm'|'md'|'lg'} size
 */
const SIZE_CLASSES = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
  lg: 'w-10 h-10',
};

const ICON_SIZE = {
  sm: 14,
  md: 16,
  lg: 18,
};

export default function ThemeToggle({ size = 'md', className }) {
  const { isDark, toggleTheme } = useTheme();
  const iconRef = useRef(null);

  const handleToggle = () => {
    // GSAP rotation on the icon
    if (iconRef.current) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        gsap.fromTo(
          iconRef.current,
          { rotate: 0, scale: 0.5, opacity: 0 },
          { rotate: 360, scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }
        );
      }
    }
    toggleTheme();
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'inline-flex items-center justify-center rounded-[8px]',
        'text-text-muted hover:text-text hover:bg-surface-alt',
        'transition-colors duration-fast cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        SIZE_CLASSES[size],
        className
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span ref={iconRef} className="inline-flex">
        {isDark ? (
          <Sun size={ICON_SIZE[size]} />
        ) : (
          <Moon size={ICON_SIZE[size]} />
        )}
      </span>
    </button>
  );
}
