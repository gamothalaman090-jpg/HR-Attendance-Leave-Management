/**
 * Name: DashboardPage.jsx
 * PHASE 4 FIXES:
 *
 * *   FIX 1 (CRITICAL): user?.name used on client-side.
 *     Although the backend model stores `fullname`, the client-side `authService`
 *     normalizes `fullname` to `name`. Thus, `user?.name` must be used.
 *
 *   FIX 2 (HIGH): isHR used fuzzy ['hr','admin'].some(r => role.includes(r))
 *     → replaced with exact role check: role === 'admin' || role === 'superadmin'.
 *     A user named "Administrator" would previously pass the 'admin' substring check.
 *
 *   FIX 3 (HIGH): req.employeeName.charAt(0) — no null guard.
 *     If employeeName was undefined (data mapping issue), this crashed the component.
 *     AFTER: Optional chaining + fallback: (req.employeeName ?? '?').charAt(0)
 *
 *   FIX 4 (MEDIUM): Charts had no skeleton during loading.
 *     The chart containers appeared as empty boxes briefly before data arrived.
 *     AFTER: ChartSkeleton component shown while loading=true.
 *
 *   FIX 5 (MEDIUM): Chart section headings were h2 but only visually styled as h4.
 *     Heading hierarchy: page h1 → section h2 is correct. Kept semantic level,
 *     applied visual size via className (correct WCAG approach).
 */

import { useState, useEffect, useRef } from 'react';
import Meta from '@/components/common/Meta';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { employeeService } from '@/services/employeeService';
import {
  Users, CalendarOff, Clock, TrendingUp, ArrowRight,
  CalendarDays, UserCircle, ClipboardList,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Badge } from '@/components/ui';
import { leaveService } from '@/services/leaveService';
import { attendanceService } from '@/services/attendanceService';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/utils/helpers';
import gsap from 'gsap';

