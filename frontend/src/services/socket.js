import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

let socket = null;
let currentToken = null;

/**
 * Initializes and establishes the Socket.IO connection using JWT auth.
 * If already connected with the same token, returns existing socket.
 */
export const initSocket = (token) => {
  const authToken = token || localStorage.getItem('token');

  if (!authToken) {
    disconnectSocket();
    return null;
  }

  // If already connected with identical token, reuse
  if (socket && socket.connected && currentToken === authToken) {
    return socket;
  }

  // Disconnect previous instance if token changed
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = authToken;

  socket = io(BACKEND_URL, {
    auth: {
      token: authToken,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
  });

  socket.on('connect', () => {
    // Connected to private room
  });

  socket.on('connect_error', (error) => {
    // If auth error, do not retry aggressively
    if (error?.message?.includes('token') || error?.message?.includes('Unauthorized')) {
      // Auth failed
    }
  });

  return socket;
};

/**
 * Disconnects and cleans up active socket connection.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
};

/**
 * Returns current socket instance.
 */
export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('token');
    if (token) {
      return initSocket(token);
    }
  }
  return socket;
};

/**
 * Subscribes to notification real-time events.
 * Returns an unsubscription cleanup function.
 */
export const subscribeToNotifications = ({
  onNewNotification,
  onNotificationRead,
  onAllNotificationsRead,
  onNotificationDeleted,
  onUnreadCountChanged,
}) => {
  const activeSocket = getSocket();
  if (!activeSocket) return () => {};

  const handleNew = (data) => {
    if (onNewNotification) onNewNotification(data);
  };

  const handleRead = (data) => {
    if (onNotificationRead) onNotificationRead(data);
  };

  const handleReadAll = (data) => {
    if (onAllNotificationsRead) onAllNotificationsRead(data);
  };

  const handleDeleted = (data) => {
    if (onNotificationDeleted) onNotificationDeleted(data);
  };

  const handleUnreadCount = (data) => {
    if (onUnreadCountChanged) onUnreadCountChanged(data?.unread_count);
  };

  activeSocket.on('notification:new', handleNew);
  activeSocket.on('notification:read', handleRead);
  activeSocket.on('notification:read_all', handleReadAll);
  activeSocket.on('notification:deleted', handleDeleted);
  activeSocket.on('notification:unread_count', handleUnreadCount);

  return () => {
    activeSocket.off('notification:new', handleNew);
    activeSocket.off('notification:read', handleRead);
    activeSocket.off('notification:read_all', handleReadAll);
    activeSocket.off('notification:deleted', handleDeleted);
    activeSocket.off('notification:unread_count', handleUnreadCount);
  };
};

export default {
  initSocket,
  disconnectSocket,
  getSocket,
  subscribeToNotifications,
};

