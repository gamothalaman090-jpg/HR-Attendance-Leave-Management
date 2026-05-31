/**
 * Helpers — General utility functions.
 */

/**
 * Combine class names, filtering out falsy values.
 * Lightweight alternative to clsx/classnames.
 * 
 * @param  {...(string|boolean|null|undefined)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generate a unique ID (for keys, not for DB records).
 * @param {string} prefix
 * @returns {string}
 */
export function generateId(prefix = 'nini') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Sleep utility for simulating async delays.
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Group an array of objects by a key.
 * @param {Array} arr
 * @param {string|Function} key
 * @returns {Object}
 */
export function groupBy(arr, key) {
  return arr.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    (result[groupKey] = result[groupKey] || []).push(item);
    return result;
  }, {});
}

/**
 * Capitalize the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Pick specific keys from an object.
 * @param {Object} obj
 * @param {string[]} keys
 * @returns {Object}
 */
export function pick(obj, keys) {
  return keys.reduce((result, key) => {
    if (key in obj) result[key] = obj[key];
    return result;
  }, {});
}

/**
 * Download data as CSV file.
 * @param {Array<Object>} data
 * @param {string} filename
 */
export function downloadCSV(data, filename = 'export.csv') {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Format a time value (supports ISO strings or pre-formatted strings).
 * Displays time in the local timezone of the client.
 * @param {string|Date} timeStr
 * @returns {string}
 */
export function formatTime(timeStr) {
  if (!timeStr) return '—';
  const str = String(timeStr);
  if (str.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(str)) {
    try {
      return new Date(timeStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return str;
    }
  }
  return str;
}
