/**
 * Department Service — Connects to Node.js/Express/MongoDB backend.
 *
 * Admin endpoints: GET/POST /admin/departments, PUT /admin/departments/:oldName, DELETE /admin/departments/:name
 */
import api from './api';

export const departmentService = {
  /** Get all departments */
  async getAll() {
    const { data: res } = await api.get('/admin/departments');
    return res.data || [];
  },

  /** Create a new department */
  async create(name) {
    const { data: res } = await api.post('/admin/departments', { name });
    return res.data;
  },

  /** Update department name */
  async update(oldName, newName) {
    const { data: res } = await api.put(`/admin/departments/${encodeURIComponent(oldName)}`, { name: newName });
    return res.data;
  },

  /** Delete department */
  async delete(name) {
    await api.delete(`/admin/departments/${encodeURIComponent(name)}`);
    return true;
  },
};

export default departmentService;
