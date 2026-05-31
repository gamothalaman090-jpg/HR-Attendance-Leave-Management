/**
 * Name: AuthContext.jsx (client-side)
 * PHASE 3 FIX: Listens for the 'auth:session-expired' custom event
 * dispatched by the api.js interceptor on 401 responses.
 *
 * BEFORE: api.js interceptor did window.location.href = '/login'
 *   → Hard browser redirect, full page reload, lost all React state.
 *   → No toast message explaining why the user was redirected.
 *
 * AFTER: api.js dispatches 'auth:session-expired' → AuthContext listens,
 *   clears the session cleanly, and the ProtectedRoute redirects via
 *   React Router (no page reload, preserves SPA feel).
 *
 * Also fixed: initAuth() now validates token expiry client-side before
 *   making the network call — avoids a guaranteed 401 on mount when
 *   a stored token is already expired.
 */

import { createContext, useState, useCallback, useContext, useEffect } from 'react';
import authService from '@/services/authService';

const AuthContext = createContext(null);

const setAuthSession = (userData) => {
  if (!userData) return;
  localStorage.setItem('nini-user', JSON.stringify(userData));
  if (userData.token) localStorage.setItem('nini-token', userData.token);
};

const clearAuthSession = () => {
  localStorage.removeItem('nini-user');
  localStorage.removeItem('nini-token');
};

// ─────────────────────────────────────────────
// FIX: Client-side JWT expiry check.
// Decodes the JWT payload (base64) without verifying the signature.
// This is safe — we only use it to skip a doomed network call.
// The real verification always happens on the server.
// ─────────────────────────────────────────────
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds; Date.now() is in ms
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // Malformed token → treat as expired
  }
};

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Session restore on mount ──────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      try {
        const saved = localStorage.getItem('nini-user');
        if (!saved) return;

        const parsed = JSON.parse(saved);
        if (!parsed?.token) return;

        // FIX: Skip network call if token is already expired
        if (isTokenExpired(parsed.token)) {
          clearAuthSession();
          return;
        }

        // Optimistic restore — show the app immediately
        setUser(parsed);

        // Then refresh from server (catches role changes, deactivation, etc.)
        try {
          const freshUser = await authService.getProfile();
          if (freshUser) {
            setUser(freshUser);
            setAuthSession(freshUser);
          } else {
            // Profile fetch returned null → token valid but user deleted/deactivated
            clearAuthSession();
            setUser(null);
          }
        } catch (err) {
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            if (import.meta.env.DEV) console.warn('Auth session invalid, clearing', err);
            clearAuthSession();
            setUser(null);
          } else {
            if (import.meta.env.DEV) console.warn('Network or server error restoring profile, retaining session', err);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('Failed to restore auth session', err);
        clearAuthSession();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // ── Listen for 401 session-expired events from api.js ──
  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuthSession();
      setUser(null);
      // ProtectedRoute will detect isAuthenticated=false and redirect via React Router
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  // ── Auth actions ──────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const userData = await authService.login(email, password);
    setUser(userData);
    setAuthSession(userData);
    return { success: true };
  }, []);

  const signup = useCallback(async (userData) => {
    const result = await authService.signup(userData);
    setUser(result);
    setAuthSession(result);
    return { success: true };
  }, []);

  const googleLogin = useCallback(async (payload) => {
    const userData = await authService.googleLogin(payload);
    setUser(userData);
    setAuthSession(userData);
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Backend logout is best-effort — always clear local session
    }
    clearAuthSession();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('nini-user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      googleLogin,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;
