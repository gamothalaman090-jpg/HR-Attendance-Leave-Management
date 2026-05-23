import api from './api';

const mapUser = (u) => {
  if (!u) return null;
  return {
    id: u._id || u.id,
    name: u.fullname || 'Unknown',
    email: u.email || '',
    role: u.role || 'user',
    department: u.department || 'Unassigned',
    status: u.employmentStatus || 'active',
  };
};

export const userService = {
  /** Get all users across the platform */
  async getAll() {
    const { data: res } = await api.get('/superadmin');
    return (res.data || []).map(mapUser);
  },

  /** Create a new user (admin or user) */
  async create(userData) {
    const { data: res } = await api.post('/superadmin', userData);
    return mapUser(res.data);
  },

  /** Update user attributes */
  async update(id, userData) {
    const { data: res } = await api.put(`/superadmin/${id}`, userData);
    return mapUser(res.data);
  },

  /** Delete user from database */
  async delete(id) {
    await api.delete(`/superadmin/${id}`);
    return true;
  },
};

export default userService;
