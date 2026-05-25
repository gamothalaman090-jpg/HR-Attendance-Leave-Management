import api from './api';

/**
 * Employee Service — Communicates with Node.js/Express/MongoDB backend for employee management.
 */

const mapEmployee = (emp) => {
  if (!emp) return null;
  
  let status = emp.employmentStatus || 'active';
  if (emp.todayStatus === 'On Leave') {
    status = 'on-leave';
  }

  return {
    id: emp._id,
    name: emp.fullname,
    email: emp.email,
    role: emp.position || 'Staff Employee',
    department: emp.department || 'Unassigned',
    phone: emp.phone || '',
    status,
    todayStatus: emp.todayStatus || 'Absent',
    joinDate: emp.createdAt ? emp.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
    annualBalance: emp.leaveBalances?.annual ?? 20,
    sickBalance: emp.leaveBalances?.sick ?? 10,
    personalBalance: emp.leaveBalances?.personal ?? 5
  };
};

export const employeeService = {
  /** Get all employees */
  async getAll() {
    const res = await api.get('/admin/users');
    const { data } = res.data;
    return (data || []).map(mapEmployee);
  },

  /** Get employee by ID */
  async getById(id) {
    const employees = await this.getAll();
    return employees.find((e) => e.id === id) || null;
  },

  /** Search employees by name or email */
  async search(query) {
    const employees = await this.getAll();
    const q = query.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q)
    );
  },

  /** Filter employees by department */
  async getByDepartment(department) {
    const employees = await this.getAll();
    if (!department || department === 'all') return employees;
    return employees.filter((e) => e.department === department);
  },

  /** Get all department names — wired to GET /admin/departments */
  async getDepartments() {
    const res = await api.get('/admin/departments');
    return res.data.data || [];
  },

  /** Get employee statistics — derived from GET /admin/users summary block */
  async getStats() {
    const res = await api.get('/admin/users');
    const summary = res.data.summary || {};
    const data = res.data.data || [];
    return {
      total: summary.totalUsersCount ?? data.length,
      active: summary.present ?? 0,
      onLeave: summary.onLeave ?? 0,
      absent: summary.absent ?? 0,
      late: summary.late ?? 0,
    };
  },

  /** Create a new employee — POST /admin/users */
  async create(employeeData) {
    const res = await api.post('/admin/users', {
      fullname: employeeData.name,
      email: employeeData.email,
      department: employeeData.department,
      position: employeeData.role,
      phone: employeeData.phone
    });
    return mapEmployee(res.data.data);
  },

  /** Delete an employee by ID — DELETE /admin/users/:id */
  async delete(id) {
    await api.delete(`/admin/users/${id}`);
    return true;
  },

  /** Approve a pending employee registration — PUT /admin/users/:id/approve */
  async approve(id) {
    const res = await api.put(`/admin/users/${id}/approve`);
    return mapEmployee(res.data.data);
  },

  /** Reject/Delete a pending employee registration — PUT /admin/users/:id/reject */
  async reject(id) {
    await api.put(`/admin/users/${id}/reject`);
    return true;
  }
};

export default employeeService;