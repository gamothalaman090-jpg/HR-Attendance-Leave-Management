import { useState } from 'react';
import Meta from '@/components/common/Meta';
import { Users, Search } from 'lucide-react';
import { useGsap } from '@/hooks/useGsap';
import { cn } from '@/utils/helpers';

const MOCK_USERS = [
  { id: '1', name: 'Alex Rivera', email: 'alex.rivera@nini.io', role: 'HR Manager', department: 'Human Resources', status: 'Active' },
  { id: '2', name: 'Sarah Chen', email: 'sarah.chen@nini.io', role: 'Lead AI Engineer', department: 'Engineering', status: 'Active' },
  { id: '3', name: 'James Kim', email: 'james.kim@nini.io', role: 'Principal UX Designer', department: 'Design', status: 'Active' },
  { id: '4', name: 'Alex Mercer', email: 'alex.mercer@nini.io', role: 'Security Engineer', department: 'Engineering', status: 'Active' },
];

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [users] = useState(MOCK_USERS);

  // ── GSAP entrance animations ──
  const pageRef = useGsap((gsap, container) => {
    const header = container.querySelector('[data-header]');
    const searchBar = container.querySelector('[data-search]');
    const tableRows = container.querySelectorAll('[data-row]');

    if (header) {
      gsap.fromTo(header, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', clearProps: 'all' });
    }
    if (searchBar) {
      gsap.fromTo(searchBar, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: 0.1, ease: 'power3.out', clearProps: 'all' });
    }
    if (tableRows.length) {
      gsap.fromTo(tableRows,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, stagger: 0.06, delay: 0.2, ease: 'power3.out', clearProps: 'all' }
      );
    }
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={pageRef}>
      <Meta title="User Management" />

      <div data-header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="text-primary shrink-0" size={24} />
            <h1 className="font-heading text-h2 font-bold">User Management</h1>
          </div>
          <p className="text-text-muted text-body">Manage all registered platform users and their roles.</p>
        </div>
      </div>

      <div data-search className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-[10px] text-body-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[16px] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-alt/50">
                <th className="text-left px-5 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Department</th>
                <th className="text-left px-5 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} data-row className="border-b border-border last:border-0 hover:bg-surface-alt/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-body-sm font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-body-sm font-semibold text-text">{user.name}</p>
                        <p className="text-caption text-text-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-body-sm text-text">{user.role}</td>
                  <td className="px-5 py-4 text-body-sm text-text-muted">{user.department}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-caption font-medium bg-success/10 text-success">
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-body-sm text-text-muted">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
