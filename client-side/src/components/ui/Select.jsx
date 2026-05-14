import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/helpers';

/**
 * Select — Styled native select with label and error support.
 */
const Select = forwardRef(function Select(
  { label, error, hint, options = [], placeholder, id, disabled, className, ...props },
  ref
) {
  const inputId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-') || 'field'}`;
  const hasError = !!error;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-body-sm font-medium text-text mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={cn(
            'w-full appearance-none px-4 py-3 pr-10 bg-surface border rounded-[8px] text-body text-text',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'transition-all duration-fast cursor-pointer',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            hasError ? 'border-danger focus:ring-danger/30 focus:border-danger' : 'border-border',
            className
          )}
          aria-invalid={hasError}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
      </div>

      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-caption text-danger" role="alert">{error}</p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-caption text-text-muted">{hint}</p>
      )}
    </div>
  );
});

export default Select;
