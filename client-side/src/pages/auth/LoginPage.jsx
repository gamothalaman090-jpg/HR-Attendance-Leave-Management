import { useState } from 'react';
import Meta from '@/components/common/Meta';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGsap } from '@/hooks/useGsap';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const containerRef = useGsap((gsap, el) => {
    const targets = el.querySelectorAll('[data-anim]');
    if (targets.length) {
      gsap.fromTo(targets,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out', clearProps: 'all' }
      );
    }
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      navigate('/app');
    } catch (err) {
      setError('root', { message: err.message || 'An error occurred during sign in. Please try again.' });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Google Identity Services integration
      if (!window.google?.accounts?.id) {
        setError('root', { message: 'Google Sign-In is not available. Please try again later.' });
        return;
      }
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const decoded = JSON.parse(atob(response.credential.split('.')[1]));
            await googleLogin({
              email: decoded.email,
              fullname: decoded.name,
              providerId: decoded.sub,
              profilePicture: decoded.picture,
            });
            navigate('/app');
          } catch (err) {
            setError('root', { message: err.message || 'Google sign-in failed' });
          }
        },
      });
      window.google.accounts.id.prompt();
    } catch (err) {
      setError('root', { message: 'Google sign-in unavailable' });
    }
  };

  return (
    <div ref={containerRef}>
      <Meta title="Login" />
      <div data-anim className="mb-8">
        <h1 className="font-heading text-h2 font-extrabold text-text mb-2">Welcome back</h1>
        <p className="text-body text-text-muted">
          Sign in to continue to your dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {errors.root && (
          <div data-anim className="p-3 rounded-[8px] bg-danger/5 border border-danger/20 text-body-sm text-danger">
            {errors.root.message}
          </div>
        )}

        <div data-anim>
          <label htmlFor="login-email" className="block text-body-sm font-medium text-text mb-1.5">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            autoFocus
            {...register('email')}
            className="w-full px-4 py-3 bg-surface border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            placeholder="you@company.com"
          />
          {errors.email && <p className="mt-1.5 text-caption text-danger">{errors.email.message}</p>}
        </div>

        <div data-anim>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="text-body-sm font-medium text-text">
              Password
            </label>
            <Link to="/forgot-password" className="text-caption font-medium text-primary hover:text-primary-light transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              className="w-full px-4 py-3 pr-11 bg-surface border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-caption text-danger">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          data-anim
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-[10px] font-semibold text-body hover:bg-primary-light hover:shadow-glow-primary transition-all duration-base disabled:opacity-50 cursor-pointer mt-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={18} />
              Sign in
            </>
          )}
        </button>
      </form>

      {/* Google OAuth Divider */}
      <div data-anim className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-caption text-text-muted">or continue with</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Google Sign-In Button */}
      <button
        data-anim
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 bg-surface border border-border py-3 rounded-[10px] font-medium text-body text-text hover:bg-surface-alt hover:border-border-hover transition-all cursor-pointer"
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      </button>

      <p data-anim className="mt-8 text-center text-body-sm text-text-muted">
        Don't have an account?{' '}
        <Link to="/signup" className="font-semibold text-primary hover:text-primary-light transition-colors">
          Create free account
        </Link>
      </p>
    </div>
  );
}
