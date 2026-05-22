import { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGsap } from '@/hooks/useGsap';
import Meta from '@/components/common/Meta';
import { cn } from '@/utils/helpers';

/**
 * LoginPage — Superadmin-specific login with role gate.
 * Rejects any non-superadmin credentials.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── GSAP entrance animations ──
  const pageRef = useGsap((gsap, container) => {
    const icon = container.querySelector('[data-icon]');
    const header = container.querySelector('[data-header]');
    const card = container.querySelector('[data-card]');
    const footer = container.querySelector('[data-footer]');

    if (icon) {
      gsap.fromTo(icon, { scale: 0, opacity: 0, rotation: -45 }, {
        scale: 1, opacity: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.7)', clearProps: 'all',
      });
    }
    if (header) {
      gsap.fromTo(header, { y: 15, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.5, delay: 0.15, ease: 'power3.out', clearProps: 'all',
      });
    }
    if (card) {
      gsap.fromTo(card, { y: 30, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.6, delay: 0.25, ease: 'power3.out', clearProps: 'all',
      });
    }
    if (footer) {
      gsap.fromTo(footer, { opacity: 0 }, {
        opacity: 1, duration: 0.4, delay: 0.5, ease: 'power2.out', clearProps: 'all',
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // AuthContext handles navigation via ProtectedRoute
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={pageRef} className="min-h-screen flex items-center justify-center bg-bg p-4">
      <Meta title="Login" />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div data-icon className="w-16 h-16 rounded-[16px] bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-primary" />
          </div>
          <div data-header>
            <h1 className="font-heading text-h3 font-bold text-text mb-1">Superadmin Console</h1>
            <p className="text-body-sm text-text-muted">
              Restricted access — authorized personnel only.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div data-card className="bg-surface border border-border rounded-[20px] shadow-elevated p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-[12px] bg-danger/5 border border-danger/20">
                <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
                <p className="text-body-sm text-danger font-medium">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-body-sm font-medium text-text mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@nini.io"
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-surface-alt border border-border rounded-[10px] text-body-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-body-sm font-medium text-text mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 bg-surface-alt border border-border rounded-[10px] text-body-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-3 rounded-[10px] font-semibold text-body-sm transition-all duration-base',
                'bg-primary text-white hover:bg-primary-light hover:shadow-glow-primary',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                loading && 'opacity-60 cursor-not-allowed'
              )}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Sign In to Console'
              )}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-caption text-text-muted text-center">
              Use <span className="font-mono font-semibold text-primary">superadmin@nini.io</span> with any password (6+ characters).
            </p>
          </div>
        </div>

        {/* Footer */}
        <p data-footer className="text-center text-caption text-text-muted mt-6">
          This console is for system administrators only.<br />
          Unauthorized access attempts are logged.
        </p>
      </div>
    </div>
  );
}
