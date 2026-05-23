import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { useGsap } from '@/hooks/useGsap';
import authService from '@/services/authService';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const containerRef = useGsap((gsap, el) => {
    gsap.from(el.querySelectorAll('[data-anim]'), {
      y: 20, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out',
    });
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm();

  const onSubmit = async (data) => {
    try {
      await authService.forgotPassword(data.email);
      setSubmitted(true);
    } catch (err) {
      setError('root', { message: err.message || 'Failed to send reset link' });
    }
  };

  return (
    <div ref={containerRef}>
      {submitted ? (
        <div className="text-center">
          <div data-anim className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h1 data-anim className="font-heading text-h2 font-extrabold text-text mb-3">Check your email</h1>
          <p data-anim className="text-body text-text-muted mb-8">
            We've sent a password reset link to your email address.
            Check your inbox and follow the instructions.
          </p>
          <Link
            data-anim
            to="/login"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary-light transition-colors"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>
      ) : (
        <>
          <div data-anim className="mb-8">
            <h1 className="font-heading text-h2 font-extrabold text-text mb-2">Reset password</h1>
            <p className="text-body text-text-muted">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {errors.root && (
              <div data-anim className="p-3 rounded-[8px] bg-danger/5 border border-danger/20 text-body-sm text-danger">
                {errors.root.message}
              </div>
            )}

            <div data-anim>
              <label htmlFor="forgot-email" className="block text-body-sm font-medium text-text mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
                  })}
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="you@company.com"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-caption text-danger">{errors.email.message}</p>}
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
                'Send reset link'
              )}
            </button>
          </form>

          <p data-anim className="mt-8 text-center text-body-sm text-text-muted">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary-light transition-colors">
              Sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
