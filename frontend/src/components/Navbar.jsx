import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Compass,
  User,
  LogOut,
  ArrowRight,
  LayoutDashboard,
  Menu,
  X,
  Briefcase,
  Layers,
  FileText,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/');
  };

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <header
      className="navbar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--surface-glass)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="nav-container"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Brand Logo & Name */}
        <Link
          to="/"
          className="nav-brand"
          onClick={closeMobile}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            textDecoration: 'none',
            color: 'var(--text-primary)',
            fontWeight: 800,
            fontSize: '1.2rem',
            flexShrink: 0,
          }}
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
            }}
          >
            <Compass size={19} />
          </div>
          <span>CareerPilot</span>
          <span className="brand-badge">
            AI
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="nav-links desktop-only" style={{ alignItems: 'center', gap: '1.5rem' }}>
          <NavLink
            to="/"
            style={({ isActive }) => ({
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              transition: 'color var(--transition-fast)',
            })}
          >
            Home
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                style={({ isActive }) => ({
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'color var(--transition-fast)',
                })}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/opportunities"
                style={({ isActive }) => ({
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'color var(--transition-fast)',
                })}
              >
                Opportunities
              </NavLink>
              <NavLink
                to="/applications"
                style={({ isActive }) => ({
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'color var(--transition-fast)',
                })}
              >
                Tracker
              </NavLink>
            </>
          ) : (
            <>
              <a
                href="#features"
                style={{
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  color: 'var(--text-secondary)',
                  transition: 'color var(--transition-fast)',
                }}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                style={{
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  color: 'var(--text-secondary)',
                  transition: 'color var(--transition-fast)',
                }}
              >
                How It Works
              </a>
            </>
          )}
        </nav>

        {/* Header Actions */}
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.85rem',
                backgroundColor: 'var(--primary-subtle)',
                borderRadius: 'var(--radius-full)',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.84375rem',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                textDecoration: 'none',
              }}
              title="Go to Student Dashboard"
            >
              <User size={15} />
              <span className="desktop-only-text" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name?.split(' ')[0] || 'Dashboard'}
              </span>
            </Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="desktop-only-badge" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="sm" iconRight={<ArrowRight size={14} />}>
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-only topbar-icon-btn"
            title="Toggle Navigation Menu"
            aria-label="Toggle Mobile Menu"
            style={{ width: '36px', height: '36px', flexShrink: 0 }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="animate-fade-down"
          style={{
            backgroundColor: 'var(--surface-raised)',
            borderTop: '1px solid var(--border)',
            padding: '1rem 1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-floating)',
          }}
        >
          <NavLink
            to="/"
            onClick={closeMobile}
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--surface)',
            }}
          >
            Home
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                onClick={closeMobile}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                }}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/opportunities"
                onClick={closeMobile}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                }}
              >
                Opportunities
              </NavLink>
              <NavLink
                to="/applications"
                onClick={closeMobile}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                }}
              >
                Application Tracker
              </NavLink>
              <NavLink
                to="/resume"
                onClick={closeMobile}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                }}
              >
                Resume Workspace
              </NavLink>
              <NavLink
                to="/skill-gap"
                onClick={closeMobile}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                }}
              >
                Skill Gap Analysis
              </NavLink>
              <NavLink
                to="/ai-advisor"
                onClick={closeMobile}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                }}
              >
                AI Career Advisor
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Link to="/login" onClick={closeMobile} style={{ textDecoration: 'none' }}>
                <Button variant="secondary" style={{ width: '100%' }}>
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={closeMobile} style={{ textDecoration: 'none' }}>
                <Button variant="primary" style={{ width: '100%' }}>
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
