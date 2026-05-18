import { useState } from 'react';
import Meta from '@/components/common/Meta';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import {
  User, Bell, Palette, Shield, Save,
  Sun, Moon, Monitor,
} from 'lucide-react';
import { cn } from '@/utils/helpers';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '+1 (555) 234-5678',
    department: user?.department || '',
  });
  const [notifications, setNotifications] = useState({
    leaveRequests: true,
    attendance: true,
    teamUpdates: false,
    emailDigest: true,
    pushNotifications: false,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (activeSection === 'profile') {
      updateUser(profileData);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'w-11 h-6 rounded-full transition-colors duration-base relative cursor-pointer',
        checked ? 'bg-primary' : 'bg-surface-alt border border-border',
      )}
    >
      <div className={cn(
        'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-base shadow-sm',
        checked ? 'left-5.5' : 'left-0.5',
      )} />
    </button>
  );

  return (
    <div>
      <Meta title="Settings" />
      <div className="mb-6">
        <h1 className="font-heading text-h2 font-bold mb-1">Settings</h1>
        <p className="text-text-muted text-body">Configure your workspace preferences.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="bg-surface border border-border rounded-[16px] p-4 h-fit">
          <nav className="space-y-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-body-sm font-medium transition-all cursor-pointer',
                  activeSection === id
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:text-text hover:bg-surface-alt'
                )}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 bg-surface border border-border rounded-[16px] p-6">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div>
              <h2 className="font-heading text-h4 font-bold mb-1">Profile Information</h2>
              <p className="text-body-sm text-text-muted mb-6">Update your personal details and contact information.</p>

              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-h3 font-bold">
                  {user?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="text-body font-semibold text-text">{user?.name}</div>
                  <div className="text-body-sm text-text-muted">{user?.role}</div>
                  <button className="text-caption text-primary hover:text-primary-light mt-1 cursor-pointer">
                    Change avatar
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { key: 'name', label: 'Full Name' },
                  { key: 'email', label: 'Email Address' },
                  { key: 'phone', label: 'Phone Number' },
                  { key: 'department', label: 'Department' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-body-sm font-medium text-text mb-1">{label}</label>
                    <input
                      type="text"
                      value={profileData[key]}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-bg border border-border rounded-[8px] text-body text-text focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <Button onClick={handleSave} leftIcon={<Save size={16} />}>
                  {saved ? 'Saved!' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div>
              <h2 className="font-heading text-h4 font-bold mb-1">Notification Preferences</h2>
              <p className="text-body-sm text-text-muted mb-6">Control how and when you receive notifications.</p>

              <div className="space-y-4">
                {[
                  { key: 'leaveRequests', label: 'Leave Requests', desc: 'Get notified when a team member submits a leave request.' },
                  { key: 'attendance', label: 'Attendance Alerts', desc: 'Receive alerts for late clock-ins and absences.' },
                  { key: 'teamUpdates', label: 'Team Updates', desc: 'Get notified when new members join your team.' },
                  { key: 'emailDigest', label: 'Email Digest', desc: 'Receive a daily summary email of team activity.' },
                  { key: 'pushNotifications', label: 'Push Notifications', desc: 'Enable browser push notifications.' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <div className="text-body-sm font-medium text-text">{label}</div>
                      <div className="text-caption text-text-muted">{desc}</div>
                    </div>
                    <Toggle
                      checked={notifications[key]}
                      onChange={(val) => setNotifications((prev) => ({ ...prev, [key]: val }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <div>
              <h2 className="font-heading text-h4 font-bold mb-1">Appearance</h2>
              <p className="text-body-sm text-text-muted mb-6">Customize how Nini looks and feels.</p>

              <div className="mb-6">
                <label className="block text-body-sm font-medium text-text mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'system', label: 'System', icon: Monitor },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className={cn(
                        'p-4 rounded-[12px] border-2 transition-all cursor-pointer flex flex-col items-center gap-2',
                        theme === value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      )}
                    >
                      <Icon size={24} className={theme === value ? 'text-primary' : 'text-text-muted'} />
                      <span className={cn('text-body-sm font-medium', theme === value ? 'text-primary' : 'text-text')}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div>
              <h2 className="font-heading text-h4 font-bold mb-1">Security</h2>
              <p className="text-body-sm text-text-muted mb-6">Manage your password and account security.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-body-sm font-medium text-text mb-1">Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full px-3 py-2.5 bg-bg border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all max-w-md"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-text mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full px-3 py-2.5 bg-bg border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all max-w-md"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-text mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2.5 bg-bg border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all max-w-md"
                  />
                </div>
                <div className="pt-2">
                  <Button onClick={handleSave} leftIcon={<Shield size={16} />}>
                    Update Password
                  </Button>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-body font-semibold text-danger mb-2">Danger Zone</h3>
                <p className="text-body-sm text-text-muted mb-3">Once deleted, your account cannot be recovered.</p>
                <Button variant="secondary" className="text-danger border-danger/30 hover:bg-danger/10">
                  Delete Account
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
