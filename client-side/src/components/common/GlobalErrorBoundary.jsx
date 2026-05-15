import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Global Error Boundary caught an error:', error, errorInfo);
    // You could send this to an error reporting service like Sentry here
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/app';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            
            <h1 className="text-h3 font-heading font-bold text-text mb-2">Something went wrong</h1>
            <p className="text-body-sm text-text-muted mb-8">
              An unexpected error occurred. We've been notified and are looking into it.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="mb-8 p-4 bg-surface-alt border border-border rounded-lg text-left overflow-auto max-h-40 no-scrollbar">
                <p className="text-[10px] font-mono text-error font-bold mb-2 uppercase tracking-tight">Error details:</p>
                <code className="text-xs text-text break-words">
                  {this.state.error?.toString()}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-[12px] font-semibold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
              >
                <RefreshCcw size={18} />
                Try Again
              </button>
              <button
                onClick={this.handleReset}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-border text-text rounded-[12px] font-semibold hover:bg-surface-alt transition-all"
              >
                <Home size={18} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
