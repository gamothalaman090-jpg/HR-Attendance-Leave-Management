import { useState, useEffect, useRef } from 'react';
import Meta from '@/components/common/Meta';
import { Terminal, Shield, RefreshCw, Trash2, Cpu, HardDrive, Database, Activity, AlertTriangle } from 'lucide-react';
import { logService } from '@/services/logService';
import { useAuth } from '@/context/AuthContext';
import { useGsap } from '@/hooks/useGsap';
import { cn } from '@/utils/helpers';
import { Modal, Button } from '@/components/ui';

export default function ConsolePage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [telemetry, setTelemetry] = useState({ cpu: 18, ram: 42, dbOccupancy: 0.12, status: 'Operational' });
  const [showClearLogsModal, setShowClearLogsModal] = useState(false);
  const [showFullResetModal, setShowFullResetModal] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [resettingDb, setResettingDb] = useState(false);
  const terminalEndRef = useRef(null);

  // ── GSAP entrance animation for the whole page ──
  const pageRef = useGsap((gsap, container) => {
    // Stagger-animate the stat cards
    const cards = container.querySelectorAll('[data-card]');
    if (cards.length) {
      gsap.fromTo(
        cards,
        { y: 30, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'all',
        }
      );
    }

    // Animate the terminal block
    const terminal = container.querySelector('[data-terminal]');
    if (terminal) {
      gsap.fromTo(
        terminal,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay: 0.3,
          ease: 'power3.out',
          clearProps: 'all',
        }
      );
    }

    // Animate the danger zone
    const dangerZone = container.querySelector('[data-danger]');
    if (dangerZone) {
      gsap.fromTo(
        dangerZone,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          delay: 0.45,
          ease: 'power3.out',
          clearProps: 'all',
        }
      );
    }
  }, [loading]);

  const fetchLogs = async () => {
    try { setLogs(await logService.getLogs()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLogs();
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

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleClearLogsConfirm = async () => {
    setClearingLogs(true);
    try {
      await logService.clearLogs();
      await logService.logEvent('INFO', 'SYSTEM', `Superadmin ${user.email} flushed all diagnostics logs.`);
      await fetchLogs();
      setShowClearLogsModal(false);
    } catch (err) { console.error(err); }
    finally { setClearingLogs(false); }
  };

  const handleFullResetConfirm = async () => {
    setResettingDb(true);
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('nini-') && !k.startsWith('nini-admin-')) localStorage.removeItem(k);
      });
      await new Promise(r => setTimeout(r, 800));
      window.location.reload();
    } catch (err) { console.error(err); setResettingDb(false); }
  };

  const CARDS = [
    { label: 'System Health', value: telemetry.status, desc: 'All microservices normal', icon: Activity, color: 'success' },
    { label: 'CPU Load', value: `${telemetry.cpu}%`, desc: 'Simulated multi-core load', icon: Cpu, color: 'primary' },
    { label: 'Virtual Memory', value: `${telemetry.ram}%`, desc: 'Node runtime occupancy', icon: HardDrive, color: 'warning' },
    { label: 'DB Cluster', value: `${telemetry.dbOccupancy} MB`, desc: `${localStorage.length} key partitions`, icon: Database, color: 'accent' },
  ];

  return (
    <div ref={pageRef}>
      <Meta title="System Console" />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="text-primary shrink-0" size={24} />
            <h1 className="font-heading text-h2 font-bold">Superadmin Console</h1>
          </div>
          <p className="text-text-muted text-body">Low-level telemetry diagnostics, process logs, and system resets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {CARDS.map(({ label, value, desc, icon: Icon, color }) => (
          <div key={label} data-card className="p-5 rounded-[16px] bg-surface border border-border flex items-center justify-between shadow-card hover:shadow-card-hover transition-shadow duration-300">
            <div>
              <div className="text-caption text-text-muted mb-1">{label}</div>
              <div className={cn('text-h3 font-heading font-bold mb-0.5',
                color === 'success' && 'text-success', color === 'primary' && 'text-primary',
                color === 'warning' && 'text-warning', color === 'accent' && 'text-accent',
              )}>{value}</div>
              <div className="text-caption text-text-muted">{desc}</div>
            </div>
            <div className={cn('w-12 h-12 rounded-[12px] flex items-center justify-center',
              color === 'success' && 'bg-success/10 text-success', color === 'primary' && 'bg-primary/10 text-primary',
              color === 'warning' && 'bg-warning/10 text-warning', color === 'accent' && 'bg-accent/10 text-accent',
            )}><Icon size={22} /></div>
          </div>
        ))}
      </div>

      <div data-terminal className="bg-[#0b0f19] border border-[#1e293b] rounded-[16px] shadow-2xl overflow-hidden mb-6 flex flex-col h-[50vh]">
        <div className="bg-[#111827] border-b border-[#1e293b] px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="text-success" size={16} />
            <span className="font-mono text-body-sm font-semibold text-text-muted uppercase tracking-wider">Live System Logs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-ping" />
            <span className="font-mono text-[11px] text-success">ONLINE</span>
          </div>
        </div>
        <div className="p-5 overflow-y-auto flex-1 font-mono text-[12px] space-y-2 leading-relaxed text-[#10b981] select-text">
          {loading ? (
            <p className="text-text-muted">Connecting to diagnostics cluster...</p>
          ) : logs.length === 0 ? (
            <p className="text-text-muted">Waiting for system events...</p>
          ) : logs.map((log, i) => (
            <div key={i} className="hover:bg-[#1e293b]/30 p-1 rounded transition-colors flex items-start gap-3">
              <span className="text-text-muted shrink-0">[{new Date(log.timestamp).toLocaleString()}]</span>
              <span className={cn('font-bold shrink-0',
                log.level === 'ERROR' && 'text-danger', log.level === 'WARN' && 'text-warning',
                log.level === 'INFO' && 'text-primary', log.level === 'DEBUG' && 'text-text-muted',
              )}>[{log.level}]</span>
              <span className="text-accent shrink-0">[{log.category}]</span>
              <p className="text-[#a7f3d0] min-w-0 flex-1 break-all">{log.message}</p>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>

      <div data-danger className="p-6 rounded-[16px] bg-danger/5 border border-danger/10 shadow-card">
        <h2 className="text-h4 font-heading font-bold text-danger mb-2">Danger Zone</h2>
        <p className="text-body-sm text-text-muted mb-4 leading-relaxed">
          These actions affect the database cluster. Restoring default mock databases clears departments, employees, attendance, and payslips.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowClearLogsModal(true)}
            className="px-4 py-2.5 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 text-body-sm font-semibold rounded-[10px] flex items-center gap-2 transition-all cursor-pointer">
            <Trash2 size={16} /> Flush Logs
          </button>
          <button onClick={() => setShowFullResetModal(true)}
            className="px-4 py-2.5 bg-danger hover:bg-danger-light text-white text-body-sm font-semibold rounded-[10px] flex items-center gap-2 transition-all cursor-pointer">
            <RefreshCw size={16} /> Purge Database Reset
          </button>
        </div>
      </div>

      <Modal isOpen={showClearLogsModal} onClose={() => setShowClearLogsModal(false)} title="Flush Activity Logs" size="md"
        footer={<><Button variant="outline" onClick={() => setShowClearLogsModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleClearLogsConfirm} loading={clearingLogs}>Flush All Logs</Button></>}>
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 p-4 rounded-[12px] bg-danger/5 border border-danger/10">
            <Trash2 className="text-danger shrink-0" size={24} />
            <div className="text-body-sm text-text-muted">You are about to flush all system logs and diagnostics history.</div>
          </div>
          <p className="text-body-sm font-semibold text-danger">This action is logged for compliance security.</p>
        </div>
      </Modal>

      <Modal isOpen={showFullResetModal} onClose={() => setShowFullResetModal(false)} title="Purge Database Reset" size="md"
        footer={<><Button variant="outline" onClick={() => setShowFullResetModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleFullResetConfirm} loading={resettingDb}>Purge & Reset</Button></>}>
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 p-4 rounded-[12px] bg-danger/10 border border-danger/20">
            <AlertTriangle className="text-danger shrink-0 animate-bounce" size={28} />
            <div className="text-body-sm font-bold text-danger">CRITICAL SYSTEM PURGE INITIATED</div>
          </div>
          <p className="text-body text-text font-semibold">This will completely purge local database state:</p>
          <ul className="list-disc pl-5 text-body-sm text-text-muted space-y-1">
            <li>All departments & hierarchy structures</li>
            <li>All employee profiles</li>
            <li>All payroll runs & payslips</li>
            <li>All attendance & leave records</li>
          </ul>
          <p className="text-body-sm font-semibold text-danger">Confirm this purge and reset?</p>
        </div>
      </Modal>
    </div>
  );
}
