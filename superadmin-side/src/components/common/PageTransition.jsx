import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';

/**
 * PageTransition — Wrapper to animate page entries using GSAP.
 * Uses gsap.context() for proper cleanup and avoids stale animations.
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.set(el, { opacity: 1, y: 0 });
      window.scrollTo(0, 0);
      return;
    }

    // Create a scoped GSAP context for automatic cleanup
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: 'power2.out',
          clearProps: 'all',
        }
      );
    }, el);

    window.scrollTo(0, 0);

    return () => ctx.revert();
  }, [location.pathname]);

  return (
    <div ref={containerRef} className="w-full h-full">
      {children}
    </div>
  );
}
