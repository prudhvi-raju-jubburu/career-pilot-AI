import { useState, useEffect, useCallback } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getNotifications();
      setNotifications(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.warn('Could not mark notification read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.warn('Could not mark all notifications read:', err);
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

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
