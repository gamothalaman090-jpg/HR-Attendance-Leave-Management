import { createContext, useState, useCallback, useContext, useEffect } from 'react';
import authService from '@/services/authService';

const AuthContext = createContext(null);

// ----------------------------------------------------------------------
// SECURITY NOTICE:
// Currently using localStorage for JWT storage to support frontend dev.
// BEFORE PRODUCTION BACKEND INTEGRATION:
// Tokens must be migrated to HttpOnly cookies to prevent XSS attacks.
// Do NOT use these wrappers once the backend sets cookies automatically.
// ----------------------------------------------------------------------
const setAuthSession = (userData) => {
  if (!userData) return;
  localStorage.setItem('nini-user', JSON.stringify(userData));
  if (userData.token) {
    localStorage.setItem('nini-token', userData.token);
  }
};

const clearAuthSession = () => {
  localStorage.removeItem('nini-user');
  localStorage.removeItem('nini-token');
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from storage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedUser = await authService.getProfile();
        if (savedUser) setUser(savedUser);
      } catch (err) {
        console.error('Failed to restore auth session', err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const userData = await authService.login(email, password);
      setUser(userData);
      setAuthSession(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Invalid credentials' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (name, email, password) => {
    setIsLoading(true);
    try {
      const userData = await authService.signup({ name, email, password });
      setUser(userData);
      setAuthSession(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    clearAuthSession();
    setUser(null);
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
