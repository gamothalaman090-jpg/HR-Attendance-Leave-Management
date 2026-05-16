import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Meta from '@/components/common/Meta';
import { useForm } from 'react-hook-form';
import {
  CalendarOff, Plus, Search,
  CheckCircle2, XCircle, AlertTriangle, Eye, Clock, Check, X
} from 'lucide-react';
import { Badge, Modal, Button, SkeletonTable } from '@/components/ui';
import { LEAVE_TYPES } from '@/utils/constants';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/utils/helpers';
import { isEndDateAfterStart } from '@/utils/validators';
import {
  useLeaves,
  useLeaveBalance,
  useCreateLeave,
  useApproveLeave,
  useRejectLeave,
} from '@/hooks/useLeaves';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import RequireRole from '@/components/common/RequireRole';

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

function LeaveTableSkeleton() {
  return (
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
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-border last:border-0 animate-pulse">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-alt shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <div className="w-24 h-4 bg-surface-alt rounded mb-1"></div>
                    <div className="w-32 h-3 bg-surface-alt rounded sm:hidden"></div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"><div className="w-16 h-4 bg-surface-alt rounded"></div></td>
              <td className="px-4 py-3 hidden sm:table-cell"><div className="w-24 h-4 bg-surface-alt rounded"></div></td>
              <td className="px-4 py-3 hidden md:table-cell"><div className="w-8 h-4 bg-surface-alt rounded"></div></td>
              <td className="px-4 py-3"><div className="w-16 h-6 bg-surface-alt rounded-full"></div></td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <div className="w-6 h-6 bg-surface-alt rounded-[6px]"></div>
                  <div className="w-6 h-6 bg-surface-alt rounded-[6px]"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LeavePage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const isHR = ['hr', 'admin', 'manager'].some(r => user?.role?.toLowerCase().includes(r));

  const [activeTab, setActiveTab] = useState(isHR ? 'team' : 'my');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [overlapError, setOverlapError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowRequestModal(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  /* ── TanStack Query Hooks ── */
  const { data: leaves = [], isLoading: loading } = useLeaves();
  const { data: balance } = useLeaveBalance();
  const createMutation = useCreateLeave();
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();

  /* ── Filter leaves ── */
  const filteredLeaves = leaves.filter((l) => {
    // Role-based filtering
    if (!isHR) {
      if (l.employeeName !== user?.name) return false;
    } else if (activeTab === 'my') {
      if (l.employeeName !== user?.name) return false;
    }

    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.employeeName.toLowerCase().includes(q) || l.type.toLowerCase().includes(q);
    }
    return true;
  });

  /* ── Submit new request ── */
  const onSubmit = async (data) => {
    setOverlapError(null);
    try {
      const startDate = data.startDate;
      const endDate = data.endDate || data.startDate;
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end - start) / 86400000) + 1;

      await createMutation.mutateAsync({
        employeeId: 'emp-001',
        employeeName: 'Alex Rivera',
        type: data.type,
        startDate,
        endDate,
        days,
        reason: data.reason,
      });

      addNotification({
        type: 'leave',
        title: 'Leave Requested',
        message: `Your ${data.type} leave request has been submitted successfully.`,
      });

      setShowRequestModal(false);
      reset();
    } catch (err) {
      if (err.code === 'LEAVE_OVERLAP') {
        setOverlapError(err.message);
      } else {
        setOverlapError('An unexpected error occurred. Please try again.');
      }
    }
  };


  /* ── Approve/Reject ── */
  const handleAction = async (leaveId, action) => {
    if (action === 'approve') {
      await approveMutation.mutateAsync({ id: leaveId, approver: 'Alex Rivera' });
      addNotification({
        type: 'leave',
        title: 'Leave Approved',
        message: 'Leave request has been approved successfully.',
      });
    } else {
      await rejectMutation.mutateAsync({ id: leaveId, approver: 'Alex Rivera' });
      addNotification({
        type: 'leave',
        title: 'Leave Rejected',
        message: 'Leave request has been rejected.',
      });
    }
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
        <Button
          onClick={() => setShowRequestModal(true)}
          className="shrink-0"
          leftIcon={<Plus size={16} />}
        >
          Request Leave
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
        {isHR ? (
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
        ) : (
          <h2 className="font-heading text-h4 font-bold">My Leave Requests</h2>
        )}

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
          <LeaveTableSkeleton />
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedLeave(req);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 rounded-[6px] text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                          title="View Details"
                          aria-label="View leave details"
                        >
                          <Eye size={18} />
                        </button>
                        {req.status === 'pending' && isHR && (
                          <>
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
                          </>
                        )}
                      </div>
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
        onClose={() => { setShowRequestModal(false); reset(); setOverlapError(null); }}
        title="Request Leave"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowRequestModal(false); reset(); setOverlapError(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={createMutation.isPending}>
              Submit Request
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {/* Overlap / server error banner */}
          {overlapError && (
            <div className="flex items-start gap-3 p-3 rounded-[10px] bg-danger/10 border border-danger/20">
              <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" />
              <p className="text-body-sm text-danger">{overlapError}</p>
            </div>
          )}
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
                {...register('endDate', {
                  required: 'End date is required',
                  validate: (endDate) => {
                    const startDate = watch('startDate');
                    return isEndDateAfterStart(startDate, endDate) ||
                      'End date must be on or after the start date';
                  },
                })}
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

      {/* Leave Details & Audit Trail Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedLeave(null); }}
        title="Leave Details & Audit Trail"
        size="md"
        footer={
          <Button variant="secondary" onClick={() => { setShowDetailsModal(false); setSelectedLeave(null); }}>
            Close
          </Button>
        }
      >
        {selectedLeave && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-surface-alt rounded-[12px] p-4 border border-border">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-body font-bold text-text">{selectedLeave.employeeName}</h4>
                  <p className="text-caption text-text-muted capitalize">{selectedLeave.type} Leave</p>
                </div>
                <Badge variant={BADGE_VARIANT[selectedLeave.status] || 'default'}>
                  {selectedLeave.status.charAt(0).toUpperCase() + selectedLeave.status.slice(1)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-body-sm">
                <div>
                  <span className="text-text-muted block text-caption">Dates</span>
                  <span className="font-medium text-text">{formatDate(selectedLeave.startDate)} — {formatDate(selectedLeave.endDate)}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-caption">Total Days</span>
                  <span className="font-medium text-text">{selectedLeave.days} Day(s)</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border text-body-sm">
                <span className="text-text-muted block text-caption">Reason</span>
                <p className="text-text mt-1">{selectedLeave.reason}</p>
              </div>
            </div>

            {/* Audit Trail Timeline */}
            <div>
              <h4 className="text-body-sm font-bold text-text mb-4 uppercase tracking-wider">Audit Trail</h4>
              <div className="relative pl-3">
                {/* Connecting Line */}
                <div className="absolute left-[28px] top-2 bottom-2 w-px bg-border"></div>

                <div className="space-y-6">
                  {/* Step 1: Submitted */}
                  <div className="relative flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-surface ring-4 ring-surface flex items-center justify-center shrink-0 z-10 relative">
                      <div className="absolute inset-0 rounded-full bg-primary/10"></div>
                      <Clock size={14} className="text-primary relative z-10" />
                    </div>
                    <div className="pt-1.5">
                      <p className="text-body-sm font-bold text-text">Request Submitted</p>
                      <p className="text-caption text-text-muted">{selectedLeave.createdAt ? formatDate(selectedLeave.createdAt) : formatDate(selectedLeave.startDate)} by {selectedLeave.employeeName}</p>
                    </div>
                  </div>

                  {/* Step 2: Review/Decision */}
                  {selectedLeave.status === 'pending' && (
                    <div className="relative flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-surface ring-4 ring-surface flex items-center justify-center shrink-0 z-10 relative">
                        <div className="absolute inset-0 rounded-full bg-surface-alt"></div>
                        <div className="w-2 h-2 rounded-full bg-text-muted/50 relative z-10"></div>
                      </div>
                      <div className="pt-1.5">
                        <p className="text-body-sm font-medium text-text-muted">Pending Review</p>
                        <p className="text-caption text-text-muted/50">Waiting for manager approval</p>
                      </div>
                    </div>
                  )}

                  {selectedLeave.status === 'approved' && (
                    <div className="relative flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-surface ring-4 ring-surface flex items-center justify-center shrink-0 z-10 relative">
                        <div className="absolute inset-0 rounded-full bg-success/10"></div>
                        <Check size={14} className="text-success relative z-10" />
                      </div>
                      <div className="pt-1.5">
                        <p className="text-body-sm font-bold text-text">Request Approved</p>
                        <p className="text-caption text-text-muted">Approved by Manager</p>
                      </div>
                    </div>
                  )}

                  {selectedLeave.status === 'rejected' && (
                    <div className="relative flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-surface ring-4 ring-surface flex items-center justify-center shrink-0 z-10 relative">
                        <div className="absolute inset-0 rounded-full bg-danger/10"></div>
                        <X size={14} className="text-danger relative z-10" />
                      </div>
                      <div className="pt-1.5">
                        <p className="text-body-sm font-bold text-text">Request Rejected</p>
                        <p className="text-caption text-text-muted">Rejected by Manager</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
