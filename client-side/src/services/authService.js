import api from './api';

/**
 * authService — Active authentication service communicating with Express/MongoDB backend.
 */
export const authService = {
  /**
   * Log in user
   */
  login: async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, data } = res.data;
      
      // Normalize user object: map 'fullname' to 'name'
      return {
        id: data.id || data._id,
        name: data.fullname,
        email: data.email || email,
        role: data.role,
        company: data.company,
        department: data.department || 'Unassigned',
        position: data.position || 'Staff Employee',
        phone: data.phone || '',
        onboarded: data.onboarded,
        profilePicture: data.profilePicture || '',
        token,
      };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Invalid credentials or connection error';
      throw new Error(errorMsg);
    }
  },

  /**
   * Register a new user
   */
  signup: async (userData) => {
    try {
      const { name, email, password, company, role } = userData;
      const res = await api.post('/auth/register', {
        fullname: name,
        email,
        password,
        company: company || 'Default Company',
        role: role || 'admin',
      });
      
      const { token, data } = res.data;
      
      return {
        id: data.id || data._id,
        name: data.fullname,
        email: data.email,
        role: data.role,
        company: data.company,
        department: data.department || 'Unassigned',
        position: data.position || 'Staff Employee',
        phone: data.phone || '',
        onboarded: data.onboarded,
        profilePicture: data.profilePicture || '',
        token,
      };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed';
      throw new Error(errorMsg);
    }
  },

  /**
   * Google OAuth login
   */
  googleLogin: async (payload) => {
    try {
      const res = await api.post('/auth/google', payload);
      const { token, data } = res.data;
      
      return {
        id: data.id || data._id,
        name: data.fullname,
        email: data.email,
        role: data.role,
        company: data.company,
        department: data.department || 'Unassigned',
        position: data.position || 'Staff Employee',
        phone: data.phone || '',
        onboarded: data.onboarded,
        profilePicture: data.profilePicture || '',
        token,
      };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Google authentication failed';
      throw new Error(errorMsg);
    }
  },

  /**
   * Get current user profile (token based)
   */
  getProfile: async () => {
    try {
      const res = await api.get('/user/profile');
      const { data } = res.data;
      if (!data) return null;
      
      // Get the stored user token
      const stored = localStorage.getItem('nini-user');
      const token = stored ? JSON.parse(stored).token : localStorage.getItem('nini-token');
      
      return {
        id: data.id || data._id,
        name: data.fullname,
        email: data.email,
        role: data.role,
        company: data.company,
        department: data.department || 'Unassigned',
        position: data.position || 'Staff Employee',
        phone: data.phone || '',
        onboarded: data.onboarded,
        profilePicture: data.profilePicture || '',
        token,
      };
    } catch (err) {
      // If unauthorized, return null so client redirects to login
      return null;
    }
  },

  /**
   * Request password reset link
   */
  forgotPassword: async (email) => {
    try {
      const res = await api.post('/auth/forgotpassword', { email });
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send reset link';
      throw new Error(errorMsg);
    }
  },

  /**
   * Change user password
   */
  changePassword: async (currentPassword, newPassword) => {
    try {
      const res = await api.put('/auth/profile/change-password', {
        currentPassword,
        newPassword,
      });
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to change password';
      throw new Error(errorMsg);
    }
  },

  /**
   * Update user profile details
   */
  updateProfile: async (formData) => {
    try {
      const res = await api.put('/auth/profile/update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const { data } = res.data;
      
      const stored = localStorage.getItem('nini-user');
      const token = stored ? JSON.parse(stored).token : localStorage.getItem('nini-token');
      
      return {
        id: data.id || data._id,
        name: data.fullname,
        email: data.email,
        role: data.role,
        company: data.company,
        department: data.department,
        position: data.position,
        phone: data.phone || '',
        onboarded: data.onboarded,
        profilePicture: data.profilePicture || '',
        token,
      };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update profile';
      throw new Error(errorMsg);
    }
  },

  /**
   * Logout (clearing session)
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout failed or session already cleared', err);
    }
    localStorage.removeItem('nini-user');
    localStorage.removeItem('nini-token');
  },

  /**
   * Complete onboarding
   */
  completeOnboarding: async () => {
    try {
      const res = await api.put('/auth/onboard');
      const { data } = res.data;
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to complete onboarding';
      throw new Error(errorMsg);
    }
  },
};

export default authService;
