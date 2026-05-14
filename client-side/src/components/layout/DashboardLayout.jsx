import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarOff,
  Clock,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Bell,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/helpers';

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { label: 'Leave', href: '/app/leave', icon: CalendarOff },
  { label: 'Attendance', href: '/app/attendance', icon: Clock },
  { label: 'Employees', href: '/app/employees', icon: Users },
  { label: 'Calendar', href: '/app/calendar', icon: Calendar },
  { label: 'Settings', href: '/app/settings', icon: Settings },
];

/**
 * DashboardLayout — Sidebar + topbar + content for authenticated app pages.
 */
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-bg transition-colors duration-base">
      {/* ── Desktop Sidebar ── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-surface transition-all duration-base ease-smooth',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          {sidebarOpen && (
            <span className="font-heading text-h4 font-extrabold gradient-text">
              Nini
            </span>
          )}
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
          {SIDEBAR_ITEMS.map(({ label, href, icon: Icon }) => (
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

        {/* Bottom section */}
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-body-sm font-medium text-danger hover:bg-danger/10 transition-colors cursor-pointer"
          >
            <LogOut size={20} className="shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-overlay">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-72 bg-surface border-r border-border flex flex-col">
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              <span className="font-heading text-h4 font-extrabold gradient-text">Nini</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-[8px] hover:bg-surface-alt text-text-muted"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1">
              {SIDEBAR_ITEMS.map(({ label, href, icon: Icon }) => (
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
            <div className="p-3 border-t border-border">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-body-sm font-medium text-danger hover:bg-danger/10 transition-colors cursor-pointer"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
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
                placeholder="Search..."
                className="w-full pl-4 pr-4 py-2 bg-surface-alt border border-border rounded-[8px] text-body-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
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
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-[8px] hover:bg-surface-alt text-text-muted hover:text-text transition-colors cursor-pointer" aria-label="Notifications">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
            </button>

            {/* User avatar */}
            <button className="flex items-center gap-2 p-1.5 rounded-[10px] hover:bg-surface-alt transition-colors cursor-pointer" aria-label="Profile">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-body-sm font-bold">
                {user?.name?.charAt(0) || <User size={16} />}
              </div>
              <span className="hidden sm:block text-body-sm font-medium text-text">
                {user?.name || 'User'}
              </span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
