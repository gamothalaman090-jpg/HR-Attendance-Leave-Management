import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import Meta from '@/components/common/Meta';
import { useAuth } from '@/context/AuthContext';
import { useGsap } from '@/hooks/useGsap';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

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
    defaultValues: {
      email: '',
      password: '',
    }
  });

  // Handle local login submission
  const onSubmit = async (data) => {
    try {
      setGoogleError('');
      const user = await login(data);
      if (user?.onboarded) {
        navigate('/app');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setError('root', { message: err.message || 'Invalid email or password' });
    }
  };

  // Initialize Google Sign-In button
  useEffect(() => {
    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;

      // Clear previous container contents before rendering
      googleBtnRef.current.innerHTML = '';

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            setGoogleError('');
            const result = await googleLogin({ credential: response.credential });

            if (result.isNewUser) {
              // New user — redirect to signup with Google profile + credential
              navigate('/signup', {
                state: {
                  googleProfile: result.googleProfile,
                  credential: response.credential,
                },
              });
            } else {
              // Existing user — check onboarding status
              const user = result.user;
              if (user?.onboarded) {
                navigate('/app');
              } else {
                navigate('/onboarding');
              }
            }
          } catch (err) {
            setGoogleError(err.message || 'Google sign-in failed');
          }
        },
        ux_mode: 'popup',
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 320,
      });
    };

    // GIS script may still be loading (async defer)
    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          renderGoogleButton();
        }
      }, 100);
      
      // Stop checking after 5 seconds
      setTimeout(() => clearInterval(interval), 5000);
      return () => clearInterval(interval);
    }
  }, [googleLogin, navigate]);

  return (
    <div ref={containerRef} className="space-y-6">
      <Meta title="Login" />
      <div data-anim className="mb-6">
        <h1 className="font-heading text-h2 font-extrabold text-text mb-2">Welcome back</h1>
        <p className="text-body text-text-muted">
          Sign in to your HR workspace account
        </p>
      </div>

      {/* Global Google Error */}
      {googleError && (
        <div data-anim className="p-3.5 rounded-[8px] bg-danger/5 border border-danger/20 text-body-sm text-danger animate-fadeIn">
          {googleError}
        </div>
      )}

      {/* Local Auth Error */}
      {errors.root && (
        <div data-anim className="p-3.5 rounded-[8px] bg-danger/5 border border-danger/20 text-body-sm text-danger animate-fadeIn">
          {errors.root.message}
        </div>
      )}

      {/* Local Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div data-anim>
          <label htmlFor="login-email" className="block text-body-sm font-medium text-text mb-1.5">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            className="w-full px-4 py-3 bg-surface border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            placeholder="you@company.com"
          />
          {errors.email && <p className="mt-1.5 text-caption text-danger">{errors.email.message}</p>}
        </div>

        <div data-anim>
          <label htmlFor="login-password" className="block text-body-sm font-medium text-text mb-1.5">
            Password
          </label>
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
          data-anim
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 flex items-center justify-center gap-2 bg-primary text-white rounded-[8px] font-semibold text-body-sm hover:bg-primary-light hover:shadow-glow-primary transition-all duration-base disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={16} />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div data-anim className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/80"></div>
        </div>
        <div className="relative flex justify-center text-caption uppercase">
          <span className="bg-bg px-3 text-text-muted">Or continue with</span>
        </div>
      </div>

      {/* Custom Google Sign-In Button with invisible real Google button on top */}
      <div data-anim className="w-full">
        <div className="relative w-full h-10 rounded-[8px] border border-border bg-surface hover:bg-muted/10 hover:border-primary/50 transition-all duration-base flex items-center justify-center gap-2.5 cursor-pointer">
          {/* Visual layer — what the user sees */}
          <svg className="w-4.5 h-4.5 shrink-0 pointer-events-none" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.336 0 3.327 2.682 1.386 6.618L5.266 9.765z" />
            <path fill="#34A853" d="M16.04 15.345c-1.073.727-2.436 1.164-4.04 1.164-2.855 0-5.273-1.927-6.136-4.527L1.964 15.11C3.964 19.09 8.09 21.818 12 21.818c3.082 0 5.864-1.027 7.918-2.818l-3.877-3.655z" />
            <path fill="#4285F4" d="M23.49 12.273c0-.818-.082-1.609-.218-2.364H12v4.51h6.473c-.29 1.482-1.127 2.736-2.382 3.564l3.877 3.655c2.264-2.09 3.523-5.182 3.523-9.364z" />
            <path fill="#FBBC05" d="M5.864 12c0-.573.09-1.127.264-1.655L2.25 7.218A11.964 11.964 0 0 0 1.09 12c0 1.69.355 3.3 1.018 4.782l3.882-3.127A7.009 7.009 0 0 1 5.864 12z" />
          </svg>
          <span className="text-body-sm font-semibold text-text pointer-events-none">Sign in with Google</span>
          {/* Invisible click layer — real Google button rendered here */}
          <div
            ref={googleBtnRef}
            className="absolute inset-0 z-30 overflow-hidden cursor-pointer"
            style={{ opacity: 0.001 }}
          />
        </div>
      </div>

      <p data-anim className="mt-8 text-center text-body-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-semibold text-primary hover:text-primary-light transition-colors">
          Sign up
        </Link>
      </p>

      <p data-anim className="mt-3 text-center text-body-sm text-text-muted">
        <Link to="/forgot-password" className="font-medium text-primary hover:text-primary-light transition-colors">
          Forgot your password?
        </Link>
      </p>
    </div>
  );
}
