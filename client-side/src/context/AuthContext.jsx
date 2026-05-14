import { createContext, useState, useCallback, useContext } from 'react';

const AuthContext = createContext(null);

/**
 * AuthProvider — Mock authentication state manager.
 * 
 * Manages login/logout/signup flow with mock data.
 * Ready to be wired to a real API when backend is available.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nini-user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock user data
      const mockUser = {
        id: '1',
        name: 'Alex Rivera',
        email: email,
        role: 'HR Manager',
        department: 'Human Resources',
        avatar: null,
        joinDate: '2024-03-15',
      };

      setUser(mockUser);
      localStorage.setItem('nini-user', JSON.stringify(mockUser));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Invalid credentials' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (name, email, password) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockUser = {
        id: '2',
        name,
        email,
        role: 'Employee',
        department: 'Unassigned',
        avatar: null,
        joinDate: new Date().toISOString().split('T')[0],
      };

      setUser(mockUser);
      localStorage.setItem('nini-user', JSON.stringify(mockUser));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('nini-user');
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
