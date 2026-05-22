import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * ProtectedRoute — Superadmin-only auth guard.
 * 
 * 1. Redirects unauthenticated users to /login.
 * 2. Only allows superadmin role (enforced by AuthContext on login).
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-body-sm font-body">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Double-check superadmin role
  if (user?.role?.toLowerCase() !== 'superadmin') {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}
