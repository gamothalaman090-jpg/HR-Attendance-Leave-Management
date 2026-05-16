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

  const hasAccess = user && allowedRoles.includes(user.role);

  if (!hasAccess) {
    return fallback;
  }

  return children;
}
