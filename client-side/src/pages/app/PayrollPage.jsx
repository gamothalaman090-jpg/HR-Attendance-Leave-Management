import { useState, useEffect } from 'react';
import Meta from '@/components/common/Meta';
import { Search, DollarSign, Plus, CheckCircle, Clock, Trash2, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Badge, SkeletonCard, Input, Select, Button, Modal } from '@/components/ui';
import { payrollService } from '@/services/payrollService';
import { employeeService } from '@/services/employeeService';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/helpers';

export default function PayrollPage() {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Generator/Add Form state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [newRun, setNewRun] = useState({
    employeeId: '',
    salary: 5000,
    payPeriodStart: '2026-05-01',
    payPeriodEnd: '2026-05-31'
  });

  const isHighRanking = user?.role?.toLowerCase().match(/(admin|manager|hr)/) || user?.role?.toLowerCase() === 'superadmin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allPay, allEmp] = await Promise.all([
        payrollService.getAll(),
        employeeService.getAll()
      ]);
      setPayrolls(allPay || []);
      const activeEmps = (allEmp || []).filter(e => e.status === 'active');
      setEmployees(activeEmps);
      
      // Pre-select first employee
      if (activeEmps.length > 0) {
        setNewRun(prev => ({ ...prev, employeeId: activeEmps[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProcessPayment = async (id) => {
    try {
      await payrollService.processPayment(id);
      fetchData();
    } catch (err) {
      alert(err.message || 'Payment processing failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payroll record?')) return;
    try {
      await payrollService.delete(id);
      fetchData();
    } catch (err) {
      alert(err.message || 'Deletion failed');
    }
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    const selectedEmp = employees.find(emp => emp.id === newRun.employeeId);
    if (!selectedEmp) return;

    try {
      await payrollService.create({
        employeeId: newRun.employeeId,
        employeeName: selectedEmp.name,
        salary: Number(newRun.salary),
        payPeriodStart: newRun.payPeriodStart,
        payPeriodEnd: newRun.payPeriodEnd
      });
      setIsGenerateOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Compute metrics
  const totalBudget = payrolls.reduce((sum, p) => sum + p.salary, 0);
  const paidTotal = payrolls.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.salary, 0);
  const pendingTotal = payrolls.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.salary, 0);

  const filteredPayrolls = payrolls.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.employeeName.toLowerCase().includes(q) ||
        p.employeeId.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <Meta title="Payroll Management" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-h2 font-bold mb-1">Payroll Center</h1>
          <p className="text-text-muted text-body">Manage salary releases, pay cycles, and budget ledgers.</p>
        </div>

        {isHighRanking && (
          <Button
            onClick={() => setIsGenerateOpen(true)}
            leftIcon={<Plus size={18} />}
          >
            Generate Run
          </Button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Payroll Budget', value: `$${totalBudget.toLocaleString()}`, sub: 'All periods combined', icon: DollarSign, color: 'primary' },
          { label: 'Released Payments', value: `$${paidTotal.toLocaleString()}`, sub: 'Successfully settled', icon: CheckCircle, color: 'success' },
          { label: 'Pending Releases', value: `$${pendingTotal.toLocaleString()}`, sub: 'Requires HR approval', icon: Clock, color: 'warning' },
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
              <div className="text-caption text-text-muted">{sub}</div>
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
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search ledger..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
              className="w-full"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'paid', label: 'Paid' },
                { value: 'pending', label: 'Pending' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredPayrolls.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-[16px] border border-border shadow-card">
          <FileText size={40} className="mx-auto mb-3 text-text-muted/50" />
          <p className="text-text-muted">No payroll ledger entries found.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-[16px] overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-alt/30">
                  <th className="text-left px-5 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Payroll Run</th>
                  <th className="text-left px-5 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Employee</th>
                  <th className="text-left px-5 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Pay Period</th>
                  <th className="text-left px-5 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Salary</th>
                  <th className="text-left px-5 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Status</th>
                  {isHighRanking && <th className="px-5 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredPayrolls.map((pay) => (
                  <tr key={pay.id} className="border-b border-border last:border-0 hover:bg-surface-alt/50 transition-colors">
                    <td className="px-5 py-4 font-mono text-body-sm text-text font-medium">{pay.id}</td>
                    <td className="px-5 py-4">
                      <div>
                        <div className="text-body-sm font-semibold text-text">{pay.employeeName}</div>
                        <div className="text-caption text-text-muted font-mono">{pay.employeeId}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-body-sm text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="shrink-0" />
                        <span>{pay.payPeriodStart} to {pay.payPeriodEnd}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-body-sm font-bold text-text">${pay.salary.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <Badge variant={pay.status === 'paid' ? 'success' : 'warning'}>
                        {pay.status.toUpperCase()}
                      </Badge>
                    </td>
                    {isHighRanking && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {pay.status === 'pending' ? (
                            <button
                              onClick={() => handleProcessPayment(pay.id)}
                              className="px-3 py-1.5 rounded-[6px] text-caption font-semibold text-white bg-success hover:bg-success-dark transition-all hover:shadow-[0_4px_10px_rgba(34,197,94,0.15)] flex items-center gap-1 cursor-pointer"
                            >
                              Release Salary
                            </button>
                          ) : (
                            <span className="text-caption text-success font-medium flex items-center gap-1">
                              <CheckCircle size={13} /> Slipped ({pay.processedDate})
                            </span>
                          )}
                          <button
                            onClick={() => handleDelete(pay.id)}
                            className="p-2 rounded-full border border-border hover:bg-danger/10 hover:border-danger/20 hover:text-danger text-text-muted transition-all cursor-pointer"
                            title="Purge record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Run Modal Drawer */}
      <Modal isOpen={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} title="Generate Payroll Run" size="md">
        {employees.length === 0 ? (
          <div className="p-4 text-center text-body-sm text-text-muted bg-warning/5 border border-warning/10 rounded-[12px] flex items-start gap-2 pt-2">
            <AlertCircle size={18} className="text-warning shrink-0" />
            <span>No active employees registered to generate payroll runs. Make sure signup approvals are processed first.</span>
          </div>
        ) : (
          <form onSubmit={handleGenerateSubmit} className="space-y-4 pt-2">
            <Select
              label="Select Employee"
              value={newRun.employeeId}
              onChange={e => setNewRun({ ...newRun, employeeId: e.target.value })}
              options={employees.map(emp => ({
                value: emp.id,
                label: `${emp.name} (${emp.id})`
              }))}
            />

            <Input
              required
              label="Basic Monthly Salary ($)"
              type="number"
              min="1"
              value={newRun.salary}
              onChange={e => setNewRun({ ...newRun, salary: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                required
                label="Period Start"
                type="date"
                value={newRun.payPeriodStart}
                onChange={e => setNewRun({ ...newRun, payPeriodStart: e.target.value })}
              />
              <Input
                required
                label="Period End"
                type="date"
                value={newRun.payPeriodEnd}
                onChange={e => setNewRun({ ...newRun, payPeriodEnd: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsGenerateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
              >
                Generate Entry
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
