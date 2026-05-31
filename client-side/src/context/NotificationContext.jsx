/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '@/services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

const POLL_INTERVAL = 30000; // 30 seconds

const mapNotification = (n, readIds = []) => ({
  id: n._id,
  type: n.type || 'info',
  title: n.title || 'Notification',
  message: n.message || '',
  time: n.createdAt || n.time || new Date().toISOString(),
  read: n.read || readIds.includes(n._id) || false,
});

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const storageKey = user?.id || user?.email ? `read_notifications_${user.id || user.email}` : null;

  const getReadNotificationIds = useCallback(() => {
    if (!storageKey) return [];
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [storageKey]);

  const saveReadNotificationIds = useCallback((ids) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(ids));
    } catch (e) {
      console.error('Failed to save read notifications to localStorage:', e);
    }
  }, [storageKey]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.token) return;

    try {
      // Admin gets notifications from /admin/notifications
      // Regular users get notifications from /user/notifications
      const isAdmin = user.role === 'admin';
      const endpoint = isAdmin ? '/admin/notifications' : '/user/notifications';

      const { data: res } = await api.get(endpoint);
      const readIds = getReadNotificationIds();
      const items = (res.data || []).map((n) => mapNotification(n, readIds));
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, [user, getReadNotificationIds]);

  // Initial fetch + polling
  useEffect(() => {
    if (!user?.token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, fetchNotifications]);

  /** Mark a specific notification as read (client-side only) */
  const markAsRead = (id) => {
    const readIds = getReadNotificationIds();
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      saveReadNotificationIds(updated);
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  /** Mark all as read (client-side only) */
  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const readIds = getReadNotificationIds();
    const merged = Array.from(new Set([...readIds, ...allIds]));
    saveReadNotificationIds(merged);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  /** Clear all notifications (both API and client-side) */
  const clearAll = async () => {
    if (!user?.token) return;

    try {
      const isAdmin = user.role === 'admin';
      const endpoint = isAdmin ? '/admin/notifications' : '/user/notifications';

      await api.delete(endpoint);
      saveReadNotificationIds([]);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  /** Clear a single notification (both API and client-side) */
  const clearNotification = async (id) => {
    if (!user?.token) return;

    try {
      const isAdmin = user.role === 'admin';
      const endpoint = isAdmin ? `/admin/notifications/${id}` : `/user/notifications/${id}`;

      await api.delete(endpoint);

      const readIds = getReadNotificationIds();
      saveReadNotificationIds(readIds.filter((x) => x !== id));

      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (error) {
      console.error('Failed to clear notification:', error);
    }
  };

  /** Add a local notification */
  const addNotification = (notif) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      time: new Date().toISOString(),
      read: false,
      ...notif,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        clearNotification,
        addNotification,
        refetch: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
