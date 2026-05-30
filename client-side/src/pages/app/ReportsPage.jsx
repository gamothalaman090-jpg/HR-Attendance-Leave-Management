/**
 * ReportsPage — Analytics & reporting for attendance and leave data.
 * Tabs: Attendance Report | Leave Report
 * Features: stat cards, charts (recharts), data table, Excel export (ExportButton)
 */
import { useState, useMemo, useEffect } from 'react';
import Meta from '@/components/common/Meta';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  BarChart3, Clock, Calendar, CheckCircle2,
  XCircle, TrendingUp, Users, CalendarOff, Filter
} from 'lucide-react';
import {
  Card, CardHeader, CardContent, Badge, ExportButton,
  Table, TableCell, Select, SkeletonCard, SkeletonTable
} from '@/components/ui';
import { attendanceService } from '@/services/attendanceService';
import { leaveService } from '@/services/leaveService';
import { cn, capitalize } from '@/utils/helpers';

/* ── Colour palette aligned with CSS tokens ── */
const CHART_COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  late: '#f59e0b',
  'half-day': '#8b5cf6',
  leave: '#6366f1',
  holiday: '#3b82f6',
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  annual: '#6366f1',
  sick: '#ef4444',
  personal: '#8b5cf6',
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
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── Filter States ── */
  const [attStatusFilter, setAttStatusFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('all');

  /* ── Fetch Data ── */
  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        setLoading(true);
        const [attData, leaveRes] = await Promise.all([
          attendanceService.getMonthly(),
          leaveService.getAll({ limit: 1000 })
        ]);
        if (active) {
          setAttendanceRecords(attData);
          setLeaveRequests(leaveRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, []);

  /* ── Attendance data computations ── */
  const workdays = useMemo(() =>
    attendanceRecords.filter((r) => !['weekend', 'upcoming'].includes(r.status)),
    [attendanceRecords]
  );

  const attStats = useMemo(() => ({
    present: workdays.filter((r) => r.status === 'present' || r.status === 'late' || r.status === 'half-day').length,
    absent: workdays.filter((r) => r.status === 'absent').length,
    late: workdays.filter((r) => r.status === 'late').length,
    leave: workdays.filter((r) => r.status === 'leave').length,
    avgHours: workdays.length
      ? (workdays.reduce((s, r) => s + (r.hours || 0), 0) / workdays.filter(r => r.hours > 0).length || 0).toFixed(1)
      : 0,
  }), [workdays]);

  const filteredWorkdays = useMemo(() => {
    return workdays.filter((r) => {
      if (attStatusFilter !== 'all' && r.status !== attStatusFilter) return false;
      return true;
    });
  }, [workdays, attStatusFilter]);

  const barData = useMemo(() =>
    filteredWorkdays
      .filter((r) => r.hours > 0)
      .slice(-14) // last 14 working days
      .map((r) => ({
        date: r.date.slice(5), // MM-DD
        hours: r.hours,
        status: r.status,
      })),
    [filteredWorkdays]
  );

  /* ── Leave data computations ── */
  const leaveStats = useMemo(() => {
    const counts = { approved: 0, pending: 0, rejected: 0 };
    leaveRequests.forEach((l) => { if (counts[l.status] !== undefined) counts[l.status]++; });
    return counts;
  }, [leaveRequests]);

  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter((l) => {
      if (leaveTypeFilter !== 'all' && l.type !== leaveTypeFilter) return false;
      if (leaveStatusFilter !== 'all' && l.status !== leaveStatusFilter) return false;
      return true;
    });
  }, [leaveRequests, leaveTypeFilter, leaveStatusFilter]);

  const leaveByType = useMemo(() => {
    const map = {};
    filteredLeaves.filter((l) => l.status === 'approved').forEach((l) => {
      map[l.type] = (map[l.type] || 0) + l.days;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredLeaves]);

  const statusPieData = useMemo(() => {
    const counts = { approved: 0, pending: 0, rejected: 0 };
    filteredLeaves.forEach((l) => { if (counts[l.status] !== undefined) counts[l.status]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredLeaves]);

  /* ── Export data (cleaned) ── */
  const attendanceExportData = useMemo(() =>
    filteredWorkdays.map((r) => ({
      date: r.date,
      status: r.status,
      clockIn: r.clockIn || '—',
      clockOut: r.clockOut || '—',
      hours: r.hours || 0,
    })),
    [filteredWorkdays]
  );

  if (loading) {
    return (
      <>
        <Meta title="Reports | Nini HR" />
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="w-1/3 h-8 bg-surface-alt/60 animate-pulse rounded-[8px]" />
            <div className="w-32 h-10 bg-surface-alt/60 animate-pulse rounded-[8px]" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonTable rows={6} cols={5} />
        </div>
      </>
    );
  }

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
              data={filteredLeaves}
              columns={LEAVE_COLS}
              filename="leave_report"
              sheetName="Leave Requests"
            />
          )}
        </div>

        {/* Tabs & Filters Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-[16px] bg-surface border border-border">
          <div className="flex gap-1 p-1 bg-surface-alt rounded-[12px] w-fit shrink-0" role="tablist" aria-label="Report types">
            {TABS.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`${tab}-panel`}
                id={`${tab}-tab`}
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

          {/* Contextual Filters */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter size={16} className="text-text-muted shrink-0 hidden sm:inline" />
            
            {activeTab === 'attendance' ? (
              <div className="w-full sm:w-48">
                <Select
                  value={attStatusFilter}
                  onChange={(e) => setAttStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'present', label: 'Present' },
                    { value: 'absent', label: 'Absent' },
                    { value: 'late', label: 'Late' },
                    { value: 'half-day', label: 'Half Day' },
                    { value: 'leave', label: 'Leave' },
                    { value: 'holiday', label: 'Holiday' },
                  ]}
                  placeholder="Filter Status"
                />
              </div>
            ) : (
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="w-1/2 sm:w-36">
                  <Select
                    value={leaveTypeFilter}
                    onChange={(e) => setLeaveTypeFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Types' },
                      { value: 'annual', label: 'Annual' },
                      { value: 'sick', label: 'Sick' },
                      { value: 'personal', label: 'Personal' },
                    ]}
                    placeholder="Filter Type"
                  />
                </div>
                <div className="w-1/2 sm:w-36">
                  <Select
                    value={leaveStatusFilter}
                    onChange={(e) => setLeaveStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'approved', label: 'Approved' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'rejected', label: 'Rejected' },
                    ]}
                    placeholder="Filter Status"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── ATTENDANCE TAB PANEL ── */}
        {activeTab === 'attendance' && (
          <div className="space-y-6" role="tabpanel" id="attendance-panel" aria-labelledby="attendance-tab">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={CheckCircle2} label="Present" value={attStats.present} color="bg-success/10 text-success" sub="days this month" />
              <StatCard icon={XCircle} label="Absent" value={attStats.absent} color="bg-danger/10 text-danger" sub="days this month" />
              <StatCard icon={Clock} label="Late" value={attStats.late} color="bg-warning/10 text-warning" sub="days this month" />
              <StatCard icon={TrendingUp} label="Avg Hours" value={attStats.avgHours} color="bg-primary/10 text-primary" sub="hours per day" />
            </div>

            {/* Bar chart */}
            <Card>
              <CardHeader title="Daily Hours Worked" subtitle="Last 14 working days recorded" />
              <CardContent>
                <div className="h-56">
                  {barData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-text-muted text-body-sm">
                      No matching records with active hours.
                    </div>
                  ) : (
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
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader title="Attendance Records" subtitle={`${filteredWorkdays.length} working days filtered`} />
              <CardContent className="p-0">
                <Table
                  columns={[
                    { key: 'date', label: 'Date' },
                    { key: 'status', label: 'Status' },
                    { key: 'clockIn', label: 'Clock In' },
                    { key: 'clockOut', label: 'Clock Out' },
                    { key: 'hours', label: 'Hours', className: 'text-right' },
                  ]}
                  data={filteredWorkdays.slice(0, 15)}
                  emptyMessage="No attendance records found matching filters."
                  renderRow={(r) => (
                    <tr key={r.date} className="hover:bg-surface-alt/30 transition-colors">
                      <TableCell className="font-medium">{r.date}</TableCell>
                      <TableCell>
                        <Badge variant={
                          r.status === 'present' ? 'success' :
                          r.status === 'absent' ? 'danger' :
                          r.status === 'late' ? 'warning' :
                          r.status === 'half-day' ? 'accent' : 'default'
                        }>
                          {capitalize(r.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-text-muted">{r.clockIn || '—'}</TableCell>
                      <TableCell className="text-text-muted">{r.clockOut || '—'}</TableCell>
                      <TableCell className="text-right font-medium">{r.hours > 0 ? `${r.hours}h` : '—'}</TableCell>
                    </tr>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── LEAVE TAB PANEL ── */}
        {activeTab === 'leave' && (
          <div className="space-y-6" role="tabpanel" id="leave-panel" aria-labelledby="leave-tab">
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
                    {filteredLeaves.length === 0 ? (
                      <div className="w-full flex justify-center text-text-muted text-body-sm">
                        No requests to map.
                      </div>
                    ) : (
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
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Days by type pie */}
              <Card>
                <CardHeader title="Approved Days by Type" subtitle="Days taken per leave type" />
                <CardContent>
                  <div className="h-52 flex items-center">
                    {leaveByType.length === 0 ? (
                      <div className="w-full flex justify-center text-text-muted text-body-sm">
                        No approved leave days to map.
                      </div>
                    ) : (
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
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leave table */}
            <Card>
              <CardHeader title="Leave Requests" subtitle={`${filteredLeaves.length} requests filtered`} />
              <CardContent className="p-0">
                <Table
                  columns={[
                    { key: 'employeeName', label: 'Employee' },
                    { key: 'type', label: 'Type' },
                    { key: 'dates', label: 'Dates' },
                    { key: 'days', label: 'Days', className: 'text-center' },
                    { key: 'status', label: 'Status' },
                    { key: 'appliedOn', label: 'Applied' },
                  ]}
                  data={filteredLeaves}
                  emptyMessage="No leave requests found matching filters."
                  renderRow={(l) => (
                    <tr key={l.id} className="hover:bg-surface-alt/30 transition-colors">
                      <TableCell className="font-medium text-text">{l.employeeName}</TableCell>
                      <TableCell className="text-text-muted capitalize">{l.type}</TableCell>
                      <TableCell className="text-text-muted">
                        {l.startDate === l.endDate ? l.startDate : `${l.startDate} → ${l.endDate}`}
                      </TableCell>
                      <TableCell className="text-center">{l.days}</TableCell>
                      <TableCell>
                        <Badge variant={
                          l.status === 'approved' ? 'success' :
                          l.status === 'rejected' ? 'danger' :
                          l.status === 'pending' ? 'warning' : 'default'
                        }>
                          {capitalize(l.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-text-muted">{l.appliedOn}</TableCell>
                    </tr>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
