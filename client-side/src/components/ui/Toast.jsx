import { useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/utils/helpers';
import gsap from 'gsap';

/**
 * ToastContainer — Renders toast notifications from ToastContext.
 * Place once in your app tree (e.g., in App.jsx or main layout).
 */
const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLE_CLASSES = {
  success: 'border-success/30 bg-success/5',
  error: 'border-danger/30 bg-danger/5',
  warning: 'border-warning/30 bg-warning/5',
  info: 'border-info/30 bg-info/5',
};

const ICON_CLASSES = {
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed bottom-4 right-4 z-toast flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const ref = useRef(null);
  const Icon = ICONS[toast.type] || Info;

  useEffect(() => {
    if (!ref.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      gsap.fromTo(
        ref.current,
        { x: 100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-4 rounded-[12px] border shadow-elevated bg-surface-elevated',
        STYLE_CLASSES[toast.type]
      )}
      role="alert"
    >
      <Icon size={20} className={cn('shrink-0 mt-0.5', ICON_CLASSES[toast.type])} />

      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-body-sm font-semibold text-text">{toast.title}</p>
        )}
        {toast.message && (
          <p className="text-caption text-text-muted mt-0.5">{toast.message}</p>
        )}
      </div>

      <button
        onClick={onClose}
        className="shrink-0 p-1 rounded-[6px] text-text-muted hover:text-text hover:bg-surface-alt transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}
