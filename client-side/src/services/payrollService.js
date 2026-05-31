
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
    avatar: emp.profilePicture || '',
    salary: p.basicSalary,
    payPeriodStart: p.periodStart ? p.periodStart.split('T')[0] : '',
    payPeriodEnd:   p.periodEnd   ? p.periodEnd.split('T')[0]   : '',
    status: (p.status || 'Pending').toLowerCase(),
    processedDate: p.paymentDate ? p.paymentDate.split('T')[0] : '',
  };
};

export const payrollService = {
  /** Get all payroll records + dashboard metrics */
  async getAll(isAdmin = false) {
    const endpoint = isAdmin ? '/admin/payroll' : '/user/payroll';
    const { data: res } = await api.get(endpoint);
    return (res.data || []).map(mapPayroll);
  },

  /** Get user's own payslips */
  async getMyPayroll() {
    const { data: res } = await api.get('/user/payroll');
    return (res.data || []).map(mapPayroll);
  },

  /**
   * Get dashboard metrics + paginated records.
   * @param {{ page?, limit? }} options
   */
  async getDashboard({ page = 1, limit = 20 } = {}) {
    const { data: res } = await api.get(`/admin/payroll?page=${page}&limit=${limit}`);
    return {
      metrics: res.metrics || { totalBudget: 0, releasedPayments: 0, pendingReleases: 0 },
      records: (res.data || []).map(mapPayroll),
      total:   res.total || 0,
      pages:   res.pages || 1,
      page:    res.page  || 1,
    };
  },

  async getByEmployeeId(empId, { page = 1, limit = 20 } = {}) {
    const { records } = await this.getDashboard({ page, limit });
    return records.filter(p => p.employeeId === empId);
  },

  /** Create a new payroll run */
  async create(payrollData) {
    const payload = {
      employeeId:  payrollData.employeeId,
      basicSalary: payrollData.salary || payrollData.basicSalary,
      periodStart: payrollData.payPeriodStart || payrollData.periodStart,
      periodEnd:   payrollData.payPeriodEnd   || payrollData.periodEnd,
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