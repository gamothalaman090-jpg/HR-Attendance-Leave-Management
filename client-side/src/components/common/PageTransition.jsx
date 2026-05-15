import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';

/**
 * PageTransition — Wrapper to animate page entries using GSAP.
 * 
 * Uses the route location as a key to trigger animations on change.
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Reset initial state
    gsap.set(el, { 
      opacity: 0, 
      y: 10,
    });

    // Animate in
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
      clearProps: 'all', // Clear properties after animation for layout stability
    });

    // Scroll to top on page change
    window.scrollTo(0, 0);

  }, [location.pathname]);

  return (
    <div ref={containerRef} className="w-full h-full">
      {children}
    </div>
  );
}
