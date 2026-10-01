import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import SearchInput from '../ui/SearchInput';
import Badge from '../ui/Badge';
import { mockNotifications } from '../../services/mockData';

export default function Topbar({ onToggleMobile }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUserDropdownOpen(false);
    logout();
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/opportunities?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const unreadCount = mockNotifications.filter((n) => !n.read).length;
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';

  return (
    <header className="app-topbar">
      {/* Left Area: Mobile Menu + Search */}
      <div className="topbar-left">
        <button
          onClick={onToggleMobile}
          className="topbar-icon-btn topbar-mobile-toggle"
          id="mobile-menu-trigger"
          title="Toggle Navigation Menu"
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <div style={{ flex: 1, minWidth: 0, maxWidth: '420px' }}>
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            placeholder="Search internships, roles, skills, or companies..."
            showShortcut
            shortcutKey="↵ Enter"
          />
        </div>
      </div>

      {/* Right Area: Status Badge + Theme Toggle + Notifications + User Menu */}
      <div className="topbar-right">
        {/* Status Badge */}
        <Badge
          variant="primary"
          dot
          size="sm"
          className="desktop-only-badge"
          style={{ display: 'none' }}
        >
          Telemetry Active
        </Badge>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="topbar-icon-btn"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun size={17} className="text-warning animate-scale-in" />
          ) : (
            <Moon size={17} className="text-primary animate-scale-in" />
          )}
        </button>

        {/* Notifications Dropdown Container */}
        <div style={{ position: 'relative' }} ref={notifDropdownRef}>
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            title="Notifications"
            aria-label="Open notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && <span className="notification-badge" />}
          </button>

          {notifDropdownOpen && (
            <div
              className="animate-fade-down"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '340px',
                maxWidth: 'calc(100vw - 2rem)',
                backgroundColor: 'var(--surface-raised)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-floating)',
                zIndex: 1000,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--surface)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Notifications
                </div>
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.45rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--primary-subtle)',
                      color: 'var(--primary)',
                    }}
                  >
                    {unreadCount} unread
                  </span>
                )}
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {mockNotifications.slice(0, 3).map((notif) => (
                  <Link
                    key={notif.id}
                    to={notif.link}
                    onClick={() => setNotifDropdownOpen(false)}
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: notif.read ? 'transparent' : 'var(--primary-subtle)',
                      transition: 'background-color var(--transition-fast)',
                    }}
                  >
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {notif.timeAgo}
                    </div>
                  </Link>
                ))}
              </div>

              <Link
                to="/notifications"
                onClick={() => setNotifDropdownOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  padding: '0.65rem 1rem',
                  fontSize: '0.78125rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  backgroundColor: 'var(--surface)',
                  borderTop: '1px solid var(--border)',
                  textAlign: 'center',
                }}
              >
                <span>View all notifications</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={userDropdownRef}>
          <button
            type="button"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.2rem 0.35rem',
              borderRadius: 'var(--radius-md)',
              border: userDropdownOpen ? '1px solid var(--primary)' : '1px solid transparent',
              backgroundColor: userDropdownOpen ? 'var(--surface-raised)' : 'transparent',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            title="User Account Menu"
            aria-label="User account menu"
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
                boxShadow: 'var(--shadow-btn-primary)',
              }}
            >
              {userInitial}
            </div>
            <ChevronDown
              size={14}
              style={{
                color: 'var(--text-muted)',
                transform: userDropdownOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform var(--transition-fast)',
              }}
            />
          </button>

          {/* User Menu Dropdown Panel */}
          {userDropdownOpen && (
            <div
              className="animate-fade-down"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '230px',
                maxWidth: 'calc(100vw - 2rem)',
                backgroundColor: 'var(--surface-raised)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-floating)',
                zIndex: 1000,
                padding: '0.5rem 0',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '0.75rem 1rem 0.85rem',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'Student Candidate'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                  {user?.email || 'student@careerpilot.ai'}
                </div>
              </div>

              <div style={{ padding: '0.35rem 0' }}>
                <button
                  type="button"
                  onClick={() => { setUserDropdownOpen(false); navigate('/profile'); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.6rem 1rem',
                    fontSize: '0.84375rem',
                    color: 'var(--text-primary)',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <User size={15} color="var(--text-secondary)" />
                  <span>Profile Workspace</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setUserDropdownOpen(false); navigate('/settings'); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.6rem 1rem',
                    fontSize: '0.84375rem',
                    color: 'var(--text-primary)',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Settings size={15} color="var(--text-secondary)" />
                  <span>Settings & Preferences</span>
                </button>
              </div>

              <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0.25rem 0' }} />

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.6rem 1rem',
                  fontSize: '0.84375rem',
                  color: 'var(--danger)',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger-bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <LogOut size={15} color="var(--danger)" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          #mobile-menu-trigger {
            display: flex !important;
          }
        }
        @media (min-width: 860px) {
          .desktop-only-badge {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
}
