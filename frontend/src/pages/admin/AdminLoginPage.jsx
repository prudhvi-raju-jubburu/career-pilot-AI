import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

export default function AdminLoginPage() {
  const { user, login, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in as admin, redirect directly to admin overview
  if (!authLoading && isAuthenticated && user?.role === 'admin') {
    const destination = location.state?.from?.pathname || '/admin/overview';
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const authUser = await login(email.trim(), password);

      // Verify that this user actually holds the admin role
      if (authUser?.role !== 'admin') {
        logout();
        setErrorMessage(
          `Access Denied: Account '${authUser?.email || email}' does not possess administrative clearance. Please sign in via the Student Flight Deck.`
        );
        toast.error('Administrative access denied for student credentials.');
        setLoading(false);
        return;
      }

      toast.success(`Welcome back, ${authUser.name || 'Administrator'}!`, 'Admin Access Granted');
      const destination = location.state?.from?.pathname || '/admin/overview';
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Admin authentication error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please verify your administrator credentials.');
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 1.5rem',
        backgroundColor: '#f8fafc',
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37, 99, 235, 0.08), transparent 70%),
          radial-gradient(circle at 15% 90%, rgba(99, 102, 241, 0.05), transparent 45%),
          #f8fafc
        `,
        color: '#0f172a',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Grid Lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(15, 23, 42, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.03) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          pointerEvents: 'none',
          opacity: 0.8,
        }}
      />

      {/* Main Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          zIndex: 1,
          animation: 'adminScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top Header Badge */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.9rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              color: '#2563eb',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)',
            }}
          >
            <Shield size={14} />
            Platform Control & Operations
          </div>

          <h1
            style={{
              fontSize: '1.875rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: '0 0 0.5rem 0',
              color: '#0f172a',
            }}
          >
            Administrator Portal
          </h1>
          <p
            style={{
              color: '#64748b',
              fontSize: '0.9rem',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Secure flight control for platform operations, system telemetry, and user governance.
          </p>
        </div>

        {/* Login White Elevation Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2.25rem',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.05)',
          }}
        >
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '0.84rem',
                lineHeight: 1.5,
                marginBottom: '1.5rem',
              }}
              role="alert"
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Email Field */}
            <div>
              <label
                htmlFor="admin-email"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.5rem',
                }}
              >
                Administrator Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@careerpilot.ai"
                  required
                  autoComplete="username"
                  disabled={loading}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <label
                  htmlFor="admin-password"
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#334155',
                  }}
                >
                  Password
                </label>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Role-Restricted</span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.75rem 2.75rem 0.75rem 2.5rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.85rem 1.25rem',
                marginTop: '0.5rem',
                backgroundColor: '#2563eb',
                backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.45)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.35)';
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#ffffff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>Authenticating Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Authenticate as Administrator</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: '#64748b',
              fontSize: '0.75rem',
            }}
          >
            <ShieldCheck size={16} style={{ color: '#059669', flexShrink: 0 }} />
            <span>Encrypted Session • Server-Side Role Enforcement • Monitored Access</span>
          </div>
        </div>

        {/* Footer Navigation Back to Student Flight Deck */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#64748b',
              fontSize: '0.84375rem',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            <ArrowLeft size={15} />
            Looking for the Student Portal? Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
