import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Activity,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  Settings,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './Admin.css';

export default function AdminLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const navItems = [
    { name: 'Overview', path: '/admin/overview', icon: <LayoutDashboard size={18} /> },
    { name: 'User Management', path: '/admin/users', icon: <Users size={18} /> },
    { name: 'Opportunity Moderation', path: '/admin/opportunities', icon: <Briefcase size={18} /> },
    { name: 'Source Health', path: '/admin/sources', icon: <Activity size={18} /> },
    { name: 'Platform Analytics', path: '/admin/analytics', icon: <BarChart3 size={18} /> },
    { name: 'Feedback & Reports', path: '/admin/feedback', icon: <MessageSquare size={18} /> },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: <ShieldCheck size={18} /> },
    { name: 'System Settings', path: '/admin/settings', icon: <Settings size={18} /> },
  ];

  // Derive breadcrumb from current path
  const currentNav = navItems.find((item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
  ) || { name: 'Admin Workspace' };

  return (
    <div className="admin-workspace">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 998,
          }}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        style={{
          width: '260px',
          backgroundColor: 'var(--admin-sidebar-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRight: '1px solid var(--admin-border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 999,
          transition: 'transform 0.25s ease',
          ...(typeof window !== 'undefined' && window.innerWidth < 1024
            ? {
                position: 'fixed',
                transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
              }
            : {}),
        }}
      >
        {/* Sidebar Brand Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--admin-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--admin-primary), var(--admin-accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '1rem',
                boxShadow: '0 0 15px var(--admin-primary-glow)',
              }}
            >
              CP
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em', color: 'var(--admin-text-main)' }}>
                CareerPilot
              </div>
              <div
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--admin-accent)',
                }}
              >
                Admin Workspace
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--admin-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: '0.25rem',
            }}
            className="lg:hidden"
            aria-label="Close admin navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav
          style={{
            flex: 1,
            padding: '1rem 0.75rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <div
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--admin-text-dim)',
            }}
          >
            Platform Operations
          </div>

          {navItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => setMobileOpen(false)}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <span style={{ display: 'flex', opacity: isActive ? 1 : 0.85 }}>{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer with Link to Student Mode */}
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
          }}
        >
          <Link
            to="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#1e293b',
              textDecoration: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
              transition: 'border-color 0.2s ease, background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <span>Switch to Student App</span>
            <ArrowUpRight size={15} color="#64748b" />
          </Link>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name || 'Administrator'}
              </div>
              <div
                style={{
                  fontSize: '0.71875rem',
                  color: 'var(--text-muted, #94a3b8)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.email}
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '6px',
                display: 'flex',
              }}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Top Header Bar */}
        <header
          style={{
            height: '64px',
            backgroundColor: 'var(--admin-header-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--admin-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            position: 'sticky',
            top: 0,
            zIndex: 90,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setMobileOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                padding: '0.25rem',
              }}
              className="lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>

            {/* Breadcrumb Navigation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
              }}
            >
              <Link to="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                Admin
              </Link>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {currentNav.name}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Live Authorization Badge with Pulsing Live Dot */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                color: '#2563eb',
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              <span className="admin-live-dot" />
              <span>AUTHORIZATION: ADMIN</span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main
          className="admin-main-content"
          style={{
            flex: 1,
            padding: '1.75rem 2.25rem',
            maxWidth: '1440px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {title && (
            <div style={{ marginBottom: '1.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--admin-text-main)' }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
