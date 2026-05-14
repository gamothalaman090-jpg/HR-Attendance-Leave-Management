import { forwardRef } from 'react';
import { cn } from '@/utils/helpers';

/**
 * Input — Form input component with label, error, and icon support.
 *
 * @param {'text'|'email'|'password'|'number'|'tel'|'url'|'search'|'date'} type
 * @param {string} label
 * @param {string} error
 * @param {string} hint
 * @param {React.ReactNode} leftIcon
 * @param {React.ReactNode} rightIcon
 */
const Input = forwardRef(function Input(
  {
    type = 'text',
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    className,
    id,
    disabled = false,
    ...props
  },
  ref
) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-') || 'field'}`;
  const hasError = !!error;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-body-sm font-medium text-text mb-1.5"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 bg-surface border rounded-[8px] text-body text-text',
            'placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'transition-all duration-fast',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            hasError
              ? 'border-danger focus:ring-danger/30 focus:border-danger'
              : 'border-border',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />

        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-caption text-danger" role="alert">
          {error}
        </p>
      )}

      {!error && hint && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-caption text-text-muted">
          {hint}
        </p>
      )}
    </div>
  );
});

export default Input;
