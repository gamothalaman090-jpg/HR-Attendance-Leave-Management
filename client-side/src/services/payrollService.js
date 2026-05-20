import { sleep } from '@/utils/helpers';

const STORAGE_KEY = 'nini-payrolls';

const getStoredPayrolls = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  const defaultPayrolls = [
    {
      id: 'PAY-8921',
      employeeId: 'EMP-1001',
      employeeName: 'Sarah Chen',
      salary: 12500,
      payPeriodStart: '2026-04-01',
      payPeriodEnd: '2026-04-30',
      status: 'paid',
      processedDate: '2026-04-28'
    },
    {
      id: 'PAY-4310',
      employeeId: 'EMP-1002',
      employeeName: 'James Kim',
      salary: 10500,
      payPeriodStart: '2026-04-01',
      payPeriodEnd: '2026-04-30',
      status: 'paid',
      processedDate: '2026-04-28'
    },
    {
      id: 'PAY-1102',
      employeeId: 'EMP-1001',
      employeeName: 'Sarah Chen',
      salary: 12500,
      payPeriodStart: '2026-05-01',
      payPeriodEnd: '2026-05-31',
      status: 'pending',
      processedDate: ''
    }
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPayrolls));
  return defaultPayrolls;
};

const savePayrolls = (payrolls) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payrolls));
};

export const payrollService = {
  async getAll() {
    await sleep(300);
    return getStoredPayrolls();
  },

  async getByEmployeeId(empId) {
    await sleep(200);
    const payrolls = getStoredPayrolls();
    return payrolls.filter(p => p.employeeId === empId);
  },

  async create(payrollData) {
    await sleep(400);
    const payrolls = getStoredPayrolls();
    const newPayroll = {
      id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'pending',
      processedDate: '',
      ...payrollData
    };
    payrolls.push(newPayroll);
    savePayrolls(payrolls);
    return newPayroll;
  },

  async processPayment(id) {
    await sleep(500);
    const payrolls = getStoredPayrolls();
    const idx = payrolls.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Payroll record not found');
    payrolls[idx].status = 'paid';
    payrolls[idx].processedDate = new Date().toISOString().split('T')[0];
    savePayrolls(payrolls);
    return payrolls[idx];
  },

  async delete(id) {
    await sleep(300);
    const payrolls = getStoredPayrolls();
    const filtered = payrolls.filter(p => p.id !== id);
    savePayrolls(filtered);
    return true;
  }
};

export default payrollService;
