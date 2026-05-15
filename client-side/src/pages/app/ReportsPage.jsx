/**
 * ReportsPage — Analytics & reporting for attendance and leave data.
 * Tabs: Attendance Report | Leave Report
 * Features: stat cards, charts (recharts), data table, Excel export (ExportButton)
 */
import { useState, useMemo } from 'react';
import Meta from '@/components/common/Meta';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  BarChart3, Clock, Calendar, CheckCircle2,
  XCircle, TrendingUp, Users, CalendarOff,
} from 'lucide-react';
import { Card, CardHeader, CardContent, Badge, ExportButton } from '@/components/ui';
import { ATTENDANCE_RECORDS } from '@/data/attendance';
import { LEAVE_REQUESTS } from '@/data/leaves';
import { cn, capitalize } from '@/utils/helpers';

/* ── Colour palette aligned with CSS tokens ── */
const CHART_COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  late: '#f59e0b',
  leave: '#8b5cf6',
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  annual: '#6366f1',
  sick: '#ef4444',
  personal: '#8b5cf6',
  maternity: '#ec4899',
  paternity: '#06b6d4',
  unpaid: '#6b7280',
};

const TABS = ['attendance', 'leave'];

/* ── Column definitions for Excel export ── */
const ATTENDANCE_COLS = [
  { header: 'Date', key: 'date' },
  { header: 'Status', key: 'status' },
  { header: 'Clock In', key: 'clockIn' },
  { header: 'Clock Out', key: 'clockOut' },
  { header: 'Hours Worked', key: 'hours' },
];

const LEAVE_COLS = [
  { header: 'Employee', key: 'employeeName' },
  { header: 'Type', key: 'type' },
  { header: 'Start Date', key: 'startDate' },
  { header: 'End Date', key: 'endDate' },
  { header: 'Days', key: 'days' },
  { header: 'Status', key: 'status' },
  { header: 'Applied On', key: 'appliedOn' },
  { header: 'Approved By', key: 'approvedBy' },
  { header: 'Reason', key: 'reason' },
];

