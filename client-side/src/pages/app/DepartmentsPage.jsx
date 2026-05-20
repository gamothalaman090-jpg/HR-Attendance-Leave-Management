import { useState, useEffect } from 'react';
import Meta from '@/components/common/Meta';
import { Search, Building, Plus, Trash2, Edit2, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { Badge, SkeletonCard, Input, Button, Modal } from '@/components/ui';
import { departmentService } from '@/services/departmentService';
import { employeeService } from '@/services/employeeService';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/helpers';

export default function DepartmentsPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add / Edit Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [editDeptTarget, setEditDeptTarget] = useState(null);
  const [editDeptName, setEditDeptName] = useState('');

  // Delete Validation Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteBlockOpen, setIsDeleteBlockOpen] = useState(false);

  const isHighRanking = user?.role?.toLowerCase().match(/(admin|manager|hr)/) || user?.role?.toLowerCase() === 'superadmin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [depts, emps] = await Promise.all([
        departmentService.getAll(),
        employeeService.getAll(),
      ]);
      setDepartments(depts || []);
      setEmployees(emps || []);
    } catch (err) {
      console.error('Failed to load department data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute stats
  const getEmployeeCount = (deptName) => {
    return employees.filter(emp => emp.department === deptName && emp.status === 'active').length;
  };

  const totalDepartments = departments.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;

  let topDept = 'N/A';
  let maxCount = 0;
  departments.forEach(dept => {
    const count = getEmployeeCount(dept);
    if (count > maxCount) {
      maxCount = count;
      topDept = dept;
    }
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      await departmentService.create(newDeptName.trim());
      setNewDeptName('');
      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create department');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editDeptName.trim() || !editDeptTarget) return;
    try {
      await departmentService.update(editDeptTarget, editDeptName.trim());
      setEditDeptTarget(null);
      setEditDeptName('');
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update department');
    }
  };

  const openEditModal = (dept) => {
    setEditDeptTarget(dept);
    setEditDeptName(dept);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (dept) => {
    const count = getEmployeeCount(dept);
    if (count > 0) {
      setDeleteTarget(dept);
      setIsDeleteBlockOpen(true);
    } else {
      setDeleteTarget(dept);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await departmentService.delete(deleteTarget);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete department');
    }
  };

  const filteredDepartments = departments.filter(dept => 
    dept.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <Meta title="Departments" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-h2 font-bold mb-1">Departments</h1>
          <p className="text-text-muted text-body">Manage organizational departments and team allocation.</p>
        </div>

        {isHighRanking && (
          <Button
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus size={18} />}
          >
            Add Department
          </Button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Departments', value: totalDepartments, icon: Building, color: 'primary' },
          { label: 'Top Department', value: topDept, sub: maxCount > 0 ? `${maxCount} employees` : '0 employees', icon: TrendingUp, color: 'success' },
          { label: 'Active Personnel', value: activeEmployees, icon: Users, color: 'warning' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="p-5 rounded-[16px] bg-surface border border-border flex items-center justify-between shadow-card">
            <div>
              <div className="text-caption text-text-muted mb-1">{label}</div>
              <div className={cn(
                'text-h3 font-heading font-bold mb-0.5',
                color === 'primary' && 'text-primary',
                color === 'success' && 'text-success',
                color === 'warning' && 'text-warning',
              )}>{value}</div>
              {sub && <div className="text-caption text-text-muted">{sub}</div>}
            </div>
            <div className={cn(
              'w-12 h-12 rounded-[12px] flex items-center justify-center',
              color === 'primary' && 'bg-primary/10 text-primary',
              color === 'success' && 'bg-success/10 text-success',
              color === 'warning' && 'bg-warning/10 text-warning',
            )}>
              <Icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 bg-surface/50 border border-border p-4 rounded-[16px] backdrop-blur-sm">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
            className="w-full"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-[16px] border border-border shadow-card">
          <Building size={40} className="mx-auto mb-3 text-text-muted/50" />
          <p className="text-text-muted">No departments found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => {
            const count = getEmployeeCount(dept);
            return (
              <div
                key={dept}
                className="p-5 rounded-[16px] bg-surface border border-border flex flex-col justify-between hover:shadow-card hover:border-border-hover transition-all duration-300 group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Building size={18} />
                    </div>
                    <h3 className="text-body font-semibold text-text truncate">{dept}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-caption text-text-muted mb-4">
                    <Users size={14} className="shrink-0" />
                    <span>{count} active employee{count !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {isHighRanking && (
                  <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-3">
                    <button
                      onClick={() => openEditModal(dept)}
                      className="p-2 rounded-full border border-border text-text-muted hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all cursor-pointer"
                      title="Edit Department"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(dept)}
                      className="p-2 rounded-full border border-border text-text-muted hover:text-danger hover:bg-danger/10 hover:border-danger/20 transition-all cursor-pointer"
                      title="Delete Department"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Department Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Department" size="md">
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
          <Input
            required
            label="Department Name"
            placeholder="e.g. Finance"
            value={newDeptName}
            onChange={e => setNewDeptName(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
            >
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rename Department Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Rename Department" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          <Input
            required
            label="Department Name"
            value={editDeptName}
            onChange={e => setEditDeptName(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETION BLOCKED MODAL */}
      <Modal isOpen={isDeleteBlockOpen} onClose={() => { setIsDeleteBlockOpen(false); setDeleteTarget(null); }} title="Deletion Blocked" size="md">
        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-4">
            <AlertTriangle size={28} />
          </div>
          <p className="text-body-sm text-text-muted mb-6">
            You cannot delete the department <span className="font-semibold text-text">"{deleteTarget}"</span> because there are active employees currently assigned to it.
          </p>
          <div className="w-full bg-surface-alt border border-border rounded-[12px] p-4 text-left mb-6">
            <div className="text-body-sm font-semibold text-text mb-1">Assigned Staff Count</div>
            <div className="text-caption text-text-muted">
              {getEmployeeCount(deleteTarget)} active personnel must be reassigned to other departments before this department can be purged.
            </div>
          </div>
          <Button
            type="button"
            className="w-full"
            variant="secondary"
            onClick={() => {
              setIsDeleteBlockOpen(false);
              setDeleteTarget(null);
            }}
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* NORMAL DELETE CONFIRMATION MODAL */}
      <Modal isOpen={!!deleteTarget && !isDeleteBlockOpen} onClose={() => setDeleteTarget(null)} title="Delete Department?" size="md">
        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-4">
            <Trash2 size={28} />
          </div>
          <p className="text-body-sm text-text-muted mb-6">
            Are you sure you want to permanently delete the department <span className="font-semibold text-text">"{deleteTarget}"</span>? This action cannot be undone.
          </p>
          <div className="flex w-full gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={confirmDelete}
              className="flex-1 bg-danger hover:bg-danger-dark border-none text-white hover:text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
