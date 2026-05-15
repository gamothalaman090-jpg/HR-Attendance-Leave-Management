import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useOutsideClick — Detects clicks outside a referenced element.
 * 
 * @param {Function} callback - Function to call when clicking outside
 * @returns {React.RefObject}
 */
export function useOutsideClick(callback) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [callback]);

  return ref;
}

/**
 * useMediaQuery — Reactive media query hook.
 * 
 * @param {string} query - CSS media query string
 * @returns {boolean}
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * useDebounce — Debounced value hook.
 * 
 * @param {*} value - Value to debounce
 * @param {number} delay - Debounce delay in ms
 * @returns {*} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useLocalStorage — Persistent state hook with localStorage.
 * 
 * SECURITY WARNING: 
 * Do NOT use this hook for storing sensitive information such as 
 * authentication tokens, JWTs, or PII. Use HttpOnly cookies instead 
 * to prevent Cross-Site Scripting (XSS) attacks.
 * 
 * @param {string} key - Storage key
 * @param {*} initialValue - Default value
 * @returns {[*, Function]}
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    try {
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}
