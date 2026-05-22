import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * AuthLayout — Wrapper for the login page.
 * Redirects to /console if already authenticated.
 */
export default function AuthLayout({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-body-sm font-body">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/console" replace />;
  }

  return <>{children}</>;
}
