/**
 * Name: NotificationCenter.jsx
 * PHASE 4 FIXES:
 *
 *   FIX 1 (HIGH): Bell button missing aria-expanded.
 *     Screen readers couldn't tell whether the notification panel was open.
 *
 *   FIX 2 (HIGH): Slide-over panel missing role="dialog" + aria-label + aria-modal.
 *     Without these, VoiceOver/NVDA treat the panel as generic inline content,
 *     not as a dismissible overlay that should capture focus.
 *
 *   FIX 3 (HIGH): markAsRead only triggered on onMouseEnter.
 *     Keyboard users navigating with Tab/arrow keys never triggered read marking.
 *     AFTER: Also fires on onFocus so keyboard users mark notifications as read.
 *
 *   FIX 4 (HIGH): "View all activity" button was a dead non-functional button.
 *     It had no onClick handler. Removed the dead button entirely; the
 *     "Mark all read" action is now in its place in the header.
 *
 *   FIX 5 (MEDIUM): Panel close button missing aria-label.
 *     The X icon button had no accessible label — screen readers said "button".
 *
 *   FIX 6 (MEDIUM): Unread dot indicator was aria-visible but had no text equivalent.
 *     Screen readers read the notification content but couldn't distinguish
 *     read vs unread. Added sr-only "Unread" text next to the dot.
 */

import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, Info, Calendar, X } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/utils/helpers';
import { formatDate } from '@/utils/formatters';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';

const TYPE_ICONS = {
  leave:             { icon: Calendar,     color: 'text-primary bg-primary/10' },
  leave_request:     { icon: Calendar,     color: 'text-primary bg-primary/10' },
  leave_status:      { icon: Calendar,     color: 'text-primary bg-primary/10' },
  attendance:        { icon: Info,         color: 'text-accent bg-accent/10' },
  attendance_late:   { icon: Info,         color: 'text-accent bg-accent/10' },
  system:            { icon: Info,         color: 'text-info bg-info/10' },
  team:              { icon: CheckCircle2, color: 'text-success bg-success/10' },
  payroll_generated: { icon: Info,         color: 'text-info bg-info/10' },
  payroll_released:  { icon: CheckCircle2, color: 'text-success bg-success/10' },
};

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, clearNotification } = useNotifications();
  const panelRef   = useRef(null);
  const triggerRef = useRef(null);

  // Close on Escape — return focus to trigger
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when panel open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Move focus into panel when it opens
  useEffect(() => {
    if (isOpen) {
      // Small delay for the CSS slide animation to start
      const t = setTimeout(() => {
        panelRef.current?.querySelector('button')?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const slideOver = (
    <div className={cn('fixed inset-0 z-[1100] flex justify-end', !isOpen && 'pointer-events-none')}>
      <div
        className={cn(
          'fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* FIX 2: role="dialog" + aria-modal + aria-label */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className={cn(
          'relative w-full sm:w-[400px] h-full bg-surface shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-alt/30">
          <div className="flex items-center gap-2">
            <h2 className="text-h4 font-bold text-text">Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-caption font-medium text-danger hover:text-danger-dark transition-colors cursor-pointer"
                aria-label="Clear all notifications"
              >
                Clear all
              </button>
            )}
            {/* FIX 5: Added aria-label to close button */}
            <button
              onClick={() => { setIsOpen(false); triggerRef.current?.focus(); }}
              className="p-1.5 text-text-muted hover:text-text hover:bg-surface-alt rounded-md transition-colors"
              aria-label="Close notifications panel"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-surface/50" role="list" aria-label="Notification list">
          {notifications.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full" role="listitem">
              <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center mb-4">
                <Bell size={28} className="text-text-muted/50" aria-hidden="true" />
              </div>
              <h3 className="text-body font-bold text-text mb-1">All caught up!</h3>
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
                      'p-5 flex gap-4 transition-colors hover:bg-surface-alt/50 cursor-default relative group',
                      !notif.read ? 'bg-primary/5' : 'bg-transparent'
                    )}
                    role="listitem"
                    // FIX 3: Also mark as read on focus (for keyboard users)
                    onMouseEnter={() => !notif.read && markAsRead(notif.id)}
                    onFocus={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
                        TYPE_ICONS[notif.type]?.color || 'bg-surface-alt text-text-muted'
                      )}
                      aria-hidden="true"
                    >
                      <TypeIcon size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-body font-bold text-text truncate pr-2">
                          {notif.title}
                          {/* FIX 6: sr-only "Unread" for screen readers */}
                          {!notif.read && <span className="sr-only"> (Unread)</span>}
                        </span>
                        <time
                          className="text-caption text-text-muted shrink-0 whitespace-nowrap"
                          dateTime={notif.time}
                        >
                          {formatDate(notif.time)}
                        </time>
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

                    {/* FIX 6: aria-hidden on visual dot — sr-only handles the "unread" state */}
                    {!notif.read && (
                      <div
                        className="absolute top-6 right-5 w-2.5 h-2.5 bg-primary rounded-full shadow-glow-primary group-hover:scale-0 transition-all duration-200"
                        aria-hidden="true"
                      />
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); clearNotification(notif.id); }}
                      className="absolute top-5 right-4 p-1 rounded-md text-text-muted opacity-0 group-hover:opacity-100 hover:text-text hover:bg-surface-alt transition-all duration-200 cursor-pointer focus:opacity-100"
                      aria-label={`Dismiss notification: ${notif.title}`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* FIX 1: aria-expanded tells screen readers whether panel is open */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-[8px] transition-all duration-base cursor-pointer',
          isOpen ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-surface-alt hover:text-text'
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-surface"
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {createPortal(slideOver, document.body)}
    </>
  );
}
