import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, CheckCircle, Info } from 'lucide-react';
import Meta from '@/components/common/Meta';
import { useAuth } from '@/context/AuthContext';
import { useGsap } from '@/hooks/useGsap';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [googleProfile, setGoogleProfile] = useState(null);
  const [credential, setCredential] = useState('');
  const [googleError, setGoogleError] = useState('');
  const { register: localRegister, googleLogin, googleCompleteSignup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleBtnRef = useRef(null);

  const containerRef = useGsap((gsap, el) => {
    gsap.fromTo(el.querySelectorAll('[data-anim]'), 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out', clearProps: 'all' }
    );
  });

  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm({
    defaultValues: {
      fullname: '',
      email: '',
      company: '',
      password: '',
      confirmPassword: '',
    }
  });

  const password = watch('password');

  // Load Google profile from router navigation state (if redirected from login)
  useEffect(() => {
    if (location.state?.googleProfile && location.state?.credential) {
      setGoogleProfile(location.state.googleProfile);
      setCredential(location.state.credential);
      // Pre-fill company name suggestions if available
      setValue('company', `${location.state.googleProfile.name}'s Org`);
    }
  }, [location.state, setValue]);

  // Initialize Google Sign-Up button
  useEffect(() => {
    if (googleProfile) return;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;

      googleBtnRef.current.innerHTML = '';

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            setGoogleError('');
            const result = await googleLogin({ credential: response.credential });

            if (result.isNewUser) {
              setGoogleProfile(result.googleProfile);
              setCredential(response.credential);
              setValue('company', `${result.googleProfile.name}'s Org`);
            } else {
              // Existing user — navigate directly
              if (result.user?.onboarded) {
                navigate('/app');
              } else {
                navigate('/onboarding');
              }
            }
          } catch (err) {
            setGoogleError(err.message || 'Google verification failed');
          }
        },
        ux_mode: 'popup',
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'signup_with',
        shape: 'rectangular',
        width: 320,
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          renderGoogleButton();
        }
      }, 100);
      setTimeout(() => clearInterval(interval), 5000);
      return () => clearInterval(interval);
    }
  }, [googleProfile, googleLogin, navigate, setValue]);

  const onSubmit = async (data) => {
    try {
      setGoogleError('');
      if (googleProfile) {
        // Complete Google signup
        if (!credential) {
          setError('root', { message: 'Google authentication required. Please sign in with Google first.' });
          return;
        }

        await googleCompleteSignup({
          credential,
          company: data.company,
          password: data.password,
        });
      } else {
        // Local signup
        await localRegister({
          fullname: data.fullname,
          email: data.email,
          company: data.company,
          password: data.password,
        });
      }
      navigate('/onboarding');
    } catch (err) {
      setError('root', { message: err.message || 'Signup failed' });
    }
  };

  return (
    <div ref={containerRef} className="space-y-6">
      <Meta title="Sign Up" />
      <div data-anim className="mb-6">
        <h1 className="font-heading text-h2 font-extrabold text-text mb-2">Create your account</h1>
        <p className="text-body text-text-muted">
          {googleProfile 
            ? 'Complete your profile information below'
            : 'Sign up to set up your HR workspace'}
        </p>
      </div>

      {googleError && (
        <div data-anim className="p-3.5 rounded-[8px] bg-danger/5 border border-danger/20 text-body-sm text-danger animate-fadeIn">
          {googleError}
        </div>
      )}

      {errors.root && (
        <div data-anim className="p-3.5 rounded-[8px] bg-danger/5 border border-danger/20 text-body-sm text-danger animate-fadeIn">
          {errors.root.message}
        </div>
      )}

      {googleProfile ? (
        // Step 2 (Google Auth Complete): Show only Company and Optional Password
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Google Profile Display */}
          <div data-anim className="flex items-center gap-3.5 p-3.5 rounded-[12px] bg-surface-variant/40 border border-border/60">
            {googleProfile.picture && (
              <img 
                src={googleProfile.picture} 
                alt={googleProfile.name} 
                className="w-10 h-10 rounded-full border border-border/80"
              />
            )}
            <div>
              <p className="text-body-sm font-semibold text-text">{googleProfile.name}</p>
              <p className="text-caption text-text-muted">{googleProfile.email}</p>
            </div>
          </div>

          <div data-anim>
            <label htmlFor="signup-company" className="block text-body-sm font-medium text-text mb-1.5">Company name</label>
            <input
              id="signup-company"
              autoFocus
              {...registerField('company', { required: 'Company name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
              className="w-full px-4 py-3 bg-surface border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="e.g. Acme Corp"
            />
            {errors.company && <p className="mt-1.5 text-caption text-danger">{errors.company.message}</p>}
          </div>

          <div data-anim>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="signup-password" className="block text-body-sm font-medium text-text">
                Password <span className="text-text-muted/60 font-normal">(optional)</span>
              </label>
              <span className="text-caption text-text-muted flex items-center gap-1 font-normal">
                <Info size={13} className="text-primary/70" />
                Default is WelcomeNini123!
              </span>
            </div>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...registerField('password', {
                  minLength: { value: 8, message: 'At least 8 characters' },
                })}
                className="w-full px-4 py-3 pr-11 bg-surface border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Leave blank for default password"
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

            {password && (
              <div className="mt-2 flex flex-wrap gap-2 animate-fadeIn">
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

          {password && (
            <div data-anim className="animate-slideDown">
              <label htmlFor="signup-confirm" className="block text-body-sm font-medium text-text mb-1.5">Confirm password</label>
              <input
                id="signup-confirm"
                type="password"
                autoComplete="new-password"
                {...registerField('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) => val === password || 'Passwords do not match',
                })}
                className="w-full px-4 py-3 bg-surface border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Confirm your custom password"
              />
              {errors.confirmPassword && <p className="mt-1.5 text-caption text-danger">{errors.confirmPassword.message}</p>}
            </div>
          )}

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
                Complete Registration
              </>
            )}
          </button>
        </form>
      ) : (
        // Standard Local Signup (with Google Sign-Up button below)
        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div data-anim>
              <label htmlFor="signup-fullname" className="block text-body-sm font-medium text-text mb-1.5">Full name</label>
              <input
                id="signup-fullname"
                type="text"
                autoFocus
                {...registerField('fullname', { 
                  required: 'Full name is required', 
                  minLength: { value: 2, message: 'At least 2 characters' } 
                })}
                className="w-full px-4 py-3 bg-surface border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="John Doe"
              />
              {errors.fullname && <p className="mt-1.5 text-caption text-danger">{errors.fullname.message}</p>}
            </div>

            <div data-anim>
              <label htmlFor="signup-email" className="block text-body-sm font-medium text-text mb-1.5">Email address</label>
              <input
                id="signup-email"
                type="email"
                {...registerField('email', { 
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
              <label htmlFor="signup-company" className="block text-body-sm font-medium text-text mb-1.5">Company name</label>
              <input
                id="signup-company"
                {...registerField('company', { 
                  required: 'Company name is required', 
                  minLength: { value: 2, message: 'At least 2 characters' } 
                })}
                className="w-full px-4 py-3 bg-surface border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Acme Corp"
              />
              {errors.company && <p className="mt-1.5 text-caption text-danger">{errors.company.message}</p>}
            </div>

            <div data-anim>
              <label htmlFor="signup-password" className="block text-body-sm font-medium text-text mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...registerField('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                  className="w-full px-4 py-3 pr-11 bg-surface border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="At least 8 characters"
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

              {password && (
                <div className="mt-2 flex flex-wrap gap-2 animate-fadeIn">
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

            {password && (
              <div data-anim className="animate-slideDown">
                <label htmlFor="signup-confirm" className="block text-body-sm font-medium text-text mb-1.5">Confirm password</label>
                <input
                  id="signup-confirm"
                  type="password"
                  autoComplete="new-password"
                  {...registerField('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (val) => val === password || 'Passwords do not match',
                  })}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <p className="mt-1.5 text-caption text-danger">{errors.confirmPassword.message}</p>}
              </div>
            )}

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
                  <UserPlus size={16} />
                  <span>Sign Up</span>
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

          {/* Custom Google Sign-Up Button with invisible real Google button on top */}
          <div data-anim className="w-full">
            <div className="relative w-full h-10 rounded-[8px] border border-border bg-surface hover:bg-muted/10 hover:border-primary/50 transition-all duration-base flex items-center justify-center gap-2.5 cursor-pointer">
              {/* Visual layer */}
              <svg className="w-4.5 h-4.5 shrink-0 pointer-events-none" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.336 0 3.327 2.682 1.386 6.618L5.266 9.765z" />
                <path fill="#34A853" d="M16.04 15.345c-1.073.727-2.436 1.164-4.04 1.164-2.855 0-5.273-1.927-6.136-4.527L1.964 15.11C3.964 19.09 8.09 21.818 12 21.818c3.082 0 5.864-1.027 7.918-2.818l-3.877-3.655z" />
                <path fill="#4285F4" d="M23.49 12.273c0-.818-.082-1.609-.218-2.364H12v4.51h6.473c-.29 1.482-1.127 2.736-2.382 3.564l3.877 3.655c2.264-2.09 3.523-5.182 3.523-9.364z" />
                <path fill="#FBBC05" d="M5.864 12c0-.573.09-1.127.264-1.655L2.25 7.218A11.964 11.964 0 0 0 1.09 12c0 1.69.355 3.3 1.018 4.782l3.882-3.127A7.009 7.009 0 0 1 5.864 12z" />
              </svg>
              <span className="text-body-sm font-semibold text-text pointer-events-none">Sign up with Google</span>
              {/* Invisible click layer */}
              <div
                ref={googleBtnRef}
                className="absolute inset-0 z-30 overflow-hidden cursor-pointer"
                style={{ opacity: 0.001 }}
              />
            </div>
          </div>

          <p data-anim className="text-caption text-text-muted text-center leading-relaxed">
            By creating an account, you agree to our{' '}
            <Link to="/terms-of-service" className="text-primary hover:text-primary-light">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy-policy" className="text-primary hover:text-primary-light">Privacy Policy</Link>.
          </p>
        </div>
      )}

      <p data-anim className="mt-8 text-center text-body-sm text-text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:text-primary-light transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