/* ── Small stat card ── */
function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={cn('w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0', color)}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-caption text-text-muted uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-h3 font-bold text-text">{value}</p>
        {sub && <p className="text-caption text-text-muted mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

/* ── Custom tooltip for charts ── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-[10px] px-3 py-2 shadow-elevated text-body-sm">
      {label && <p className="font-semibold text-text mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {capitalize(p.name)}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('attendance');

  /* ── Attendance data ── */
  const workdays = useMemo(() =>
    ATTENDANCE_RECORDS.filter((r) => !['weekend', 'upcoming'].includes(r.status)),
    []
  );

  const attStats = useMemo(() => ({
    present: workdays.filter((r) => r.status === 'present').length,
    absent: workdays.filter((r) => r.status === 'absent').length,
    late: workdays.filter((r) => r.status === 'late').length,
    leave: workdays.filter((r) => r.status === 'leave').length,
    avgHours: workdays.length
      ? (workdays.reduce((s, r) => s + (r.hours || 0), 0) / workdays.filter(r => r.hours > 0).length || 0).toFixed(1)
      : 0,
  }), [workdays]);

  const barData = useMemo(() =>
    workdays
      .filter((r) => r.hours > 0)
      .slice(-14) // last 14 working days
      .map((r) => ({
        date: r.date.slice(5), // MM-DD
        hours: r.hours,
        status: r.status,
      })),
    [workdays]
  );

  /* ── Leave data ── */
  const leaveStats = useMemo(() => {
    const counts = { approved: 0, pending: 0, rejected: 0 };
    LEAVE_REQUESTS.forEach((l) => { if (counts[l.status] !== undefined) counts[l.status]++; });
    return counts;
  }, []);

  const leaveByType = useMemo(() => {
    const map = {};
    LEAVE_REQUESTS.filter((l) => l.status === 'approved').forEach((l) => {
      map[l.type] = (map[l.type] || 0) + l.days;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  const statusPieData = useMemo(() =>
    Object.entries(leaveStats).map(([name, value]) => ({ name, value })),
    [leaveStats]
  );

  /* ── Export data (cleaned) ── */
  const attendanceExportData = workdays.map((r) => ({
    date: r.date,
    status: r.status,
    clockIn: r.clockIn || '—',
    clockOut: r.clockOut || '—',
    hours: r.hours || 0,
  }));

  return (
    <>
      <Meta title="Reports | Nini HR" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-h2 font-bold text-text">Reports & Analytics</h1>
            <p className="text-body text-text-muted mt-1">
              Attendance and leave insights for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          {/* Export Button — contextual to the active tab */}
          {activeTab === 'attendance' ? (
            <ExportButton
              data={attendanceExportData}
              columns={ATTENDANCE_COLS}
              filename="attendance_report"
              sheetName="Attendance"
            />
          ) : (
            <ExportButton
              data={LEAVE_REQUESTS}
              columns={LEAVE_COLS}
              filename="leave_report"
              sheetName="Leave Requests"
            />
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-alt rounded-[12px] w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-5 py-2 rounded-[10px] text-body-sm font-semibold transition-all duration-base cursor-pointer capitalize',
                activeTab === tab
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-muted hover:text-text'
              )}
            >
              {tab === 'attendance' ? 'Attendance' : 'Leave'}
            </button>
          ))}
        </div>

        {/* ── ATTENDANCE TAB ── */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={CheckCircle2} label="Present" value={attStats.present} color="bg-success/10 text-success" sub="days this month" />
              <StatCard icon={XCircle} label="Absent" value={attStats.absent} color="bg-danger/10 text-danger" sub="days this month" />
              <StatCard icon={Clock} label="Late" value={attStats.late} color="bg-warning/10 text-warning" sub="days this month" />
              <StatCard icon={TrendingUp} label="Avg Hours" value={attStats.avgHours} color="bg-primary/10 text-primary" sub="hours per day" />
            </div>

            {/* Bar chart */}
            <Card>
              <CardHeader title="Daily Hours Worked" subtitle="Last 14 working days" />
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} unit="h" domain={[0, 10]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="hours" name="Hours" radius={[6, 6, 0, 0]}>
                        {barData.map((entry, i) => (
                          <Cell key={i} fill={CHART_COLORS[entry.status] || 'var(--color-primary)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader title="Attendance Records" subtitle={`${workdays.length} working days recorded`} />
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-body-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-alt/40">
                        <th className="text-left px-4 py-3 font-semibold text-text-muted">Date</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-muted">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-muted">Clock In</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-muted">Clock Out</th>
                        <th className="text-right px-4 py-3 font-semibold text-text-muted">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {workdays.slice(0, 15).map((r) => (
                        <tr key={r.date} className="hover:bg-surface-alt/30 transition-colors">
                          <td className="px-4 py-3 text-text font-medium">{r.date}</td>
                          <td className="px-4 py-3">
                            <Badge variant={
                              r.status === 'present' ? 'success' :
                              r.status === 'absent' ? 'danger' :
                              r.status === 'late' ? 'warning' : 'default'
                            }>
                              {capitalize(r.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-text-muted">{r.clockIn || '—'}</td>
                          <td className="px-4 py-3 text-text-muted">{r.clockOut || '—'}</td>
                          <td className="px-4 py-3 text-right text-text font-medium">{r.hours > 0 ? `${r.hours}h` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── LEAVE TAB ── */}
        {activeTab === 'leave' && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard icon={CheckCircle2} label="Approved" value={leaveStats.approved} color="bg-success/10 text-success" sub="requests" />
              <StatCard icon={Clock} label="Pending" value={leaveStats.pending} color="bg-warning/10 text-warning" sub="requests" />
              <StatCard icon={XCircle} label="Rejected" value={leaveStats.rejected} color="bg-danger/10 text-danger" sub="requests" />
            </div>

            {/* Two charts side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Status pie */}
              <Card>
                <CardHeader title="Requests by Status" />
                <CardContent>
                  <div className="h-52 flex items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusPieData.map((entry) => (
                            <Cell key={entry.name} fill={CHART_COLORS[entry.name] || '#6b7280'} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend formatter={(v) => <span className="text-body-sm text-text capitalize">{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Days by type pie */}
              <Card>
                <CardHeader title="Approved Days by Type" subtitle="Days taken per leave type" />
                <CardContent>
                  <div className="h-52 flex items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leaveByType}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {leaveByType.map((entry) => (
                            <Cell key={entry.name} fill={CHART_COLORS[entry.name] || '#6b7280'} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend formatter={(v) => <span className="text-body-sm text-text capitalize">{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leave table */}
            <Card>
              <CardHeader title="All Leave Requests" subtitle={`${LEAVE_REQUESTS.length} total requests`} />
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-body-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-alt/40">
                        <th className="text-left px-4 py-3 font-semibold text-text-muted">Employee</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-muted">Type</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-muted">Dates</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-muted">Days</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-muted">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-muted">Applied</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {LEAVE_REQUESTS.map((l) => (
                        <tr key={l.id} className="hover:bg-surface-alt/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-text">{l.employeeName}</td>
                          <td className="px-4 py-3 text-text-muted capitalize">{l.type}</td>
                          <td className="px-4 py-3 text-text-muted">
                            {l.startDate === l.endDate ? l.startDate : `${l.startDate} → ${l.endDate}`}
                          </td>
                          <td className="px-4 py-3 text-text">{l.days}</td>
                          <td className="px-4 py-3">
                            <Badge variant={
                              l.status === 'approved' ? 'success' :
                              l.status === 'rejected' ? 'danger' :
                              l.status === 'pending' ? 'warning' : 'default'
                            }>
                              {capitalize(l.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-text-muted">{l.appliedOn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
