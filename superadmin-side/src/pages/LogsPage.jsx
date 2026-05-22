import { useState, useEffect } from 'react';
import Meta from '@/components/common/Meta';
import { ScrollText, Search } from 'lucide-react';
import { logService } from '@/services/logService';
import { useGsap } from '@/hooks/useGsap';
import { cn } from '@/utils/helpers';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');

  useEffect(() => {
    const load = async () => {
      try { setLogs(await logService.getLogs()); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // ── GSAP entrance animations ──
  const pageRef = useGsap((gsap, container) => {
    const header = container.querySelector('[data-header]');
    const filters = container.querySelector('[data-filters]');
    const logEntries = container.querySelectorAll('[data-log]');

    if (header) {
      gsap.fromTo(header, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', clearProps: 'all' });
    }
    if (filters) {
      gsap.fromTo(filters, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: 0.1, ease: 'power3.out', clearProps: 'all' });
    }
    if (logEntries.length) {
      gsap.fromTo(logEntries,
        { x: -10, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, stagger: 0.04, delay: 0.2, ease: 'power3.out', clearProps: 'all' }
      );
    }
  }, [loading]);

  const filtered = logs.filter(log => {
    const matchesSearch = !search || log.message.toLowerCase().includes(search.toLowerCase()) || log.category.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === 'ALL' || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const LEVELS = ['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'];

  const LEVEL_COLORS = {
    INFO: 'text-primary bg-primary/10',
    WARN: 'text-warning bg-warning/10',
    ERROR: 'text-danger bg-danger/10',
    DEBUG: 'text-text-muted bg-surface-alt',
  };

  return (
    <div ref={pageRef}>
      <Meta title="System Logs" />
      <div data-header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ScrollText className="text-primary shrink-0" size={24} />
            <h1 className="font-heading text-h2 font-bold">System Logs</h1>
          </div>
          <p className="text-text-muted text-body">Full audit trail of all system events and operations.</p>
        </div>
        <div className="text-body-sm text-text-muted">{filtered.length} entries</div>
      </div>

      <div data-filters className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-[10px] text-body-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
        </div>
        <div className="flex gap-1.5">
          {LEVELS.map(level => (
            <button key={level} onClick={() => setLevelFilter(level)}
              className={cn('px-3 py-2 rounded-[8px] text-caption font-semibold transition-all cursor-pointer',
                levelFilter === level ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted hover:bg-surface-alt'
              )}>{level}</button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[16px] shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-muted text-body-sm">Loading system logs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-body-sm">No logs match your filters.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((log, i) => (
              <div key={i} data-log className="px-5 py-3.5 hover:bg-surface-alt/30 transition-colors flex items-start gap-4">
                <span className={cn('inline-flex px-2 py-0.5 rounded-[6px] text-caption font-bold shrink-0 mt-0.5', LEVEL_COLORS[log.level] || LEVEL_COLORS.DEBUG)}>
                  {log.level}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-caption font-semibold text-accent">{log.category}</span>
                    <span className="text-caption text-text-muted">·</span>
                    <span className="text-caption text-text-muted">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-body-sm text-text break-all">{log.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
