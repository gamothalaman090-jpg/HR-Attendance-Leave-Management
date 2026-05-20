/**
 * Employee Service — Mock CRUD for employee directory with localStorage persistence.
 */
import { EMPLOYEES as DEFAULT_EMPLOYEES, DEPARTMENTS } from '@/data/employees';
import { sleep } from '@/utils/helpers';

const STORAGE_KEY = 'nini-employees';

const getStoredEmployees = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    // If it has any of the old mock employee IDs, clear local storage
    if (parsed.some(e => e.id && (e.id.startsWith('emp-') || e.id === 'emp-001'))) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
  }
  const pendingSeeded = [
    ...DEFAULT_EMPLOYEES,
    {
      id: 'EMP-9001',
      name: 'Oliver Thorne',
      email: 'oliver.thorne@nini.io',
      role: 'Frontend Engineer',
      department: 'Engineering',
      phone: '+1 (555) 601-9231',
      status: 'pending',
      joinDate: '2026-05-15',
      annualBalance: 20,
      sickBalance: 10,
      personalBalance: 5
    },
    {
      id: 'EMP-9002',
      name: 'Claire Sinclair',
      email: 'claire.sinclair@nini.io',
      role: 'Growth Specialist',
      department: 'Marketing',
      phone: '+1 (555) 712-4491',
      status: 'pending',
      joinDate: '2026-05-18',
      annualBalance: 15,
      sickBalance: 8,
      personalBalance: 5
    }
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingSeeded));
  return pendingSeeded;
};

const saveEmployees = (employees) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
};

export const employeeService = {
  /** Get all employees */
  async getAll() {
    await sleep(400);
    return getStoredEmployees();
  },

  /** Get employee by ID */
  async getById(id) {
    await sleep(200);
    const employees = getStoredEmployees();
    return employees.find((e) => e.id === id) || null;
  },

  /** Search employees by name or email */
  async search(query) {
    await sleep(300);
    const employees = getStoredEmployees();
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
    await sleep(200);
    const employees = getStoredEmployees();
    if (!department || department === 'all') return employees;
    return employees.filter((e) => e.department === department);
  },

  /** Get all department names */
  async getDepartments() {
    await sleep(100);
    return [...DEPARTMENTS];
  },

  /** Get employee statistics */
  async getStats() {
    await sleep(200);
    const employees = getStoredEmployees();
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
    await sleep(500);
    const employees = getStoredEmployees();
    const newEmployee = {
      id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      ...employeeData,
    };
    employees.push(newEmployee);
    saveEmployees(employees);
    return newEmployee;
  },

  /** Delete an employee by ID */
  async delete(id) {
    await sleep(400);
    const employees = getStoredEmployees();
    const filtered = employees.filter((e) => e.id !== id);
    if (filtered.length === employees.length) return false; // not found
    saveEmployees(filtered);
    return true;
  },

  /** Approve a pending employee registration */
  async approve(id) {
    await sleep(300);
    const employees = getStoredEmployees();
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Employee not found');
    employees[index].status = 'active';
    saveEmployees(employees);
    return employees[index];
  },

  /** Reject/Delete a pending employee registration */
  async reject(id) {
    await sleep(300);
    const employees = getStoredEmployees();
    const filtered = employees.filter(e => e.id !== id);
    saveEmployees(filtered);
    return true;
  }
};

export default employeeService;
