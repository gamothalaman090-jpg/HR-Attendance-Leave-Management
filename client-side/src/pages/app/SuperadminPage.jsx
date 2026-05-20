import { useState, useEffect, useRef } from 'react';
import Meta from '@/components/common/Meta';
import { Terminal, Shield, RefreshCw, Trash2, Cpu, HardDrive, Database, Activity } from 'lucide-react';
import { logService } from '@/services/logService';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/helpers';

export default function SuperadminPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [telemetry, setTelemetry] = useState({
    cpu: 18,
    ram: 42,
    dbOccupancy: 0.12,
    status: 'Operational'
  });
  
  const terminalEndRef = useRef(null);

  // Safety checks
  const isSuperadmin = user?.role?.toLowerCase() === 'superadmin';

  const fetchLogs = async () => {
    try {
      const allLogs = await logService.getLogs();
      setLogs(allLogs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Simulate real-time metrics pulse
    const interval = setInterval(() => {
      setTelemetry({
        cpu: Math.round(15 + Math.random() * 20),
        ram: Math.round(38 + Math.random() * 8),
        dbOccupancy: Number((0.08 + (localStorage.length * 0.01)).toFixed(2)),
        status: 'Operational'
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom of terminal when logs load
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to flush all system activity logs?')) return;
    await logService.clearLogs();
    await logService.log({
      action: 'FLUSH_LOGS',
      performedBy: user.email,
      details: 'Superadmin cleared all historical diagnostics logs.'
    });
    fetchLogs();
  };

  const handleFullReset = async () => {
    if (!confirm('CRITICAL WARNING: This will completely purge the local database state, including all departments, employees, payrolls, and clocks. The application will be reset and re-seeded. Do you wish to continue?')) return;
    
    // Clear all localStorage keys starting with nini-
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith('nini-')) {
        localStorage.removeItem(k);
      }
    });

    alert('System state purged successfully. Reloading page...');
    window.location.reload();
  };

  if (!isSuperadmin) {
    return (
      <div className="p-12 text-center max-w-md mx-auto bg-surface border border-border rounded-[24px] shadow-2xl mt-12 onboard-step-anim">
        <Shield className="w-16 h-16 text-danger mx-auto mb-4 stroke-[1.5]" />
        <h2 className="text-h3 font-heading font-bold text-text mb-2">Access Denied</h2>
        <p className="text-body-sm text-text-muted mb-6">
          This system console is strictly restricted to workspace <span className="font-semibold text-danger">Superadmin</span> users.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="w-full py-3 rounded-[12px] bg-surface-alt border border-border hover:bg-border/30 text-text font-medium transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <Meta title="Superadmin System Console" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="text-primary shrink-0" size={24} />
            <h1 className="font-heading text-h2 font-bold">Superadmin Console</h1>
          </div>
          <p className="text-text-muted text-body">Low-level telemetry diagnostics, process logs, and system resets.</p>
        </div>
      </div>

      {/* Diagnostics grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'System Health', value: telemetry.status, desc: 'All microservices normal', icon: Activity, color: 'success' },
          { label: 'CPU Load Status', value: `${telemetry.cpu}%`, desc: 'Simulated multi-core load', icon: Cpu, color: 'primary' },
          { label: 'Virtual Memory', value: `${telemetry.ram}%`, desc: 'Node runtime container occupancy', icon: HardDrive, color: 'warning' },
          { label: 'DB Cluster Size', value: `${telemetry.dbOccupancy} MB`, desc: `${localStorage.length} active key partitions`, icon: Database, color: 'accent' },
        ].map(({ label, value, desc, icon: Icon, color }) => (
          <div key={label} className="p-5 rounded-[16px] bg-surface border border-border flex items-center justify-between shadow-card">
            <div>
              <div className="text-caption text-text-muted mb-1">{label}</div>
              <div className={cn(
                'text-h3 font-heading font-bold mb-0.5',
                color === 'success' && 'text-success',
                color === 'primary' && 'text-primary',
                color === 'warning' && 'text-warning',
                color === 'accent' && 'text-accent',
              )}>{value}</div>
              <div className="text-caption text-text-muted">{desc}</div>
            </div>
            <div className={cn(
              'w-12 h-12 rounded-[12px] flex items-center justify-center',
              color === 'success' && 'bg-success/10 text-success',
              color === 'primary' && 'bg-primary/10 text-primary',
              color === 'warning' && 'bg-warning/10 text-warning',
              color === 'accent' && 'bg-accent/10 text-accent',
            )}>
              <Icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Retro scrolling terminal */}
      <div className="bg-[#0b0f19] border border-[#1e293b] rounded-[16px] shadow-2xl overflow-hidden mb-6 flex flex-col h-[50vh]">
        {/* Terminal Header */}
        <div className="bg-[#111827] border-b border-[#1e293b] px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="text-success" size={16} />
            <span className="font-mono text-body-sm font-semibold text-text-muted uppercase tracking-wider">Live System Logs Terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-ping" />
            <span className="font-mono text-[11px] text-success">ONLINE FEED</span>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="p-5 overflow-y-auto flex-1 font-mono text-[12px] space-y-2 leading-relaxed text-[#10b981] select-text">
          {loading ? (
            <p className="text-text-muted">Connecting to diagnostics cluster...</p>
          ) : logs.length === 0 ? (
            <p className="text-text-muted">Terminal connection active. Waiting for system events...</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="hover:bg-[#1e293b]/30 p-1 rounded transition-colors flex items-start gap-3">
                <span className="text-text-muted shrink-0">[{log.timestamp}]</span>
                <span className="text-primary font-bold shrink-0">[{log.action}]</span>
                <div className="min-w-0 flex-1">
                  <span className="text-[#a7f3d0]">by {log.performedBy}</span>
                  <p className="text-text mt-0.5 break-all">{log.details}</p>
                </div>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Danger Zone Controls */}
      <div className="p-6 rounded-[16px] bg-danger/5 border border-danger/10 shadow-card">
        <h2 className="text-h4 font-heading font-bold text-danger mb-2">Danger Zone</h2>
        <p className="text-body-sm text-text-muted mb-4 leading-relaxed">
          These actions affect the database cluster. Restoring default mock databases clears your department structures, employees list, attendance clock cards, and payslip runs.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleClearLogs}
            className="px-4 py-2.5 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 text-body-sm font-semibold rounded-[10px] flex items-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 size={16} /> Flush Logs
          </button>
          
          <button
            onClick={handleFullReset}
            className="px-4 py-2.5 bg-danger hover:bg-danger-light text-white text-body-sm font-semibold rounded-[10px] flex items-center gap-2 shadow-glow-accent hover:shadow-[0_4px_12px_rgba(239,68,68,0.2)] transition-all cursor-pointer"
          >
            <RefreshCw size={16} /> Purge Database Reset
          </button>
        </div>
      </div>
    </div>
  );
}
