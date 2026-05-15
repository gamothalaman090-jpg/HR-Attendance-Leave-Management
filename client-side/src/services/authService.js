import api from './api';

/**
 * authService — Mock authentication service.
 * 
 * Simulated API calls for login, signup, and profile management.
 * In a real app, these would hit /auth/login, /auth/signup, etc.
 */

const sleep = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  /**
   * Log in user
   */
  login: async (email, password) => {
    await sleep();
    
    // For mock: any valid-looking email/password works
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const mockUser = {
      id: '1',
      name: 'Alex Rivera',
      email: email,
      role: 'HR Manager',
      department: 'Human Resources',
      avatar: null,
      joinDate: '2024-03-15',
      token: 'mock-jwt-token-' + Math.random().toString(36).substring(7),
    };

    return mockUser;
  },

  /**
   * Register a new user
   */
  signup: async (userData) => {
    await sleep();
    
    const { name, email, password } = userData;
    if (!name || !email || !password) {
      throw new Error('All fields are required');
    }

    const mockUser = {
      id: '2',
      name,
      email,
      role: 'Employee',
      department: 'Unassigned',
      avatar: null,
      joinDate: new Date().toISOString().split('T')[0],
      token: 'mock-jwt-token-' + Math.random().toString(36).substring(7),
    };

    return mockUser;
  },

  /**
   * Get current user profile (token based)
   */
  getProfile: async () => {
    await sleep(400);
    // In a real app: return (await api.get('/auth/me')).data;
    
    const saved = localStorage.getItem('nini-user');
    return saved ? JSON.parse(saved) : null;
  },

  /**
   * Logout (clearing session)
   */
  logout: () => {
    localStorage.removeItem('nini-user');
    localStorage.removeItem('nini-token');
  },
};

export default authService;
