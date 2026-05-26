import { useState, useRef, useEffect } from 'react';
import Meta from '@/components/common/Meta';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { Button, Input } from '@/components/ui';
import {
  User, Bell, Palette, Shield, Save,
  Sun, Moon, Monitor, Camera, Sparkles, Check, AlertCircle
} from 'lucide-react';
import { cn } from '@/utils/helpers';
import { getInitials } from '@/utils/formatters';
import authService from '@/services/authService';
import { employeeService } from '@/services/employeeService';

/* Hide native browser password-reveal toggle (Edge / Chrome eye icon) */
const hidePasswordRevealCSS = `
  input[type="password"]::-ms-reveal,
  input[type="password"]::-ms-clear,
  input[type="password"]::-webkit-credentials-auto-fill-button {
    display: none !important;
  }
`;

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
  
  const fileInputRef = useRef(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || 'Unassigned',
    profilePicture: user?.profilePicture || '',
  });

  const [notifications, setNotifications] = useState({
    leaveRequests: true,
    attendance: true,
    teamUpdates: false,
    emailDigest: true,
    pushNotifications: false,
  });

  // Password fields
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [departments, setDepartments] = useState([]);


 const getAvatarUrl = (profilePicture) => {
  if (!profilePicture) return null;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return profilePicture.startsWith('http')
    ? profilePicture
    : `${base}/${profilePicture}`;
};

  useEffect(() => {
    if (user?.role === 'admin') {
      employeeService.getDepartments()
        .then(depts => setDepartments(depts))
        .catch(err => console.error('Error fetching departments in settings:', err));
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || 'Unassigned',
      });
      // Setup avatar preview if existing
if (user.profilePicture) {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const fullUrl = user.profilePicture.startsWith('http')
    ? user.profilePicture
    : `${base}/${user.profilePicture}`;
  setAvatarPreviewUrl(fullUrl);
      } else {
        setAvatarPreviewUrl('');
      }
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

const handleAvatarChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setSelectedAvatarFile(file);

  const reader = new FileReader();
  reader.onload = (event) => {
    setAvatarPreviewUrl(event.target.result); // data:image/... — allowed by CSP
  };
  reader.readAsDataURL(file);
};

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim() || !profileData.email.trim()) {
      setErrorMsg('Full name and email address are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('fullname', profileData.name);
      formData.append('email', profileData.email);
      formData.append('phone', profileData.phone);
      if (user?.role === 'admin') {
        formData.append('department', profileData.department);
      }
      if (selectedAvatarFile) {
        formData.append('profilePicture', selectedAvatarFile);
      }

      const updated = await authService.updateProfile(formData);
      
      // Update local storage and context state
      updateUser({
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        profilePicture: updated.profilePicture,
        department: updated.department
      });

      setSelectedAvatarFile(null);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setErrorMsg('Please fill out all password fields.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await authService.changePassword(passwords.currentPassword, passwords.newPassword);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccessMsg('Password changed successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to change password.');
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <Meta title="Settings" />
      <style dangerouslySetInnerHTML={{ __html: hidePasswordRevealCSS }} />
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
                onClick={() => {
                  setActiveSection(id);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
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
        <div className="lg:col-span-3 bg-surface border border-border rounded-[16px] p-6 relative">
          
          {successMsg && (
            <div className="mb-6 p-3 bg-success/10 border border-success/20 text-success rounded-[10px] text-body-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <Check size={16} className="stroke-[2.5]" />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-3 bg-error/10 border border-error/20 text-error rounded-[10px] text-body-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div>
              <h2 className="font-heading text-h4 font-bold mb-1">Profile Information</h2>
              <p className="text-body-sm text-text-muted mb-6">Update your personal details and contact information.</p>

              <form onSubmit={handleSaveProfile}>
                <div className="flex items-center gap-5 mb-6 pb-6 border-b border-border">
                  <div 
                    onClick={handleAvatarClick}
                    className="relative w-16 h-16 rounded-[18px] bg-primary/10 flex items-center justify-center text-primary text-h3 font-bold cursor-pointer group hover:bg-primary/20 transition-all overflow-hidden"
                  >
                    {avatarPreviewUrl ? (
                      <img 
                        src={avatarPreviewUrl} 
                        alt="Avatar Preview" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                      />
                    ) : (
                      getInitials(user?.name)
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={18} />
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  <div>
                    <div className="text-body font-semibold text-text">{user?.name}</div>
                    <div className="text-caption text-text-muted uppercase tracking-wider font-bold mt-0.5">{user?.role}</div>
                    <button 
                      type="button"
                      onClick={handleAvatarClick}
                      className="text-body-sm text-primary hover:text-primary-light font-medium mt-1 cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      Change avatar picture
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                      required
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Phone Number</label>
                    <input
                      type="text"
                      value={profileData.phone}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Add phone number"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                      Department {user?.role !== 'admin' && '(Managed by HR)'}
                    </label>
                    {user?.role === 'admin' ? (
                      <select
                        value={profileData.department}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, department: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium cursor-pointer appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                      >
                        <option value="Unassigned">Unassigned</option>
                        {departments.map((dept) => {
                          const name = typeof dept === 'string' ? dept : dept.name;
                          if (!name || name === 'Unassigned') return null;
                          return (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={profileData.department}
                        disabled
                        className="w-full px-4 py-2.5 bg-surface-alt border border-border rounded-[10px] text-body-sm text-text-muted font-medium cursor-not-allowed opacity-80"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-[10px] text-body-sm font-semibold shadow-md shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
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

              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    required
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    required
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    required
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-[10px] text-body-sm font-semibold shadow-md shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Shield size={16} />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-body font-semibold text-danger mb-2">Danger Zone</h3>
                <p className="text-body-sm text-text-muted mb-3">Once deleted, your account cannot be recovered.</p>
                <button 
                  type="button"
                  onClick={() => alert("Purge request filed. Please coordinate with Superadmin to complete account deletion.")}
                  className="px-4 py-2.5 border border-danger/30 text-danger hover:bg-danger/10 font-semibold rounded-[10px] text-body-sm transition-all"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
