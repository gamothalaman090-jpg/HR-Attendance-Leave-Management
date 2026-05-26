import api from './api';

/**
 * Employee Service — Communicates with Node.js/Express/MongoDB backend for employee management.
 */

const DEPARTMENTS = [
  'Engineering', 'Design', 'Marketing', 'Sales',
  'Human Resources', 'Finance', 'Product', 'Operations', 'Unassigned'
];

const mapEmployee = (emp) => {
  if (!emp) return null;
  
  // Mapping status: if todayStatus is 'On Leave', set status to 'on-leave',
  // otherwise map employmentStatus ('active'/'inactive'/'pending' etc.)
  let status = emp.employmentStatus || 'active';
  if (emp.todayStatus === 'On Leave') {
    status = 'on-leave';
  }

  const annual = typeof emp.leaveBalances?.annual === 'number' ? emp.leaveBalances.annual : (emp.leaveBalances?.annual?.left ?? 20);
  const sick = typeof emp.leaveBalances?.sick === 'number' ? emp.leaveBalances.sick : (emp.leaveBalances?.sick?.left ?? 10);
  const personal = typeof emp.leaveBalances?.personal === 'number' ? emp.leaveBalances.personal : (emp.leaveBalances?.personal?.left ?? 5);

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
    leaveBalance: {
      annual,
      sick,
      personal
    },
    annualBalance: annual,
    sickBalance: sick,
    personalBalance: personal
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

  /** Get all department names */
  async getDepartments() {
    const res = await api.get('/admin/departments');
    return res.data.data || [];
  },

  /** Create department */
  async createDepartment(name) {
    const res = await api.post('/admin/departments', { name });
    return res.data.data;
  },

  /** Update department */
  async updateDepartment(oldName, newName) {
    const res = await api.put(`/admin/departments/${encodeURIComponent(oldName)}`, { name: newName });
    return res.data.data;
  },

  /** Delete department */
  async deleteDepartment(name) {
    await api.delete(`/admin/departments/${encodeURIComponent(name)}`);
    return true;
  },

  /** Get employee statistics */
  async getStats() {
    const employees = await this.getAll();
    const active = employees.filter((e) => e.status === 'active').length;
    const onLeave = employees.filter((e) => e.status === 'on-leave').length;
    const inactive = employees.filter((e) => e.status === 'inactive').length;
    const depts = await this.getDepartments();
    return {
      total: employees.length,
      active,
      onLeave,
      inactive,
      departments: depts.length,
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
  },

  /** Update an existing employee */
  async update(id, employeeData) {
    const res = await api.put(`/admin/users/${id}`, {
      fullname: employeeData.name,
      email: employeeData.email,
      department: employeeData.department,
      position: employeeData.role,
      phone: employeeData.phone,
      leaveBalances: {
        annual: {
            allotted: employeeData.annualBalance || 20,
            left: employeeData.annualBalance || 20
        },
        sick: {
            allotted: employeeData.sickBalance || 12,
            left: employeeData.sickBalance || 12
        },
        personal: {
            allotted: employeeData.personalBalance || 7,
            left: employeeData.personalBalance || 7
        }
      }
    });
    return mapEmployee(res.data.data);
  }
};

export default employeeService;