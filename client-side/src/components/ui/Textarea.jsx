import { forwardRef } from 'react';
import { cn } from '@/utils/helpers';

/**
 * Textarea — Multi-line text input with label and error support.
 */
const Textarea = forwardRef(function Textarea(
  { label, error, hint, rows = 4, id, disabled, className, ...props },
  ref
) {
  const inputId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-') || 'field'}`;
  const hasError = !!error;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-body-sm font-medium text-text mb-1.5">
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-3 bg-surface border rounded-[8px] text-body text-text resize-none',
          'placeholder:text-text-muted',
          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
          'transition-all duration-fast',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          hasError ? 'border-danger focus:ring-danger/30 focus:border-danger' : 'border-border',
          className
        )}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />

      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-caption text-danger" role="alert">{error}</p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-caption text-text-muted">{hint}</p>
      )}
    </div>
  );
});

export default Textarea;
