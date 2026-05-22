/**
 * Helpers — General utility functions for the Superadmin app.
 */

/**
 * Combine class names, filtering out falsy values.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generate a unique ID (for keys, not for DB records).
 */
export function generateId(prefix = 'nini') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Sleep utility for simulating async delays.
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
