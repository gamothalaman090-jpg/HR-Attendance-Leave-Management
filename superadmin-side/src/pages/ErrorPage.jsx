import { useState } from 'react';
import { useNavigate, useRouteError, useInRouterContext } from 'react-router-dom';
import { 
  ArrowLeft, 
  Home, 
  RefreshCw, 
  Terminal, 
  Copy, 
  Check, 
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

/**
 * Superadmin Console Premium ErrorPage Component
 * Handles 404 Not Found, routing unhandled errors, and general application crashes.
 * Works safely both inside and outside of React Router context.
 */
export default function ErrorPage({ type, error: errorProp, resetErrorBoundary }) {
  const inRouter = useInRouterContext();
  if (inRouter) {
    return (
      <ErrorPageWithRouter 
        type={type} 
        errorProp={errorProp} 
        resetErrorBoundary={resetErrorBoundary} 
      />
    );
  }
  return (
    <ErrorPageWithoutRouter 
      errorProp={errorProp} 
      resetErrorBoundary={resetErrorBoundary} 
    />
  );
}

function ErrorPageWithRouter({ type, errorProp, resetErrorBoundary }) {
  const navigate = useNavigate();
  const routeError = useRouteError();
  
  // Combine potential error sources
  const error = errorProp || routeError;
  const is404 = type === '404' || (routeError && routeError.status === 404);

  return (
    <ErrorPageUI
      error={error}
      is404={is404}
      resetErrorBoundary={resetErrorBoundary}
      onGoBack={() => navigate(-1)}
      onGoHome={() => navigate('/console')}
      homeLabel="Console HQ"
    />
  );
}

function ErrorPageWithoutRouter({ errorProp, resetErrorBoundary }) {
  const error = errorProp;
  const is404 = false;

  return (
    <ErrorPageUI
      error={error}
      is404={is404}
      resetErrorBoundary={resetErrorBoundary}
      onGoBack={() => window.history.back()}
      onGoHome={() => { window.location.href = '/console'; }}
      homeLabel="Console HQ"
    />
  );
}

function ErrorPageUI({ error, is404, resetErrorBoundary, onGoBack, onGoHome, homeLabel }) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fallback messages
  const errorCode = is404 ? '404' : (error?.status || '500');
  const errorTitle = is404 
    ? 'Console Quadrant Offline' 
    : 'Console Anomaly Detected';
  const errorDescription = is404
    ? "The console path you requested does not exist or has been shifted in system memory."
    : "An unexpected runtime error has disrupted the console deck. Diagnostics are active below.";

  // Handle clipboard copy
  const handleCopyDiagnostics = () => {
    if (!error) return;
    const details = `Error: ${error.message || error.toString()}\n\nStack Trace:\n${error.stack || 'No stack trace available.'}`;
    navigator.clipboard.writeText(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-bg text-text font-body transition-colors duration-300">
      {/* ── CSS Keyframe Animations (Encapsulated) ── */}
      <style>{`
        @keyframes float-radar {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes orbit-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.08); }
        }
        .float-animation {
          animation: float-radar 5s ease-in-out infinite;
        }
        .orbit-animation {
          animation: orbit-slow 25s linear infinite;
        }
        .glow-pulse-1 {
          animation: pulse-soft 8s ease-in-out infinite;
        }
        .glow-pulse-2 {
          animation: pulse-soft 6s ease-in-out infinite 2s;
        }
      `}</style>

      {/* ── Ambient Background Glow Blobs ── */}
      <div className="absolute rounded-full filter blur-[120px] glow-pulse-1 bg-primary w-[320px] h-[320px] -top-12 -left-12 pointer-events-none" />
      <div className="absolute rounded-full filter blur-[120px] glow-pulse-2 bg-secondary w-[350px] h-[350px] -bottom-16 -right-16 pointer-events-none" />

      {/* ── Grid Overlay ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.06),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))] pointer-events-none" />

      <div className="relative w-full max-w-2xl text-center z-10">
        {/* ── Floating SVG Vector Illustration ── */}
        <div className="flex justify-center mb-8">
          <div className="relative w-64 h-64 float-animation flex items-center justify-center">
            {/* Pulsing ring outer */}
            <div className="absolute w-56 h-56 rounded-full border border-primary/20 scale-105 animate-pulse" />
            <div className="absolute w-44 h-44 rounded-full border border-dashed border-text-muted/20 orbit-animation" />

            {/* Core Illustration Canvas */}
            <svg 
              viewBox="0 0 200 200" 
              className="w-48 h-48 select-none drop-shadow-[0_8px_16px_rgba(79,70,229,0.15)]"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-secondary)" />
                </linearGradient>
                <linearGradient id="grad-accent" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-accent)" />
                  <stop offset="100%" stopColor="var(--color-danger)" />
                </linearGradient>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="8" stdDeviation="4" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Orbital Circles */}
              <circle cx="100" cy="100" r="80" fill="none" stroke="url(#grad-primary)" strokeWidth="1" strokeDasharray="4 8" opacity="0.3" />
              <circle cx="100" cy="100" r="65" fill="none" stroke="var(--color-border)" strokeWidth="1.5" opacity="0.4" />
              
              {/* Animated Radar Sweepers */}
              <line x1="100" y1="100" x2="155" y2="45" stroke="var(--color-primary)" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
              <circle cx="155" cy="45" r="4" fill="var(--color-primary)" />

              {/* Main Core Graphic */}
              {is404 ? (
                // 404 Planetary Radar Graphic
                <g>
                  {/* Outer Planet Ring */}
                  <ellipse cx="100" cy="100" rx="60" ry="16" fill="none" stroke="url(#grad-primary)" strokeWidth="5" transform="rotate(-15 100 100)" />
                  {/* Planet Sphere */}
                  <circle cx="100" cy="100" r="32" fill="url(#grad-primary)" />
                  {/* Ring Foreground slice to overlap planet */}
                  <path d="M 45 110 A 60 16 0 0 0 155 90" fill="none" stroke="url(#grad-primary)" strokeWidth="5" transform="rotate(-15 100 100)" strokeLinecap="round" />
                  {/* Satellite floating */}
                  <g transform="translate(145, 80) scale(0.8)">
                    <rect x="-15" y="-3" width="30" height="6" rx="2" fill="var(--color-accent)" />
                    <circle cx="0" cy="0" r="6" fill="var(--color-text)" />
                    <line x1="0" y1="0" x2="0" y2="12" stroke="var(--color-accent)" strokeWidth="1.5" />
                    <path d="M-4,12 L4,12 L0,16 Z" fill="var(--color-accent)" />
                  </g>
                </g>
              ) : (
                // 500 Glitch Dashboard Server Graphic
                <g>
                  {/* Server Console Chassis */}
                  <rect x="50" y="60" width="100" height="80" rx="8" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="2" />
                  {/* Internal grid bars */}
                  <rect x="60" y="70" width="80" height="8" rx="2" fill="var(--color-border-light)" />
                  <rect x="60" y="85" width="80" height="8" rx="2" fill="var(--color-border-light)" />
                  <rect x="60" y="100" width="80" height="8" rx="2" fill="var(--color-border-light)" />
                  
                  {/* Error Indicator Triangle */}
                  <g transform="translate(100, 115) scale(1.1)" filter="url(#shadow)">
                    <polygon points="0,-18 16,12 -16,12" fill="url(#grad-accent)" />
                    <circle cx="0" cy="4" r="2" fill="white" />
                    <rect x="-1" y="-6" width="2" height="6" rx="0.5" fill="white" />
                  </g>

                  {/* Tech Lines */}
                  <circle cx="65" cy="74" r="2.5" fill="var(--color-primary)" />
                  <circle cx="65" cy="89" r="2.5" fill="var(--color-secondary)" />
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* ── Content Card (Glassmorphism) ── */}
        <div className="glass-card p-8 md:p-12 mb-8 shadow-elevated border border-border/50 text-center select-text">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-caption font-bold tracking-widest uppercase bg-danger/10 text-danger border border-danger/20 mb-4 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            Superadmin Error {errorCode}
          </div>

          <h1 className="text-h2 md:text-h1 font-heading font-extrabold tracking-tight mb-4 gradient-text text-balance">
            {errorTitle}
          </h1>

          <p className="text-text-muted text-body md:text-body-lg max-w-lg mx-auto mb-8 text-balance">
            {errorDescription}
          </p>

          {/* ── Navigation / Action Deck ── */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGoBack}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-body-sm text-text bg-surface-alt hover:bg-border border border-border rounded-btn transition-all duration-300 transform active:scale-95 hover:-translate-y-0.5 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Navigate to previous page"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Go Back
            </button>

            {resetErrorBoundary ? (
              <button
                onClick={resetErrorBoundary}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-body-sm text-white bg-primary hover:bg-primary-light rounded-btn transition-all duration-300 transform active:scale-95 hover:-translate-y-0.5 cursor-pointer shadow-glow-primary focus-visible:ring-2 focus-visible:ring-primary-light"
              >
                <RefreshCw className="w-4 h-4 animate-spin-hover" />
                Retry Deck
              </button>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-body-sm text-text bg-surface-alt hover:bg-border border border-border rounded-btn transition-all duration-300 transform active:scale-95 hover:-translate-y-0.5 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
            )}

            <button
              onClick={onGoHome}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-body-sm text-white bg-primary hover:bg-primary-light rounded-btn transition-all duration-300 transform active:scale-95 hover:-translate-y-0.5 cursor-pointer shadow-glow-primary focus-visible:ring-2 focus-visible:ring-primary-light"
            >
              <Home className="w-4 h-4" />
              {homeLabel}
            </button>
          </div>
        </div>

        {/* ── Collapsible Diagnostics Console ── */}
        {error && (
          <div className="w-full max-w-2xl mx-auto mb-6">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="inline-flex items-center gap-2 text-text-muted hover:text-text text-body-sm transition-colors cursor-pointer py-2 focus-visible:ring-2 focus-visible:ring-primary rounded px-3"
              aria-expanded={showDiagnostics}
              aria-controls="diagnostics-panel"
            >
              <Terminal className="w-4 h-4" />
              <span>{showDiagnostics ? 'Hide Diagnostic Log' : 'View Diagnostic Log'}</span>
              {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDiagnostics && (
              <div 
                id="diagnostics-panel" 
                className="glass-card border border-border mt-3 text-left overflow-hidden shadow-elevated animate-in fade-in ease-out duration-200"
              >
                {/* Header bar */}
                <div className="bg-surface border-b border-border px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-danger" />
                    <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                    <div className="w-2.5 h-2.5 rounded-full bg-success" />
                    <span className="text-caption font-mono text-text-muted ml-2">superadmin-diagnostics.log</span>
                  </div>
                  <button
                    onClick={handleCopyDiagnostics}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-caption text-text-muted hover:text-text bg-surface-alt hover:bg-border rounded border border-border cursor-pointer transition-colors focus-visible:ring-1 focus-visible:ring-primary"
                    title="Copy technical logs to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-success" />
                        <span className="text-success font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Log</span>
                      </>
                    )}
                  </button>
                </div>
                {/* Body code log */}
                <pre className="p-5 font-mono text-caption text-text-muted bg-surface-elevated/70 max-h-64 overflow-auto leading-relaxed select-text">
                  <div className="text-danger font-bold mb-1">
                    [SUPERADMIN CORE EXCEPTION] {error.message || error.toString()}
                  </div>
                  {error.stack ? (
                    <div className="whitespace-pre">{error.stack}</div>
                  ) : (
                    <div className="italic text-text-muted/60">No automated stack trace returned from engine.</div>
                  )}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ── Footer Branding ── */}
        <p className="text-caption text-text-muted/60 pointer-events-none select-none">
          HR Management & Attendance System • Nini Admin Engine
        </p>
      </div>
    </main>
  );
}
