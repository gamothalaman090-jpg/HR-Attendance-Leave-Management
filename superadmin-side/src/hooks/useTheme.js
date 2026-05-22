import { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';

/**
 * useTheme — Hook to access theme state and toggle function.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
