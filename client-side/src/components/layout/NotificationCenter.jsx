import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, Info, Calendar, X } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/utils/helpers';
import { formatDate } from '@/utils/formatters';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';

const TYPE_ICONS = {
  leave: { icon: Calendar, color: 'text-primary bg-primary/10' },
  attendance: { icon: Info, color: 'text-accent bg-accent/10' },
  system: { icon: Info, color: 'text-info bg-info/10' },
  team: { icon: CheckCircle2, color: 'text-success bg-success/10' },
};

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const panelRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const slideOver = (
    <div className={cn("fixed inset-0 z-[100] flex justify-end", !isOpen && "pointer-events-none")}>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-over Panel */}
      <div
        ref={panelRef}
        className={cn(
          "relative w-full sm:w-[400px] h-full bg-surface shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-alt/30">
          <div className="flex items-center gap-2">
            <h3 className="text-h4 font-bold text-text">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-caption font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-caption font-medium text-primary hover:text-primary-dark transition-colors cursor-pointer"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-text-muted hover:text-text hover:bg-surface-alt rounded-md transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-surface/50">
          {notifications.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center mb-4">
                <Bell size={28} className="text-text-muted/50" />
              </div>
              <h4 className="text-body font-bold text-text mb-1">All caught up!</h4>
              <p className="text-body-sm text-text-muted">You have no new notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notif) => {
                const TypeIcon = TYPE_ICONS[notif.type]?.icon || Info;
                return (
                  <div
                    key={notif.id}
                    className={cn(
                      "p-5 flex gap-4 transition-colors hover:bg-surface-alt/50 cursor-default relative group",
                      !notif.read ? "bg-primary/5" : "bg-transparent"
                    )}
                    onMouseEnter={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      TYPE_ICONS[notif.type]?.color || 'bg-surface-alt text-text-muted'
                    )}>
                      <TypeIcon size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-body font-bold text-text truncate pr-2">{notif.title}</span>
                        <span className="text-caption text-text-muted shrink-0 whitespace-nowrap">{formatDate(notif.time)}</span>
                      </div>
                      <p className="text-body-sm text-text-muted leading-relaxed mb-2">{notif.message}</p>
                      {notif.action && (
                        <Link
                          to={notif.action}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center text-caption font-bold text-primary hover:text-primary-dark transition-colors"
                        >
                          View Details
                        </Link>
                      )}
                    </div>

                    {!notif.read && (
                      <div className="absolute top-6 right-5 w-2.5 h-2.5 bg-primary rounded-full shadow-glow-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-alt/30 text-center">
          <button className="w-full py-2 px-4 rounded-lg bg-surface border border-border text-body-sm font-bold text-text hover:bg-surface-alt transition-colors">
            View all activity
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
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

      {/* Render Slide-over inside portal to avoid overflow/z-index issues */}
      {createPortal(slideOver, document.body)}
    </>
  );
}

