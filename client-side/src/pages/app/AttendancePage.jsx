import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Meta from '@/components/common/Meta';
import {
  Clock, LogIn, LogOut, Calendar, BarChart3,
  CheckCircle, XCircle, AlertCircle, Sun,
} from 'lucide-react';
import { attendanceService } from '@/services/attendanceService';
import { Modal, Button } from '@/components/ui';
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
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [clockStatus, setClockStatus] = useState({ isClockedIn: false, clockInTime: null, clockOutTime: null });
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const timerRef = useRef(null);

  const today = new Date();

  useEffect(() => {
    if (searchParams.get('action') === 'clock') {
      setShowConfirmModal(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [recs, sum, status] = await Promise.all([
        attendanceService.getMonthly(),
        attendanceService.getSummary(),
        attendanceService.getClockStatus(),
      ]);
      setRecords(recs);
      setSummary(sum);
      setClockStatus(status);
      setLoading(false);
    })();
  }, []);

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
    } finally {
      setClocking(false);
    }
  };

  /* ── Calendar grid ── */
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

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

  return (
    <div>
      <Meta title="Attendance" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-h2 font-bold mb-1">Attendance</h1>
          <p className="text-text-muted text-body">Track your clock in/out and attendance records.</p>
        </div>
        <button
          onClick={handleExport}
          className="text-body-sm font-medium text-primary hover:text-primary-light transition-colors cursor-pointer"
        >
          Export CSV
        </button>
      </div>

      {/* Clock In/Out + Summary Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Clock Widget */}
        <div className="p-6 rounded-[16px] bg-surface border border-border text-center">
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

            <div className="p-6 rounded-[16px] bg-surface border border-border flex flex-col justify-center">
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
      <div className="bg-surface border border-border rounded-[16px] p-6">
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

      {/* Confirmation Modal */}
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
    </div>
  );
}
