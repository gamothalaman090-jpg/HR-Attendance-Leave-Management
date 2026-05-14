import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ui';
import { cn } from '@/utils/helpers';
import { NAV_LINKS, BRAND } from '@/utils/constants';
import gsap from 'gsap';

/**
 * Navbar — Sticky navigation with scroll blur, mobile drawer, and theme toggle.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef(null);
  const backdropRef = useRef(null);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Scroll detection for navbar blur effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // GSAP mobile drawer animation
  useEffect(() => {
    if (!drawerRef.current || !backdropRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (mobileOpen) {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      gsap.fromTo(drawerRef.current, { x: '100%' }, { x: '0%', duration: 0.35, ease: 'power3.out' });
    }
  }, [mobileOpen]);

  const closeDrawer = () => {
    if (!drawerRef.current || !backdropRef.current) {
      setMobileOpen(false);
      return;
    }
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.2 });
    gsap.to(drawerRef.current, {
      x: '100%',
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => setMobileOpen(false),
    });
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-sticky transition-all duration-base border-b',
          scrolled
            ? 'bg-bg/95 backdrop-blur-md border-border shadow-navbar'
            : 'bg-bg border-transparent'
        )}
      >
        <nav className="section-container flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <Link
            to="/"
            className="font-heading text-h4 font-extrabold gradient-text shrink-0 hover:opacity-80 transition-opacity"
          >
            {BRAND.name}
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <NavLink
                key={href}
                to={href}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-2 rounded-[8px] text-body-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary bg-primary/5'
                      : 'text-text-muted hover:text-text hover:bg-surface-alt'
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle size="md" />
            <Link
              to="/login"
              className="px-4 py-2 rounded-[8px] text-body-sm font-medium text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-[10px] text-body-sm font-semibold hover:bg-primary-light hover:shadow-glow-primary transition-all duration-base"
            >
              Get Started
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile: Theme Toggle + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle size="sm" />
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-[8px] hover:bg-surface-alt text-text-muted hover:text-text transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-overlay md:hidden">
          {/* Backdrop */}
          <div
            ref={backdropRef}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeDrawer}
          />

          {/* Drawer Panel */}
          <div
            ref={drawerRef}
            className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-surface border-l border-border flex flex-col"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between h-16 px-5 border-b border-border">
              <span className="font-heading text-h4 font-extrabold gradient-text">
                {BRAND.name}
              </span>
              <button
                onClick={closeDrawer}
                className="p-2 rounded-[8px] hover:bg-surface-alt text-text-muted cursor-pointer"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Links */}
            <nav className="flex-1 py-4 px-4 space-y-1">
              {NAV_LINKS.map(({ label, href }) => (
                <NavLink
                  key={href}
                  to={href}
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    cn(
                      'block px-4 py-3 rounded-[10px] text-body font-medium transition-colors',
                      isActive
                        ? 'text-primary bg-primary/5'
                        : 'text-text-muted hover:text-text hover:bg-surface-alt'
                    )
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Drawer Actions */}
            <div className="p-4 border-t border-border space-y-3">
              <Link
                to="/login"
                onClick={closeDrawer}
                className="block text-center px-4 py-3 rounded-[10px] border border-border text-body-sm font-semibold text-text hover:bg-surface-alt transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                onClick={closeDrawer}
                className="block text-center px-4 py-3 rounded-[10px] bg-primary text-white text-body-sm font-semibold hover:bg-primary-light transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
