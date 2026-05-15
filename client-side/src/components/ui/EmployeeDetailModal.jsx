import { X, Mail, Phone, Building, Calendar, Shield, CreditCard, Clock } from 'lucide-react';
import { Badge } from '@/components/ui';
import { getInitials } from '@/utils/formatters';
import { cn } from '@/utils/helpers';

const STATUS_BADGE = {
  active: 'success',
  'on-leave': 'warning',
  inactive: 'default',
};

export default function EmployeeDetailModal({ employee, isOpen, onClose }) {
  if (!isOpen || !employee) return null;

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
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-surface/50 backdrop-blur-md rounded-full text-text-muted hover:text-text transition-colors z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Info Overlay */}
        <div className="px-6 pb-8 -mt-12 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-8">
            <div className="w-24 h-24 rounded-[24px] bg-primary flex items-center justify-center text-white text-h2 font-bold shadow-xl ring-4 ring-surface">
              {getInitials(employee.name)}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h2 className="text-h3 font-heading font-bold text-text">{employee.name}</h2>
                <Badge variant={STATUS_BADGE[employee.status] || 'default'}>
                  {employee.status === 'on-leave' ? 'On Leave' : employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                </Badge>
              </div>
              <p className="text-body text-text-muted font-medium">{employee.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact & General Info */}
            <div className="space-y-6">
              <div>
                <h4 className="text-caption font-bold text-text-muted uppercase tracking-wider mb-4">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-body-sm text-text">
                    <div className="w-8 h-8 rounded-[8px] bg-surface-alt flex items-center justify-center text-text-muted">
                      <Mail size={16} />
                    </div>
                    {employee.email}
                  </div>
                  <div className="flex items-center gap-3 text-body-sm text-text">
                    <div className="w-8 h-8 rounded-[8px] bg-surface-alt flex items-center justify-center text-text-muted">
                      <Phone size={16} />
                    </div>
                    {employee.phone}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-caption font-bold text-text-muted uppercase tracking-wider mb-4">Employment Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-body-sm text-text">
                    <div className="w-8 h-8 rounded-[8px] bg-surface-alt flex items-center justify-center text-text-muted">
                      <Building size={16} />
                    </div>
                    {employee.department}
                  </div>
                  <div className="flex items-center gap-3 text-body-sm text-text">
                    <div className="w-8 h-8 rounded-[8px] bg-surface-alt flex items-center justify-center text-text-muted">
                      <Calendar size={16} />
                    </div>
                    Joined {new Date(employee.joinDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-3 text-body-sm text-text">
                    <div className="w-8 h-8 rounded-[8px] bg-surface-alt flex items-center justify-center text-text-muted">
                      <Shield size={16} />
                    </div>
                    ID: {employee.id}
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Balance & Stats */}
            <div className="space-y-6">
              <div>
                <h4 className="text-caption font-bold text-text-muted uppercase tracking-wider mb-4">Leave Balances</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-[12px] bg-surface-alt border border-border">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <Clock size={14} />
                      <span className="text-[10px] font-bold uppercase">Annual</span>
                    </div>
                    <div className="text-h4 font-bold">{employee.leaveBalance?.annual || 0}d</div>
                  </div>
                  <div className="p-3 rounded-[12px] bg-surface-alt border border-border">
                    <div className="flex items-center gap-2 text-success mb-1">
                      <Clock size={14} />
                      <span className="text-[10px] font-bold uppercase">Sick</span>
                    </div>
                    <div className="text-h4 font-bold">{employee.leaveBalance?.sick || 0}d</div>
                  </div>
                  <div className="p-3 rounded-[12px] bg-surface-alt border border-border">
                    <div className="flex items-center gap-2 text-warning mb-1">
                      <Clock size={14} />
                      <span className="text-[10px] font-bold uppercase">Personal</span>
                    </div>
                    <div className="text-h4 font-bold">{employee.leaveBalance?.personal || 0}d</div>
                  </div>
                </div>
              </div>

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
                <button className="w-full py-2 bg-primary text-white rounded-[8px] text-body-sm font-medium hover:bg-primary-dark transition-colors">
                  View Full Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
