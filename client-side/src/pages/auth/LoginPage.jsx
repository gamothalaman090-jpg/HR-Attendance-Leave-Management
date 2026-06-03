import { useState, useEffect, useRef } from 'react';
import Meta from '@/components/common/Meta';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useGsap } from '@/hooks/useGsap';

export default function LoginPage() {
  const [googleError, setGoogleError] = useState('');
  const { googleLogin } = useAuth();
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

  // Initialize Google Sign-In button
  useEffect(() => {
    const initGoogleSignIn = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;

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
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: googleBtnRef.current.offsetWidth || 400,
      });
    };

    // GIS script may still be loading (async defer)
    if (window.google?.accounts?.id) {
      initGoogleSignIn();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogleSignIn();
        }
      }, 100);
      // Stop checking after 5 seconds
      setTimeout(() => clearInterval(interval), 5000);
      return () => clearInterval(interval);
    }
  }, [googleLogin, navigate]);

  return (
    <div ref={containerRef}>
      <Meta title="Login" />
      <div data-anim className="mb-8">
        <h1 className="font-heading text-h2 font-extrabold text-text mb-2">Welcome back</h1>
        <p className="text-body text-text-muted">
          Sign in with your Google account to continue
        </p>
      </div>

      {/* Google Sign-In Error */}
      {googleError && (
        <div data-anim className="mb-5 p-3 rounded-[8px] bg-danger/5 border border-danger/20 text-body-sm text-danger">
          {googleError}
        </div>
      )}

      {/* Google Sign-In Button (rendered by Google Identity Services) */}
      <div data-anim className="flex justify-center">
        <div ref={googleBtnRef} className="w-full" />
      </div>

      <p data-anim className="mt-8 text-center text-body-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-semibold text-primary hover:text-primary-light transition-colors">
          Sign up with Google
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
