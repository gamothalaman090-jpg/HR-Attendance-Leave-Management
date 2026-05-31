import api from './api';

const mapLeave = (l) => {
  if (!l) return null;
  const user = l.user || {};
  return {
    id: l._id,
    employeeId: typeof user === 'string' ? user : user._id,
    employeeName: user.fullname || 'Unknown',
    email: user.email || '',
    department: user.department || 'Unassigned',
    position: user.position || '',
    type: l.leaveType,
    startDate: l.startDate ? l.startDate.split('T')[0] : '',
    endDate: l.endDate ? l.endDate.split('T')[0] : '',
    reason: l.reason || '',
    status: l.status,
    appliedOn: l.createdAt ? l.createdAt.split('T')[0] : '',
    approvedBy: null,
  };
};

export const leaveService = {
  /**
   * Get all leave requests (admin) — supports server-side pagination + filters.
   * @param {{ page?, limit?, status?, employeeId? }} options
   */
  async getAll({ page = 1, limit = 20, status, employeeId } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (status) params.set('status', status);
    if (employeeId) params.set('employeeId', employeeId);

    const { data: res } = await api.get(`/admin/leaves?${params.toString()}`);
    return {
      data: (res.data || []).map(mapLeave),
      total: res.total || 0,
      page: res.page || 1,
      pages: res.pages || 1,
    };
  },

  /**
   * FIX: No longer fetches ALL leaves to filter client-side.
   * Passes employeeId to the server so only that employee's records come back.
   */
  async getByEmployee(employeeId, { page = 1, limit = 20 } = {}) {
    return this.getAll({ employeeId, page, limit });
  },

  /**
   * FIX: No longer fetches ALL leaves and filters for pending in JS.
   * Server now returns only pending records.
   */
  async getPending({ page = 1, limit = 20 } = {}) {
    return this.getAll({ status: 'pending', page, limit });
  },

  /** Get leave history for current logged-in user with pagination */
  async getMyLeaves({ page = 1, limit = 20, status } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (status) params.set('status', status);

    const { data: res } = await api.get(`/user/leave-history?${params.toString()}`);
    return {
      data: (res.data || []).map(mapLeave),
      total: res.total || 0,
      page: res.page || 1,
      pages: res.pages || 1,
    };
  },

  /** Create a new leave request (user) */
  async create(leaveData) {
    const payload = {
      leaveType: leaveData.type || leaveData.leaveType,
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      reason: leaveData.reason,
    };
    const { data: res } = await api.post('/user/leave-request', payload);
    return mapLeave(res.data);
  },

  /** Approve a leave request (admin) */
  async approve(leaveId) {
    const { data: res } = await api.put(`/admin/leaves/${leaveId}/review`, { action: 'approved' });
    return mapLeave(res.data);
  },

  /** Reject a leave request (admin) */
  async reject(leaveId) {
    const { data: res } = await api.put(`/admin/leaves/${leaveId}/review`, { action: 'declined' });
    return mapLeave(res.data);
  },

  async cancel(leaveId) {
    return this.reject(leaveId);
  },

  /** Get leave balance for the current user */
  async getBalance() {
    const { data: res } = await api.get('/user/leave-balance');
    const balances = res.data || {};
    return {
      annual: { total: balances.annual?.allotted ?? 20, used: (balances.annual?.allotted ?? 20) - (balances.annual?.left ?? 20), left: balances.annual?.left ?? 20 },
      sick: { total: balances.sick?.allotted ?? 12, used: (balances.sick?.allotted ?? 12) - (balances.sick?.left ?? 12), left: balances.sick?.left ?? 12 },
      personal: { total: balances.personal?.allotted ?? 7, used: (balances.personal?.allotted ?? 7) - (balances.personal?.left ?? 7), left: balances.personal?.left ?? 7 },
    };
  },
};

export default leaveService;