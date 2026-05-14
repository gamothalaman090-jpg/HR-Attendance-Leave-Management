import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGsap } from '@/hooks/useGsap';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
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
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      navigate('/app');
    } catch (err) {
      setError('root', { message: err.message || 'Invalid credentials' });
    }
  };

  return (
    <div ref={containerRef}>
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
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
            })}
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
              {...register('password', { required: 'Password is required' })}
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

      <p data-anim className="mt-8 text-center text-body-sm text-text-muted">
        Don't have an account?{' '}
        <Link to="/signup" className="font-semibold text-primary hover:text-primary-light transition-colors">
          Create free account
        </Link>
      </p>

      {/* Demo credentials hint */}
      <div data-anim className="mt-6 p-3 rounded-[8px] bg-primary/5 border border-primary/10">
        <p className="text-caption text-primary font-medium text-center">
          Demo: Use any email & password (min 6 chars) to log in
        </p>
      </div>
    </div>
  );
}
