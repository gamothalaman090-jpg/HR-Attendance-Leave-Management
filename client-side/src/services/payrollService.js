/**
 * Payroll Service — Connects to Node.js/Express/MongoDB backend.
 *
 * Admin endpoints: GET/POST /admin/payroll, DELETE /admin/payroll/:id,
 *                  PUT /admin/payroll/:id/release
 */
import api from './api';

const mapPayroll = (p) => {
  if (!p) return null;
  const emp = p.employee || {};
  return {
    id: p._id,
    payrollId: p.payrollId,
    employeeId: typeof emp === 'string' ? emp : emp._id,
    employeeName: emp.fullname || 'Unknown',
    email: emp.email || '',
    position: emp.position || '',
    salary: p.basicSalary,
    payPeriodStart: p.periodStart ? p.periodStart.split('T')[0] : '',
    payPeriodEnd: p.periodEnd ? p.periodEnd.split('T')[0] : '',
    status: (p.status || 'Pending').toLowerCase(),
    processedDate: p.paymentDate ? p.paymentDate.split('T')[0] : '',
  };
};

export const payrollService = {
  /** Get all payroll records + dashboard metrics */
  async getAll() {
    const { data: res } = await api.get('/admin/payroll');
    return (res.data || []).map(mapPayroll);
  },

  /** Get dashboard metrics */
  async getDashboard() {
    const { data: res } = await api.get('/admin/payroll');
    return {
      metrics: res.metrics || { totalBudget: 0, releasedPayments: 0, pendingReleases: 0 },
      records: (res.data || []).map(mapPayroll),
    };
  },

  /** Get payrolls for a specific employee */
  async getByEmployeeId(empId) {
    const all = await this.getAll();
    return all.filter((p) => p.employeeId === empId);
  },

  /** Create a new payroll run */
  async create(payrollData) {
    const payload = {
      employeeId: payrollData.employeeId,
      basicSalary: payrollData.salary || payrollData.basicSalary,
      periodStart: payrollData.payPeriodStart || payrollData.periodStart,
      periodEnd: payrollData.payPeriodEnd || payrollData.periodEnd,
    };

    const { data: res } = await api.post('/admin/payroll', payload);
    return mapPayroll(res.data);
  },

  /** Release/process a payroll payment */
  async processPayment(id) {
    const { data: res } = await api.put(`/admin/payroll/${id}/release`);
    return mapPayroll(res.data);
  },

  /** Delete a payroll record */
  async delete(id) {
    await api.delete(`/admin/payroll/${id}`);
    return true;
  },
};

export default payrollService;
