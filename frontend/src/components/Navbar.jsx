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
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="nav-container"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
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
            gap: '0.55rem',
            textDecoration: 'none',
            color: 'var(--color-text)',
            fontWeight: 800,
            fontSize: '1.15rem',
            flexShrink: 0,
          }}
        >
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
              boxShadow: 'var(--shadow-raised-sm)',
            }}
          >
            <Compass size={18} />
          </div>
          <span>CareerPilot</span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              backgroundColor: 'var(--color-primary-50)',
              color: 'var(--color-primary-600)',
              padding: '0.12rem 0.4rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(37,99,235,0.2)',
            }}
          >
            AI
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="nav-links">
          <NavLink
            to="/"
            style={({ isActive }) => ({
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: isActive ? 'var(--color-primary-600)' : 'var(--color-text-muted)',
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
                  fontSize: '0.9rem',
                  color: isActive ? 'var(--color-primary-600)' : 'var(--color-text-muted)',
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
                  fontSize: '0.9rem',
                  color: isActive ? 'var(--color-primary-600)' : 'var(--color-text-muted)',
                  transition: 'color var(--transition-fast)',
                })}
              >
                Opportunities
              </NavLink>
            </>
          ) : (
            <a
              href="#how-it-works"
              style={{
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: 'var(--color-text-muted)',
                transition: 'color var(--transition-fast)',
              }}
            >
              How It Works
            </a>
          )}
        </nav>

        {/* Header Actions */}
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link
                to="/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.35rem 0.8rem',
                  backgroundColor: 'var(--color-primary-50)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--color-primary-700)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  textDecoration: 'none',
                }}
                title="Go to Dashboard"
              >
                <User size={14} />
                <span className="desktop-only-text" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name?.split(' ')[0] || 'Dashboard'}
                </span>
              </Link>
            </div>
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

      {/* Mobile Slide-down Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderTop: '1px solid var(--border-subtle)',
            padding: '1rem 1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-raised-lg)',
            animation: 'fadeInUp 0.2s ease-out',
          }}
        >
          <NavLink
            to="/"
            onClick={closeMobile}
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: 'var(--color-text)',
              backgroundColor: 'var(--color-bg)',
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'var(--color-primary-700)',
                  backgroundColor: 'var(--color-primary-50)',
                }}
              >
                <LayoutDashboard size={18} />
                <span>Student Dashboard</span>
              </NavLink>

              <NavLink
                to="/opportunities"
                onClick={closeMobile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'var(--color-text)',
                }}
              >
                <Briefcase size={18} />
                <span>Opportunities</span>
              </NavLink>

              <NavLink
                to="/applications"
                onClick={closeMobile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'var(--color-text)',
                }}
              >
                <Layers size={18} />
                <span>Applications Tracker</span>
              </NavLink>

              <NavLink
                to="/resume"
                onClick={closeMobile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'var(--color-text)',
                }}
              >
                <FileText size={18} />
                <span>Resume Intelligence</span>
              </NavLink>

              <NavLink
                to="/skill-gap"
                onClick={closeMobile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'var(--color-text)',
                }}
              >
                <TrendingUp size={18} />
                <span>Skill Gap &amp; Roadmap</span>
              </NavLink>

              <NavLink
                to="/ai-advisor"
                onClick={closeMobile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'var(--color-text)',
                }}
              >
                <Sparkles size={18} color="var(--color-purple-600)" />
                <span>AI Career Advisor</span>
              </NavLink>

              <NavLink
                to="/profile"
                onClick={closeMobile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'var(--color-text)',
                }}
              >
                <User size={18} />
                <span>Profile ({user?.name || 'Student'})</span>
              </NavLink>

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'var(--color-danger-dark)',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                }}
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
              <Link to="/login" onClick={closeMobile} style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="md" style={{ width: '100%', justifyContent: 'center' }}>
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={closeMobile} style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="md" iconRight={<ArrowRight size={15} />} style={{ width: '100%', justifyContent: 'center' }}>
                  Get Started Free
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
