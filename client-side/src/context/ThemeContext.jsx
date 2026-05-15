import { createContext, useState, useEffect, useCallback } from 'react';

export const ThemeContext = createContext(null);

/**
 * ThemeProvider — Manages dark/light mode state with persistence.
 * 
 * Strategy:
 * 1. Check localStorage for saved preference
 * 2. Fall back to system prefers-color-scheme
 * 3. Toggle .dark class on <html> element
 * 4. Persist choice to localStorage
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('nini-theme');
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    return 'system';
  });

  // Apply .dark class on <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (targetTheme) => {
      let resolved = targetTheme;
      if (targetTheme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);
    localStorage.setItem('nini-theme', theme);
  }, [theme]);

  // Listen for system preference changes (only when in 'system' mode)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        const root = document.documentElement;
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
