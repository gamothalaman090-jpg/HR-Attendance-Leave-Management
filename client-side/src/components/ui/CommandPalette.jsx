import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Users, Calendar, BarChart3, Settings, User, Clock, PlusCircle } from 'lucide-react';
import { EMPLOYEES } from '@/data/employees';
import { LEAVE_REQUESTS } from '@/data/leaves';
import { cn } from '@/utils/helpers';
import { useAuth } from '@/context/AuthContext';

/**
 * CommandPalette — Global search triggered by Ctrl+K
 */
export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isHR = ['hr', 'admin', 'manager'].some(r => user?.role?.toLowerCase().includes(r));

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  /* ── Build Search Results ── */
  const results = [];
  const lowerQuery = query.toLowerCase();

  // 1. Pages
  const ALL_PAGES = [
    { id: 'p1', label: 'Dashboard', icon: BarChart3, path: '/app' },
    { id: 'p2', label: 'Leave Requests', icon: Calendar, path: '/app/leave' },
    { id: 'p3', label: 'Attendance', icon: Calendar, path: '/app/attendance' },
    { id: 'p4', label: 'Employees', icon: Users, path: '/app/employees', roles: ['admin', 'manager', 'hr'] },
    { id: 'p5', label: 'Reports', icon: FileText, path: '/app/reports', roles: ['admin', 'manager', 'hr'] },
    { id: 'p6', label: 'Settings', icon: Settings, path: '/app/settings' },
    { id: 'p7', label: 'My Profile', icon: User, path: '/app/profile' },
  ];
  const PAGES = ALL_PAGES.filter(p => !p.roles || p.roles.some(r => user?.role?.toLowerCase().includes(r)));
  const matchedPages = PAGES.filter(p => p.label.toLowerCase().includes(lowerQuery));
  if (matchedPages.length > 0) {
    results.push({ type: 'header', label: 'Pages' });
    matchedPages.forEach(p => results.push({ ...p, type: 'page' }));
  }

  // 1.5 Actions
  const ACTIONS = [
    { id: 'a1', label: 'Clock In / Out', icon: Clock, path: '/app/attendance?action=clock' },
    { id: 'a2', label: 'Request Leave', icon: PlusCircle, path: '/app/leave?new=true' },
    { id: 'a3', label: 'View Profile', icon: User, path: '/app/profile' },
  ];
  const matchedActions = ACTIONS.filter(a => a.label.toLowerCase().includes(lowerQuery));
  if (matchedActions.length > 0) {
    results.push({ type: 'header', label: 'Quick Actions' });
    matchedActions.forEach(a => results.push({ ...a, type: 'action' }));
  }

  // 2. Employees & Leaves (if query > 1 char)
  if (query.length > 1) {
    // Employees (HR only)
    if (isHR) {
      const matchedEmps = EMPLOYEES.filter(e => 
        e.name.toLowerCase().includes(lowerQuery) || 
        e.role.toLowerCase().includes(lowerQuery) ||
        e.department.toLowerCase().includes(lowerQuery)
      ).slice(0, 5);
      
      if (matchedEmps.length > 0) {
        results.push({ type: 'header', label: 'Employees' });
        matchedEmps.forEach(e => results.push({
          id: e.id,
          label: e.name,
          sub: `${e.role} • ${e.department}`,
          icon: User,
          type: 'employee',
          path: '/app/employees',
        }));
      }
    }

    // 3. Leaves
    let matchedLeaves = LEAVE_REQUESTS.filter(l => 
      l.employeeName.toLowerCase().includes(lowerQuery) ||
      l.type.toLowerCase().includes(lowerQuery)
    );
    
    if (!isHR) {
      matchedLeaves = matchedLeaves.filter(l => l.employeeName === user?.name);
    }
    matchedLeaves = matchedLeaves.slice(0, 3);

    if (matchedLeaves.length > 0) {
      results.push({ type: 'header', label: 'Leave Requests' });
      matchedLeaves.forEach(l => results.push({
        id: l.id,
        label: `${l.employeeName} — ${l.type}`,
        sub: `${l.startDate} to ${l.endDate}`,
        icon: FileText,
        type: 'leave',
        path: '/app/leave',
      }));
    }
  }

  // Keep selectedIndex within bounds
  const selectableResults = results.filter(r => r.type !== 'header');
  useEffect(() => {
    if (selectedIndex >= selectableResults.length) {
      setSelectedIndex(Math.max(0, selectableResults.length - 1));
    }
  }, [query, selectableResults.length, selectedIndex]);

  /* ── Keyboard Navigation ── */
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < selectableResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectableResults[selectedIndex]) {
        navigate(selectableResults[selectedIndex].path);
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-4 border-b border-border">
          <Search className="w-5 h-5 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none text-body outline-none px-3 text-text placeholder:text-text-muted/60"
            placeholder="Search pages, employees, requests..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-surface-alt rounded text-[10px] font-medium text-text-muted uppercase font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
          {results.length === 0 ? (
            <div className="py-14 text-center text-body-sm text-text-muted">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, index) => {
                if (item.type === 'header') {
                  return (
                    <div key={`header-${item.label}`} className="px-3 py-2 text-[10px] font-bold tracking-wider text-text-muted uppercase mt-2 first:mt-0">
                      {item.label}
                    </div>
                  );
                }

                const SelectableIcon = item.icon;
                // Calculate the actual index within selectable items to match selectedIndex
                const selectIndex = selectableResults.findIndex(r => r.id === item.id);
                const isSelected = selectIndex === selectedIndex;

                return (
                  <button
                    key={item.id}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-left transition-colors",
                      isSelected ? "bg-primary/10 text-primary" : "hover:bg-surface-alt text-text"
                    )}
                    onClick={() => {
                      navigate(item.path);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(selectIndex)}
                  >
                    <div className={cn("p-1.5 rounded-[6px]", isSelected ? "bg-primary/20" : "bg-surface-alt")}>
                      <SelectableIcon size={16} className={isSelected ? "text-primary" : "text-text-muted"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-body-sm font-medium", isSelected ? "text-primary" : "text-text")}>
                        {item.label}
                      </p>
                      {item.sub && (
                        <p className={cn("text-caption truncate", isSelected ? "text-primary/70" : "text-text-muted")}>
                          {item.sub}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary rounded text-[10px] font-medium ml-3">
                        ↵ Enter
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
