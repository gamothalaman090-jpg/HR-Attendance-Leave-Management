import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * ProtectedRoute — Auth & Role guard wrapper.
 * 
 * 1. Redirects unauthenticated users to /login.
 * 2. Redirects authenticated but unauthorized users to /app (dashboard).
 * 3. Passes through to child routes when authorized.
 * 
 * @param {object} props
 * @param {string[]} [props.allowedRoles] - Optional list of roles permitted for these routes.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth state
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

  // Auth Guard
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role Guard (if allowedRoles is specified)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role?.toLowerCase();
    const isAuthorized = allowedRoles.some(role => {
      const targetRole = role.toLowerCase();
      // Flexible matching: 'hr' matches 'HR Manager'
      if (targetRole === 'hr' && userRole?.includes('hr')) return true;
      return userRole === targetRole;
    });

    if (!isAuthorized) {
      console.warn(`Unauthorized access attempt to ${location.pathname} by role: ${user?.role}`);
      return <Navigate to="/app" replace />;
    }
  }

  return children ? children : <Outlet />;
}
