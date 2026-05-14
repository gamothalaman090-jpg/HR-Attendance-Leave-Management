import { useAuth } from '@/context/AuthContext';
import { Users, CalendarOff, Clock, TrendingUp } from 'lucide-react';

const STATS = [
  { label: 'Total Employees', value: '156', change: '+12%', icon: Users, color: 'primary' },
  { label: 'Pending Leaves', value: '8', change: '-3', icon: CalendarOff, color: 'accent' },
  { label: 'Present Today', value: '142', change: '91%', icon: Clock, color: 'success' },
  { label: 'Avg Hours/Week', value: '38.5', change: '+0.5', icon: TrendingUp, color: 'secondary' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-heading text-h2 font-bold mb-1">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-text-muted text-body">
          Here's what's happening with your team today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map(({ label, value, change, icon: Icon, color }) => (
          <div
            key={label}
            className="p-5 rounded-[16px] bg-surface border border-border hover:shadow-card-hover transition-all duration-base group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-[10px] bg-${color}/10 flex items-center justify-center text-${color} group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
              </div>
              <span className="text-caption font-medium text-success bg-success/10 px-2 py-0.5 rounded-pill">
                {change}
              </span>
            </div>
            <div className="text-h3 font-heading font-bold mb-0.5">{value}</div>
            <div className="text-body-sm text-text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Leave Requests */}
        <div className="lg:col-span-2 p-6 rounded-[16px] bg-surface border border-border">
          <h2 className="font-heading text-h4 font-bold mb-4">Recent Leave Requests</h2>
          <div className="space-y-3">
            {[
              { name: 'Sarah Chen', type: 'Annual Leave', dates: 'May 20 - May 22', status: 'Pending', statusColor: 'warning' },
              { name: 'James Kim', type: 'Sick Leave', dates: 'May 18', status: 'Approved', statusColor: 'success' },
              { name: 'Maria Lopez', type: 'Personal Leave', dates: 'May 25 - May 26', status: 'Pending', statusColor: 'warning' },
              { name: 'David Park', type: 'Annual Leave', dates: 'Jun 1 - Jun 5', status: 'Approved', statusColor: 'success' },
            ].map((req, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-body-sm font-bold">
                    {req.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-body-sm font-medium text-text">{req.name}</div>
                    <div className="text-caption text-text-muted">{req.type} · {req.dates}</div>
                  </div>
                </div>
                <span className={`text-caption font-medium px-2.5 py-1 rounded-pill bg-${req.statusColor}/10 text-${req.statusColor}`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-[16px] bg-surface border border-border">
          <h2 className="font-heading text-h4 font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Apply for Leave', desc: 'Submit a new leave request', href: '/app/leave' },
              { label: 'Clock In', desc: 'Start your work day', href: '/app/attendance' },
              { label: 'View Calendar', desc: 'See team availability', href: '/app/calendar' },
              { label: 'My Profile', desc: 'Update your information', href: '/app/profile' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="block p-3 rounded-[10px] border border-border hover:border-primary/30 hover:bg-primary-50 dark:hover:bg-primary/5 transition-all duration-base group"
              >
                <div className="text-body-sm font-medium text-text group-hover:text-primary transition-colors">
                  {action.label}
                </div>
                <div className="text-caption text-text-muted">{action.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
