
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach token ─────────────────────────────
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('nini-user') || 'null');
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — centralised error extraction ────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // ─────────────────────────────────────────────
    // FIX: Extract the best available human-readable message from the server response.
    // Server always returns { success: false, message: string, errors?: [] }
    // ─────────────────────────────────────────────
    let message = data?.message || error.message || 'An unexpected error occurred';

    // If there are field-level validation errors, build a readable summary
    if (data?.errors?.length) {
      const fieldSummary = data.errors.map(e => `${e.field}: ${e.message}`).join(' · ');
      message = fieldSummary || message;
      // Attach the raw errors array for forms to consume
      error.validationErrors = data.errors;
    }

    // Override message with status-specific user-friendly text
    if (status === 429) {
      message = 'Too many requests. Please wait a moment and try again.';
    }
    if (status === 503) {
      message = 'Service temporarily unavailable. Please try again shortly.';
    }
    if (status === 401 && !window.location.pathname.endsWith('/login')) {
      // ─────────────────────────────────────────────
      // FIX: Dispatch a custom event instead of hard-redirecting.
      // AuthContext listens for 'auth:session-expired' and uses React Router
      // to navigate — preserves SPA behaviour and avoids full page reload.
      // ─────────────────────────────────────────────
      localStorage.removeItem('nini-user');
      localStorage.removeItem('nini-token');
      window.dispatchEvent(new CustomEvent('auth:session-expired', { detail: { message } }));
      // Fall through to reject so callers still receive the error
    }

    // Attach the cleaned message so services/components can just use err.message
    error.message = message;

    return Promise.reject(error);
  },
);

export default api;