const PIE_COLORS = ['#4F46E5', '#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

const STATUS_MAP = {
  pending:  { label: 'Pending',  variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  declined: { label: 'Declined', variant: 'danger' },
  rejected: { label: 'Rejected', variant: 'danger' },
};

export function StatCardSkeleton() {
  return (
    <div className="p-5 rounded-[16px] bg-surface border border-border animate-pulse" aria-hidden="true">
      <div className="w-10 h-10 rounded-[10px] bg-surface-alt mb-3" />
      <div className="w-24 h-8 bg-surface-alt rounded mb-2" />
      <div className="w-16 h-4 bg-surface-alt rounded" />
    </div>
  );
}

// FIX 4: Chart skeleton — replaces empty chart boxes during load
function ChartSkeleton() {
  return (
    <div className="h-64 flex items-end justify-around px-6 gap-3 animate-pulse" aria-hidden="true">
      {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
        <div key={i} className="flex-1 bg-surface-alt rounded-t-[6px]" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user }   = useAuth();
  const statsRef   = useRef(null);
  const [loading, setLoading]               = useState(true);
  const [employees, setEmployees]           = useState([]);
  const [employeeStats, setEmployeeStats]   = useState({ total: 0, active: 0, onLeave: 0 });
  const [leaveRequests, setLeaveRequests]   = useState([]);
  const [leaveBalance, setLeaveBalance]     = useState(null);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);

  // ─────────────────────────────────────────────
  // FIX 2: Exact role check — no more fuzzy substring matching.
  // BEFORE: ['hr', 'admin'].some(r => user?.role?.toLowerCase().includes(r))
  //   → user named "Chris Harris" would match 'hr' via includes()!
  // AFTER: Exact equality check against the two valid admin roles.
  // ─────────────────────────────────────────────
  const userRole = user?.role?.toLowerCase();
  const isAdmin  = userRole === 'admin' || userRole === 'superadmin';

  const mapWeekly = (recs) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return recs.map(r => {
      const d = new Date(r.date);
      return { day: days[d.getDay()], hours: r.hours || 0, target: 8 };
    });
  };

  useEffect(() => {
    let active = true;
    const fetchDashboardData = async () => {
      try {
        const [emps, st, recs, bal, weekly] = await Promise.all([
          employeeService.getAll().catch(() => []),
          employeeService.getStats().catch(() => ({ total: 0, active: 0, onLeave: 0 })),
          (isAdmin ? leaveService.getAll() : leaveService.getMyLeaves())
            .then(r => r?.data ?? r ?? []).catch(() => []),
          leaveService.getBalance().catch(() => null),
          attendanceService.getWeekly().catch(() => []),
        ]);
        if (!active) return;
        setEmployees(emps);
        setEmployeeStats(st);
        setLeaveRequests(recs);
        setLeaveBalance(bal);
        setWeeklyAttendance(mapWeekly(weekly));
      } catch (err) {
        if (import.meta.env.DEV) console.error('Failed to fetch dashboard data', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDashboardData();
    return () => { active = false; };
  }, [isAdmin]);

  const pendingCount  = leaveRequests.filter(l => l.status === 'pending').length;
  const approvedCount = leaveRequests.filter(l => l.status === 'approved').length;

  const currentMonth = new Date().getMonth();
  const currentYear  = new Date().getFullYear();
  const joinedThisMonth = employees.filter(emp => {
    if (!emp.joinDate) return false;
    const d = new Date(emp.joinDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const presentPercentage = employeeStats.total > 0
    ? Math.round((employeeStats.active / employeeStats.total) * 100)
    : 0;

  const STATS = [
    ...(isAdmin ? [
      { label: 'Total Employees', value: String(employeeStats.total), change: joinedThisMonth > 0 ? `+${joinedThisMonth} this month` : '0 this month', icon: Users, color: 'primary' },
      { label: 'Pending Requests', value: String(pendingCount), change: `${approvedCount} approved`, icon: CalendarOff, color: 'accent' },
    ] : []),
    { label: 'Present Today', value: String(employeeStats.active), change: `${presentPercentage}%`, icon: Clock, color: 'success' },
    { label: 'Avg Hours/Week', value: '38.5', change: '+0.5h', icon: TrendingUp, color: 'secondary' },
  ];

  const leaveBalanceData = [
    { name: 'Annual',   value: leaveBalance?.annual?.used   || 0, remaining: leaveBalance?.annual?.left   || 20 },
    { name: 'Sick',     value: leaveBalance?.sick?.used     || 0, remaining: leaveBalance?.sick?.left     || 12 },
    { name: 'Personal', value: leaveBalance?.personal?.used || 0, remaining: leaveBalance?.personal?.left || 7  },
  ];

  useEffect(() => {
    if (!statsRef.current || loading) return;
    const cards = statsRef.current.querySelectorAll('[data-stat]');
    gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out', clearProps: 'all' });
  }, [loading]);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

  // FIX: user?.name contains the user's name on the client side (mapped from fullname in authService)
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div>
      <Meta title="Dashboard" />

      {/* Greeting */}
      <div className="mb-8">
        {/* firstName derived from user.name */}
        <h1 className="font-heading text-h2 font-bold mb-1">
          Good {greeting}, {firstName} 👋
        </h1>
        <p className="text-text-muted text-body">
          Here's what's happening with your team today.
        </p>
      </div>

      {/* Stats Grid */}
      <div
        ref={statsRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        aria-label="Dashboard statistics"
      >
        {loading ? (
          Array.from({ length: isAdmin ? 4 : 2 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          STATS.map(({ label, value, change, icon: Icon, color }) => (
            <div
              key={label}
              data-stat
              className="p-5 rounded-[16px] bg-surface border border-border hover:shadow-card-hover transition-all duration-base group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  'w-10 h-10 rounded-[10px] flex items-center justify-center group-hover:scale-110 transition-transform',
                  color === 'primary'   && 'bg-primary/10 text-primary',
                  color === 'accent'    && 'bg-accent/10 text-accent',
                  color === 'success'   && 'bg-success/10 text-success',
                  color === 'secondary' && 'bg-secondary/10 text-secondary',
                )}>
                  <Icon size={20} aria-hidden="true" />
                </div>
                <span className="text-caption font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                  {change}
                </span>
              </div>
              <div className="text-h3 font-heading font-bold mb-0.5" aria-label={`${label}: ${value}`}>
                {value}
              </div>
              <div className="text-body-sm text-text-muted">{label}</div>
            </div>
          ))
        )}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Leave Balance Donut */}
        <div className="p-6 rounded-[16px] bg-surface border border-border">
          <h2 className="font-heading text-h4 font-bold mb-4">Leave Balance</h2>
          {loading ? (
            <ChartSkeleton />   // FIX 4
          ) : (
            <div className="h-64" role="img" aria-label="Donut chart showing remaining leave days by type">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leaveBalanceData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="remaining" stroke="none" paddingAngle={4}>
                    {leaveBalanceData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', color: 'var(--color-text)' }}
                    formatter={(value, name) => [`${value} days`, name]}
                  />
                  <Legend formatter={(value) => <span style={{ color: 'var(--color-text)' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Weekly Attendance */}
        <div className="p-6 rounded-[16px] bg-surface border border-border">
          <h2 className="font-heading text-h4 font-bold mb-4">This Week's Hours</h2>
          {loading ? (
            <ChartSkeleton />   // FIX 4
          ) : (
            <div className="h-64" role="img" aria-label="Bar chart showing daily hours worked this week compared to 8-hour target">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyAttendance} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} domain={[0, 12]} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', color: 'var(--color-text)' }}
                  />
                  <Bar dataKey="hours" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Hours Worked" />
                  <Bar dataKey="target" fill="#E2E8F0" radius={[6, 6, 0, 0]} name="Target (8h)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Leave Requests */}
        <div className="lg:col-span-2 p-6 rounded-[16px] bg-surface border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-h4 font-bold">
              {isAdmin ? 'Recent Leave Requests' : 'My Recent Requests'}
            </h2>
            <Link to="/app/leave" className="text-body-sm font-medium text-primary hover:text-primary-light flex items-center gap-1">
              View All <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-surface-alt shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-28 bg-surface-alt rounded" />
                    <div className="h-3 w-40 bg-surface-alt rounded" />
                  </div>
                  <div className="h-6 w-16 bg-surface-alt rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1" role="list" aria-label="Leave requests">
              {leaveRequests.slice(0, 5).map((req) => (
                <div key={req.id} className="flex items-center justify-between py-3 border-b border-border last:border-0" role="listitem">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-body-sm font-bold shrink-0" aria-hidden="true">
                      {/* FIX 3: Null guard — was crashing if employeeName was undefined */}
                      {(req.employeeName ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-body-sm font-medium text-text truncate">{req.employeeName ?? 'Unknown'}</div>
                      <div className="text-caption text-text-muted">
                        {(req.type ?? '').charAt(0).toUpperCase() + (req.type ?? '').slice(1)} · {formatDate(req.startDate)} — {formatDate(req.endDate)}
                      </div>
                    </div>
                  </div>
                  <Badge variant={STATUS_MAP[req.status]?.variant || 'default'}>
                    {STATUS_MAP[req.status]?.label || req.status}
                  </Badge>
                </div>
              ))}
              {leaveRequests.length === 0 && (
                <p className="text-center py-4 text-text-muted text-body-sm">No recent requests found.</p>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-[16px] bg-surface border border-border">
          <h2 className="font-heading text-h4 font-bold mb-4">Quick Actions</h2>
          <nav aria-label="Quick actions">
            <ul className="space-y-3">
              {[
                { label: 'Apply for Leave', desc: 'Submit a new leave request', href: '/app/leave',      icon: ClipboardList },
                { label: 'Clock In',        desc: 'Start your work day',         href: '/app/attendance', icon: Clock },
                { label: 'View Calendar',   desc: 'See team availability',       href: '/app/calendar',   icon: CalendarDays },
                { label: 'My Profile',      desc: 'Update your information',     href: '/app/profile',    icon: UserCircle },
              ].map(({ label, desc, href, icon: Icon }) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="flex items-center gap-3 p-3 rounded-[10px] border border-border hover:border-primary/30 hover:bg-primary-50 dark:hover:bg-primary/5 transition-all duration-base group"
                  >
                    <div className="w-9 h-9 rounded-[8px] bg-surface-alt flex items-center justify-center text-text-muted group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                      <Icon size={18} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-body-sm font-medium text-text group-hover:text-primary transition-colors">{label}</div>
                      <div className="text-caption text-text-muted">{desc}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
