import { useAuth } from '@/context/AuthContext';
import Meta from '@/components/common/Meta';
import {
  Mail, Phone, Building, Calendar, MapPin,
  Briefcase, Clock, Award,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { MY_LEAVE_BALANCE } from '@/data/leaves';
import { formatDate } from '@/utils/formatters';
import { getInitials } from '@/utils/formatters';
import { cn } from '@/utils/helpers';

const ACTIVITIES = [
  { action: 'Approved leave request for David Park', time: '2 hours ago', type: 'leave' },
  { action: 'Clocked in at 8:55 AM', time: '4 hours ago', type: 'attendance' },
  { action: 'Rejected leave request from Lucas Martin', time: '1 day ago', type: 'leave' },
  { action: 'Updated notification preferences', time: '2 days ago', type: 'settings' },
  { action: 'Approved leave request for Emily Nguyen', time: '3 days ago', type: 'leave' },
  { action: 'Added Yuki Tanaka to Engineering team', time: '5 days ago', type: 'team' },
];

const ACTIVITY_COLORS = {
  leave: 'bg-primary/10 text-primary',
  attendance: 'bg-success/10 text-success',
  settings: 'bg-secondary/10 text-secondary',
  team: 'bg-accent/10 text-accent',
};

export default function ProfilePage() {
  const { user } = useAuth();

  const leaveCards = [
    { label: 'Annual', remaining: MY_LEAVE_BALANCE.annual.remaining, total: MY_LEAVE_BALANCE.annual.total, color: 'primary' },
    { label: 'Sick', remaining: MY_LEAVE_BALANCE.sick.remaining, total: MY_LEAVE_BALANCE.sick.total, color: 'danger' },
    { label: 'Personal', remaining: MY_LEAVE_BALANCE.personal.remaining, total: MY_LEAVE_BALANCE.personal.total, color: 'secondary' },
  ];

  return (
    <div>
      <Meta title="My Profile" />
      {/* Profile Header */}
      <div className="bg-surface border border-border rounded-[16px] p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-h2 font-bold shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="font-heading text-h2 font-bold mb-1">{user?.name || 'Alex Rivera'}</h1>
            <p className="text-body text-text-muted mb-3">{user?.role || 'HR Manager'} · {user?.department || 'Human Resources'}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
              <Badge variant="success">Active</Badge>
              <Badge variant="default">Full Time</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-[16px] p-6">
            <h2 className="font-heading text-h4 font-bold mb-4">Personal Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Mail, label: 'Email', value: user?.email || 'alex.rivera@nini.io' },
                { icon: Phone, label: 'Phone', value: '+1 (555) 234-5678' },
                { icon: Building, label: 'Department', value: user?.department || 'Human Resources' },
                { icon: Briefcase, label: 'Role', value: user?.role || 'HR Manager' },
                { icon: Calendar, label: 'Join Date', value: formatDate(user?.joinDate || '2024-03-15') },
                { icon: MapPin, label: 'Location', value: 'San Francisco, CA' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 py-2">
                  <div className="w-9 h-9 rounded-[8px] bg-surface-alt flex items-center justify-center text-text-muted shrink-0">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-caption text-text-muted">{label}</div>
                    <div className="text-body-sm font-medium text-text">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-surface border border-border rounded-[16px] p-6">
            <h2 className="font-heading text-h4 font-bold mb-4">Recent Activity</h2>
            <div className="space-y-0">
              {ACTIVITIES.map((activity, i) => (
                <div key={i} className="flex gap-3 relative">
                  {/* Timeline line */}
                  {i < ACTIVITIES.length - 1 && (
                    <div className="absolute left-[15px] top-8 w-0.5 h-[calc(100%-16px)] bg-border" />
                  )}
                  {/* Dot */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative z-10',
                    ACTIVITY_COLORS[activity.type] || 'bg-surface-alt text-text-muted',
                  )}>
                    <div className="w-2 h-2 rounded-full bg-current" />
                  </div>
                  {/* Content */}
                  <div className="pb-5">
                    <p className="text-body-sm text-text">{activity.action}</p>
                    <span className="text-caption text-text-muted">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Leave Balance */}
          <div className="bg-surface border border-border rounded-[16px] p-5">
            <h3 className="font-heading text-h4 font-bold mb-4">Leave Balance</h3>
            <div className="space-y-4">
              {leaveCards.map(({ label, remaining, total, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-body-sm text-text-muted">{label}</span>
                    <span className="text-body-sm font-semibold text-text">{remaining}/{total}</span>
                  </div>
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
          </div>

          {/* Quick Stats */}
          <div className="bg-surface border border-border rounded-[16px] p-5">
            <h3 className="font-heading text-h4 font-bold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              {[
                { icon: Clock, label: 'Avg Hours/Week', value: '38.5h' },
                { icon: Award, label: 'Attendance Rate', value: '96%' },
                { icon: Calendar, label: 'Days This Month', value: '12/18' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2 text-text-muted">
                    <Icon size={14} />
                    <span className="text-body-sm">{label}</span>
                  </div>
                  <span className="text-body-sm font-semibold text-text">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
