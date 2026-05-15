import { useState, useEffect } from 'react';
import Meta from '@/components/common/Meta';
import { Search, LayoutGrid, List, Users, Mail, Phone, Building } from 'lucide-react';
import { Badge, SkeletonCard } from '@/components/ui';
import EmployeeDetailModal from '@/components/ui/EmployeeDetailModal';
import { employeeService } from '@/services/employeeService';
import { cn } from '@/utils/helpers';
import { getInitials, formatDate } from '@/utils/formatters';

const STATUS_BADGE = {
  active: 'success',
  'on-leave': 'warning',
  inactive: 'default',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [view, setView] = useState('grid'); // 'grid' | 'list'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [emps, depts] = await Promise.all([
        employeeService.getAll(),
        employeeService.getDepartments(),
      ]);
      setEmployees(emps);
      setDepartments(depts);
      setLoading(false);
    })();
  }, []);

  const handleOpenModal = (emp) => {
    setSelectedEmployee(emp);
    setIsModalOpen(true);
  };

  /* ── Filter ── */
  const filtered = employees.filter((e) => {
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

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === 'active').length,
    onLeave: employees.filter((e) => e.status === 'on-leave').length,
  };

  return (
    <div>
      <Meta title="Employees" />
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-h2 font-bold mb-1">Employees</h1>
        <p className="text-text-muted text-body">Manage your team directory.</p>
      </div>

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
            aria-label="Grid view"
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
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
              onClick={() => handleOpenModal(emp)}
              className="p-5 rounded-[16px] bg-surface border border-border hover:shadow-card-hover hover:border-primary/20 transition-all duration-base group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-h4 font-bold group-hover:scale-110 transition-transform">
                  {getInitials(emp.name)}
                </div>
                <Badge variant={STATUS_BADGE[emp.status] || 'default'}>
                  {emp.status === 'on-leave' ? 'On Leave' : emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                </Badge>
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
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-surface border border-border rounded-[16px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Role</th>
                  <th className="text-left px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="text-left px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr 
                    key={emp.id} 
                    onClick={() => handleOpenModal(emp)}
                    className="border-b border-border last:border-0 hover:bg-surface-alt/50 transition-colors cursor-pointer"
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <EmployeeDetailModal 
        employee={selectedEmployee}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
