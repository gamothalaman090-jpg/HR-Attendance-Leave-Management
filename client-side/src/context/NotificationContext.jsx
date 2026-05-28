/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '@/services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

const POLL_INTERVAL = 30000; // 30 seconds

const mapNotification = (n) => ({
  id: n._id,
  type: n.type || 'info',
  title: n.title || 'Notification',
  message: n.message || '',
  time: n.createdAt || n.time || new Date().toISOString(),
  read: n.read || false,
});

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.token) return;

    try {
      // Admin gets notifications from /admin/notifications
      // Regular users get notifications from /user/notifications
      const isAdmin = user.role === 'admin';
      const endpoint = isAdmin ? '/admin/notifications' : '/user/notifications';

      const { data: res } = await api.get(endpoint);
      const items = (res.data || []).map(mapNotification);
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, [user]);

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
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  /** Mark all as read (client-side only) */
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
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
