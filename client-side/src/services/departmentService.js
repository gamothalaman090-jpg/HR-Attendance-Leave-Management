import { DEPARTMENTS as DEFAULT_DEPARTMENTS } from '@/data/employees';
import { sleep } from '@/utils/helpers';

const STORAGE_KEY = 'nini-departments';

const getStoredDepartments = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEPARTMENTS));
  return DEFAULT_DEPARTMENTS;
};

const saveDepartments = (departments) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(departments));
};

export const departmentService = {
  async getAll() {
    await sleep(200);
    return getStoredDepartments();
  },

  async create(name) {
    await sleep(300);
    const depts = getStoredDepartments();
    if (depts.includes(name)) {
      throw new Error('Department already exists');
    }
    depts.push(name);
    saveDepartments(depts);
    return name;
  },

  async update(oldName, newName) {
    await sleep(300);
    let depts = getStoredDepartments();
    const idx = depts.indexOf(oldName);
    if (idx === -1) throw new Error('Department not found');
    if (depts.includes(newName) && oldName !== newName) {
      throw new Error('New department name already exists');
    }
    depts[idx] = newName;
    saveDepartments(depts);

    // Also update any employees who belong to this department
    const empStored = localStorage.getItem('nini-employees');
    if (empStored) {
      const emps = JSON.parse(empStored);
      const updatedEmps = emps.map(emp => {
        if (emp.department === oldName) {
          return { ...emp, department: newName };
        }
        return emp;
      });
      localStorage.setItem('nini-employees', JSON.stringify(updatedEmps));
    }

    return newName;
  },

  async delete(name) {
    await sleep(300);
    let depts = getStoredDepartments();
    const filtered = depts.filter(d => d !== name);
    saveDepartments(filtered);
    return true;
  }
};

export default departmentService;
