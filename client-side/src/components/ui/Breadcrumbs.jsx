import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeMap = {
  app: 'Dashboard',
  leave: 'Leave Requests',
  attendance: 'Attendance',
  employees: 'Employees',
  reports: 'Reports & Analytics',
  settings: 'Settings',
  profile: 'My Profile',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // If we're at the root of the app, don't show much or show Dashboard
  if (pathnames.length <= 1 && pathnames[0] === 'app') return null;

  return (
    <nav className="flex items-center space-x-2 text-caption font-medium mb-6" aria-label="Breadcrumb">
      <Link 
        to="/app" 
        className="flex items-center text-text-muted hover:text-primary transition-colors"
      >
        <Home size={14} className="mr-1" />
        <span>Dashboard</span>
      </Link>

      {pathnames.map((value, index) => {
        // Skip 'app' as we already have 'Dashboard'
        if (value === 'app') return null;

        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const label = routeMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

        return (
          <div key={to} className="flex items-center">
            <ChevronRight size={14} className="text-text-muted mx-1 shrink-0" />
            {last ? (
              <span className="text-text font-semibold">{label}</span>
            ) : (
              <Link 
                to={to} 
                className="text-text-muted hover:text-primary transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
