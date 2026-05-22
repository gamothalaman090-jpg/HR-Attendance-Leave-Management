import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins once
gsap.registerPlugin(ScrollTrigger);

/**
 * useGsap — Helper hook for GSAP animations with automatic cleanup.
 * 
 * Provides:
 * - Scoped animation context for automatic cleanup
 * - ScrollTrigger-aware animations
 * - Reduced-motion awareness
 * 
 * @param {Function} animationFn - Function receiving (gsap, container) to setup animations
 * @param {Array} deps - Dependency array for re-running animations
 */
export function useGsap(animationFn, deps = []) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Create a GSAP context scoped to the container for automatic cleanup
    const ctx = gsap.context(() => {
      animationFn(gsap, containerRef.current);
    }, containerRef.current);

    // Refresh ScrollTrigger after a tick to ensure all sections are positioned correctly
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      ctx.revert(); // Cleans up all animations created in context
      clearTimeout(timer);
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return containerRef;
}

/**
 * useScrollReveal — Quick scroll-triggered fade-up animation.
 * 
 * @param {Object} options
 * @param {string} options.target - CSS selector for elements to animate
 * @param {number} options.stagger - Stagger delay between elements
 * @param {number} options.y - Starting Y offset
 * @param {number} options.duration - Animation duration
 */
export function useScrollReveal({
  target = '[data-reveal]',
  stagger = 0.15,
  y = 40,
  duration = 0.8,
} = {}) {
  return useGsap((gsap, container) => {
    const elements = container.querySelectorAll(target);
    if (!elements.length) return;

    gsap.fromTo(elements, 
      { y, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration,
        stagger,
        ease: 'power3.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: container,
          start: 'top 95%',
          toggleActions: 'play none none none',
          once: true,
        },
      }
    );
  });
}

/**
 * useCountUp — Animates a number counting up when visible.
 * 
 * @param {number} target - Target number to count to
 * @param {number} duration - Animation duration in seconds
 * @returns {React.RefObject}
 */
export function useCountUp(target, duration = 2) {
  const ref = useRef(null);
  const valueRef = useRef({ val: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      ref.current.textContent = target.toLocaleString();
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(valueRef.current, {
        val: target,
        duration,
        ease: 'power2.out',
        snap: { val: 1 },
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        onUpdate: () => {
          if (ref.current) {
            ref.current.textContent = Math.round(valueRef.current.val).toLocaleString();
          }
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [target, duration]);

  return ref;
}

export { gsap, ScrollTrigger };
