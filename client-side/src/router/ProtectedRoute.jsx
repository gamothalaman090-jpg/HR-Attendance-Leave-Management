/**
 * Name: ProtectedRoute.jsx
 * PHASE 1 FIX: Role mismatch between frontend guard and backend enum.
 *
 * BEFORE (broken):
 *   allowedRoles={['admin', 'manager', 'hr']}
 *   Backend enum: ['user', 'admin', 'superadmin']
 *   → 'manager' and 'hr' roles DO NOT EXIST in the backend.
 *   → Any user with role='user' gets bounced back to /app even with a valid 'admin' role guard.
 *
 * AFTER (fixed):
 *   All allowedRoles now use only backend-defined values: 'user', 'admin', 'superadmin'
 *   The fuzzy 'hr' / 'manager' matching logic is removed — it was masking the bug.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * ProtectedRoute — Auth & Role guard wrapper.
 *
 * @param {string[]} [allowedRoles] - Roles from backend enum: 'user' | 'admin' | 'superadmin'
 * @param {ReactNode} [children]    - Optional children (use Outlet if not provided)
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-body-sm font-body">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Auth Guard
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Onboarding Guard
  const isOnboardingPath = location.pathname === '/onboarding';
  if (!user?.onboarded && !isOnboardingPath) {
    return <Navigate to="/onboarding" replace />;
  }
  if (user?.onboarded && isOnboardingPath) {
    return <Navigate to="/app" replace />;
  }

  // ─────────────────────────────────────────────
  // FIX: Role Guard — strict exact match only.
  //
  // REMOVED: Fuzzy 'hr' substring matching logic.
  //   if (targetRole === 'hr' && userRole?.includes('hr')) return true;
  //   → This was trying to work around the fact that 'hr' isn't a valid role.
  //   → The real fix is to use the correct backend roles everywhere.
  //
  // Backend roles are: 'user', 'admin', 'superadmin'
  // ─────────────────────────────────────────────
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role?.toLowerCase();
    const isAuthorized = allowedRoles.map(r => r.toLowerCase()).includes(userRole);

    if (!isAuthorized) {
      // Don't log to console in production (leaks role info)
      if (import.meta.env.DEV) {
        console.warn(`Access denied to ${location.pathname} for role: ${user?.role}`);
      }
      return <Navigate to="/app" replace />;
    }
  }

  return children ? children : <Outlet />;
}
