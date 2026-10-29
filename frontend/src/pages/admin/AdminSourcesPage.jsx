import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  History,
  X,
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  getAdminSourcesStatus,
  getAdminSourceHistory,
  triggerAdminSourceSync,
} from '../../services/adminService';

export default function AdminSourcesPage() {
  const [sourcesStatus, setSourcesStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // History Drawer
  const [selectedSource, setSelectedSource] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadSources = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await getAdminSourcesStatus();
      if (res?.success) {
        setSourcesStatus(res.data);
      }
    } catch (err) {
      console.error('Error fetching admin sources:', err);
      setError(err.message || 'Failed to retrieve source connector telemetry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const handleOpenHistory = async (sourceName) => {
    try {
      setSelectedSource(sourceName);
      setHistoryLoading(true);
      const res = await getAdminSourceHistory(sourceName);
      if (res?.success) {
        setHistory(res.data || []);
      }
    } catch (err) {
      setError(`Failed to retrieve history for ${sourceName}: ${err.message}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      setSuccessMsg(null);
      setError(null);
      const res = await triggerAdminSourceSync();
      if (res?.success) {
        setSuccessMsg(
          `Opportunity synchronization completed in ${res.data?.duration_seconds || 0}s. Accepted: ${res.data?.total_accepted || 0}, Duplicates: ${res.data?.total_duplicates || 0}.`
        );
        loadSources();
      }
    } catch (err) {
      setError(err.message || 'Source synchronization failed.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout
      title="Source Health & Ingestion Pipeline"
      subtitle="Monitor real external connectors (ATS Job Boards, Unstop, Devfolio, Remotive) and telemetry runs."
    >
      {/* Alert Messages */}
      {successMsg && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Action Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              backgroundColor:
                sourcesStatus?.system_status === 'healthy'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(245, 158, 11, 0.15)',
              color: sourcesStatus?.system_status === 'healthy' ? '#10b981' : '#f59e0b',
            }}
          >
            System Status: {sourcesStatus?.system_status || 'HEALTHY'}
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {sourcesStatus?.healthy_count ?? 6} of {sourcesStatus?.total_connectors ?? 6} connectors healthy
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={loadSources}
            disabled={refreshing}
            className="admin-btn admin-btn-secondary"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleTriggerSync}
            disabled={syncing || sourcesStatus?.is_syncing}
            className="admin-btn admin-btn-primary"
          >
            <PlayCircle size={15} />
            <span>{syncing || sourcesStatus?.is_syncing ? 'Ingestion In Progress...' : 'Trigger Immediate Sync'}</span>
          </button>
        </div>
      </div>

      {/* Connectors Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            Loading connector health telemetry...
          </div>
        ) : (
          sourcesStatus?.connectors?.map((conn) => {
            const isSuccess = conn.status === 'success';
            const isFailed = conn.status === 'failed';

            return (
              <div
                key={conn.source_name}
                className="admin-card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{conn.display_name}</div>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        backgroundColor: isSuccess ? '#ecfdf5' : isFailed ? '#fef2f2' : '#f1f5f9',
                        color: isSuccess ? '#059669' : isFailed ? '#dc2626' : '#64748b',
                        border: isSuccess ? '1px solid #a7f3d0' : isFailed ? '1px solid #fecaca' : '1px solid #e2e8f0',
                      }}
                    >
                      {conn.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78125rem', color: '#64748b', marginBottom: '1rem' }}>
                    Schedule: {conn.schedule} • Type: <code style={{ backgroundColor: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', color: '#0f172a' }}>{conn.type}</code>
                  </div>

                  {/* Telemetry Metrics */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: '0.4rem',
                      backgroundColor: '#f8fafc',
                      padding: '0.75rem 0.5rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.6875rem', fontWeight: 600 }}>Fetched</div>
                      <div style={{ fontWeight: 700, marginTop: '0.15rem', color: '#0f172a' }}>{conn.items_fetched}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.6875rem', fontWeight: 600 }}>Accepted</div>
                      <div style={{ fontWeight: 700, color: '#059669', marginTop: '0.15rem' }}>{conn.items_accepted}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.6875rem', fontWeight: 600 }}>Updated</div>
                      <div style={{ fontWeight: 700, color: '#2563eb', marginTop: '0.15rem' }}>{conn.items_updated || 0}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.6875rem', fontWeight: 600 }}>Duplicates</div>
                      <div style={{ fontWeight: 700, color: '#d97706', marginTop: '0.15rem' }}>{conn.items_duplicates}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.6875rem', fontWeight: 600 }}>Duration</div>
                      <div style={{ fontWeight: 700, marginTop: '0.15rem', color: '#0f172a' }}>{conn.duration_seconds}s</div>
                    </div>
                  </div>

                  {conn.last_error && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.65rem',
                        borderRadius: '6px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        fontSize: '0.75rem',
                        lineHeight: 1.4,
                      }}
                    >
                      Error: {conn.last_error}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1.25rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid #f1f5f9',
                    fontSize: '0.78125rem',
                    color: '#64748b',
                  }}
                >
                  <div>
                    <div>
                      <span style={{ fontWeight: 600 }}>Last Attempt:</span>{' '}
                      {conn.last_synced_at ? conn.last_synced_at.replace('T', ' ').slice(0, 16) : 'Never'}
                    </div>
                    {conn.last_success_at && conn.last_success_at !== conn.last_synced_at && (
                      <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '0.15rem' }}>
                        Last Success: {conn.last_success_at.replace('T', ' ').slice(0, 16)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenHistory(conn.source_name)}
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                  >
                    <History size={13} style={{ marginRight: '0.3rem' }} /> History
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* History Drawer Modal */}
      {selectedSource && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 1000,
          }}
          onClick={() => setSelectedSource(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#ffffff',
              borderLeft: '1px solid #e2e8f0',
              height: '100%',
              overflowY: 'auto',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              animation: 'adminSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Connector Execution History</h2>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Source: <code>{selectedSource}</code>
                </div>
              </div>
              <button
                onClick={() => setSelectedSource(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {historyLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                Loading historical runs...
              </div>
            ) : history.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                No telemetry run records found for this connector.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {history.map((run, i) => (
                  <div
                    key={run.id || i}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: run.status === 'success' ? '#059669' : '#dc2626',
                          backgroundColor: run.status === 'success' ? '#ecfdf5' : '#fef2f2',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          border: run.status === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                          textTransform: 'uppercase',
                          fontSize: '0.6875rem',
                        }}
                      >
                        {run.status}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {run.started_at ? run.started_at.replace('T', ' ').slice(0, 19) : '—'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.85rem', color: '#475569', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                      <span>Fetched: <strong style={{ color: '#0f172a' }}>{run.fetched || 0}</strong></span>
                      <span>Accepted: <strong style={{ color: '#059669' }}>{run.accepted || 0}</strong></span>
                      <span>Updated: <strong style={{ color: '#2563eb' }}>{run.updated || 0}</strong></span>
                      <span>Duplicates: <strong style={{ color: '#d97706' }}>{run.duplicates || 0}</strong></span>
                      <span>Duration: <strong style={{ color: '#0f172a' }}>{run.duration_seconds || 0}s</strong></span>
                    </div>

                    {run.error && (
                      <div style={{ marginTop: '0.5rem', color: '#dc2626', fontSize: '0.75rem' }}>
                        {run.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
