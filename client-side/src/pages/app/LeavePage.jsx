import { useState, useEffect, useCallback } from 'react';
import Meta from '@/components/common/Meta';
import { useForm } from 'react-hook-form';
import {
  CalendarOff, Plus, Filter, Search,
  Calendar, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { Badge, Modal, Button, Input, Select, Textarea, SkeletonTable } from '@/components/ui';
import { LEAVE_TYPES, LEAVE_STATUS } from '@/utils/constants';
import { leaveService } from '@/services/leaveService';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/utils/helpers';

const TAB_ITEMS = [
  { id: 'my', label: 'My Leaves' },
  { id: 'team', label: 'Team Leaves' },
];

const STATUS_FILTER = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const BADGE_VARIANT = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'default',
};

export default function LeavePage() {
  const [activeTab, setActiveTab] = useState('team');
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  /* ── Fetch data ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allLeaves, bal] = await Promise.all([
        leaveService.getAll(),
        leaveService.getBalance(),
      ]);
      setLeaves(allLeaves);
      setBalance(bal);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Filter leaves ── */
  const filteredLeaves = leaves.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.employeeName.toLowerCase().includes(q) || l.type.toLowerCase().includes(q);
    }
    return true;
  });

  /* ── Submit new request ── */
  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const startDate = data.startDate;
      const endDate = data.endDate || data.startDate;
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end - start) / 86400000) + 1;

      await leaveService.create({
        employeeId: 'emp-001',
        employeeName: 'Alex Rivera',
        type: data.type,
        startDate,
        endDate,
        days,
        reason: data.reason,
      });

      setShowRequestModal(false);
      reset();
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Approve/Reject ── */
  const handleAction = async (leaveId, action) => {
    if (action === 'approve') await leaveService.approve(leaveId);
    else await leaveService.reject(leaveId);
    loadData();
  };

  /* ── Balance cards ── */
  const balanceCards = balance
    ? [
        { label: 'Annual', used: balance.annual.used, total: balance.annual.total, remaining: balance.annual.remaining, color: 'primary' },
        { label: 'Sick', used: balance.sick.used, total: balance.sick.total, remaining: balance.sick.remaining, color: 'danger' },
        { label: 'Personal', used: balance.personal.used, total: balance.personal.total, remaining: balance.personal.remaining, color: 'secondary' },
      ]
    : [];

  return (
    <div>
      <Meta title="Leaves" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-h2 font-bold mb-1">Leave Management</h1>
          <p className="text-text-muted text-body">Request, track, and manage team leave.</p>
        </div>
        <Button onClick={() => setShowRequestModal(true)} className="shrink-0">
          <Plus size={16} className="mr-1.5" /> Request Leave
        </Button>
      </div>

      {/* Leave Balance Cards */}
      {balanceCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {balanceCards.map(({ label, used, total, remaining, color }) => (
            <div key={label} className="p-4 rounded-[16px] bg-surface border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-body-sm font-medium text-text-muted">{label} Leave</span>
                <span className={cn(
                  'text-caption font-semibold px-2 py-0.5 rounded-full',
                  color === 'primary' && 'bg-primary/10 text-primary',
                  color === 'danger' && 'bg-danger/10 text-danger',
                  color === 'secondary' && 'bg-secondary/10 text-secondary',
                )}>{remaining} left</span>
              </div>
              <div className="text-h3 font-heading font-bold mb-2">{remaining}<span className="text-body-sm text-text-muted font-normal">/{total}</span></div>
              <div className="w-full h-2 bg-surface-alt rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-slow',
                    color === 'primary' && 'bg-primary',
                    color === 'danger' && 'bg-danger',
                    color === 'secondary' && 'bg-secondary',
                  )}
                  style={{ width: `${(remaining / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        {/* Tabs */}
        <div className="flex bg-surface-alt rounded-[10px] p-1">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-[8px] text-body-sm font-medium transition-all cursor-pointer',
                activeTab === tab.id
                  ? 'bg-surface text-text shadow-card'
                  : 'text-text-muted hover:text-text'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-surface border border-border rounded-[8px] text-body-sm text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all w-44"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface border border-border rounded-[8px] text-body-sm text-text cursor-pointer focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          >
            {STATUS_FILTER.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-surface border border-border rounded-[16px] overflow-hidden">
        {loading ? (
          <SkeletonTable rows={6} cols={5} />
        ) : filteredLeaves.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarOff size={40} className="mx-auto mb-3 text-text-muted/50" />
            <p className="text-text-muted">No leave requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Employee</th>
                  <th className="text-left px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Dates</th>
                  <th className="text-left px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Days</th>
                  <th className="text-left px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((req) => (
                  <tr key={req.id} className="border-b border-border last:border-0 hover:bg-surface-alt/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-body-sm font-bold shrink-0">
                          {req.employeeName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-body-sm font-medium text-text truncate">{req.employeeName}</div>
                          <div className="text-caption text-text-muted sm:hidden">{formatDate(req.startDate)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-body-sm text-text capitalize">{req.type}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-body-sm text-text-muted">
                        {formatDate(req.startDate)} — {formatDate(req.endDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-body-sm text-text">{req.days}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={BADGE_VARIANT[req.status] || 'default'}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleAction(req.id, 'approve')}
                            className="p-1.5 rounded-[6px] text-success hover:bg-success/10 transition-colors cursor-pointer"
                            title="Approve"
                            aria-label="Approve leave request"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'reject')}
                            className="p-1.5 rounded-[6px] text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                            title="Reject"
                            aria-label="Reject leave request"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-caption text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leave Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => { setShowRequestModal(false); reset(); }}
        title="Request Leave"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowRequestModal(false); reset(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={submitting}>
              Submit Request
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-body-sm font-medium text-text mb-1">Leave Type</label>
            <select
              {...register('type', { required: 'Please select a leave type' })}
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-[8px] text-body text-text focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            >
              <option value="">Select type...</option>
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.type && <p className="text-caption text-danger mt-1">{errors.type.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-medium text-text mb-1">Start Date</label>
              <input
                type="date"
                {...register('startDate', { required: 'Start date is required' })}
                className="w-full px-3 py-2.5 bg-bg border border-border rounded-[8px] text-body text-text focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
              {errors.startDate && <p className="text-caption text-danger mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-body-sm font-medium text-text mb-1">End Date</label>
              <input
                type="date"
                {...register('endDate', { required: 'End date is required' })}
                className="w-full px-3 py-2.5 bg-bg border border-border rounded-[8px] text-body text-text focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
              {errors.endDate && <p className="text-caption text-danger mt-1">{errors.endDate.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-text mb-1">Reason</label>
            <textarea
              {...register('reason', { required: 'Please provide a reason', minLength: { value: 10, message: 'Min 10 characters' } })}
              rows={3}
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none"
              placeholder="Brief reason for your leave request..."
            />
            {errors.reason && <p className="text-caption text-danger mt-1">{errors.reason.message}</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
}
