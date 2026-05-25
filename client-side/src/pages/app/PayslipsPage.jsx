import { useState, useEffect } from 'react';
import Meta from '@/components/common/Meta';
import { Search, FileText, Printer, Eye, Download, ShieldCheck, Landmark } from 'lucide-react';
import { Badge, SkeletonCard, Input, Button, Modal } from '@/components/ui';
import { payrollService } from '@/services/payrollService';
import { employeeService } from '@/services/employeeService';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/helpers';

export default function PayslipsPage() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const isHighRanking = user?.role?.toLowerCase().match(/(admin|manager|hr)/) || user?.role?.toLowerCase() === 'superadmin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const allPay = await payrollService.getAll(isHighRanking);
      // If employee/manager/hr:
      // Admins/HR/Managers see all payslips, regular employees only see their own payslips
      if (isHighRanking) {
        setPayslips(allPay.filter(p => p.status === 'paid'));
      } else {
        // Backend filters user payroll automatically, so we set the result directly
        setPayslips(allPay);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const filteredPayslips = payslips.filter(p => {
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

  const handlePrint = () => {
    window.print();
  };

  // Helper to calculate components of salary
  const getPayslipDetails = (pay) => {
    if (!pay) return null;
    const basic = pay.salary;
    const allowance = Math.round(basic * 0.12); // Mock 12% allowances
    const tax = Math.round(basic * 0.15); // Mock 15% income tax
    const pension = Math.round(basic * 0.05); // Mock 5% pension fund
    const netPay = basic + allowance - tax - pension;

    return {
      basic,
      allowance,
      tax,
      pension,
      netPay
    };
  };

  const details = getPayslipDetails(selectedPayslip);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <Meta title="Payslips" />

      {/* Printable Area Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-payslip, #printable-payslip * {
            visibility: visible;
          }
          #printable-payslip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 no-print">
        <div>
          <h1 className="font-heading text-h2 font-bold mb-1">My Payslips</h1>
          <p className="text-text-muted text-body">View and download your digital payroll slips and earnings ledger.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-6 no-print bg-surface/50 border border-border p-4 rounded-[16px] backdrop-blur-sm">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search paystubs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
            className="w-full"
          />
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredPayslips.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-[16px] border border-border no-print shadow-card">
          <FileText size={40} className="mx-auto mb-3 text-text-muted/50" />
          <p className="text-text-muted">No released payslips found.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-[16px] overflow-hidden no-print shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-alt/30">
                  <th className="text-left px-5 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Statement ID</th>
                  <th className="text-left px-5 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Employee</th>
                  <th className="text-left px-5 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Cycle Period</th>
                  <th className="text-left px-5 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Release Date</th>
                  <th className="text-left px-5 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Net Amount</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayslips.map((pay) => {
                  const payDetail = getPayslipDetails(pay);
                  return (
                    <tr key={pay.id} className="border-b border-border last:border-0 hover:bg-surface-alt/50 transition-colors">
                      <td className="px-5 py-4 font-mono text-body-sm text-text font-medium">{pay.id}</td>
                      <td className="px-5 py-4">
                        <div>
                          <div className="text-body-sm font-semibold text-text">{pay.employeeName}</div>
                          <div className="text-caption text-text-muted font-mono">{pay.employeeId}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-body-sm text-text-muted">
                        {pay.payPeriodStart} to {pay.payPeriodEnd}
                      </td>
                      <td className="px-5 py-4 text-body-sm text-text-muted">{pay.processedDate}</td>
                      <td className="px-5 py-4 text-body-sm font-bold text-success">${payDetail.netPay.toLocaleString()}</td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          onClick={() => setSelectedPayslip(pay)}
                          variant="secondary"
                          size="sm"
                          leftIcon={<Eye size={14} />}
                        >
                          View Slip
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payslip View/Print Modal */}
      <Modal 
        isOpen={!!selectedPayslip && !!details} 
        onClose={() => setSelectedPayslip(null)} 
        title="View Payslip Statement" 
        size="xl"
        className="no-print"
        footer={
          <div className="flex gap-2">
            <Button
              onClick={handlePrint}
              leftIcon={<Printer size={16} />}
            >
              Print Payslip
            </Button>
            <Button
              variant="secondary"
              onClick={() => setSelectedPayslip(null)}
            >
              Close
            </Button>
          </div>
        }
      >
        {selectedPayslip && details && (
          <div id="printable-payslip" className="bg-surface rounded-[16px] border border-border/80 p-6 md:p-8 text-text select-text mt-2">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Landmark size={24} className="text-primary shrink-0" />
                  <span className="font-heading text-h3 font-bold uppercase tracking-wider text-text">NINI LABS CO.</span>
                </div>
                <p className="text-caption text-text-muted leading-relaxed">
                  100 Pine Street, Floor 32<br />
                  San Francisco, CA 94111<br />
                  hr@ninilabs.io
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-success/15 border border-success/20 text-success text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">Paid Release</span>
                <div className="text-caption text-text-muted">Statement Ref:</div>
                <div className="font-mono text-body-sm font-semibold text-text">{selectedPayslip.id}</div>
              </div>
            </div>

            {/* General details grid */}
            <div className="grid grid-cols-2 gap-4 bg-surface-alt/40 border border-border rounded-[12px] p-4 mb-6">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-text-muted mb-0.5">Prepared For:</div>
                <div className="text-body-sm font-semibold text-text">{selectedPayslip.employeeName}</div>
                <div className="text-caption text-text-muted font-mono">ID: {selectedPayslip.employeeId}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-text-muted mb-0.5">Pay Period Cycle:</div>
                <div className="text-body-sm font-semibold text-text">{selectedPayslip.payPeriodStart} to {selectedPayslip.payPeriodEnd}</div>
                <div className="text-caption text-text-muted">Settled On: {selectedPayslip.processedDate}</div>
              </div>
            </div>

            {/* Statement breakdown */}
            <div className="space-y-4">
              <div className="border border-border rounded-[12px] overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-alt/30 border-b border-border text-[11px] uppercase tracking-wider font-semibold text-text-muted">
                      <th className="px-4 py-2">Earning / Deduction Summary</th>
                      <th className="px-4 py-2 text-right">Debit ($)</th>
                      <th className="px-4 py-2 text-right">Credit ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-body-sm">
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-text">Basic Base Salary</td>
                      <td className="px-4 py-2.5 text-right">-</td>
                      <td className="px-4 py-2.5 text-right text-text font-semibold">{details.basic.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-text">HR Allowance Credits (12% base)</td>
                      <td className="px-4 py-2.5 text-right">-</td>
                      <td className="px-4 py-2.5 text-right text-text">{details.allowance.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-danger">Federal Income Tax Withholding (15% base)</td>
                      <td className="px-4 py-2.5 text-right text-danger">{details.tax.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right">-</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-danger">Corporate Pension Fund Contribution (5% base)</td>
                      <td className="px-4 py-2.5 text-right text-danger">{details.pension.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Final Net Pay calculation */}
              <div className="bg-surface-alt/60 border border-border/80 rounded-[12px] p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-success shrink-0" />
                  <div>
                    <div className="text-body font-bold text-text">NET NET EARNINGS</div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Deposited to registered checking bank account</div>
                  </div>
                </div>
                <div className="text-h3 font-heading font-black text-success">
                  ${details.netPay.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Printable footer disclaimer */}
            <div className="mt-8 pt-6 border-t border-dashed border-border text-center text-caption text-text-muted leading-relaxed">
              This is a system-generated statement of earnings. For queries relating to withholding adjustments or bank routing details, please lodge an internal ticket with the Human Resources department.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
