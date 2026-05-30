/**
 * Name: api.js (superadmin-side)
 * PHASE 3 FIXES: Mirrors the client-side api.js improvements.
 *   - Centralised error message extraction
 *   - 422 validationErrors surfaced
 *   - 429 / 503 user-friendly messages
 *   - 401 uses custom event instead of hard redirect
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,  // FIX: Was 10s — bumped to 15s (log queries can take longer)
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('nini-admin-user') || 'null');
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data   = error.response?.data;

    let message = data?.message || error.message || 'An unexpected error occurred';

    if (data?.errors?.length) {
      const fieldSummary = data.errors.map(e => `${e.field}: ${e.message}`).join(' · ');
      message = fieldSummary || message;
      error.validationErrors = data.errors;
    }

    if (status === 429) message = 'Too many requests. Please slow down.';
    if (status === 503) message = 'Service temporarily unavailable.';

    if (status === 401 && !window.location.pathname.endsWith('/login')) {
      localStorage.removeItem('nini-admin-user');
      localStorage.removeItem('nini-admin-token');
      window.dispatchEvent(new CustomEvent('auth:session-expired', { detail: { message } }));
    }

    error.message = message;
    return Promise.reject(error);
  },
);

export default api;
