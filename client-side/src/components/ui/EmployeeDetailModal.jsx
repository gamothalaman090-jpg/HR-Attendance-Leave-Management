import { useState, useEffect } from 'react';
import { X, Mail, Phone, Building, Calendar, Shield, CreditCard, Clock, Edit2, Save, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui';
import { getInitials } from '@/utils/formatters';
import { cn } from '@/utils/helpers';
import { useAuth } from '@/context/AuthContext';
import employeeService from '@/services/employeeService';

const STATUS_BADGE = {
  active: 'success',
  'on-leave': 'warning',
  inactive: 'default',
};

export default function EmployeeDetailModal({ employee, isOpen, onClose, onUpdate, departments = [] }) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    role: '',
    annualBalance: 20,
    sickBalance: 12,
    personalBalance: 7,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || 'Unassigned',
        role: employee.role || 'Staff Employee',
        annualBalance: employee.leaveBalance?.annual ?? 20,
        sickBalance: employee.leaveBalance?.sick ?? 12,
        personalBalance: employee.leaveBalance?.personal ?? 7,
      });
      setIsEditing(false);
      setErrorMsg('');
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name, val) => {
    const intVal = parseInt(val, 10);
    setFormData((prev) => ({ ...prev, [name]: isNaN(intVal) ? 0 : intVal }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMsg('Name and email are required fields.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const updated = await employeeService.update(employee.id, formData);
      if (onUpdate) {
        onUpdate(updated);
      }
      setIsEditing(false);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update employee details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-[20px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header/Banner */}
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative">
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            {isAdmin && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 bg-surface/80 backdrop-blur-md rounded-full text-primary hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center"
                title="Edit Employee"
              >
                <Edit2 size={16} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 bg-surface/80 backdrop-blur-md rounded-full text-text-muted hover:text-text transition-all shadow-sm flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Profile Info Overlay */}
        <div className="px-6 pb-8 -mt-12 relative">
          <form onSubmit={handleSave}>
            <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-6">
              <div className="w-24 h-24 rounded-[24px] bg-primary flex items-center justify-center text-white text-h2 font-bold shadow-xl ring-4 ring-surface select-none">
                {getInitials(isEditing ? formData.name : employee.name)}
              </div>
              <div className="flex-1 pb-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <h2 className="text-h3 font-heading font-bold text-text">{employee.name}</h2>
                      <Badge variant={STATUS_BADGE[employee.status] || 'default'}>
                        {employee.status === 'on-leave' ? 'On Leave' : employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-body text-text-muted font-medium">{employee.role}</p>
                  </>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3 bg-error/10 border border-error/20 text-error rounded-[10px] text-body-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Contact & General Info */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-caption font-bold text-text-muted uppercase tracking-wider mb-4">Contact Information</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-body-sm text-text">
                      <div className="w-8 h-8 rounded-[8px] bg-surface-alt flex items-center justify-center text-text-muted flex-shrink-0">
                        <Mail size={16} />
                      </div>
                      {isEditing ? (
                        <div className="flex-1">
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-1.5 bg-background border border-border rounded-[8px] text-body-sm text-text focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      ) : (
                        <span className="truncate">{employee.email}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-text">
                      <div className="w-8 h-8 rounded-[8px] bg-surface-alt flex items-center justify-center text-text-muted flex-shrink-0">
                        <Phone size={16} />
                      </div>
                      {isEditing ? (
                        <div className="flex-1">
                          <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Add phone number"
                            className="w-full px-3 py-1.5 bg-background border border-border rounded-[8px] text-body-sm text-text focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      ) : (
                        <span>{employee.phone || 'No phone added'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-caption font-bold text-text-muted uppercase tracking-wider mb-4">Employment Details</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-body-sm text-text">
                      <div className="w-8 h-8 rounded-[8px] bg-surface-alt flex items-center justify-center text-text-muted flex-shrink-0">
                        <Building size={16} />
                      </div>
                      {isEditing ? (
                        <div className="flex-grow flex gap-2">
                          <div className="flex-1">
                            <select
                              name="department"
                              value={formData.department}
                              onChange={handleInputChange}
                              className="w-full px-3 py-1.5 bg-background border border-border rounded-[8px] text-body-sm text-text focus:outline-none focus:border-primary transition-colors cursor-pointer appearance-none"
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
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
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              name="role"
                              value={formData.role}
                              onChange={handleInputChange}
                              placeholder="Position/Role"
                              className="w-full px-3 py-1.5 bg-background border border-border rounded-[8px] text-body-sm text-text focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                        </div>
                      ) : (
                        <span>{employee.department} • {employee.role}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-text">
                      <div className="w-8 h-8 rounded-[8px] bg-surface-alt flex items-center justify-center text-text-muted flex-shrink-0">
                        <Calendar size={16} />
                      </div>
                      <span>Joined {new Date(employee.joinDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-text">
                      <div className="w-8 h-8 rounded-[8px] bg-surface-alt flex items-center justify-center text-text-muted flex-shrink-0">
                        <Shield size={16} />
                      </div>
                      <span className="font-mono text-xs">ID: {employee.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Leave Balance & Quick Actions */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-caption font-bold text-text-muted uppercase tracking-wider mb-4">Leave Balances</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-[12px] bg-surface-alt border border-border flex flex-col justify-between min-h-[72px]">
                      <div className="flex items-center gap-2 text-primary">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Annual</span>
                      </div>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={formData.annualBalance}
                          onChange={(e) => handleNumberChange('annualBalance', e.target.value)}
                          className="w-full mt-1.5 px-2 py-1 bg-background border border-border rounded-[6px] text-body-sm font-bold text-text focus:outline-none focus:border-primary"
                        />
                      ) : (
                        <div className="text-h4 font-bold text-text-strong">{employee.leaveBalance?.annual || 0}d</div>
                      )}
                    </div>
                    <div className="p-3 rounded-[12px] bg-surface-alt border border-border flex flex-col justify-between min-h-[72px]">
                      <div className="flex items-center gap-2 text-success">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Sick</span>
                      </div>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={formData.sickBalance}
                          onChange={(e) => handleNumberChange('sickBalance', e.target.value)}
                          className="w-full mt-1.5 px-2 py-1 bg-background border border-border rounded-[6px] text-body-sm font-bold text-text focus:outline-none focus:border-primary"
                        />
                      ) : (
                        <div className="text-h4 font-bold text-text-strong">{employee.leaveBalance?.sick || 0}d</div>
                      )}
                    </div>
                    <div className="p-3 rounded-[12px] bg-surface-alt border border-border flex flex-col justify-between min-h-[72px]">
                      <div className="flex items-center gap-2 text-warning">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Personal</span>
                      </div>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={formData.personalBalance}
                          onChange={(e) => handleNumberChange('personalBalance', e.target.value)}
                          className="w-full mt-1.5 px-2 py-1 bg-background border border-border rounded-[6px] text-body-sm font-bold text-text focus:outline-none focus:border-primary"
                        />
                      ) : (
                        <div className="text-h4 font-bold text-text-strong">{employee.leaveBalance?.personal || 0}d</div>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2.5 border border-border hover:bg-surface-alt text-text rounded-[10px] text-body-sm font-semibold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-[10px] text-body-sm font-semibold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                ) : (
                  <div className="p-4 rounded-[16px] bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-primary uppercase">Quick Action</p>
                        <p className="text-body-sm font-semibold">Payroll Settings</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={onClose}
                      className="w-full py-2 bg-primary text-white rounded-[8px] text-body-sm font-medium hover:bg-primary-dark transition-colors"
                    >
                      Dismiss View
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
