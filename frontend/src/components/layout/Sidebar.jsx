import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  Home,
  LayoutDashboard,
  Briefcase,
  Layers,
  FileText,
  TrendingUp,
  Sparkles,
  LogOut,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={18} /> },
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Opportunities', path: '/opportunities', icon: <Briefcase size={18} /> },
    { name: 'Applications', path: '/applications', icon: <Layers size={18} /> },
    { name: 'Resume', path: '/resume', icon: <FileText size={18} /> },
    { name: 'Skill Gap', path: '/skill-gap', icon: <TrendingUp size={18} /> },
    { name: 'AI Career Advisor', path: '/ai-advisor', icon: <Sparkles size={18} /> },
  ];

  return (
    <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Sidebar Header with Home Link */}
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-brand" onClick={onCloseMobile} title="CareerPilot AI Home">
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 2px 5px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
            }}
          >
            <Compass size={20} />
          </div>
          <span>CareerPilot</span>
          <span className="sidebar-brand-badge">AI</span>
        </NavLink>

        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            style={{
              padding: '0.4rem',
              color: 'var(--color-text-muted)',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            title="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="sidebar-nav">
        <span className="sidebar-section-title">Navigation</span>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onCloseMobile}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}

        <button
          onClick={handleLogout}
          className="sidebar-nav-item"
          style={{ width: '100%', marginTop: 'auto', color: 'var(--color-danger-dark)' }}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Bottom User Card linking to Profile */}
      <div className="sidebar-footer">
        <Link
          to="/profile"
          onClick={onCloseMobile}
          className="sidebar-user-card"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
          title="View Student Profile"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600))',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name || 'Prudhvi'}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.email || 'student@careerpilot.ai'}
              </div>
            </div>
          </div>
          <ChevronRight size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
        </Link>
      </div>
    </aside>
  );
}
