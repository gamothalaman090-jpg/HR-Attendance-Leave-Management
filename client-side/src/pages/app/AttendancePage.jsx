import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Meta from '@/components/common/Meta';
import {
  Clock, LogIn, LogOut, Calendar, BarChart3,
  CheckCircle, XCircle, AlertCircle, Sun, Edit, Search, Users, Check
} from 'lucide-react';
import { attendanceService } from '@/services/attendanceService';
import { employeeService } from '@/services/employeeService';
import { Modal, Button, Badge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/helpers';
import { downloadCSV } from '@/utils/helpers';

const STATUS_STYLES = {
  present: { bg: 'bg-success/15', text: 'text-success', label: 'Present' },
  absent: { bg: 'bg-danger/15', text: 'text-danger', label: 'Absent' },
  leave: { bg: 'bg-primary/15', text: 'text-primary', label: 'Leave' },
  holiday: { bg: 'bg-accent/15', text: 'text-accent', label: 'Holiday' },
  late: { bg: 'bg-warning/15', text: 'text-warning', label: 'Late' },
  'half-day': { bg: 'bg-secondary/15', text: 'text-secondary', label: 'Half Day' },
  weekend: { bg: 'bg-surface-alt', text: 'text-text-muted', label: 'Weekend' },
  upcoming: { bg: 'bg-surface', text: 'text-text-muted', label: '—' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function AttendancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'staff'
  const isHighRanking = user?.role?.toLowerCase().match(/(admin|manager|hr)/);

  /* ── Personal View State ── */
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [clockStatus, setClockStatus] = useState({ isClockedIn: false, clockInTime: null, clockOutTime: null });
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const timerRef = useRef(null);

  /* ── Staff View State ── */
  const [staffList, setStaffList] = useState([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [staffRecords, setStaffRecords] = useState([]);
  const [allAttendance, setAllAttendance] = useState({});
  const [adjustTarget, setAdjustTarget] = useState(null); // { employeeId, record }
  const [adjustForm, setAdjustForm] = useState({
    status: 'present',
    clockIn: '09:00',
    clockOut: '17:00',
    hours: 8
  });

  const today = new Date();

  useEffect(() => {
    if (searchParams.get('action') === 'clock') {
      setShowConfirmModal(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Load personal data
  const loadPersonalData = async () => {
    setLoading(true);
    try {
      const [recs, sum, status] = await Promise.all([
        attendanceService.getMonthly(),
        attendanceService.getSummary(),
        attendanceService.getClockStatus(),
      ]);
      setRecords(recs);
      setSummary(sum);
      setClockStatus(status);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load staff data
  const loadStaffData = async () => {
    setLoading(true);
    try {
      const [employees, allAtt] = await Promise.all([
        employeeService.getAll(),
        attendanceService.getAllEmployeesAttendance()
      ]);
      const actives = employees.filter(e => e.status === 'active');
      setStaffList(actives);
      setAllAttendance(allAtt);
      
      // Auto select first staff member if none selected
      if (actives.length > 0 && !selectedStaffId) {
        setSelectedStaffId(actives[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'personal') {
      loadPersonalData();
    } else {
      loadStaffData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedStaffId && allAttendance[selectedStaffId]) {
      setStaffRecords(allAttendance[selectedStaffId]);
    } else {
      setStaffRecords([]);
    }
  }, [selectedStaffId, allAttendance]);

  /* ── Timer for clocked-in duration ── */
  useEffect(() => {
    if (clockStatus.isClockedIn) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [clockStatus.isClockedIn]);

  const formatElapsed = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleClock = async () => {
    setClocking(true);
    try {
      if (clockStatus.isClockedIn) {
        const result = await attendanceService.clockOut();
        setClockStatus(result);
      } else {
        const result = await attendanceService.clockIn();
        setClockStatus(result);
      }
      setShowConfirmModal(false);
      loadPersonalData();
    } finally {
      setClocking(false);
    }
  };

  const handleExport = () => {
    const data = records
      .filter((r) => !['weekend', 'upcoming'].includes(r.status))
      .map((r) => ({
        Date: r.date,
        Status: STATUS_STYLES[r.status]?.label || r.status,
        'Clock In': r.clockIn || '—',
        'Clock Out': r.clockOut || '—',
        Hours: r.hours || 0,
      }));
    downloadCSV(data, `attendance-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}.csv`);
  };

  const handleOpenAdjust = (rec) => {
    setAdjustTarget(rec);
    setAdjustForm({
      status: rec.status === 'upcoming' || rec.status === 'weekend' ? 'present' : rec.status,
      clockIn: rec.clockIn || '09:00',
      clockOut: rec.clockOut || '17:00',
      hours: rec.hours || 8
    });
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustTarget) return;

    try {
      await attendanceService.adjustAttendance({
        employeeId: selectedStaffId,
        dateStr: adjustTarget.date,
        data: adjustForm
      });
      setAdjustTarget(null);
      loadStaffData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter staff by search box
  const filteredStaff = staffList.filter(s =>
    s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.id.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.department.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const selectedStaffMember = staffList.find(s => s.id === selectedStaffId);

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  return (
    <div>
      <Meta title="Attendance Management" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-h2 font-bold mb-1">Time & Attendance</h1>
          <p className="text-text-muted text-body">Manage clock activity, schedules, and timesheet adjustments.</p>
        </div>
        {activeTab === 'personal' && (
          <button
            onClick={handleExport}
            className="text-body-sm font-semibold text-primary hover:text-primary-light transition-colors border border-primary/20 bg-primary/5 px-4 py-2 rounded-[8px] cursor-pointer"
          >
            Export Timesheet CSV
          </button>
        )}
      </div>

      {/* Tabs */}
      {isHighRanking && (
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab('personal')}
            className={cn(
              'px-5 py-3 text-body-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'personal'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text'
            )}
          >
            <Clock size={16} />
            My Attendance
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={cn(
              'px-5 py-3 text-body-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'staff'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text'
            )}
          >
            <Users size={16} />
            Staff Timesheets
          </button>
        </div>
      )}

      {/* Content Rendering */}
      {activeTab === 'personal' ? (
        <>
          {/* Clock In/Out + Summary Row */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Clock Widget */}
            <div className="p-6 rounded-[16px] bg-surface border border-border text-center flex flex-col justify-between shadow-card">
              <div>
                <div className="text-body-sm text-text-muted mb-2">
                  {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                <div className="font-heading text-display font-bold text-text mb-1">
                  {clockStatus.isClockedIn ? formatElapsed(elapsed) : today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {clockStatus.clockInTime && (
                  <div className="text-caption text-text-muted mb-4">
                    Clocked in at {clockStatus.clockInTime}
                    {clockStatus.clockOutTime && ` · Out at ${clockStatus.clockOutTime}`}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowConfirmModal(true)}
                className={cn(
                  'w-full py-3 rounded-[10px] text-body font-semibold transition-all duration-base cursor-pointer',
                  clockStatus.isClockedIn
                    ? 'bg-danger text-white hover:bg-danger-light shadow-glow-accent'
                    : 'bg-primary text-white hover:bg-primary-light shadow-glow-primary'
                )}
              >
                {clockStatus.isClockedIn ? (
                  <span className="flex items-center justify-center gap-2"><LogOut size={18} /> Clock Out</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><LogIn size={18} /> Clock In</span>
                )}
              </button>
            </div>

            {/* Summary Cards */}
            {summary && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Present', value: summary.presentDays, icon: CheckCircle, color: 'success' },
                    { label: 'Absent', value: summary.absentDays, icon: XCircle, color: 'danger' },
                    { label: 'Late', value: summary.lateDays, icon: AlertCircle, color: 'warning' },
                    { label: 'On Leave', value: summary.leaveDays, icon: Calendar, color: 'primary' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="p-4 rounded-[12px] bg-surface border border-border">
                      <div className={cn(
                        'w-8 h-8 rounded-[8px] flex items-center justify-center mb-2',
                        color === 'success' && 'bg-success/10 text-success',
                        color === 'danger' && 'bg-danger/10 text-danger',
                        color === 'warning' && 'bg-warning/10 text-warning',
                        color === 'primary' && 'bg-primary/10 text-primary',
                      )}>
                        <Icon size={16} />
                      </div>
                      <div className="text-h4 font-heading font-bold">{value}</div>
                      <div className="text-caption text-text-muted">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="p-6 rounded-[16px] bg-surface border border-border flex flex-col justify-center shadow-card">
                  <div className="text-body-sm text-text-muted mb-1">Attendance Rate</div>
                  <div className="text-display font-heading font-bold text-primary mb-2">
                    {Math.min(summary.attendanceRate, 100)}%
                  </div>
                  <div className="w-full h-3 bg-surface-alt rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-slow"
                      style={{ width: `${Math.min(summary.attendanceRate, 100)}%` }}
                    />
                  </div>
                  <div className="text-caption text-text-muted mt-2">
                    {summary.totalHours} hrs total · {summary.avgHoursPerDay} hrs/day avg
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Monthly Calendar Grid */}
          <div className="bg-surface border border-border rounded-[16px] p-6 shadow-card">
            <h2 className="font-heading text-h4 font-bold mb-4">
              {MONTHS[today.getMonth()]} {today.getFullYear()}
            </h2>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-caption font-semibold text-text-muted py-1">{d}</div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Day cells */}
              {records.map((rec) => {
                const style = STATUS_STYLES[rec.status] || STATUS_STYLES.upcoming;
                const isToday = rec.day === today.getDate();
                return (
                  <div
                    key={rec.day}
                    className={cn(
                      'aspect-square rounded-[8px] flex flex-col items-center justify-center text-center transition-all',
                      style.bg,
                      isToday && 'ring-2 ring-primary ring-offset-1',
                    )}
                    title={`${style.label}${rec.clockIn ? ` · ${rec.clockIn} — ${rec.clockOut}` : ''}`}
                  >
                    <span className={cn('text-body-sm font-medium', isToday ? 'text-primary font-bold' : style.text)}>
                      {rec.day}
                    </span>
                    <span className={cn('text-[10px] leading-tight', style.text, 'hidden sm:block')}>
                      {rec.status !== 'upcoming' && rec.status !== 'weekend' ? style.label : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
              {Object.entries(STATUS_STYLES)
                .filter(([key]) => !['weekend', 'upcoming'].includes(key))
                .map(([key, { bg, text, label }]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={cn('w-3 h-3 rounded-full', bg, text)} />
                    <span className="text-caption text-text-muted">{label}</span>
                  </div>
                ))}
            </div>
          </div>
        </>
      ) : (
        /* ── Staff Timesheets View ── */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left panel: Employee Directory selector */}
          <div className="lg:col-span-1 bg-surface border border-border rounded-[16px] p-4 flex flex-col max-h-[80vh] shadow-card">
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search staff..."
                value={staffSearch}
                onChange={e => setStaffSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-[8px] text-body-sm text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>
            
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {filteredStaff.length === 0 ? (
                <p className="text-caption text-text-muted text-center py-4">No employees match.</p>
              ) : (
                filteredStaff.map(emp => (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedStaffId(emp.id)}
                    className={cn(
                      'p-3 rounded-[10px] border cursor-pointer transition-all flex items-center justify-between',
                      selectedStaffId === emp.id
                        ? 'border-primary/30 bg-primary/5 text-primary'
                        : 'border-transparent hover:bg-surface-alt text-text'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-body-sm font-semibold truncate">{emp.name}</div>
                      <div className="text-caption text-text-muted truncate">{emp.role}</div>
                    </div>
                    {selectedStaffId === emp.id && (
                      <Check size={14} className="shrink-0 text-primary" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right panel: Calendar override grid */}
          <div className="lg:col-span-3 bg-surface border border-border rounded-[16px] p-6 shadow-card">
            {selectedStaffMember ? (
              <div>
                <div className="flex justify-between items-start pb-4 border-b border-border mb-6">
                  <div>
                    <h2 className="text-h3 font-heading font-bold text-text mb-0.5">{selectedStaffMember.name}</h2>
                    <p className="text-body-sm text-text-muted">{selectedStaffMember.role} • {selectedStaffMember.department}</p>
                  </div>
                  <Badge variant="default" className="font-mono">
                    ID: {selectedStaffMember.id}
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface-alt/30 text-caption font-semibold text-text-muted uppercase tracking-wider">
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Clock In</th>
                        <th className="px-4 py-2.5">Clock Out</th>
                        <th className="px-4 py-2.5">Hours</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 text-body-sm">
                      {staffRecords
                        .filter(r => r.status !== 'weekend' && r.status !== 'upcoming')
                        .map(rec => {
                          const style = STATUS_STYLES[rec.status] || STATUS_STYLES.upcoming;
                          return (
                            <tr key={rec.date} className="hover:bg-surface-alt/20 transition-colors">
                              <td className="px-4 py-3 font-medium text-text">{rec.date}</td>
                              <td className="px-4 py-3">
                                <span className={cn('px-2.5 py-0.5 rounded-full text-caption font-bold border border-transparent', style.bg, style.text)}>
                                  {style.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-text-muted">{rec.clockIn || '—'}</td>
                              <td className="px-4 py-3 font-mono text-text-muted">{rec.clockOut || '—'}</td>
                              <td className="px-4 py-3 font-semibold text-text">{rec.hours || 0} hrs</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleOpenAdjust(rec)}
                                  className="p-1.5 rounded-full border border-border hover:bg-primary/10 hover:border-primary/20 hover:text-primary text-text-muted transition-all cursor-pointer inline-flex items-center gap-1 text-caption font-medium px-3"
                                >
                                  <Edit size={12} /> Override
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-text-muted">
                <Users size={40} className="mx-auto mb-3 text-text-muted/40" />
                Select an employee from the staff panel directory.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Personal Clock Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={clockStatus.isClockedIn ? "Confirm Clock Out" : "Confirm Clock In"}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              variant={clockStatus.isClockedIn ? "danger" : "primary"}
              onClick={handleClock}
              loading={clocking}
            >
              {clockStatus.isClockedIn ? "Yes, Clock Out" : "Yes, Clock In"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-body text-text-muted">
            {clockStatus.isClockedIn
              ? `You are about to clock out. Your elapsed time is ${formatElapsed(elapsed)}.`
              : `You are about to clock in for ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`}
          </p>
          <p className="text-body font-medium text-text">
            Are you sure you want to proceed?
          </p>
        </div>
      </Modal>

      {/* Staff Override Adjust Modal */}
      {adjustTarget && (
        <Modal
          isOpen={!!adjustTarget}
          onClose={() => setAdjustTarget(null)}
          title={`Override Attendance for ${adjustTarget.date}`}
          size="md"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div>
              <label className="block text-body-sm font-medium text-text mb-1.5">Adjustment Status</label>
              <select
                value={adjustForm.status}
                onChange={e => setAdjustForm({ ...adjustForm, status: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="leave">Leave</option>
                <option value="half-day">Half Day</option>
              </select>
            </div>

            {['present', 'late', 'half-day'].includes(adjustForm.status) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-sm font-medium text-text mb-1.5">Clock In</label>
                    <input
                      type="text"
                      placeholder="e.g. 09:00 AM"
                      value={adjustForm.clockIn}
                      onChange={e => setAdjustForm({ ...adjustForm, clockIn: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-text mb-1.5">Clock Out</label>
                    <input
                      type="text"
                      placeholder="e.g. 05:00 PM"
                      value={adjustForm.clockOut}
                      onChange={e => setAdjustForm({ ...adjustForm, clockOut: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-text mb-1.5">Total Hours Worked</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={adjustForm.hours}
                    onChange={e => setAdjustForm({ ...adjustForm, hours: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="px-4 py-2 rounded-[10px] font-medium text-text hover:bg-border/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-[10px] font-semibold text-white bg-primary hover:bg-primary-light transition-all cursor-pointer"
              >
                Apply Correction
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
