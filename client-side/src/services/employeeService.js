/**
 * Employee Service — Mock CRUD for employee directory.
 */
import { EMPLOYEES, DEPARTMENTS } from '@/data/employees';
import { sleep } from '@/utils/helpers';

export const employeeService = {
  /** Get all employees */
  async getAll() {
    await sleep(400);
    return [...EMPLOYEES];
  },

  /** Get employee by ID */
  async getById(id) {
    await sleep(200);
    return EMPLOYEES.find((e) => e.id === id) || null;
  },

  /** Search employees by name or email */
  async search(query) {
    await sleep(300);
    const q = query.toLowerCase();
    return EMPLOYEES.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q)
    );
  },

  /** Filter employees by department */
  async getByDepartment(department) {
    await sleep(200);
    if (!department || department === 'all') return [...EMPLOYEES];
    return EMPLOYEES.filter((e) => e.department === department);
  },

  /** Get all department names */
  async getDepartments() {
    await sleep(100);
    return [...DEPARTMENTS];
  },

  /** Get employee statistics */
  async getStats() {
    await sleep(200);
    const active = EMPLOYEES.filter((e) => e.status === 'active').length;
    const onLeave = EMPLOYEES.filter((e) => e.status === 'on-leave').length;
    const inactive = EMPLOYEES.filter((e) => e.status === 'inactive').length;
    return {
      total: EMPLOYEES.length,
      active,
      onLeave,
      inactive,
      departments: DEPARTMENTS.length,
    };
  },
};

export default employeeService;
