import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  Sparkles,
  Bell,
  Search,
  Settings,
  ChevronDown,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { CommandPalette } from './ui/CommandPalette';
import Button from './ui/Button';

export default function Navbar({ onOpenCmd }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const userDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/');
  };

  const closeMobile = () => setMobileMenuOpen(false);

  const triggerCmd = () => {
    if (onOpenCmd) {
      onOpenCmd();
    } else {
      setCmdOpen(true);
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';

  return (
    <>
      <header
        className="navbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 2px 14px rgba(15, 23, 42, 0.04)',
          width: '100%',
        }}
      >

        <div
          className="nav-container"
          style={{
            maxWidth: '1360px',
            margin: '0 auto',
            padding: '0.8rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {/* Brand Logo & Name */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="nav-brand"
            onClick={closeMobile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <img
              src="/careerpilot-logo.png"
              alt="CareerPilot — Discover • Prepare • Grow"
              style={{
                height: '42px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.15rem 0.45rem',
                borderRadius: '9999px',
                background: 'var(--lx-blue)',
                color: '#ffffff',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: '0 2px 6px rgba(43, 87, 255, 0.35)',
              }}
            >
              AI
            </span>
          </Link>

          {/* Desktop Nav Links (Mavens-i Light Navbar style) */}
          <nav className="nav-links desktop-only" style={{ alignItems: 'center', gap: '1.5rem', display: 'flex' }}>
            <NavLink
              to="/"
              style={({ isActive }) => ({
                textDecoration: 'none',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                color: isActive ? '#0f172a' : '#475569',
                transition: 'color 0.2s ease',
              })}
            >
              Home
            </NavLink>

            {isAuthenticated && (
              <NavLink
                to="/dashboard"
                style={({ isActive }) => ({
                  textDecoration: 'none',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  color: isActive ? '#255eff' : '#475569',
                  transition: 'color 0.2s ease',
                })}
              >
                Dashboard
              </NavLink>
            )}

            <NavLink
              to="/opportunities"
              style={({ isActive }) => ({
                textDecoration: 'none',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                color: isActive ? '#255eff' : '#475569',
                transition: 'color 0.2s ease',
              })}
            >
              Opportunities
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink
                  to="/applications"
                  style={({ isActive }) => ({
                    textDecoration: 'none',
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    color: isActive ? '#255eff' : '#475569',
                    transition: 'color 0.2s ease',
                  })}
                >
                  Applications
                </NavLink>

                <NavLink
                  to="/skill-gap"
                  style={({ isActive }) => ({
                    textDecoration: 'none',
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    color: isActive ? '#255eff' : '#475569',
                    transition: 'color 0.2s ease',
                  })}
                >
                  Skill Gap
                </NavLink>

                <NavLink
                  to="/resume"
                  style={({ isActive }) => ({
                    textDecoration: 'none',
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    color: isActive ? '#255eff' : '#475569',
                    transition: 'color 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  })}
                >
                  <span>Resume</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, background: 'var(--lx-gold)', color: 'var(--lx-ink)', padding: '0.1rem 0.35rem', borderRadius: '9999px' }}>
                    AI
                  </span>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/resume"
                  style={({ isActive }) => ({
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    color: '#475569',
                    transition: 'color 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  })}
                >
                  <span>Resume Builder</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, background: 'var(--lx-gold)', color: 'var(--lx-ink)', padding: '0.1rem 0.35rem', borderRadius: '9999px' }}>
                    AI
                  </span>
                </NavLink>
                <a
                  href="/#features"
                  style={{
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    color: '#475569',
                    transition: 'color 0.2s ease',
                  }}
                >
                  Capabilities
                </a>
                <a
                  href="/#how-it-works"
                  style={{
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    color: '#475569',
                    transition: 'color 0.2s ease',
                  }}
                >
                  Roadmap
                </a>
              </>
            )}

            {/* AI Solutions / Copilot link with signature Mavens dual gradient icon */}
            <NavLink
              to="/ai-advisor"
              style={({ isActive }) => ({
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                color: isActive ? '#f97316' : '#0f172a',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'color 0.2s ease',
              })}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" style={{ flexShrink: 0 }}>
                <defs>
                  <linearGradient id="mavAiFillNavLight2" x1="3.5" y1="3.5" x2="20.5" y2="20.5" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4a67f5" />
                    <stop offset="58%" stopColor="#1e2b85" />
                    <stop offset="100%" stopColor="#131b60" />
                  </linearGradient>
                  <linearGradient id="mavAiArcNavLight2" x1="12" y1="1.5" x2="22.5" y2="22.5" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FF8A2A" />
                    <stop offset="52%" stopColor="#3b52c4" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#1e2b85" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M12 1.5 A10.5 10.5 0 0 1 22.5 12 A10.5 10.5 0 0 1 12 22.5" stroke="url(#mavAiArcNavLight2)" strokeWidth="1.7" strokeLinecap="round" fill="none" />
                <path d="M12 3.5 C12 8 16 12 20.5 12 C16 12 12 16 12 20.5 C12 16 8 12 3.5 12 C8 12 12 8 12 3.5 Z" fill="url(#mavAiFillNavLight2)" />
              </svg>
              <span>AI Solutions</span>
            </NavLink>
          </nav>

          {/* Header Right Actions */}
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Command Palette Trigger Button */}
            <button
              type="button"
              onClick={triggerCmd}
              className="desktop-only"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Search opportunities, commands, and tools (Ctrl+K or ⌘K)"
            >
              <Search size={14} color="#94a3b8" />
              <span>Search</span>
              <kbd
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.35rem',
                  borderRadius: '4px',
                  backgroundColor: '#e2e8f0',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  marginLeft: '0.2rem',
                }}
              >
                ⌘K
              </kbd>
            </button>

            {/* Notifications Bell (Authenticated) */}
            {isAuthenticated && (
              <Link
                to="/notifications"
                style={{
                  position: 'relative',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                title={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-3px',
                      minWidth: '16px',
                      height: '16px',
                      borderRadius: '9999px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px',
                      boxShadow: '0 0 0 2px #ffffff',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Authenticated User Menu vs Guest Login/Register */}
            {isAuthenticated ? (
              <div ref={userDropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.35rem 0.75rem 0.35rem 0.45rem',
                    background: '#ffffff',
                    borderRadius: '9999px',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="User Profile & Quick Actions"
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0b2f74 0%, #255eff 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      boxShadow: '0 2px 6px rgba(37, 94, 255, 0.25)',
                    }}
                  >
                    {userInitial}
                  </div>
                  <span className="desktop-only-text" style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name?.split(' ')[0] || 'Student'}
                  </span>
                  <ChevronDown
                    size={14}
                    color="#64748b"
                    style={{
                      transform: userDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '230px',
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
                      padding: '0.5rem',
                      zIndex: 1000,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    {/* User info head */}
                    <div style={{ padding: '0.6rem 0.75rem 0.75rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.35rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0f172a' }}>{user?.name || 'Student User'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.email || 'student@careerpilot.ai'}
                      </div>
                      <div style={{ marginTop: '0.4rem', display: 'inline-flex', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#255eff', fontSize: '0.7rem', fontWeight: 700 }}>
                        Student Account
                      </div>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="mavens-menu-item"
                    >
                      <LayoutDashboard size={15} color="#255eff" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="mavens-menu-item"
                    >
                      <User size={15} color="#255eff" />
                      <span>Student Profile</span>
                    </Link>
                    <Link
                      to="/applications"
                      onClick={() => setUserDropdownOpen(false)}
                      className="mavens-menu-item"
                    >
                      <Layers size={15} color="#255eff" />
                      <span>Application Tracker</span>
                    </Link>
                    <Link
                      to="/skill-gap"
                      onClick={() => setUserDropdownOpen(false)}
                      className="mavens-menu-item"
                    >
                      <TrendingUp size={15} color="#255eff" />
                      <span>Skill Gap Analysis</span>
                    </Link>
                    <Link
                      to="/notifications"
                      onClick={() => setUserDropdownOpen(false)}
                      className="mavens-menu-item"
                    >
                      <Bell size={15} color="#255eff" />
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span style={{ marginLeft: 'auto', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '999px', fontWeight: 800 }}>
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="mavens-menu-item"
                    >
                      <Settings size={15} color="#64748b" />
                      <span>Settings</span>
                    </Link>

                    {user?.role === 'admin' && (
                      <Link
                        to="/admin/overview"
                        onClick={() => setUserDropdownOpen(false)}
                        className="mavens-menu-item"
                        style={{ color: '#255eff', fontWeight: 700 }}
                      >
                        <ShieldAlert size={15} color="#255eff" />
                        <span>Admin Workspace</span>
                      </Link>
                    )}

                    <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '0.35rem 0' }} />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mavens-menu-item"
                      style={{ color: '#ef4444', border: 'none', background: 'transparent', width: '100%', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <LogOut size={15} color="#ef4444" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <button
                    type="button"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Sign In
                  </button>
                </Link>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <button
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.55rem 1.25rem',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #0b2f74 0%, #255eff 55%, #f97316 100%)',
                      border: '1px solid rgba(37, 94, 255, 0.3)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 14px rgba(37, 94, 255, 0.35)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>Get Started</span>
                    <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-only topbar-icon-btn"
              title="Toggle Navigation Menu"
              aria-label="Toggle Mobile Menu"
              style={{ width: '38px', height: '38px', flexShrink: 0, color: '#0f172a' }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className="animate-fade-down"
            style={{
              backgroundColor: '#ffffff',
              borderTop: '1px solid rgba(148, 163, 184, 0.2)',
              padding: '1rem 1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Search command in mobile drawer */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                triggerCmd();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.7rem 0.9rem',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Search size={16} />
              <span>Search Opportunities &amp; Skills (⌘K)</span>
            </button>

            <NavLink
              to="/"
              onClick={closeMobile}
              style={{
                padding: '0.7rem 0.9rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                textDecoration: 'none',
              }}
            >
              Home
            </NavLink>

            {isAuthenticated && (
              <NavLink
                to="/dashboard"
                onClick={closeMobile}
                style={{
                  padding: '0.7rem 0.9rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: '#0f172a',
                  textDecoration: 'none',
                }}
              >
                Dashboard
              </NavLink>
            )}

            <NavLink
              to="/opportunities"
              onClick={closeMobile}
              style={{
                padding: '0.7rem 0.9rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#0f172a',
                textDecoration: 'none',
              }}
            >
              Opportunities
            </NavLink>

            <NavLink
              to="/ai-advisor"
              onClick={closeMobile}
              style={{
                padding: '0.7rem 0.9rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#f97316',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
              }}
            >
              <Sparkles size={16} />
              <span>AI Solutions</span>
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink
                  to="/applications"
                  onClick={closeMobile}
                  style={{
                    padding: '0.7rem 0.9rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    textDecoration: 'none',
                  }}
                >
                  Application Tracker
                </NavLink>
                <NavLink
                  to="/skill-gap"
                  onClick={closeMobile}
                  style={{
                    padding: '0.7rem 0.9rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    textDecoration: 'none',
                  }}
                >
                  Skill Gap Analysis
                </NavLink>
                <NavLink
                  to="/profile"
                  onClick={closeMobile}
                  style={{
                    padding: '0.7rem 0.9rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    textDecoration: 'none',
                  }}
                >
                  Student Profile
                </NavLink>
                <NavLink
                  to="/notifications"
                  onClick={closeMobile}
                  style={{
                    padding: '0.7rem 0.9rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                  }}
                >
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '999px', fontWeight: 800 }}>
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
                <NavLink
                  to="/settings"
                  onClick={closeMobile}
                  style={{
                    padding: '0.7rem 0.9rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    textDecoration: 'none',
                  }}
                >
                  Settings
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.7rem 0.9rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: '#ef4444',
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
                <Link to="/login" onClick={closeMobile} style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" style={{ width: '100%' }}>
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={closeMobile} style={{ textDecoration: 'none' }}>
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #0b2f74 0%, #255eff 55%, #f97316 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Get Started
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Embedded Command Palette (usable from any page) */}
      {cmdOpen && (
        <CommandPalette
          isOpen={cmdOpen}
          setIsOpen={setCmdOpen}
          onClose={() => setCmdOpen(false)}
        />
      )}
    </>
  );
}
