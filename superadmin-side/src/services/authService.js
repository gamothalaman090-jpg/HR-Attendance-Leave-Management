import api from './api';

/**
 * authService — Production authentication service for Superadmin console.
 */
export const authService = {
  /** Log in superadmin user */
  login: async (email, password) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, data } = res.data;

      if (data.role !== 'superadmin') {
        throw new Error('Access denied. Only Superadmin accounts can access this console.');
      }

      const userData = {
        id: data._id || data.id,
        name: data.fullname,
        email: data.email,
        role: data.role,
        department: data.department || 'Operations',
        avatar: null,
        joinDate: data.createdAt ? data.createdAt.split('T')[0] : '2024-01-01',
        token,
        onboarded: true,
      };

      localStorage.setItem('nini-admin-user', JSON.stringify(userData));
      localStorage.setItem('nini-admin-token', token);

      return userData;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Authentication failed';
      throw new Error(errorMsg);
    }
  },

  /** Get current user profile */
  getProfile: async () => {
    try {
      const res = await api.get('/user/profile');
      const { data } = res.data;
      if (!data || data.role !== 'superadmin') return null;

      const token = localStorage.getItem('nini-admin-token');

      return {
        id: data._id || data.id,
        name: data.fullname,
        email: data.email,
        role: data.role,
        department: data.department || 'Operations',
        avatar: null,
        joinDate: data.createdAt ? data.createdAt.split('T')[0] : '2024-01-01',
        token,
        onboarded: true,
      };
    } catch {
      return null;
    }
  },

  /** Logout superadmin */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout failed or session already cleared', err);
    }
    localStorage.removeItem('nini-admin-user');
    localStorage.removeItem('nini-admin-token');
  },
};

export default authService;
