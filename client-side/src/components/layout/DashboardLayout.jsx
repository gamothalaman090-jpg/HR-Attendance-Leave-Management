import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import PageTransition from '@/components/common/PageTransition';
import {
  LayoutDashboard,
  CalendarOff,
  Clock,
  Users,
  Calendar,
  Settings,
  Menu,
  X,
  ChevronLeft,
  User,
  BarChart3,
  Megaphone,
  Building,
  DollarSign,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/helpers';
import { BRAND } from '@/utils/constants';
import NotificationCenter from '@/components/layout/NotificationCenter';
import CommandPalette from '@/components/ui/CommandPalette';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Schema from '@/components/common/Schema';

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { label: 'Announcements', href: '/app/announcements', icon: Megaphone },
  { label: 'Leave', href: '/app/leave', icon: CalendarOff },
  { label: 'Attendance', href: '/app/attendance', icon: Clock },
  { label: 'Employees', href: '/app/employees', icon: Users, roles: ['admin', 'manager', 'hr'] },
  { label: 'Departments', href: '/app/departments', icon: Building, roles: ['admin', 'manager', 'hr'] },
  { label: 'Payroll', href: '/app/payroll', icon: DollarSign, roles: ['admin', 'manager', 'hr'] },
  { label: 'Payslips', href: '/app/payslips', icon: FileText },
  { label: 'Calendar', href: '/app/calendar', icon: Calendar },
  { label: 'Reports', href: '/app/reports', icon: BarChart3, roles: ['admin', 'manager', 'hr'] },
  { label: 'Settings', href: '/app/settings', icon: Settings },
];

/**
 * DashboardLayout — Sidebar + topbar + content for authenticated app pages.
 */
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const visibleSidebarItems = SIDEBAR_ITEMS.filter(item => {
    if (!item.roles) return true;
    const userRole = user?.role?.toLowerCase();
    if (userRole === 'superadmin') return true;
    return item.roles.some(r => userRole?.includes(r));
  });

  // Close mobile menu on route change
  const location = useLocation();
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const getAvatarUrl = (profilePicture) => {
    if (!profilePicture) return null;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return profilePicture.startsWith('http') ? profilePicture : `${base}/${profilePicture}`;
  };
  return (
    <div className="min-h-screen flex bg-bg transition-colors duration-base">
      <Schema />
      {/* ── Desktop Sidebar ── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-surface transition-all duration-base ease-smooth fixed left-0 top-0 h-screen overflow-y-auto shrink-0 z-30',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center">
            <img
              src={BRAND.logo}
              alt={BRAND.name}
              className={cn(
                "object-contain transition-all duration-base",
                sidebarOpen ? "h-10 w-auto" : "h-8 w-auto"
              )}
            />
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-[8px] hover:bg-surface-alt transition-colors text-text-muted hover:text-text"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              size={20}
              className={cn('transition-transform duration-base', !sidebarOpen && 'rotate-180')}
            />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1">
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
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={20} className="shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[1500]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-72 bg-surface border-r border-border flex flex-col shadow-elevated animate-in slide-in-from-left duration-300 ease-out">
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              <div className="flex items-center">
                <img src={BRAND.logo} alt={BRAND.name} className="h-10 w-auto object-contain" />
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-[8px] hover:bg-surface-alt text-text-muted"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1">
              {visibleSidebarItems.map(({ label, href, icon: Icon }) => (
                <NavLink
                  key={href}
                  to={href}
                  end={href === '/app'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-body-sm font-medium transition-colors cursor-pointer',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-text-muted hover:bg-surface-alt hover:text-text'
                    )
                  }
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-base ease-smooth',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        )}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-sticky h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-surface/80 backdrop-blur-md">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-[8px] hover:bg-surface-alt text-text-muted cursor-pointer"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Search placeholder */}
          <div className="hidden sm:block flex-1 max-w-md mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search... (Ctrl+K)"
                readOnly
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' }))}
                className="w-full pl-4 pr-4 py-2 bg-surface-alt border border-border rounded-[8px] text-body-sm text-text placeholder:text-text-muted hover:bg-surface-alt/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                <kbd className="px-1.5 py-0.5 bg-surface rounded-[4px] border border-border text-[10px] font-medium text-text-muted uppercase">Ctrl</kbd>
                <kbd className="px-1.5 py-0.5 bg-surface rounded-[4px] border border-border text-[10px] font-medium text-text-muted uppercase">K</kbd>
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-[8px] hover:bg-surface-alt text-text-muted hover:text-text transition-colors cursor-pointer"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Notifications */}
            <NotificationCenter />

            {/* User avatar */}
            <Link
              to="/app/profile"
              className="flex items-center gap-2 p-1.5 rounded-[10px] hover:bg-surface-alt transition-colors cursor-pointer"
              aria-label="Profile"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-body-sm font-bold overflow-hidden">
                {user?.profilePicture ? (
                  <img
                    src={getAvatarUrl(user.profilePicture)}
                    alt={user.name}
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

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          <Breadcrumbs />
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
}
