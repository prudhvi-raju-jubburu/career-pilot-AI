import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  AlertTriangle,
  Lock,
  X,
  FileText,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getAdminAuditLogs } from '../../services/adminService';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // JSON Details Modal
  const [selectedDetails, setSelectedDetails] = useState(null);

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminAuditLogs({
        page,
        limit: 20,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        target_type: targetTypeFilter !== 'all' ? targetTypeFilter : undefined,
      });

      if (res?.success) {
        setLogs(res.data.audit_logs || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.total_pages || 1);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message || 'Failed to retrieve audit trail.');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, targetTypeFilter]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  return (
    <AdminLayout
      title="Administrative Audit Logs"
      subtitle="Immutable, append-only record of all administrative actions, account mutations, and moderation outcomes."
    >
      {/* Immutability Banner */}
      <div
        style={{
          padding: '0.85rem 1.15rem',
          borderRadius: '10px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1e40af',
          fontSize: '0.84375rem',
          lineHeight: 1.5,
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <Lock size={18} color="#2563eb" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#1d4ed8' }}>Append-Only Integrity Guarantee:</strong> Audit log records are cryptographically stored and strictly read-only. No APIs or administrative workflows exist to alter, overwrite, or delete history.
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div
        className="admin-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          padding: '1rem 1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="admin-input"
            style={{ padding: '0.5rem 0.85rem' }}
          >
            <option value="all">All Action Types</option>
            <option value="USER_SUSPENDED">USER_SUSPENDED</option>
            <option value="USER_REACTIVATED">USER_REACTIVATED</option>
            <option value="USER_ROLE_CHANGED">USER_ROLE_CHANGED</option>
            <option value="OPPORTUNITY_APPROVE">OPPORTUNITY_APPROVE</option>
            <option value="OPPORTUNITY_UPDATE_METADATA">OPPORTUNITY_UPDATE_METADATA</option>
            <option value="OPPORTUNITY_RETIRE">OPPORTUNITY_RETIRE</option>
            <option value="OPPORTUNITY_MERGED">OPPORTUNITY_MERGED</option>
            <option value="SOURCES_SYNC_TRIGGERED">SOURCES_SYNC_TRIGGERED</option>
            <option value="FEEDBACK_REPORT_RESOLVED">FEEDBACK_REPORT_RESOLVED</option>
          </select>

          {/* Target Type Filter */}
          <select
            value={targetTypeFilter}
            onChange={(e) => {
              setTargetTypeFilter(e.target.value);
              setPage(1);
            }}
            className="admin-input"
            style={{ padding: '0.5rem 0.85rem' }}
          >
            <option value="all">All Target Resources</option>
            <option value="user">User</option>
            <option value="opportunity">Opportunity</option>
            <option value="source">Source</option>
            <option value="feedback">Feedback</option>
            <option value="system">System</option>
          </select>
        </div>

        <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
          Total logged events: <strong style={{ color: '#0f172a' }}>{total}</strong>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div
        className="admin-card"
        style={{
          overflow: 'hidden',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '0.85rem 1rem' }}>Timestamp</th>
                <th style={{ padding: '0.85rem 1rem' }}>Administrator</th>
                <th style={{ padding: '0.85rem 1rem' }}>Action</th>
                <th style={{ padding: '0.85rem 1rem' }}>Target Resource</th>
                <th style={{ padding: '0.85rem 1rem' }}>IP & Client</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Payload Diff</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No audit records match selected criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.05))',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Timestamp */}
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.78125rem' }}>
                      {log.created_at ? log.created_at.replace('T', ' ').slice(0, 19) : '—'}
                    </td>

                    {/* Admin */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                        {log.admin_email || 'System'}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        ID: {log.admin_id ? log.admin_id.slice(-8) : '—'}
                      </div>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          color: 'var(--primary, #3b82f6)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Target */}
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8125rem' }}>
                      <div>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{log.target_type}</span>
                        {log.target_id && (
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.71875rem', marginLeft: '0.4rem' }}>
                            #{log.target_id.slice(-8)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* IP & UA */}
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      <div>{log.ip_address || '127.0.0.1'}</div>
                      <div style={{ fontSize: '0.6875rem', opacity: 0.8, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.user_agent || 'Browser'}
                      </div>
                    </td>

                    {/* Details View */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedDetails(log)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        <FileText size={13} style={{ marginRight: '0.3rem' }} /> View Context
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            Showing <strong>{logs.length}</strong> of <strong>{total}</strong> audit entries
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* JSON Context Details Modal */}
      {selectedDetails && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              animation: 'adminScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Audit Entry Context</h2>
                <div style={{ fontSize: '0.78125rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Action: <code style={{ backgroundColor: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', color: '#0f172a' }}>{selectedDetails.action}</code> • Target: <strong style={{ color: '#0f172a' }}>{selectedDetails.target_type}</strong>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetails(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                fontFamily: 'monospace',
                fontSize: '0.8125rem',
                maxHeight: '320px',
                overflowY: 'auto',
                color: '#0f172a',
                lineHeight: 1.5,
              }}
            >
              <pre style={{ margin: 0 }}>
                {JSON.stringify(selectedDetails.details || {}, null, 2)}
              </pre>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedDetails(null)}
                className="admin-btn admin-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
