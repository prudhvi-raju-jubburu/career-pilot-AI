import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  Info,
  Trash2,
  CheckCheck,
  ExternalLink,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import { mockNotifications } from '../services/mockData';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeCategory, setActiveCategory] = useState('All');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const toast = useToast();

  const categories = ['All', 'Opportunity', 'Application', 'Deadline', 'AI Recommendation', 'System'];

  const filteredNotifications = notifications.filter((notif) => {
    if (activeCategory !== 'All' && notif.category !== activeCategory) return false;
    if (unreadOnly && notif.read) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.info('Notifications cleared');
  };

  const handleToggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Opportunity':
        return <Briefcase size={17} className="text-primary" />;
      case 'Application':
        return <Layers size={17} className="text-accent" />;
      case 'Deadline':
        return <Clock size={17} className="text-warning" />;
      case 'AI Recommendation':
        return <Sparkles size={17} className="text-purple-600" />;
      case 'System':
      default:
        return <Info size={17} className="text-info" />;
    }
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <h1 className="font-h1" style={{ color: 'var(--text-primary)' }}>
              Notifications Center
            </h1>
            {unreadCount > 0 && (
              <Badge variant="primary" size="md">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Real-time telemetry alerts, matching opportunity updates, and application milestones.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            icon={<CheckCheck size={16} />}
          >
            Mark all read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            icon={<Trash2 size={16} />}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: activeCategory === cat ? 'var(--primary)' : 'var(--surface)',
                color: activeCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${activeCategory === cat ? 'var(--primary)' : 'var(--border)'}`,
                boxShadow: activeCategory === cat ? 'var(--shadow-btn-primary)' : 'var(--shadow-sm)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>Unread only</span>
        </label>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={28} />}
          title="No notifications to show"
          description={
            unreadOnly
              ? "You're all caught up! There are no unread notifications matching this filter."
              : 'You have no notifications in this category.'
          }
          actionLabel={unreadOnly ? 'Show All Notifications' : undefined}
          onAction={unreadOnly ? () => setUnreadOnly(false) : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredNotifications.map((notif) => (
            <Card
              key={notif.id}
              variant={notif.read ? 'default' : 'raised'}
              style={{
                borderLeft: notif.read
                  ? '1px solid var(--border)'
                  : notif.priority === 'urgent'
                  ? '4px solid var(--danger)'
                  : '4px solid var(--primary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Card.Content style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary)',
                            }}
                          />
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {notif.timeAgo}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                      {notif.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {notif.link && (
                        <Link to={notif.link}>
                          <Button variant="outline" size="sm" iconRight={<ExternalLink size={13} />}>
                            View Details
                          </Button>
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleRead(notif.id)}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        {notif.read ? 'Mark as unread' : 'Mark as read'}
                      </button>
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
