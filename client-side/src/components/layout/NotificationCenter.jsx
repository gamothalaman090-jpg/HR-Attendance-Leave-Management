import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, Info, Calendar } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/utils/helpers';
import { formatDate } from '@/utils/formatters';
import { Link } from 'react-router-dom';

const TYPE_ICONS = {
  leave: { icon: Calendar, color: 'text-primary bg-primary/10' },
  attendance: { icon: Info, color: 'text-accent bg-accent/10' },
  system: { icon: Info, color: 'text-info bg-info/10' },
  team: { icon: CheckCircle2, color: 'text-success bg-success/10' },
};

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-[8px] transition-all duration-base cursor-pointer",
          isOpen ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-surface-alt hover:text-text"
        )} 
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-surface">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-[16px] shadow-elevated z-modal overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface-alt/30">
            <h3 className="text-body-sm font-bold text-text">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-caption font-medium text-primary hover:text-primary-dark transition-colors cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto no-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto mb-2 text-text-muted/30" />
                <p className="text-body-sm text-text-muted">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notif) => {
                  const TypeIcon = TYPE_ICONS[notif.type]?.icon || Info;
                  return (
                    <div 
                      key={notif.id}
                      className={cn(
                        "p-4 flex gap-3 transition-colors hover:bg-surface-alt/50 cursor-default relative",
                        !notif.read && "bg-primary/5"
                      )}
                      onMouseEnter={() => !notif.read && markAsRead(notif.id)}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0",
                        TYPE_ICONS[notif.type]?.color || 'bg-surface-alt text-text-muted'
                      )}>
                        <TypeIcon size={18} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-body-sm font-bold text-text truncate pr-2">{notif.title}</span>
                          <span className="text-[10px] text-text-muted shrink-0">{formatDate(notif.time)}</span>
                        </div>
                        <p className="text-body-sm text-text-muted line-clamp-2 mb-1">{notif.message}</p>
                        {notif.action && (
                          <Link 
                            to={notif.action}
                            onClick={() => setIsOpen(false)}
                            className="text-caption font-semibold text-primary hover:underline"
                          >
                            View Details
                          </Link>
                        )}
                      </div>
                      
                      {!notif.read && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full shadow-glow-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border bg-surface-alt/30 text-center">
            <button className="text-body-sm font-bold text-text-muted hover:text-text transition-colors">
              View all activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
