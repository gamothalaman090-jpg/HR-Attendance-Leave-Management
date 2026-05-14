import { useState } from 'react';
import { cn } from '@/utils/helpers';

/**
 * Tooltip — Hover-triggered text tooltip.
 *
 * @param {string} content - Tooltip text
 * @param {'top'|'bottom'|'left'|'right'} position
 * @param {number} delay - Delay before showing (ms)
 */
const POSITION_CLASSES = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const ARROW_CLASSES = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-text border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-text border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-text border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-text border-y-transparent border-l-transparent',
};

export default function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
  className,
}) {
  const [visible, setVisible] = useState(false);
  let timeout = null;

  const show = () => {
    timeout = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timeout);
    setVisible(false);
  };

  if (!content) return children;

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {visible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-tooltip px-2.5 py-1.5 rounded-[6px] text-caption font-medium',
            'bg-text text-text-inverted whitespace-nowrap',
            'animate-in fade-in duration-150',
            'pointer-events-none select-none',
            POSITION_CLASSES[position]
          )}
        >
          {content}
          <div
            className={cn(
              'absolute w-0 h-0 border-4',
              ARROW_CLASSES[position]
            )}
          />
        </div>
      )}
    </div>
  );
}
