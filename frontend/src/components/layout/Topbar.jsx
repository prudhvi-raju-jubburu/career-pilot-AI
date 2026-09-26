import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Badge from '../ui/Badge';

export default function Topbar({ onToggleMobile }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/');
  };

  const handleNavigate = (path) => {
    setDropdownOpen(false);
    navigate(path);
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'P';

  return (
    <header className="app-topbar">
      <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
        <button
          onClick={onToggleMobile}
          className="topbar-icon-btn topbar-mobile-toggle"
          id="mobile-menu-trigger"
          title="Toggle Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu size={18} />
        </button>

        {/* Logo and Title linking to Homepage */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            textDecoration: 'none',
            color: 'var(--color-text)',
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            transition: 'opacity var(--transition-fast)',
          }}
          title="CareerPilot AI — Go to Homepage"
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: 'var(--shadow-raised-sm)',
            }}
          >
            <Compass size={16} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>
            CareerPilot
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              backgroundColor: 'var(--color-primary-50)',
              color: 'var(--color-primary-600)',
              padding: '0.1rem 0.35rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(37,99,235,0.2)',
            }}
          >
            AI
          </span>
        </Link>

        <div className="topbar-search-wrapper">
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-subtle)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search internships, roles, skills, or companies..."
          />
        </div>
      </div>

      <div className="topbar-right">
        <Badge variant="primary" dot size="sm" style={{ display: 'none' }} className="desktop-only-badge">
          AI Co-Pilot Ready
        </Badge>

        <button className="topbar-icon-btn" title="Notifications">
          <Bell size={17} />
          <span className="notification-badge" />
        </button>

        {/* User Profile Dropdown Menu */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.25rem 0.45rem',
              borderRadius: 'var(--radius-md)',
              border: dropdownOpen ? '1px solid var(--color-primary-500)' : '1px solid transparent',
              backgroundColor: dropdownOpen ? 'var(--color-surface)' : 'transparent',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            title="Account Menu"
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600))',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
                boxShadow: 'var(--shadow-btn-primary)',
              }}
            >
              {initial}
            </div>
            <ChevronDown
              size={15}
              style={{
                color: 'var(--color-text-muted)',
                transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform var(--transition-fast)',
              }}
            />
          </button>

          {/* Dropdown Menu Container */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '240px',
                maxWidth: 'calc(100vw - 1.5rem)',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-control)',
                boxShadow: 'var(--shadow-raised-lg), 0 12px 24px rgba(0,0,0,0.12)',
                zIndex: 1000,
                padding: '0.5rem 0',
                animation: 'fadeInUp 0.15s ease-out',
              }}
            >
              {/* User Identity Header */}
              <div
                style={{
                  padding: '0.75rem 1rem 0.85rem',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'Prudhvi'}
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.1rem' }}>
                  {user?.email || 'student@careerpilot.ai'}
                </div>
              </div>

              {/* Account Section Title */}
              <div
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.65rem 1rem 0.35rem',
                }}
              >
                Account
              </div>

              {/* Option 1: Profile */}
              <button
                onClick={() => handleNavigate('/profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.6rem 1rem',
                  fontSize: '0.875rem',
                  color: 'var(--color-text)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <User size={16} color="var(--color-text-muted)" />
                <span style={{ fontWeight: 500 }}>Profile</span>
              </button>

              {/* Option 2: Settings */}
              <button
                onClick={() => handleNavigate('/settings')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.6rem 1rem',
                  fontSize: '0.875rem',
                  color: 'var(--color-text)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Settings size={16} color="var(--color-text-muted)" />
                <span style={{ fontWeight: 500 }}>Settings</span>
              </button>

              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '0.35rem 0' }} />

              {/* Option 3: Sign Out */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.6rem 1rem',
                  fontSize: '0.875rem',
                  color: 'var(--color-danger-dark)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-danger-bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <LogOut size={16} color="var(--color-danger-dark)" />
                <span style={{ fontWeight: 600 }}>Sign Out</span>
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
        @media (min-width: 768px) {
          .desktop-only-badge {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
}
