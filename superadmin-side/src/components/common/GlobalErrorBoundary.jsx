import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }) {
  const handleGoHome = () => {
    resetErrorBoundary();
    window.location.href = '/console';
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={40} />
        </div>
        
        <h1 className="text-h3 font-heading font-bold text-text mb-2">Something went wrong</h1>
        <p className="text-body-sm text-text-muted mb-8">
          An unexpected error occurred in the admin console.
        </p>

        {import.meta.env.DEV && (
          <div className="mb-8 p-4 bg-surface-alt border border-border rounded-lg text-left overflow-auto max-h-40 no-scrollbar">
            <p className="text-[10px] font-mono text-danger font-bold mb-2 uppercase tracking-tight">Error details:</p>
            <code className="text-xs text-text break-words">
              {error?.message || error?.toString()}
            </code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-[12px] font-semibold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 cursor-pointer"
          >
            <RefreshCcw size={18} />
            Try Again
          </button>
          <button
            onClick={handleGoHome}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-border text-text rounded-[12px] font-semibold hover:bg-surface-alt transition-all cursor-pointer"
          >
            <Home size={18} />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GlobalErrorBoundary({ children }) {
  const handleError = (error, info) => {
    console.error('Admin Error Boundary caught an error:', error, info);
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => {}}
    >
      {children}
    </ErrorBoundary>
  );
}
