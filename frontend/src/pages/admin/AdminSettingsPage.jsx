import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Shield,
  Activity,
  Server,
  Key,
  Database,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getAdminSettings } from '../../services/adminService';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadSettings = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await getAdminSettings();
      if (res?.success) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error('Error fetching admin settings:', err);
      setError(err.message || 'Failed to retrieve system settings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <AdminLayout
      title="System Settings & Operational Topology"
      subtitle="Inspect deployment configuration, background job schedulers, and connector capabilities."
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
        <button
          onClick={loadSettings}
          disabled={refreshing}
          className="admin-btn admin-btn-secondary"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh Parameters</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Settings Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Environment & Runtime Card */}
        <div
          className="admin-card"
          style={{
            padding: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <Server size={20} color="#2563eb" />
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Runtime & Deployment</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.6rem' }}>
              <span style={{ color: '#64748b' }}>Flask Environment</span>
              <span style={{ fontWeight: 600, textTransform: 'uppercase', color: '#0f172a' }}>{settings?.environment || 'production'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.6rem' }}>
              <span style={{ color: '#64748b' }}>Background Scheduler</span>
              <span style={{ fontWeight: 600, color: settings?.background_scheduler_enabled ? '#059669' : '#d97706' }}>
                {settings?.background_scheduler_enabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.6rem' }}>
              <span style={{ color: '#64748b' }}>Scheduler Thread Status</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{settings?.scheduler_active ? 'Active (Running)' : 'Idle / Testing Mode'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.6rem' }}>
              <span style={{ color: '#64748b' }}>Ingestion Interval</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Every {settings?.ingestion_interval_hours || 6} hours</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Startup Seeding</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{settings?.seed_on_startup ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>

        {/* Security & Access Policies Card */}
        <div
          className="admin-card"
          style={{
            padding: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <Lock size={20} color="#059669" />
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Security Controls & RBAC</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.6rem' }}>
              <span style={{ color: '#64748b' }}>Role Enforcement</span>
              <span style={{ fontWeight: 600, color: '#059669' }}>Server-Side MongoDB Verified</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.6rem' }}>
              <span style={{ color: '#64748b' }}>JWT Signing Algorithm</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{settings?.security?.jwt_algorithm || 'HS256'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.6rem' }}>
              <span style={{ color: '#64748b' }}>Token Expiration</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{settings?.security?.jwt_expiration_hours || 24} hours</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.6rem' }}>
              <span style={{ color: '#64748b' }}>Audit Log Integrity</span>
              <span style={{ fontWeight: 600, color: '#059669' }}>Append-Only (No Delete/Edit)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Client Role Trust</span>
              <span style={{ fontWeight: 600, color: '#059669' }}>Untrusted (Header/Body Ignored)</span>
            </div>
          </div>
        </div>

        {/* Registered Connectors Card */}
        <div
          className="admin-card"
          style={{
            padding: '1.75rem',
            gridColumn: '1 / -1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <Radio size={20} color="#7c3aed" />
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Registered Ingestion Connectors</h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1rem',
            }}
          >
            {settings?.supported_connectors?.map((conn) => (
              <div
                key={conn.name}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1.15rem',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.925rem', marginBottom: '0.35rem', color: '#0f172a' }}>
                  {conn.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.65rem' }}>
                  Connector Type: <code style={{ backgroundColor: '#e2e8f0', padding: '1px 5px', borderRadius: '4px', color: '#0f172a' }}>{conn.type}</code>
                </div>
                <span
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '9999px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                  }}
                >
                  {conn.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
