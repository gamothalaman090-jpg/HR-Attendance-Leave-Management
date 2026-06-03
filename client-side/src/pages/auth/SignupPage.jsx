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
  const { googleLogin, googleCompleteSignup } = useAuth();
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
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm({
    defaultValues: {
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

  // If no Google profile in state, initialize Google Sign-In button on this page
  useEffect(() => {
    if (googleProfile) return;

    const initGoogleSignUp = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;

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
        theme: 'outline',
        size: 'large',
        text: 'signup_with',
        shape: 'pill',
        width: googleBtnRef.current.offsetWidth || 400,
      });
    };

    if (window.google?.accounts?.id) {
      initGoogleSignUp();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogleSignUp();
        }
      }, 100);
      setTimeout(() => clearInterval(interval), 5000);
      return () => clearInterval(interval);
    }
  }, [googleProfile, googleLogin, navigate, setValue]);

  const onSubmit = async (data) => {
    try {
      if (!credential) {
        setError('root', { message: 'Google authentication required. Please sign in with Google first.' });
        return;
      }

      await googleCompleteSignup({
        credential,
        company: data.company,
        password: data.password,
      });
      navigate('/onboarding');
    } catch (err) {
      setError('root', { message: err.message || 'Signup completion failed' });
    }
  };

  return (
    <div ref={containerRef}>
      <Meta title="Sign Up" />
      <div data-anim className="mb-8">
        <h1 className="font-heading text-h2 font-extrabold text-text mb-2">Create your account</h1>
        <p className="text-body text-text-muted">
          {!googleProfile 
            ? 'Sign up with Google to set up your workspace' 
            : 'Complete your profile information below'}
        </p>
      </div>

      {googleError && (
        <div data-anim className="mb-5 p-3 rounded-[8px] bg-danger/5 border border-danger/20 text-body-sm text-danger">
          {googleError}
        </div>
      )}

      {!googleProfile ? (
        // Step 1: Click Google Sign-Up button
        <div className="space-y-6">
          <div data-anim className="flex justify-center">
            <div ref={googleBtnRef} className="w-full" />
          </div>
          
          <p data-anim className="text-caption text-text-muted text-center leading-relaxed">
            By creating an account, you agree to our{' '}
            <Link to="/terms-of-service" className="text-primary hover:text-primary-light">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy-policy" className="text-primary hover:text-primary-light">Privacy Policy</Link>.
          </p>
        </div>
      ) : (
        // Step 2: Complete profile with company & optional password
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {errors.root && (
            <div data-anim className="p-3 rounded-[8px] bg-danger/5 border border-danger/20 text-body-sm text-danger">
              {errors.root.message}
            </div>
          )}

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

          <div data-anim className="pt-1">
            <label htmlFor="signup-company" className="block text-body-sm font-medium text-text mb-1.5">Company name</label>
            <input
              id="signup-company"
              autoFocus
              {...register('company', { required: 'Company name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
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
                {...register('password', {
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

            {/* Password strength hints */}
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
                {...register('confirmPassword', {
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

          <p data-anim className="text-caption text-text-muted text-center leading-relaxed">
            By registering, you agree to our{' '}
            <Link to="/terms-of-service" className="text-primary hover:text-primary-light">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy-policy" className="text-primary hover:text-primary-light">Privacy Policy</Link>.
          </p>
        </form>
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
