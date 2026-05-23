/**
 * Leave Service — Connects to Node.js/Express/MongoDB backend.
 *
 * User endpoints:  POST /user/leave-request, GET /user/leave-history, GET /user/leave-balance
 * Admin endpoints: GET  /admin/leaves, PUT /admin/leaves/:id/review
 */
import api from './api';

/* ── Mappers ── */

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
  /** Get all leave requests (admin) */
  async getAll() {
    const { data: res } = await api.get('/admin/leaves');
    return (res.data || []).map(mapLeave);
  },

  /** Get leaves for a specific employee (admin, filtered client-side) */
  async getByEmployee(employeeId) {
    const all = await this.getAll();
    return all.filter((l) => l.employeeId === employeeId);
  },

  /** Get pending leave requests (admin) */
  async getPending() {
    const all = await this.getAll();
    return all.filter((l) => l.status === 'pending');
  },

  /** Get leave history for current logged-in user */
  async getMyLeaves() {
    const { data: res } = await api.get('/user/leave-history');
    return (res.data || []).map(mapLeave);
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

  /** Cancel a leave request — not supported server-side, reject instead */
  async cancel(leaveId) {
    return this.reject(leaveId);
  },

  /** Get leave balance for the current user */
  async getBalance() {
    const { data: res } = await api.get('/user/leave-balance');
    const balances = res.data || {};

    // Normalize to frontend expected shape
    return {
      annual: { total: balances.annual?.total ?? 20, used: balances.annual?.used ?? 0, left: balances.annual?.left ?? 20 },
      sick: { total: balances.sick?.total ?? 10, used: balances.sick?.used ?? 0, left: balances.sick?.left ?? 10 },
      personal: { total: balances.personal?.total ?? 5, used: balances.personal?.used ?? 0, left: balances.personal?.left ?? 5 },
    };
  },
};

export default leaveService;
