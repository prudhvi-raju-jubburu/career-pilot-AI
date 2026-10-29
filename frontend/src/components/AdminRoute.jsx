import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="status-dot connected" style={{ display: 'inline-block', width: '12px', height: '12px', marginBottom: '0.75rem' }} />
          <p>Verifying administrative credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-primary)',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            color: 'var(--danger, #ef4444)',
          }}
        >
          <ShieldAlert size={38} />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Administrative Access Denied
        </h1>

        <p
          style={{
            maxWidth: '480px',
            color: 'var(--text-muted)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          Your account (<strong>{user?.email}</strong>) is registered with the role <code>{user?.role || 'student'}</code> and does not have administrative privileges to access this workspace.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            to="/dashboard"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
          >
            <ArrowLeft size={16} /> Return to Student App
          </Link>
          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <LogOut size={16} /> Sign In as Administrator
          </button>
        </div>
      </div>
    );
  }

  return children;
}
