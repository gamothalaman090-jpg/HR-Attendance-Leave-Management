import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, FileText, Users, Calendar, BarChart3, Settings, User, Clock,
  PlusCircle, Megaphone, Building2, Wallet, Receipt, ShieldAlert,
  CalendarDays, ArrowUpDown, Loader2, Command,
} from 'lucide-react';
import { employeeService } from '@/services/employeeService';
import { leaveService } from '@/services/leaveService';
import { announcementService } from '@/services/announcementService';
import { departmentService } from '@/services/departmentService';
import { cn } from '@/utils/helpers';
import { useAuth } from '@/context/AuthContext';

/**
 * CommandPalette — Global search triggered by Ctrl+K
 *
 * Indexes: Pages, Quick Actions, Employees, Leave Requests,
 *          Announcements, Departments
 */
export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isSuperadmin = user?.role?.toLowerCase() === 'superadmin';
  const isHR = ['hr', 'admin', 'manager'].some(r => user?.role?.toLowerCase().includes(r)) || isSuperadmin;

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

  // Reset state and fetch data when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);

      const fetchSearchData = async () => {
        setLoadingData(true);
        try {
          const promises = [
            employeeService.getAll(),
            leaveService.getAll(),
            announcementService.getAll(),
            departmentService.getAll(),
          ];
          const [empList, leaveList, annList, deptList] = await Promise.all(promises);
          setEmployees(empList || []);
          setLeaves(leaveList || []);
          setAnnouncements(annList || []);
          setDepartments(deptList || []);
        } catch (err) {
          console.error('Failed to load search data:', err);
        } finally {
          setLoadingData(false);
        }
      };

      fetchSearchData();
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
  const lowerQuery = query.toLowerCase().trim();

  // 1. Pages — complete list matching the router
  const ALL_PAGES = [
    { id: 'p-dashboard',      label: 'Dashboard',       icon: BarChart3,    path: '/app' },
    { id: 'p-leave',          label: 'Leave Requests',  icon: Calendar,     path: '/app/leave' },
    { id: 'p-attendance',     label: 'Attendance',       icon: CalendarDays, path: '/app/attendance' },
    { id: 'p-calendar',       label: 'Team Calendar',   icon: Calendar,     path: '/app/calendar' },
    { id: 'p-announcements',  label: 'Announcements',   icon: Megaphone,    path: '/app/announcements' },
    { id: 'p-payslips',       label: 'My Payslips',     icon: Receipt,      path: '/app/payslips' },
    { id: 'p-employees',      label: 'Employees',       icon: Users,        path: '/app/employees',    roles: ['admin', 'manager', 'hr'] },
    { id: 'p-departments',    label: 'Departments',     icon: Building2,    path: '/app/departments',  roles: ['admin', 'manager', 'hr'] },
    { id: 'p-payroll',        label: 'Payroll',         icon: Wallet,       path: '/app/payroll',      roles: ['admin', 'manager', 'hr'] },
    { id: 'p-reports',        label: 'Reports',         icon: FileText,     path: '/app/reports',      roles: ['admin', 'manager', 'hr'] },
    { id: 'p-settings',       label: 'Settings',        icon: Settings,     path: '/app/settings' },
    { id: 'p-profile',        label: 'My Profile',      icon: User,         path: '/app/profile' },
    { id: 'p-superadmin',     label: 'Superadmin Console', icon: ShieldAlert, path: '/app/superadmin', roles: ['superadmin'] },
  ];
  const PAGES = ALL_PAGES.filter(p => !p.roles || isSuperadmin || p.roles.some(r => user?.role?.toLowerCase().includes(r)));
  const matchedPages = PAGES.filter(p => p.label.toLowerCase().includes(lowerQuery));
  if (matchedPages.length > 0) {
    results.push({ type: 'header', label: 'Pages' });
    matchedPages.forEach(p => results.push({ ...p, type: 'page' }));
  }

  // 2. Quick Actions
  const ACTIONS = [
    { id: 'a-clock',    label: 'Clock In / Out',      icon: Clock,      path: '/app/attendance' },
    { id: 'a-leave',    label: 'Request Leave',        icon: PlusCircle, path: '/app/leave?new=true' },
    { id: 'a-profile',  label: 'View Profile',         icon: User,       path: '/app/profile' },
    { id: 'a-announce', label: 'View Announcements',   icon: Megaphone,  path: '/app/announcements' },
    { id: 'a-payslip',  label: 'View My Payslips',     icon: Receipt,    path: '/app/payslips' },
  ];
  const matchedActions = ACTIONS.filter(a => a.label.toLowerCase().includes(lowerQuery));
  if (matchedActions.length > 0) {
    results.push({ type: 'header', label: 'Quick Actions' });
    matchedActions.forEach(a => results.push({ ...a, type: 'action' }));
  }

  // 3. Dynamic data search (requires > 1 char typed)
  if (lowerQuery.length > 1) {
    // Employees (HR only)
    if (isHR) {
      const matchedEmps = employees.filter(e =>
        e.name?.toLowerCase().includes(lowerQuery) ||
        e.role?.toLowerCase().includes(lowerQuery) ||
        e.department?.toLowerCase().includes(lowerQuery) ||
        e.email?.toLowerCase().includes(lowerQuery)
      ).slice(0, 5);

      if (matchedEmps.length > 0) {
        results.push({ type: 'header', label: 'Employees' });
        matchedEmps.forEach(e => results.push({
          id: `emp-${e.id}`,
          label: e.name,
          sub: `${e.role} · ${e.department}`,
          icon: User,
          type: 'employee',
          path: '/app/employees',
        }));
      }
    }

    // Leave Requests
    let matchedLeaves = leaves.filter(l =>
      l.employeeName?.toLowerCase().includes(lowerQuery) ||
      l.type?.toLowerCase().includes(lowerQuery) ||
      l.status?.toLowerCase().includes(lowerQuery)
    );
    if (!isHR) {
      matchedLeaves = matchedLeaves.filter(l => l.employeeName === user?.name);
    }
    matchedLeaves = matchedLeaves.slice(0, 4);
    if (matchedLeaves.length > 0) {
      results.push({ type: 'header', label: 'Leave Requests' });
      matchedLeaves.forEach(l => results.push({
        id: `lv-${l.id}`,
        label: `${l.employeeName} — ${l.type}`,
        sub: `${l.startDate} → ${l.endDate} · ${l.status}`,
        icon: FileText,
        type: 'leave',
        path: '/app/leave',
      }));
    }

    // Announcements
    const matchedAnnouncements = announcements.filter(a =>
      a.title?.toLowerCase().includes(lowerQuery) ||
      a.category?.toLowerCase().includes(lowerQuery) ||
      a.content?.toLowerCase().includes(lowerQuery)
    ).slice(0, 3);
    if (matchedAnnouncements.length > 0) {
      results.push({ type: 'header', label: 'Announcements' });
      matchedAnnouncements.forEach(a => results.push({
        id: `ann-${a.id}`,
        label: a.title,
        sub: `${a.category || 'General'} · ${a.date || ''}`,
        icon: Megaphone,
        type: 'announcement',
        path: '/app/announcements',
      }));
    }

    // Departments (HR only)
    if (isHR) {
      const matchedDepts = departments.filter(d =>
        (typeof d === 'string' ? d : d?.name || '')
          .toLowerCase().includes(lowerQuery)
      ).slice(0, 4);
      if (matchedDepts.length > 0) {
        results.push({ type: 'header', label: 'Departments' });
        matchedDepts.forEach((d, i) => {
          const name = typeof d === 'string' ? d : d?.name || d;
          return results.push({
            id: `dept-${i}`,
            label: name,
            sub: 'Department',
            icon: Building2,
            type: 'department',
            path: '/app/departments',
          });
        });
      }
    }
  }

  // Keep selectedIndex within bounds
  const selectableResults = results.filter(r => r.type !== 'header');
  useEffect(() => {
    if (selectedIndex >= selectableResults.length) {
      setSelectedIndex(Math.max(0, selectableResults.length - 1));
    }
  }, [query, selectableResults.length, selectedIndex]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-selectable]');
    items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

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
    <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-[12vh] sm:pt-[16vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl bg-surface border border-border rounded-[16px] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-4 border-b border-border gap-3">
          {loadingData ? (
            <Loader2 className="w-5 h-5 text-primary shrink-0 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-text-muted shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none text-body outline-none text-text placeholder:text-text-muted/60"
            placeholder="Search pages, employees, requests..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-surface-alt rounded-[6px] text-[10px] font-medium text-text-muted uppercase font-mono border border-border/50">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-2 no-scrollbar">
          {results.length === 0 ? (
            <div className="py-14 text-center">
              {lowerQuery.length > 0 ? (
                <>
                  <Search size={32} className="mx-auto mb-3 text-text-muted/30" />
                  <p className="text-body-sm text-text-muted">No results for "<span className="font-semibold text-text">{query}</span>"</p>
                  <p className="text-caption text-text-muted/60 mt-1">Try searching for a page, employee, or leave type</p>
                </>
              ) : (
                <>
                  <Command size={32} className="mx-auto mb-3 text-text-muted/30" />
                  <p className="text-body-sm text-text-muted">Start typing to search…</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              {results.map((item) => {
                if (item.type === 'header') {
                  return (
                    <div key={`header-${item.label}`} className="px-3 py-2 text-[10px] font-bold tracking-widest text-text-muted uppercase mt-3 first:mt-0">
                      {item.label}
                    </div>
                  );
                }

                const SelectableIcon = item.icon;
                const selectIndex = selectableResults.findIndex(r => r.id === item.id);
                const isSelected = selectIndex === selectedIndex;

                return (
                  <button
                    key={item.id}
                    data-selectable
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-all duration-150 cursor-pointer",
                      isSelected
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "hover:bg-surface-alt text-text"
                    )}
                    onClick={() => {
                      navigate(item.path);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(selectIndex)}
                  >
                    <div className={cn(
                      "p-1.5 rounded-[8px] transition-colors shrink-0",
                      isSelected ? "bg-primary/20" : "bg-surface-alt"
                    )}>
                      <SelectableIcon size={16} className={isSelected ? "text-primary" : "text-text-muted"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-body-sm font-medium truncate", isSelected ? "text-primary" : "text-text")}>
                        {item.label}
                      </p>
                      {item.sub && (
                        <p className={cn("text-caption truncate", isSelected ? "text-primary/70" : "text-text-muted")}>
                          {item.sub}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary rounded-[6px] text-[10px] font-medium ml-2 shrink-0">
                        ↵ Enter
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer — Keyboard shortcuts */}
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-t border-border bg-surface-alt/30 text-[10px] text-text-muted">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-alt border border-border/60 rounded font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-surface-alt border border-border/60 rounded font-mono">↓</kbd>
              <span className="ml-0.5">Navigate</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-alt border border-border/60 rounded font-mono">↵</kbd>
              <span className="ml-0.5">Open</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-alt border border-border/60 rounded font-mono">Esc</kbd>
              <span className="ml-0.5">Close</span>
            </span>
          </div>
          <span className="text-text-muted/50">{selectableResults.length} results</span>
        </div>
      </div>
    </div>
  );
}
