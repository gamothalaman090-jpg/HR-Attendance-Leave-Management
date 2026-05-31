/**
 * Name: AuthContext.jsx (superadmin-side)
 * PHASE 3 FIXES: Mirrors client-side AuthContext improvements.
 *   - Listens for auth:session-expired event from api.js interceptor
 *   - Client-side token expiry pre-check avoids doomed network call on mount
 *   - try/catch removed from login() — errors now propagate to LoginPage
 *     so the page can show the error message directly
 */

import { createContext, useState, useCallback, useContext, useEffect } from 'react';
import authService from '@/services/authService';

const AuthContext = createContext(null);

const setAuthSession = (userData) => {
  if (!userData) return;
  localStorage.setItem('nini-admin-user', JSON.stringify(userData));
  if (userData.token) localStorage.setItem('nini-admin-token', userData.token);
};

const clearAuthSession = () => {
  localStorage.removeItem('nini-admin-user');
  localStorage.removeItem('nini-admin-token');
};

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Session restore ────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      try {
        const saved = localStorage.getItem('nini-admin-user');
        if (!saved) return;

        const parsed = JSON.parse(saved);
        if (!parsed?.token || isTokenExpired(parsed.token)) {
          clearAuthSession();
          return;
        }

        // Optimistic restore — show console immediately
        setUser(parsed);

        try {
          const savedUser = await authService.getProfile();
          if (savedUser?.role?.toLowerCase() === 'superadmin') {
            setUser(savedUser);
          } else {
            clearAuthSession();
            setUser(null);
          }
        } catch (err) {
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            if (import.meta.env.DEV) console.warn('Superadmin auth session invalid, clearing', err);
            clearAuthSession();
            setUser(null);
          } else {
            if (import.meta.env.DEV) console.warn('Network or server error restoring superadmin profile, retaining session', err);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('Failed to restore superadmin session', err);
        clearAuthSession();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // ── Listen for 401 session-expired from api.js interceptor ──
  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuthSession();
      setUser(null);
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  // ── Login ──────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    // Errors propagate to LoginPage — no try/catch here
    const userData = await authService.login(email, password);

    if (userData.role?.toLowerCase() !== 'superadmin') {
      throw new Error('Access denied. This console is restricted to Superadmin accounts only.');
    }

    setUser(userData);
    setAuthSession(userData);
    return { success: true };
  }, []);

  // ── Logout ─────────────────────────────────────────────
  const logout = useCallback(() => {
    try { authService.logout(); } catch { /* best-effort */ }
    clearAuthSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
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
