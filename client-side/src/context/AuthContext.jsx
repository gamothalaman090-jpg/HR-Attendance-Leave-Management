import { createContext, useState, useCallback, useContext, useEffect } from 'react';
import authService from '@/services/authService';

const AuthContext = createContext(null);

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
        const saved = localStorage.getItem('nini-user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.token) {
            setUser(parsed);
          }
        }
      } catch (err) {
        console.error('Failed to restore auth session', err);
        clearAuthSession();
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
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (userData) => {
    setIsLoading(true);
    try {
      const result = await authService.signup(userData);
      setUser(result);
      setAuthSession(result);
      return { success: true };
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const googleLogin = useCallback(async (payload) => {
    setIsLoading(true);
    try {
      const userData = await authService.googleLogin(payload);
      setUser(userData);
      setAuthSession(userData);
      return { success: true };
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
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

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, signup, googleLogin, logout, updateUser }}
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
