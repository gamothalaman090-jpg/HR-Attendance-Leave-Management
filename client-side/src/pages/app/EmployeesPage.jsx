import { useState, useEffect } from 'react';
import Meta from '@/components/common/Meta';
import { Search, LayoutGrid, List, Users, Mail, Phone, Building, Plus, Trash2, X, AlertTriangle, Lock, Sparkles, Check, XCircle, UserCheck } from 'lucide-react';
import { Badge, SkeletonCard } from '@/components/ui';
import EmployeeDetailModal from '@/components/ui/EmployeeDetailModal';
import { employeeService } from '@/services/employeeService';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/helpers';
import { getInitials } from '@/utils/formatters';

const STATUS_BADGE = {
  active: 'success',
  'on-leave': 'warning',
  inactive: 'default',
  pending: 'warning',
};

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, onLeave: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [view, setView] = useState('grid');
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'approvals'
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Add Employee Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', email: '', role: '', department: 'Engineering', phone: '', annualBalance: 20, sickBalance: 10, personalBalance: 5 });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingAddEmp, setPendingAddEmp] = useState(null);
  const [isTierLimitOpen, setIsTierLimitOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const isHighRanking = user?.role?.toLowerCase().match(/(admin|manager|hr)/) || user?.role?.toLowerCase() === 'superadmin';

  const fetchData = async () => {
    setLoading(true);
    const [emps, depts, st] = await Promise.all([
      employeeService.getAll(),
      employeeService.getDepartments(),
      employeeService.getStats()
    ]);
    setEmployees(emps);
    setDepartments(depts);
    setStats(st);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDetailModal = (emp) => {
    setSelectedEmployee(emp);
    setIsDetailModalOpen(true);
  };

  const handleAddButtonClick = () => {
    if (employees.length >= 10) {
      setIsTierLimitOpen(true);
    } else {
      setIsAddModalOpen(true);
    }
  };

  const handleDelete = (e, emp) => {
    e.stopPropagation(); // prevent opening detail modal
    setDeleteTarget(emp);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setPendingAddEmp(newEmp);
  };

  /* ── Filter ── */
  const filtered = employees.filter((e) => {
    // Filter based on active tab
    if (activeTab === 'approvals') {
      if (e.status !== 'pending') return false;
    } else {
      if (e.status === 'pending') return false;
    }

    if (deptFilter !== 'all' && e.department !== deptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <Meta title="Employees" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-h2 font-bold mb-1">Employees</h1>
          <p className="text-text-muted text-body">Manage your team directory.</p>
        </div>
        
        {isHighRanking && (
          <button 
            onClick={handleAddButtonClick}
            className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-[10px] font-semibold hover:bg-primary-light hover:shadow-glow-primary transition-all duration-300"
          >
            <Plus size={18} />
            Add Employee
          </button>
        )}
      </div>

      {/* Role-based Tab Switching for Admins/HR/Managers */}
      {isHighRanking && (
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab('directory')}
            className={cn(
              'px-5 py-3 text-body-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'directory'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text'
            )}
          >
            <Users size={16} />
            Employee Directory
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={cn(
              'px-5 py-3 text-body-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 relative',
              activeTab === 'approvals'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text'
            )}
          >
            <UserCheck size={16} />
            Pending Approvals
            {employees.filter(e => e.status === 'pending').length > 0 && (
              <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1.5">
                {employees.filter(e => e.status === 'pending').length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'primary' },
          { label: 'Active', value: stats.active, color: 'success' },
          { label: 'On Leave', value: stats.onLeave, color: 'warning' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 rounded-[12px] bg-surface border border-border text-center">
            <div className={cn(
              'text-h3 font-heading font-bold',
              color === 'primary' && 'text-primary',
              color === 'success' && 'text-success',
              color === 'warning' && 'text-warning',
            )}>{value}</div>
            <div className="text-caption text-text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-[8px] text-body-sm text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-surface border border-border rounded-[8px] text-body-sm text-text cursor-pointer focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* View toggle */}
        <div className="flex bg-surface-alt rounded-[8px] p-1">
          <button
            onClick={() => setView('grid')}
            className={cn(
              'p-2 rounded-[6px] transition-all cursor-pointer',
              view === 'grid' ? 'bg-surface text-primary shadow-card' : 'text-text-muted hover:text-text'
            )}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'p-2 rounded-[6px] transition-all cursor-pointer',
              view === 'list' ? 'bg-surface text-primary shadow-card' : 'text-text-muted hover:text-text'
            )}
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-[16px] border border-border">
          <Users size={40} className="mx-auto mb-3 text-text-muted/50" />
          <p className="text-text-muted">No employees found.</p>
        </div>
      ) : view === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              onClick={() => handleOpenDetailModal(emp)}
              className="p-5 rounded-[16px] bg-surface border border-border hover:shadow-card-hover hover:border-primary/20 transition-all duration-base group cursor-pointer relative overflow-hidden"
            >
              {isHighRanking && (
                <button 
                  onClick={(e) => handleDelete(e, emp)}
                  className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 bg-surface border border-border rounded-full text-text-muted hover:text-danger hover:border-danger/30 hover:bg-danger/10 transition-all"
                  title="Delete Employee"
                >
                  <Trash2 size={16} />
                </button>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-h4 font-bold group-hover:scale-110 transition-transform">
                  {getInitials(emp.name)}
                </div>
                {!isHighRanking && (
                  <Badge variant={STATUS_BADGE[emp.status] || 'default'}>
                    {emp.status === 'on-leave' ? 'On Leave' : emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                  </Badge>
                )}
              </div>
              <h3 className="text-body font-semibold text-text mb-0.5 truncate">{emp.name}</h3>
              <p className="text-body-sm text-text-muted mb-3">{emp.role}</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-caption text-text-muted">
                  <Building size={13} className="shrink-0" />
                  <span className="truncate">{emp.department}</span>
                </div>
                <div className="flex items-center gap-2 text-caption text-text-muted">
                  <Mail size={13} className="shrink-0" />
                  <span className="truncate">{emp.email}</span>
                </div>
              </div>
              {isHighRanking && activeTab === 'approvals' ? (
                <div className="mt-4 pt-4 border-t border-border/50 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setApproveTarget(emp)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-success/15 hover:bg-success/25 text-success text-body-sm font-semibold py-2 rounded-[8px] border border-success/20 transition-all cursor-pointer"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    onClick={() => setRejectTarget(emp)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-danger/15 hover:bg-danger/25 text-danger text-body-sm font-semibold py-2 rounded-[8px] border border-danger/20 transition-all cursor-pointer"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              ) : isHighRanking && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <Badge variant={STATUS_BADGE[emp.status] || 'default'}>
                    {emp.status === 'on-leave' ? 'On Leave' : emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-surface border border-border rounded-[16px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-alt/30">
                  <th className="text-left px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Role</th>
                  <th className="text-left px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="text-left px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Status</th>
                  {isHighRanking && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr 
                    key={emp.id} 
                    onClick={() => handleOpenDetailModal(emp)}
                    className="border-b border-border last:border-0 hover:bg-surface-alt/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-body-sm font-bold shrink-0">
                          {getInitials(emp.name)}
                        </div>
                        <span className="text-body-sm font-medium text-text">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-muted hidden sm:table-cell">{emp.role}</td>
                    <td className="px-4 py-3 text-body-sm text-text-muted hidden md:table-cell">{emp.department}</td>
                    <td className="px-4 py-3 text-body-sm text-text-muted hidden lg:table-cell">{emp.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[emp.status] || 'default'}>
                        {emp.status === 'on-leave' ? 'On Leave' : emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                      </Badge>
                    </td>
                     {isHighRanking && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {activeTab === 'approvals' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setApproveTarget(emp)}
                              className="p-1.5 rounded-full border border-success/20 bg-success/10 text-success hover:bg-success/20 transition-all cursor-pointer"
                              title="Approve registration"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setRejectTarget(emp)}
                              className="p-1.5 rounded-full border border-danger/20 bg-danger/10 text-danger hover:bg-danger/20 transition-all cursor-pointer"
                              title="Reject registration"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => handleDelete(e, emp)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-full transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-surface border border-border rounded-[24px] shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-h3 font-heading font-bold text-text">Add New Employee</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-text-muted hover:text-text p-1 rounded-full hover:bg-border/50 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 custom-scrollbar">
              <div>
                <label className="block text-body-sm font-medium text-text mb-1.5">Full Name</label>
                <input required type="text" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-text mb-1.5">Email Address</label>
                <input required type="email" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-medium text-text mb-1.5">Role</label>
                  <input required type="text" value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-text mb-1.5">Department</label>
                  <select value={newEmp.department} onChange={e => setNewEmp({...newEmp, department: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary transition-colors">
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-text mb-1.5">Phone (Optional)</label>
                <input type="tel" value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-[10px] text-body-sm text-text focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-caption font-medium text-text-muted mb-1.5">Annual Days</label>
                  <input type="number" min="0" value={newEmp.annualBalance} onChange={e => setNewEmp({...newEmp, annualBalance: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-background border border-border rounded-[8px] text-body-sm text-text focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-caption font-medium text-text-muted mb-1.5">Sick Days</label>
                  <input type="number" min="0" value={newEmp.sickBalance} onChange={e => setNewEmp({...newEmp, sickBalance: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-background border border-border rounded-[8px] text-body-sm text-text focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-caption font-medium text-text-muted mb-1.5">Personal</label>
                  <input type="number" min="0" value={newEmp.personalBalance} onChange={e => setNewEmp({...newEmp, personalBalance: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-background border border-border rounded-[8px] text-body-sm text-text focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              
              <div className="pt-4 mt-2 border-t border-border flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-[10px] font-medium text-text hover:bg-border/50 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-[10px] font-semibold text-white bg-primary hover:bg-primary-light hover:shadow-glow-primary transition-all">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <EmployeeDetailModal 
        employee={selectedEmployee}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />

      {/* CUSTOM MODAL: DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-surface border border-border rounded-[24px] shadow-2xl w-full max-w-md p-6 flex flex-col items-center text-center overflow-hidden onboard-step-anim">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-danger/10 rounded-full blur-xl" />
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-4 shrink-0">
              <Trash2 size={28} className="stroke-[2]" />
            </div>
            
            <h3 className="text-h3 font-heading font-bold text-text mb-2">Delete Employee?</h3>
            <p className="text-body-sm text-text-muted mb-4 max-w-xs">
              Are you sure you want to permanently remove <span className="font-semibold text-text">{deleteTarget.name}</span> from the workspace directory?
            </p>
            
            <div className="w-full bg-surface-alt border border-border rounded-[12px] p-3 mb-5 text-left flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-body-sm font-bold shrink-0">
                {getInitials(deleteTarget.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-body-sm font-semibold text-text truncate">{deleteTarget.name}</div>
                <div className="text-caption text-text-muted truncate">{deleteTarget.role} • {deleteTarget.department}</div>
              </div>
            </div>
            
            <div className="w-full bg-danger/5 border border-danger/10 text-danger rounded-[12px] p-3 text-caption text-left mb-6 flex items-start gap-2.5">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>This will permanently purge their leave records, attendance history, and system permissions. This action is irreversible.</span>
            </div>
            
            <div className="flex w-full gap-3">
              <button 
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-[12px] font-medium border border-border hover:bg-surface-alt text-text transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={async () => {
                  const targetId = deleteTarget.id;
                  setDeleteTarget(null);
                  await employeeService.delete(targetId);
                  fetchData();
                }}
                className="flex-1 py-3 rounded-[12px] font-semibold text-white bg-danger hover:bg-danger/90 transition-all hover:shadow-[0_4px_12px_rgba(239,68,68,0.2)] cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM MODAL: ADD CONFIRMATION */}
      {pendingAddEmp && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setPendingAddEmp(null)} />
          <div className="relative bg-surface border border-border rounded-[24px] shadow-2xl w-full max-w-md p-6 flex flex-col items-center text-center overflow-hidden onboard-step-anim">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-success/10 rounded-full blur-xl" />
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-success mb-4 shrink-0">
              <Plus size={28} className="stroke-[2.5]" />
            </div>
            
            <h3 className="text-h3 font-heading font-bold text-text mb-2">Confirm New Employee</h3>
            <p className="text-body-sm text-text-muted mb-4 max-w-xs">
              You are about to add <span className="font-semibold text-text">{pendingAddEmp.name}</span> to the system. Please verify their details below.
            </p>
            
            <div className="w-full bg-surface-alt border border-border rounded-[16px] p-4 text-left space-y-3 mb-6">
              <div className="flex justify-between items-center text-body-sm">
                <span className="text-text-muted">Full Name</span>
                <span className="font-semibold text-text">{pendingAddEmp.name}</span>
              </div>
              <div className="flex justify-between items-center text-body-sm border-t border-border/50 pt-2.5">
                <span className="text-text-muted">Email</span>
                <span className="font-semibold text-text truncate max-w-[200px]">{pendingAddEmp.email}</span>
              </div>
              <div className="flex justify-between items-center text-body-sm border-t border-border/50 pt-2.5">
                <span className="text-text-muted">Role</span>
                <span className="font-semibold text-text">{pendingAddEmp.role}</span>
              </div>
              <div className="flex justify-between items-center text-body-sm border-t border-border/50 pt-2.5">
                <span className="text-text-muted">Department</span>
                <span className="font-semibold text-text">{pendingAddEmp.department}</span>
              </div>
            </div>
            
            <div className="flex w-full gap-3">
              <button 
                type="button"
                onClick={() => setPendingAddEmp(null)}
                className="flex-1 py-3 rounded-[12px] font-medium border border-border hover:bg-surface-alt text-text transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button 
                type="button"
                onClick={async () => {
                  const data = pendingAddEmp;
                  setPendingAddEmp(null);
                  setIsAddModalOpen(false);
                  await employeeService.create({
                    ...data,
                    status: 'active',
                  });
                  setNewEmp({ name: '', email: '', role: '', department: 'Engineering', phone: '', annualBalance: 20, sickBalance: 10, personalBalance: 5 });
                  fetchData();
                }}
                className="flex-1 py-3 rounded-[12px] font-semibold text-white bg-primary hover:bg-primary-light transition-all hover:shadow-glow-primary cursor-pointer"
              >
                Confirm & Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM MODAL: TIER CAPACITY LIMIT */}
      {isTierLimitOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsTierLimitOpen(false)} />
          <div className="relative bg-surface border border-border rounded-[24px] shadow-2xl w-full max-w-md p-6 flex flex-col items-center text-center overflow-hidden onboard-step-anim">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-warning/10 rounded-full blur-xl" />
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center text-warning mb-4 shrink-0">
              <Lock size={28} className="stroke-[2]" />
            </div>
            
            <h3 className="text-h3 font-heading font-bold text-text mb-2">Tier Limit Reached</h3>
            <p className="text-body-sm text-text-muted mb-6 max-w-sm">
              Your workspace is on the <span className="font-semibold text-primary">Starter Tier</span>, which supports up to <span className="font-semibold text-text">10 active employees</span>.
            </p>
            
            <div className="w-full bg-surface-alt border border-border rounded-[16px] p-4 mb-6 text-left">
              <div className="flex justify-between items-center text-caption font-semibold mb-2">
                <span className="text-text-muted">Directory Capacity</span>
                <span className="text-warning">{employees.length} / 10 Active Members</span>
              </div>
              <div className="w-full bg-border rounded-full h-3.5 overflow-hidden p-[2px]">
                <div 
                  className="bg-gradient-to-r from-warning to-primary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (employees.length / 10) * 100)}%` }} 
                />
              </div>
              <p className="text-[11px] text-text-muted mt-2">
                {employees.length >= 10 
                  ? "To add new employees, you must upgrade your workspace subscription or remove existing members."
                  : `You have ${10 - employees.length} slots remaining in your Starter subscription.`
                }
              </p>
            </div>
            
            <div className="flex w-full gap-3">
              <button 
                type="button"
                onClick={() => setIsTierLimitOpen(false)}
                className="flex-1 py-3 rounded-[12px] font-medium border border-border hover:bg-surface-alt text-text transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button 
                type="button"
                onClick={() => {
                  setIsTierLimitOpen(false);
                  alert("Upgrade flow initiated! Directing to enterprise pricing selector...");
                }}
                className="flex-1 py-3 rounded-[12px] font-semibold text-white bg-primary hover:bg-primary-light transition-all hover:shadow-glow-primary flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles size={16} /> Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM MODAL: APPROVE CONFIRMATION */}
      {approveTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setApproveTarget(null)} />
          <div className="relative bg-surface border border-border rounded-[24px] shadow-2xl w-full max-w-md p-6 flex flex-col items-center text-center overflow-hidden onboard-step-anim">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-success/10 rounded-full blur-xl" />
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-success mb-4 shrink-0">
              <Check size={28} className="stroke-[2.5]" />
            </div>
            
            <h3 className="text-h3 font-heading font-bold text-text mb-2">Approve Registration?</h3>
            <p className="text-body-sm text-text-muted mb-4 max-w-xs">
              Are you sure you want to approve <span className="font-semibold text-text">{approveTarget.name}</span>'s registration? They will gain immediate access to their dashboard.
            </p>
            
            <div className="w-full bg-surface-alt border border-border rounded-[12px] p-3 mb-6 text-left flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-body-sm font-bold shrink-0">
                {getInitials(approveTarget.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-body-sm font-semibold text-text truncate">{approveTarget.name}</div>
                <div className="text-caption text-text-muted truncate">{approveTarget.role} • {approveTarget.department}</div>
              </div>
            </div>
            
            <div className="flex w-full gap-3">
              <button 
                type="button"
                onClick={() => setApproveTarget(null)}
                className="flex-1 py-3 rounded-[12px] font-medium border border-border hover:bg-surface-alt text-text transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={async () => {
                  const targetId = approveTarget.id;
                  setApproveTarget(null);
                  await employeeService.approve(targetId);
                  fetchData();
                }}
                className="flex-1 py-3 rounded-[12px] font-semibold text-white bg-success hover:bg-success/90 transition-all hover:shadow-[0_4px_12px_rgba(34,197,94,0.2)] cursor-pointer"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM MODAL: REJECT CONFIRMATION */}
      {rejectTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setRejectTarget(null)} />
          <div className="relative bg-surface border border-border rounded-[24px] shadow-2xl w-full max-w-md p-6 flex flex-col items-center text-center overflow-hidden onboard-step-anim">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-danger/10 rounded-full blur-xl" />
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-4 shrink-0">
              <XCircle size={28} className="stroke-[2]" />
            </div>
            
            <h3 className="text-h3 font-heading font-bold text-text mb-2">Reject Registration?</h3>
            <p className="text-body-sm text-text-muted mb-4 max-w-xs">
              Are you sure you want to reject and purge <span className="font-semibold text-text">{rejectTarget.name}</span>'s pending registration request?
            </p>
            
            <div className="w-full bg-surface-alt border border-border rounded-[12px] p-3 mb-6 text-left flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-body-sm font-bold shrink-0">
                {getInitials(rejectTarget.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-body-sm font-semibold text-text truncate">{rejectTarget.name}</div>
                <div className="text-caption text-text-muted truncate">{rejectTarget.role} • {rejectTarget.department}</div>
              </div>
            </div>
            
            <div className="flex w-full gap-3">
              <button 
                type="button"
                onClick={() => setRejectTarget(null)}
                className="flex-1 py-3 rounded-[12px] font-medium border border-border hover:bg-surface-alt text-text transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={async () => {
                  const targetId = rejectTarget.id;
                  setRejectTarget(null);
                  await employeeService.reject(targetId);
                  fetchData();
                }}
                className="flex-1 py-3 rounded-[12px] font-semibold text-white bg-danger hover:bg-danger/90 transition-all hover:shadow-[0_4px_12px_rgba(239,68,68,0.2)] cursor-pointer"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
