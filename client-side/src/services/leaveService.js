/**
 * Leave Service — Mock CRUD for leave requests.
 */
import { LEAVE_REQUESTS, MY_LEAVE_BALANCE } from '@/data/leaves';
import { sleep, generateId } from '@/utils/helpers';

let _leaves = [...LEAVE_REQUESTS];

export const leaveService = {
  /** Get all leave requests */
  async getAll() {
    await sleep(400);
    return [..._leaves].sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
  },

  /** Get leaves for a specific employee */
  async getByEmployee(employeeId) {
    await sleep(300);
    return _leaves.filter((l) => l.employeeId === employeeId);
  },

  /** Get pending leave requests */
  async getPending() {
    await sleep(300);
    return _leaves.filter((l) => l.status === 'pending');
  },

  /** Create a new leave request */
  async create(leaveData) {
    await sleep(600);
    const newLeave = {
      id: generateId('lv'),
      ...leaveData,
      status: 'pending',
      appliedOn: new Date().toISOString().split('T')[0],
      approvedBy: null,
    };
    _leaves = [newLeave, ..._leaves];
    return newLeave;
  },

  /** Approve a leave request */
  async approve(leaveId, approverName = 'Alex Rivera') {
    await sleep(400);
    _leaves = _leaves.map((l) =>
      l.id === leaveId ? { ...l, status: 'approved', approvedBy: approverName } : l
    );
    return _leaves.find((l) => l.id === leaveId);
  },

  /** Reject a leave request */
  async reject(leaveId, approverName = 'Alex Rivera') {
    await sleep(400);
    _leaves = _leaves.map((l) =>
      l.id === leaveId ? { ...l, status: 'rejected', approvedBy: approverName } : l
    );
    return _leaves.find((l) => l.id === leaveId);
  },

  /** Cancel a leave request */
  async cancel(leaveId) {
    await sleep(300);
    _leaves = _leaves.map((l) =>
      l.id === leaveId ? { ...l, status: 'cancelled' } : l
    );
    return _leaves.find((l) => l.id === leaveId);
  },

  /** Get leave balance for the current user */
  async getBalance() {
    await sleep(200);
    return { ...MY_LEAVE_BALANCE };
  },
};

export default leaveService;
