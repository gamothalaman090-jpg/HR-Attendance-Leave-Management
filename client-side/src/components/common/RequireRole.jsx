import { useAuth } from '@/context/AuthContext';

/**
 * RequireRole — Fine-grained RBAC component.
 * 
 * Conditionally renders children if the current user has one of the allowed roles.
 * 
 * @param {object} props
 * @param {string[]} props.allowedRoles - List of roles permitted to see the children.
 * @param {React.ReactNode} props.children - The UI to protect.
 * @param {React.ReactNode} [props.fallback=null] - Optional UI to show if unauthorized.
 */
export default function RequireRole({ allowedRoles = [], children, fallback = null }) {
  const { user } = useAuth();

  const userRole = user?.role?.toLowerCase();
  
  // Superadmin has full access override
  const hasAccess = user && (
    userRole === 'superadmin' ||
    allowedRoles.some(role => {
      const targetRole = role.toLowerCase();
      if (targetRole === 'hr' && userRole?.includes('hr')) return true;
      return userRole === targetRole;
    })
  );

  if (!hasAccess) {
    return fallback;
  }

  return children;
}
