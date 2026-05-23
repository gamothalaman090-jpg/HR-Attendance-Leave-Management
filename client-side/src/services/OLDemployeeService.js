import api from './api';

/**
 * Employee Service — Communicates with Node.js/Express/MongoDB backend for employee management.
 */

const mapEmployee = (emp) => {
  if (!emp) return null;
  
  // Mapping status: if todayStatus is 'On Leave', set status to 'on-leave',
  // otherwise map employmentStatus ('active'/'inactive'/'pending' etc.)
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
    // The server returns: { success: true, count: X, data: [...], summary: {...} }
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

  /** Get all department names */
  async getDepartments() {
    return [...DEPARTMENTS];
  },

  /** Get employee statistics */
  async getStats() {
    const employees = await this.getAll();
    const active = employees.filter((e) => e.status === 'active').length;
    const onLeave = employees.filter((e) => e.status === 'on-leave').length;
    const inactive = employees.filter((e) => e.status === 'inactive').length;
    return {
      total: employees.length,
      active,
      onLeave,
      inactive,
      departments: DEPARTMENTS.length,
    };
  },

  /** Create a new employee */
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

  /** Delete an employee by ID */
  async delete(id) {
    await api.delete(`/admin/users/${id}`);
    return true;
  },

  /** Approve a pending employee registration */
  async approve(id) {
    const res = await api.put(`/admin/users/${id}/approve`);
    return mapEmployee(res.data.data);
  },

  /** Reject/Delete a pending employee registration */
  async reject(id) {
    await api.put(`/admin/users/${id}/reject`);
    return true;
  }
};

export default employeeService;
