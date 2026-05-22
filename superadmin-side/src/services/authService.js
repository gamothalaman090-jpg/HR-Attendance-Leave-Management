import api from './api';

/**
 * authService — Mock authentication service for Superadmin.
 * 
 * In production, these would hit /api/auth/login.
 * The mock simulates the same behavior as client-side but only
 * recognizes superadmin credentials.
 */

const sleep = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  /**
   * Log in user — returns user data.
   * The AuthContext will reject non-superadmin roles.
   */
  login: async (email, password) => {
    await sleep();
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // In production: return (await api.post('/auth/login', { email, password })).data;

    // Mock: only superadmin emails are recognized
    if (email.toLowerCase().includes('superadmin')) {
      return {
        id: 'SA-9999',
        name: 'System Superadmin',
        email: email,
        role: 'superadmin',
        department: 'Operations',
        avatar: null,
        joinDate: '2024-01-01',
        token: 'mock-jwt-token-sa-' + Math.random().toString(36).substring(7),
        onboarded: true,
      };
    }

    // Any other email returns a non-superadmin role (will be rejected by AuthContext)
    throw new Error('Invalid credentials. Only Superadmin accounts can access this console.');
  },

  /**
   * Get current user profile (from localStorage)
   */
  getProfile: async () => {
    await sleep(400);
    const saved = localStorage.getItem('nini-admin-user');
    return saved ? JSON.parse(saved) : null;
  },

  /**
   * Logout (clearing session)
   */
  logout: () => {
    localStorage.removeItem('nini-admin-user');
    localStorage.removeItem('nini-admin-token');
  },
};

export default authService;
