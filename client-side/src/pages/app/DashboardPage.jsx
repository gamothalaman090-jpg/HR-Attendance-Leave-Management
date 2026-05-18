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
import { LEAVE_REQUESTS, MY_LEAVE_BALANCE } from '@/data/leaves';
import { WEEKLY_ATTENDANCE } from '@/data/attendance';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/utils/helpers';
import gsap from 'gsap';

/* ── Chart colors ── */
const PIE_COLORS = ['#4F46E5', '#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

const STATUS_MAP = {
  pending: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
};

export function StatCardSkeleton() {
  return (
    <div className="p-5 rounded-[16px] bg-surface border border-border animate-pulse">
      <div className="w-10 h-10 rounded-[10px] bg-surface-alt mb-3"></div>
      <div className="w-24 h-8 bg-surface-alt rounded mb-2"></div>
      <div className="w-16 h-4 bg-surface-alt rounded"></div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const statsRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [employeeStats, setEmployeeStats] = useState({ total: 0, active: 0, onLeave: 0 });

  // Fetch real employee data and statistics from the service
  useEffect(() => {
    let active = true;
    const fetchDashboardData = async () => {
      try {
        const [emps, st] = await Promise.all([
          employeeService.getAll(),
          employeeService.getStats()
        ]);
        if (!active) return;
        setEmployees(emps);
        setEmployeeStats(st);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDashboardData();
    return () => {
      active = false;
    };
  }, []);

  // Derive stats
  const pendingCount = LEAVE_REQUESTS.filter((l) => l.status === 'pending').length;
  const approvedCount = LEAVE_REQUESTS.filter((l) => l.status === 'approved').length;

  // Check if user is HR/Admin
  const isHR = ['hr', 'admin'].some(r => user?.role?.toLowerCase().includes(r));

  // Calculate dynamic changes
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const joinedThisMonth = employees.filter(emp => {
    if (!emp.joinDate) return false;
    const d = new Date(emp.joinDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;
  const changeText = joinedThisMonth > 0 ? `+${joinedThisMonth} this month` : '0 this month';

  const presentPercentage = employeeStats.total > 0 
    ? Math.round((employeeStats.active / employeeStats.total) * 100) 
    : 0;

  const STATS = [
    ...(isHR ? [
      { label: 'Total Employees', value: String(employeeStats.total), change: changeText, icon: Users, color: 'primary' },
      { label: 'Pending Requests', value: String(pendingCount), change: `${approvedCount} approved`, icon: CalendarOff, color: 'accent' },
    ] : []),
    { label: 'Present Today', value: String(employeeStats.active), change: `${presentPercentage}%`, icon: Clock, color: 'success' },
    { label: 'Avg Hours/Week', value: '38.5', change: '+0.5h', icon: TrendingUp, color: 'secondary' },
  ];

  /* ── Leave balance for pie chart ── */
  const leaveBalanceData = [
    { name: 'Annual', value: MY_LEAVE_BALANCE.annual.used, remaining: MY_LEAVE_BALANCE.annual.remaining },
    { name: 'Sick', value: MY_LEAVE_BALANCE.sick.used, remaining: MY_LEAVE_BALANCE.sick.remaining },
    { name: 'Personal', value: MY_LEAVE_BALANCE.personal.used, remaining: MY_LEAVE_BALANCE.personal.remaining },
  ];

  /* ── GSAP stagger ── */
  useEffect(() => {
    if (!statsRef.current || loading) return;
    const cards = statsRef.current.querySelectorAll('[data-stat]');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out', clearProps: 'all' }
    );
  }, [loading]);

  const greeting = new Date().getHours() < 12
    ? 'morning'
    : new Date().getHours() < 18
    ? 'afternoon'
    : 'evening';

  return (
    <div>
      <Meta title="Dashboard" />
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-heading text-h2 font-bold mb-1">
          Good {greeting}, {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-text-muted text-body">
          Here's what's happening with your team today.
        </p>
      </div>

      {/* Stats Grid */}
      <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: isHR ? 4 : 2 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))
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
                  color === 'primary' && 'bg-primary/10 text-primary',
                  color === 'accent' && 'bg-accent/10 text-accent',
                  color === 'success' && 'bg-success/10 text-success',
                  color === 'secondary' && 'bg-secondary/10 text-secondary',
                )}>
                  <Icon size={20} />
                </div>
                <span className="text-caption font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                  {change}
                </span>
              </div>
              <div className="text-h3 font-heading font-bold mb-0.5">{value}</div>
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
      <div className="h-64" aria-label="Donut chart showing leave balance by type">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveBalanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="remaining"
                  stroke="none"
                  paddingAngle={4}
                >
                  {leaveBalanceData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    color: 'var(--color-text)',
                  }}
                  formatter={(value, name) => [`${value} days`, name]}
                />
                <Legend
                  formatter={(value) => <span style={{ color: 'var(--color-text)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Attendance Bar Chart */}
        <div className="p-6 rounded-[16px] bg-surface border border-border">
          <h2 className="font-heading text-h4 font-bold mb-4">This Week's Hours</h2>
      <div className="h-64" aria-label="Bar chart showing daily hours worked vs target">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_ATTENDANCE} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} domain={[0, 12]} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    color: 'var(--color-text)',
                  }}
                />
                <Bar dataKey="hours" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Hours" />
                <Bar dataKey="target" fill="#E2E8F0" radius={[6, 6, 0, 0]} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Leave Requests */}
        <div className="lg:col-span-2 p-6 rounded-[16px] bg-surface border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-h4 font-bold">
              {isHR ? 'Recent Leave Requests' : 'My Recent Requests'}
            </h2>
            <Link to="/app/leave" className="text-body-sm font-medium text-primary hover:text-primary-light flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-1">
            {LEAVE_REQUESTS
              .filter((req) => isHR || req.employeeName === user?.name)
              .slice(0, 5)
              .map((req) => (
              <div key={req.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-body-sm font-bold shrink-0">
                    {req.employeeName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-body-sm font-medium text-text truncate">{req.employeeName}</div>
                    <div className="text-caption text-text-muted">
                      {req.type.charAt(0).toUpperCase() + req.type.slice(1)} · {formatDate(req.startDate)} — {formatDate(req.endDate)}
                    </div>
                  </div>
                </div>
                <Badge variant={STATUS_MAP[req.status]?.variant || 'default'}>
                  {STATUS_MAP[req.status]?.label || req.status}
                </Badge>
              </div>
            ))}
            {LEAVE_REQUESTS.filter((req) => isHR || req.employeeName === user?.name).length === 0 && (
              <div className="text-center py-4 text-text-muted text-body-sm">
                No recent requests found.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-[16px] bg-surface border border-border">
          <h2 className="font-heading text-h4 font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Apply for Leave', desc: 'Submit a new leave request', href: '/app/leave', icon: ClipboardList },
              { label: 'Clock In', desc: 'Start your work day', href: '/app/attendance', icon: Clock },
              { label: 'View Calendar', desc: 'See team availability', href: '/app/calendar', icon: CalendarDays },
              { label: 'My Profile', desc: 'Update your information', href: '/app/profile', icon: UserCircle },
            ].map(({ label, desc, href, icon: Icon }) => (
              <Link
                key={label}
                to={href}
                className="flex items-center gap-3 p-3 rounded-[10px] border border-border hover:border-primary/30 hover:bg-primary-50 dark:hover:bg-primary/5 transition-all duration-base group"
              >
                <div className="w-9 h-9 rounded-[8px] bg-surface-alt flex items-center justify-center text-text-muted group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-body-sm font-medium text-text group-hover:text-primary transition-colors">
                    {label}
                  </div>
                  <div className="text-caption text-text-muted">{desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
