import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { announcementService } from '@/services/announcementService';
import { useGsap } from '@/hooks/useGsap';
import { Plus, Bell, Trash2, Megaphone, Calendar, X } from 'lucide-react';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', category: 'General', priority: 'normal' });

  const isHighRanking = user?.role?.toLowerCase().match(/(admin|manager|hr)/);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const data = await announcementService.getAll();
    setAnnouncements(data);
    setLoading(false);
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
  }, [loading, announcements.length]);

  const handleDelete = async (id) => {
    if (confirm('Delete this announcement?')) {
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

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-h2 font-heading font-bold text-text flex items-center gap-3">
            <Megaphone className="text-primary" size={32} />
            Company Announcements
          </h1>
          <p className="text-body text-text-muted mt-2">Stay updated with the latest news and events.</p>
        </div>
        
        {isHighRanking && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-[12px] font-semibold hover:bg-primary-light hover:shadow-glow-primary transition-all duration-300 transform hover:-translate-y-1"
          >
            <Plus size={20} />
            New Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-surface border border-border rounded-[24px] p-12 text-center">
          <Bell className="mx-auto text-text-muted/50 mb-4" size={48} />
          <h3 className="text-h3 font-heading font-bold text-text mb-2">No announcements yet</h3>
          <p className="text-text-muted">Check back later for updates from your team.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((item) => (
            <div key={item.id} className="announcement-card bg-surface border border-border rounded-[20px] p-6 hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
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
                  <p className="text-body text-text-muted whitespace-pre-wrap">{item.content}</p>
                  
                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {item.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">{item.author}</p>
                    </div>
                  </div>
                </div>

                {isHighRanking && (
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-full transition-all"
                    title="Delete Announcement"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-surface border border-border rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border bg-surface/50">
              <h2 className="text-h3 font-heading font-bold text-text">Create Announcement</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text p-1 rounded-full hover:bg-border/50 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
              <div>
                <label className="block text-body-sm font-medium text-text mb-2">Title</label>
                <input 
                  required
                  type="text" 
                  value={newAnnouncement.title}
                  onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  className="w-full px-4 py-3 bg-background border border-border rounded-[12px] text-body text-text focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Q3 Townhall Meeting"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-medium text-text mb-2">Category</label>
                  <select 
                    value={newAnnouncement.category}
                    onChange={e => setNewAnnouncement({...newAnnouncement, category: e.target.value})}
                    className="w-full px-4 py-3 bg-background border border-border rounded-[12px] text-body text-text focus:outline-none focus:border-primary transition-colors appearance-none"
                  >
                    <option value="General">General</option>
                    <option value="Event">Event</option>
                    <option value="Operations">Operations</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-text mb-2">Priority</label>
                  <select 
                    value={newAnnouncement.priority}
                    onChange={e => setNewAnnouncement({...newAnnouncement, priority: e.target.value})}
                    className="w-full px-4 py-3 bg-background border border-border rounded-[12px] text-body text-text focus:outline-none focus:border-primary transition-colors appearance-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-body-sm font-medium text-text mb-2">Content</label>
                <textarea 
                  required
                  value={newAnnouncement.content}
                  onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  className="w-full flex-1 min-h-[150px] px-4 py-3 bg-background border border-border rounded-[12px] text-body text-text focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Write your announcement here..."
                />
              </div>

              <div className="pt-4 mt-2 border-t border-border flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-[10px] font-medium text-text hover:bg-border/50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-[10px] font-semibold text-white bg-primary hover:bg-primary-light hover:shadow-glow-primary transition-all"
                >
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
