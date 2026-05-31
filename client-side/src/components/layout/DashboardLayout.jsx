/**
 * Name: DashboardLayout.jsx
 * PHASE 4 FIXES:
 *
 * *   FIX 1 (CRITICAL): user?.name used on client-side.
 *     Although the backend model stores `fullname`, the client-side `authService`
 *     normalizes `fullname` to `name`. Thus, `user?.name` must be used.
 *
 *   FIX 2 (HIGH): Sidebar roles corrected — ['admin', 'manager', 'hr'] → ['admin']
 *     'manager' and 'hr' don't exist in the backend enum. The fuzzy
 *     .includes() check was masking the bug (a user named "Adrian" would
 *     pass the 'admin' substring check accidentally).
 *
 *   FIX 3 (HIGH): Dead synthetic keyboard event removed.
 *     BEFORE: Search input onClick dispatched a synthetic KeyboardEvent
 *     to open CommandPalette. Synthetic KeyboardEvents don't fire on
 *     document listeners reliably across all browsers.
 *     AFTER: CommandPalette is opened via a shared context/state prop.
 *
 *   FIX 4 (MEDIUM): Sidebar NavLinks now have aria-label when collapsed.
 *     BEFORE: Only `title` was set (tooltip only, no screen reader label).
 *     AFTER: aria-label set when sidebar is collapsed so screen readers
 *     announce the destination correctly.
 *
 *   FIX 5 (MEDIUM): Mobile drawer now has role="dialog" + aria-label.
 *     Without these, VoiceOver/NVDA treat the mobile menu as generic content.
 *
 *   FIX 6 (MEDIUM): Topbar search input now has aria-label.
 *     BEFORE: No label — screen reader announced "edit text" with no context.
 */

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import PageTransition from '@/components/common/PageTransition';
import {
  LayoutDashboard, CalendarOff, Clock, Users, Calendar,
  Settings, Menu, X, ChevronLeft, User,
  BarChart3, Megaphone, Building, DollarSign, FileText,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/helpers';
import { BRAND } from '@/utils/constants';
import NotificationCenter from '@/components/layout/NotificationCenter';
import CommandPalette from '@/components/ui/CommandPalette';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Schema from '@/components/common/Schema';

// ─────────────────────────────────────────────
// FIX 2: roles corrected to use only backend-valid values.
// Removed: 'manager', 'hr' — these don't exist in the User.role enum.
// ─────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { label: 'Dashboard',     href: '/app',              icon: LayoutDashboard },
  { label: 'Announcements', href: '/app/announcements', icon: Megaphone },
  { label: 'Leave',         href: '/app/leave',        icon: CalendarOff },
  { label: 'Attendance',    href: '/app/attendance',   icon: Clock },
  { label: 'Employees',     href: '/app/employees',    icon: Users,       roles: ['admin'] },
  { label: 'Departments',   href: '/app/departments',  icon: Building,    roles: ['admin'] },
  { label: 'Payroll',       href: '/app/payroll',      icon: DollarSign,  roles: ['admin'] },
  { label: 'Payslips',      href: '/app/payslips',     icon: FileText },
  { label: 'Calendar',      href: '/app/calendar',     icon: Calendar },
  { label: 'Reports',       href: '/app/reports',      icon: BarChart3,   roles: ['admin'] },
  { label: 'Settings',      href: '/app/settings',     icon: Settings },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen]               = useState(false);
  const { user }      = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  // ─────────────────────────────────────────────
  // FIX 2: Exact role match instead of fuzzy .includes()
  // ─────────────────────────────────────────────
  const visibleSidebarItems = SIDEBAR_ITEMS.filter(item => {
    if (!item.roles) return true;
    const userRole = user?.role?.toLowerCase();
    if (userRole === 'superadmin') return true;
    return item.roles.includes(userRole); // WAS: item.roles.some(r => userRole?.includes(r))
  });

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // ─────────────────────────────────────────────
  // FIX 3: CommandPalette opened via keyboard shortcut + state
  // instead of dispatching synthetic KeyboardEvents (unreliable cross-browser)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  const getAvatarUrl = (profilePicture) => {
    if (!profilePicture) return null;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return profilePicture.startsWith('http') ? profilePicture : `${base}/${profilePicture}`;
  };

  return (
    <div className="min-h-screen flex bg-bg transition-colors duration-base">
      <Schema />

      {/* ── Desktop Sidebar ────────────────────────────────── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-surface transition-all duration-base ease-smooth fixed left-0 top-0 h-screen overflow-y-auto shrink-0 z-30',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <img
            src={BRAND.logo}
            alt={BRAND.name}
            className={cn('object-contain transition-all duration-base', sidebarOpen ? 'h-10 w-auto' : 'h-8 w-auto')}
          />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-[8px] hover:bg-surface-alt transition-colors text-text-muted hover:text-text"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarOpen}
          >
            <ChevronLeft
              size={20}
              className={cn('transition-transform duration-base', !sidebarOpen && 'rotate-180')}
            />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1" aria-label="Sidebar">
          {visibleSidebarItems.map(({ label, href, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              end={href === '/app'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-body-sm font-medium transition-all duration-fast cursor-pointer',
                  isActive
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-text-muted hover:bg-surface-alt hover:text-text'
                )
              }
              // FIX 4: aria-label instead of title — title is tooltip-only, not screen reader accessible
              aria-label={!sidebarOpen ? label : undefined}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={20} className="shrink-0" aria-hidden="true" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Mobile Sidebar Overlay ─────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[1500]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          {/* FIX 5: role="dialog" + aria-label + aria-modal for screen readers */}
          <aside
            className="absolute left-0 top-0 h-full w-72 bg-surface border-r border-border flex flex-col shadow-elevated animate-in slide-in-from-left duration-300 ease-out"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              <img src={BRAND.logo} alt={BRAND.name} className="h-10 w-auto object-contain" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-[8px] hover:bg-surface-alt text-text-muted"
                aria-label="Close navigation menu"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1" aria-label="Mobile navigation">
              {visibleSidebarItems.map(({ label, href, icon: Icon }) => (
                <NavLink
                  key={href}
                  to={href}
                  end={href === '/app'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-body-sm font-medium transition-colors cursor-pointer',
                      isActive ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-alt hover:text-text'
                    )
                  }
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ── Main Content Area ───────────────────────────────── */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-base ease-smooth',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        )}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-sticky h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-surface/80 backdrop-blur-md">
          <button
            className="lg:hidden p-2 rounded-[8px] hover:bg-surface-alt text-text-muted cursor-pointer"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          {/* ─────────────────────────────────────────────
            FIX 3: Search bar opens CommandPalette via state, not
            synthetic KeyboardEvent dispatch which is unreliable.
            FIX: Added aria-label for screen readers.
          ───────────────────────────────────────────── */}
          <div className="hidden sm:block flex-1 max-w-md mx-4">
            <button
              onClick={() => setCmdOpen(true)}
              className="w-full flex items-center justify-between pl-4 pr-3 py-2 bg-surface-alt border border-border rounded-[8px] text-body-sm text-text-muted hover:bg-surface-alt/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              aria-label="Open command palette (Ctrl+K)"
            >
              <span>Search...</span>
              <div className="flex gap-1 shrink-0">
                <kbd className="px-1.5 py-0.5 bg-surface rounded-[4px] border border-border text-[10px] font-medium text-text-muted uppercase">Ctrl</kbd>
                <kbd className="px-1.5 py-0.5 bg-surface rounded-[4px] border border-border text-[10px] font-medium text-text-muted uppercase">K</kbd>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-[8px] hover:bg-surface-alt text-text-muted hover:text-text transition-colors cursor-pointer"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <NotificationCenter />

            {/* FIX: user?.name contains the user's name on the client side (mapped from fullname in authService) */}
            <Link
              to="/app/profile"
              className="flex items-center gap-2 p-1.5 rounded-[10px] hover:bg-surface-alt transition-colors cursor-pointer"
              aria-label={`Go to profile — ${user?.name || 'User'}`}
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-body-sm font-bold overflow-hidden" aria-hidden="true">
                {user?.profilePicture ? (
                  <img
                    src={getAvatarUrl(user.profilePicture)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0) || <User size={16} />
                )}
              </div>
              <span className="hidden sm:block text-body-sm font-medium text-text">
                {user?.name || 'User'}
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6" id="main-content">
          <Breadcrumbs />
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
