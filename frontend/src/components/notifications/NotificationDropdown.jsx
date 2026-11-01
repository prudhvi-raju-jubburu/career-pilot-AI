import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  Briefcase,
  AlertCircle,
  Calendar,
  Sparkles,
  Info,
  Check
} from 'lucide-react';

// Format relative timestamps
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
};

const getNotificationIcon = (type) => {
  const norm = String(type || '').toLowerCase();
  if (norm.includes('opportunity') || norm.includes('match')) {
    return <Briefcase size={15} style={{ color: '#2563eb' }} />;
  }
  if (norm.includes('deadline')) {
    return <AlertCircle size={15} style={{ color: '#ea580c' }} />;
  }
  if (norm.includes('application') || norm.includes('interview')) {
    return <Calendar size={15} style={{ color: '#0d9488' }} />;
  }
  if (norm.includes('recommend') || norm.includes('digest')) {
    return <Sparkles size={15} style={{ color: '#7c3aed' }} />;
  }
  return <Info size={15} style={{ color: '#64748b' }} />;
};

export default function NotificationDropdown({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}) {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Handle outside click and Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = (item) => {
    if (!item.read && onMarkRead) {
      onMarkRead(item.id || item._id);
    }
    onClose();
    if (item.link) {
      navigate(item.link);
    } else if (item.opportunity_id) {
      navigate(`/opportunities?selected=${item.opportunity_id}`);
    } else {
      navigate('/notifications');
    }
  };

  return (
    <div
      ref={dropdownRef}
      role="menu"
      aria-label="Recent notifications"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: '-80px',
        width: '360px',
        maxWidth: 'calc(100vw - 32px)',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
        zIndex: 100,
        overflow: 'hidden',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '0.85rem 1rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fafaf9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              style={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                border: '1px solid #dbeafe',
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.4rem',
              borderRadius: '4px',
              transition: 'background 0.15s',
            }}
            title="Mark all as read"
          >
            <CheckCheck size={13} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
        {recentNotifications.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.85rem',
            }}
          >
            <Bell size={24} style={{ margin: '0 auto 0.5rem', color: '#cbd5e1' }} />
            <p style={{ margin: 0, fontWeight: 500 }}>No notifications yet</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
              We will notify you when new opportunities match.
            </p>
          </div>
        ) : (
          recentNotifications.map((item) => {
            const itemId = item.id || item._id;
            const isUnread = !item.read;

            return (
              <div
                key={itemId}
                onClick={() => handleNotificationClick(item)}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #f8fafc',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  backgroundColor: isUnread ? '#f8faff' : '#ffffff',
                  transition: 'background-color 0.15s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isUnread ? '#eff6ff' : '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isUnread ? '#f8faff' : '#ffffff';
                }}
              >
                {/* Icon avatar */}
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    backgroundColor: isUnread ? '#dbeafe' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {getNotificationIcon(item.type)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: isUnread ? 700 : 600,
                        color: isUnread ? '#0f172a' : '#334155',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: '#94a3b8',
                        flexShrink: 0,
                      }}
                    >
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '0.2rem 0 0',
                      fontSize: '0.75rem',
                      color: '#64748b',
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.message}
                  </p>
                </div>

                {/* Unread indicator dot */}
                {isUnread && (
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: '#2563eb',
                      flexShrink: 0,
                      marginTop: '6px',
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '0.65rem 1rem',
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
          backgroundColor: '#fafaf9',
        }}
      >
        <Link
          to="/notifications"
          onClick={onClose}
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#2563eb',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          View all notifications
          <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );
}

