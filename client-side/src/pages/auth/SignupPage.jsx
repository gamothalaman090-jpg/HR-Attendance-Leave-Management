import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGsap } from '@/hooks/useGsap';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const containerRef = useGsap((gsap, el) => {
    gsap.fromTo(el.querySelectorAll('[data-anim]'), 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out', clearProps: 'all' }
    );
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      await signup({ name: data.name, email: data.email, password: data.password, role: 'HR Manager' });
      navigate('/onboarding');
    } catch (err) {
      setError('root', { message: err.message || 'Signup failed' });
    }
  };

  return (
    <div ref={containerRef}>
      <div data-anim className="mb-8">
        <h1 className="font-heading text-h2 font-extrabold text-text mb-2">Create your account</h1>
        <p className="text-body text-text-muted">Start your 14-day free trial. No credit card required.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {errors.root && (
          <div data-anim className="p-3 rounded-[8px] bg-danger/5 border border-danger/20 text-body-sm text-danger">
            {errors.root.message}
          </div>
        )}

        <div data-anim>
          <label htmlFor="signup-name" className="block text-body-sm font-medium text-text mb-1.5">Full name</label>
          <input
            id="signup-name"
            autoComplete="name"
            autoFocus
            {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
            className="w-full px-4 py-3 bg-surface border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            placeholder="Jane Smith"
          />
          {errors.name && <p className="mt-1.5 text-caption text-danger">{errors.name.message}</p>}
        </div>

        <div data-anim>
          <label htmlFor="signup-email" className="block text-body-sm font-medium text-text mb-1.5">Email address</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
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
          <label htmlFor="signup-password" className="block text-body-sm font-medium text-text mb-1.5">Password</label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
              })}
              className="w-full px-4 py-3 pr-11 bg-surface border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="Min. 8 characters"
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

          {/* Password strength hints */}
          {password && (
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { label: '8+ chars', met: password.length >= 8 },
                { label: 'Uppercase', met: /[A-Z]/.test(password) },
                { label: 'Number', met: /\d/.test(password) },
              ].map(({ label, met }) => (
                <span key={label} className={`text-caption flex items-center gap-1 ${met ? 'text-success' : 'text-text-muted'}`}>
                  <CheckCircle size={12} className={met ? 'text-success' : 'text-text-muted/40'} />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div data-anim>
          <label htmlFor="signup-confirm" className="block text-body-sm font-medium text-text mb-1.5">Confirm password</label>
          <input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (val) => val === password || 'Passwords do not match',
            })}
            className="w-full px-4 py-3 bg-surface border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && <p className="mt-1.5 text-caption text-danger">{errors.confirmPassword.message}</p>}
        </div>

        <button
          data-anim
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-[10px] font-semibold text-body hover:bg-primary-light hover:shadow-glow-primary transition-all duration-base disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus size={18} />
              Create account
            </>
          )}
        </button>

        <p data-anim className="text-caption text-text-muted text-center">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-primary hover:text-primary-light">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-primary hover:text-primary-light">Privacy Policy</a>.
        </p>
      </form>

      <p data-anim className="mt-8 text-center text-body-sm text-text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:text-primary-light transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
