import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop — Resets scroll position to (0,0) on route change.
 * Handles window and common scroll containers.
 */
export default function ScrollToTop() {
  const { pathname, key } = useLocation();

  useEffect(() => {
    // Immediate scroll to top
    const scrollOptions = { top: 0, left: 0, behavior: 'instant' };
    
    window.scrollTo(scrollOptions);
    document.documentElement.scrollTo(scrollOptions);
    document.body.scrollTo(scrollOptions);

    // Force scroll for elements that might have their own scroll state
    const scrollables = document.querySelectorAll('.overflow-y-auto, main');
    scrollables.forEach(el => el.scrollTo(scrollOptions));

    // Backup for browsers with strict scroll-restoration or smooth-scroll conflicts
    const timer = setTimeout(() => {
      window.scrollTo(scrollOptions);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, key]); // Trigger on every navigation, even to the same page

  return null;
}
