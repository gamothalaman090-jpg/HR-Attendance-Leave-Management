import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { announcementService } from '@/services/announcementService';
import { useGsap } from '@/hooks/useGsap';
import { Plus, Bell, Trash2, Megaphone, Calendar, Search } from 'lucide-react';
import { Input, Select, Button, Modal, Textarea } from '@/components/ui';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', category: 'General', priority: 'normal' });

  const isHighRanking = user?.role?.toLowerCase().match(/(admin|manager|hr)/) || user?.role?.toLowerCase() === 'superadmin';

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementService.getAll();
      setAnnouncements(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useGsap((gsap, el) => {
    if (!loading && announcements.length > 0) {
      gsap.fromTo(el.querySelectorAll('.announcement-card'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out', clearProps: 'all' }
      );
    }
  }, [loading, announcements.length, search, categoryFilter]);

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to permanently delete this announcement?')) {
      await announcementService.delete(id);
      fetchAnnouncements();
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await announcementService.create({
      ...newAnnouncement,
      author: user?.name || 'System Admin',
    });
    setIsModalOpen(false);
    setNewAnnouncement({ title: '', content: '', category: 'General', priority: 'normal' });
    fetchAnnouncements();
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Urgent': return 'bg-danger/10 text-danger border-danger/20';
      case 'Event': return 'bg-success/10 text-success border-success/20';
      case 'Operations': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

const getAuthorName = (authorData) => {
  if (typeof authorData === 'string' && authorData.trim() !== '') {
    return authorData;
  }
  
  if (typeof authorData === 'object' && authorData !== null) {
    // 1. Check 'fullname' first since your backend query now explicitly selects it
    if (typeof authorData.fullname === 'string' && authorData.fullname.trim() !== '') {
      return authorData.fullname;
    }
    // 2. Check 'name' explicitly next
    if (typeof authorData.name === 'string' && authorData.name.trim() !== '') {
      return authorData.name;
    }
    // 3. Check 'username' fallback
    if (typeof authorData.username === 'string' && authorData.username.trim() !== '') {
      return authorData.username;
    }
  }
  
  return 'System Admin';
};

  // Filter logic
  const filteredAnnouncements = announcements.filter((item) => {
    if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const authorString = getAuthorName(item.author);

      return (
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        authorString.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-h2 font-heading font-bold text-text flex items-center gap-3">
            <Megaphone className="text-primary" size={32} />
            Company Announcements
          </h1>
          <p className="text-body text-text-muted mt-2">Stay updated with the latest corporate news, events, and circulars.</p>
        </div>
        
        {isHighRanking && (
          <Button 
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus size={18} />}
          >
            New Announcement
          </Button>
        )}
      </div>

      {/* Advanced Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-surface/50 border border-border p-4 rounded-[16px] backdrop-blur-sm">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'All', label: 'All Categories' },
              { value: 'General', label: 'General' },
              { value: 'Event', label: 'Events' },
              { value: 'Operations', label: 'Operations' },
              { value: 'Urgent', label: 'Urgent' },
            ]}
          />
        </div>
      </div>

      {/* Main Body */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-surface border border-border rounded-[24px] p-12 text-center shadow-card">
          <Bell className="mx-auto text-text-muted/50 mb-4" size={48} />
          <h3 className="text-h3 font-heading font-bold text-text mb-2">No announcements found</h3>
          <p className="text-text-muted">
            {search || categoryFilter !== 'All' 
              ? 'Try modifying your search queries or category filters.' 
              : 'Check back later for updates from your team.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAnnouncements.map((item) => {
            const displayAuthor = getAuthorName(item.author);
            const initial = displayAuthor.length > 0 ? displayAuthor.charAt(0).toUpperCase() : '?';

            return (
              <div key={item.id} className="announcement-card bg-surface border border-border rounded-[20px] p-6 hover:shadow-card hover:border-border-hover transition-all duration-300 relative group overflow-hidden">
                {item.priority === 'high' && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-danger/10 rotate-45 translate-x-8 -translate-y-8 flex items-end justify-center pb-1">
                    <span className="text-[10px] font-bold text-danger uppercase">Priority</span>
                  </div>
                )}
                
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className="text-caption text-text-muted flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(item.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <h3 className="text-h3 font-heading font-bold text-text mb-3">{item.title}</h3>
                    <p className="text-body text-text-muted whitespace-pre-wrap leading-relaxed">{item.content}</p>
                    
                    <div className="mt-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {initial}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text">{displayAuthor}</p>
                      </div>
                    </div>
                  </div>

                  {isHighRanking && (
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-full transition-all duration-200 cursor-pointer"
                      title="Delete Announcement"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Announcement" size="lg">
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <Input 
            required
            label="Title"
            value={newAnnouncement.title}
            onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
            placeholder="e.g. Q3 Townhall Meeting"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Category"
              value={newAnnouncement.category}
              onChange={e => setNewAnnouncement({...newAnnouncement, category: e.target.value})}
              options={[
                { value: 'General', label: 'General' },
                { value: 'Event', label: 'Event' },
                { value: 'Operations', label: 'Operations' },
                { value: 'Urgent', label: 'Urgent' },
              ]}
            />
            <Select 
              label="Priority"
              value={newAnnouncement.priority}
              onChange={e => setNewAnnouncement({...newAnnouncement, priority: e.target.value})}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'High' },
              ]}
            />
          </div>

          <Textarea 
            required
            label="Content"
            value={newAnnouncement.content}
            onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
            placeholder="Write your announcement details here..."
            rows={5}
          />

          <div className="pt-4 border-t border-border flex justify-end gap-3 mt-6">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
            >
              Publish Announcement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}