import { createContext, useState, useCallback, useContext, useEffect } from 'react';
import authService from '@/services/authService';

const AuthContext = createContext(null);

/**
 * Superadmin Auth Session Helpers
 * Uses separate localStorage keys from the client-side app.
 */
const setAuthSession = (userData) => {
  if (!userData) return;
  localStorage.setItem('nini-admin-user', JSON.stringify(userData));
  if (userData.token) {
    localStorage.setItem('nini-admin-token', userData.token);
  }
};

const clearAuthSession = () => {
  localStorage.removeItem('nini-admin-user');
  localStorage.removeItem('nini-admin-token');
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from storage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedUser = await authService.getProfile();
        // Only restore if user is a superadmin
        if (savedUser && savedUser.role?.toLowerCase() === 'superadmin') {
          setUser(savedUser);
        } else if (savedUser) {
          // Non-superadmin found in storage — clear it
          clearAuthSession();
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
      
      // SUPERADMIN GATE: Reject non-superadmin users
      if (userData.role?.toLowerCase() !== 'superadmin') {
        throw new Error('Access denied. This console is restricted to Superadmin accounts only.');
      }

      setUser(userData);
      setAuthSession(userData);
      return { success: true };
    } catch (error) {
      throw error;
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
      value={{ user, isAuthenticated, isLoading, login, logout }}
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
