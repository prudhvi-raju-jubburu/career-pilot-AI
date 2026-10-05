import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  Briefcase,
  Layers,
  FileText,
  TrendingUp,
  Sparkles,
  User,
  Bell,
  Settings,
  LogOut,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar({
  mobileOpen = false,
  onCloseMobile,
  collapsed = false,
  onToggleCollapse
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onCloseMobile) onCloseMobile();
    logout();
    navigate('/');
  };

  const primaryNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Opportunities', path: '/opportunities', icon: <Briefcase size={18} /> },
    { name: 'Applications', path: '/applications', icon: <Layers size={18} /> },
    { name: 'Resume', path: '/resume', icon: <FileText size={18} /> },
    { name: 'Skill Gap', path: '/skill-gap', icon: <TrendingUp size={18} /> },
    { name: 'AI Career Advisor', path: '/ai-advisor', icon: <Sparkles size={18} /> },
  ];

  const secondaryNavItems = [
    { name: 'Profile', path: '/profile', icon: <User size={18} /> },
    { name: 'Notifications', path: '/notifications', icon: <Bell size={18} />, badge: 3 },
    { name: 'Settings', path: '/settings', icon: <Settings size={18} /> },
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';

  return (
    <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''} ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <NavLink
          to="/"
          className="sidebar-brand"
          onClick={onCloseMobile}
          title="CareerPilot AI — Go to Homepage"
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
              flexShrink: 0,
            }}
          >
            <Compass size={19} />
          </div>
          {!collapsed && <span>CareerPilot</span>}
          {!collapsed && <span className="sidebar-brand-badge">AI</span>}
        </NavLink>

        {/* Mobile Close Button */}
        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            style={{
              padding: '0.4rem',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
            }}
            title="Close menu"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Main Navigation List */}
      <div className="sidebar-nav">
        {!collapsed && <span className="sidebar-section-title">Career Suite</span>}
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onCloseMobile}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.name : undefined}
          >
            <span className="sidebar-nav-icon">
              {item.icon}
            </span>
            <span className="sidebar-nav-label">{item.name}</span>
          </NavLink>
        ))}

        {!collapsed && <span className="sidebar-section-title" style={{ marginTop: '0.75rem' }}>Management</span>}
        {secondaryNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onCloseMobile}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.name : undefined}
          >
            <span className="sidebar-nav-icon" style={{ position: 'relative' }}>
              {item.icon}
              {item.badge && collapsed && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--danger)',
                  }}
                />
              )}
            </span>
            <span className="sidebar-nav-label">{item.name}</span>
            {item.badge && !collapsed && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--danger)',
                  color: '#ffffff',
                }}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Desktop Collapse Toggle */}
      {onToggleCollapse && (
        <div style={{ padding: '0.5rem 0.85rem', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
          <button
            type="button"
            onClick={onToggleCollapse}
            style={{
              padding: '0.35rem',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color var(--transition-fast)',
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
          </button>
        </div>
      )}

      {/* Sidebar Footer User Card */}
      <div className="sidebar-footer">
        <Link
          to="/profile"
          onClick={onCloseMobile}
          className="sidebar-user-card"
          title="View Student Profile"
          style={{ textDecoration: 'none', width: '100%' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
                flexShrink: 0,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {userInitial}
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }} className="sidebar-user-info">
                <div
                  style={{
                    fontSize: '0.84375rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.name || 'Student Candidate'}
                </div>
                <div
                  style={{
                    fontSize: '0.71875rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.email || 'student@careerpilot.ai'}
                </div>
              </div>
            )}
          </div>
          {!collapsed && <ChevronRight size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
        </Link>
      </div>
    </aside>
  );
}
