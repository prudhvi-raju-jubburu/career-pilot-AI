import { useState, useEffect, useCallback } from 'react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as apiDeleteNotification
} from '../services/api';
import { initSocket, subscribeToNotifications } from '../services/socket';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifs = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await getNotifications();
      const list = res.data || [];
      setNotifications(list);
      setUnreadCount(typeof res.unread_count === 'number' ? res.unread_count : list.filter((n) => !n.read).length);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and Real-Time Socket.IO event subscription
  useEffect(() => {
    fetchNotifs();

    const token = localStorage.getItem('token');
    if (token) {
      initSocket(token);
    }

    const unsubscribe = subscribeToNotifications({
      onNewNotification: (notif) => {
        if (!notif) return;
        setNotifications((prev) => {
          // Avoid duplicate insertion
          const exists = prev.some((item) => (item.id || item._id) === (notif.id || notif._id));
          if (exists) return prev;
          return [notif, ...prev];
        });
        setUnreadCount((c) => c + 1);
      },
      onNotificationRead: ({ id, unread_count }) => {
        setNotifications((prev) =>
          prev.map((n) => ((n.id || n._id) === id ? { ...n, read: true } : n))
        );
        if (typeof unread_count === 'number') {
          setUnreadCount(unread_count);
        } else {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
      },
      onAllNotificationsRead: ({ unread_count } = {}) => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(typeof unread_count === 'number' ? unread_count : 0);
      },
      onNotificationDeleted: ({ id, unread_count }) => {
        setNotifications((prev) => prev.filter((n) => (n.id || n._id) !== id));
        if (typeof unread_count === 'number') {
          setUnreadCount(unread_count);
        } else {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
      },
      onUnreadCountChanged: (count) => {
        if (typeof count === 'number') {
          setUnreadCount(count);
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [fetchNotifs]);

  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => ((n.id || n._id) === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.warn('Could not mark notification read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.warn('Could not mark all notifications read:', err);
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const deleteNotification = useCallback(async (id) => {
    setNotifications((prev) => prev.filter((n) => (n.id || n._id) !== id));
    try {
      await apiDeleteNotification(id);
    } catch (err) {
      console.warn('Could not delete notification from server:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifs,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
  };
};

export default useNotifications;
