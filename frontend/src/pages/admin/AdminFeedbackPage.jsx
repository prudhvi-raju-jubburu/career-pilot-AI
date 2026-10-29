import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  X,
  FileCheck,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  getAdminFeedbackReports,
  resolveAdminFeedbackReport,
} from '../../services/adminService';

export default function AdminFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Resolution Dialog Modal
  const [resolveModal, setResolveModal] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('Reviewed by administrator');
  const [resolveSubmitting, setResolveSubmitting] = useState(false);

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminFeedbackReports({
        page,
        limit: 15,
        search: search.trim() || undefined,
        reason: reasonFilter !== 'all' ? reasonFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (res?.success) {
        setFeedbackList(res.data.feedback || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.total_pages || 1);
      }
    } catch (err) {
      console.error('Error fetching admin feedback:', err);
      setError(err.message || 'Failed to retrieve feedback reports.');
    } finally {
      setLoading(false);
    }
  }, [page, search, reasonFilter, statusFilter]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const handleExecuteResolution = async (e) => {
    e.preventDefault();
    if (!resolveModal) return;
    setResolveSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await resolveAdminFeedbackReport(
        resolveModal.id,
        resolutionNotes,
        actionTaken
      );
      if (res?.success) {
        setSuccessMsg(`Feedback report for ${resolveModal.company || 'Opportunity'} resolved.`);
        setResolveModal(null);
        setResolutionNotes('');
        loadFeedback();
      }
    } catch (err) {
      setError(err.message || 'Failed to resolve feedback report.');
    } finally {
      setResolveSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="Feedback & Report Moderation"
      subtitle="Review student-submitted relevance signals, mismatch reasons, and recorded listing disputes."
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
            marginBottom: '1rem',
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
            marginBottom: '1rem',
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

      {/* Search and Filters */}
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
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            className="admin-input"
            placeholder="Search by company, reason, or student ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              paddingLeft: '2.25rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={reasonFilter}
            onChange={(e) => {
              setReasonFilter(e.target.value);
              setPage(1);
            }}
            className="admin-input"
            style={{ padding: '0.5rem 0.85rem' }}
          >
            <option value="all">All Feedback Reasons</option>
            <option value="wrong_role">Wrong Role</option>
            <option value="wrong_location">Wrong Location</option>
            <option value="not_eligible">Not Eligible</option>
            <option value="salary_too_low">Salary Too Low</option>
            <option value="already_applied">Already Applied</option>
            <option value="good_match">Good Match</option>
            <option value="other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="admin-input"
            style={{ padding: '0.5rem 0.85rem' }}
          >
            <option value="all">All Statuses</option>
            <option value="unreviewed">Unreviewed</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>
      </div>

      {/* Feedback Table */}
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
                <th style={{ padding: '0.85rem 1rem' }}>Opportunity Reference</th>
                <th style={{ padding: '0.85rem 1rem' }}>Signal Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Rating / Reason</th>
                <th style={{ padding: '0.85rem 1rem' }}>Student ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Timestamp</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading feedback signals...
                  </td>
                </tr>
              ) : feedbackList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No feedback signals match current criteria.
                  </td>
                </tr>
              ) : (
                feedbackList.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.05))',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Opportunity */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.opportunity_title || item.company || 'Opportunity Listing'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Company: {item.company || 'Unknown'}
                      </div>
                    </td>

                    {/* Event Type */}
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8125rem' }}>
                      <code>{item.event_type}</code>
                    </td>

                    {/* Rating & Reason */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {item.rating && (
                          <span
                            style={{
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              backgroundColor: item.rating === 'relevant' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: item.rating === 'relevant' ? '#10b981' : '#ef4444',
                            }}
                          >
                            {item.rating}
                          </span>
                        )}
                        {item.reason && (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            {item.reason.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Student ID */}
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {item.user_id ? item.user_id.slice(-8) : '—'}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          backgroundColor: item.status === 'reviewed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                          color: item.status === 'reviewed' ? '#10b981' : '#f59e0b',
                        }}
                      >
                        {item.status || 'unreviewed'}
                      </span>
                    </td>

                    {/* Created */}
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {item.created_at ? item.created_at.replace('T', ' ').slice(0, 16) : '—'}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setResolveModal(item);
                          setResolutionNotes(item.resolution_notes || '');
                          setActionTaken(item.action_taken || 'Reviewed by administrator');
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        {item.status === 'reviewed' ? 'Re-inspect' : 'Resolve'}
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
            Showing <strong>{feedbackList.length}</strong> of <strong>{total}</strong> reports
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

      {/* Resolve Dialog Modal */}
      {resolveModal && (
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
              maxWidth: '480px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              animation: 'adminScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Moderate Feedback Report
              </h2>
              <button
                onClick={() => setResolveModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Associated Opportunity: <strong style={{ color: '#0f172a' }}>{resolveModal.opportunity_title || resolveModal.company}</strong>
              <br />
              Student Reason: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0f172a' }}>{resolveModal.reason || 'None provided'}</code>
            </p>

            <form onSubmit={handleExecuteResolution}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>
                  Action Taken:
                </label>
                <select
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                >
                  <option value="Reviewed by administrator">Reviewed by administrator</option>
                  <option value="Listing verified as accurate">Listing verified as accurate</option>
                  <option value="Opportunity metadata corrected">Opportunity metadata corrected</option>
                  <option value="Opportunity retired">Opportunity retired</option>
                  <option value="Student feedback noted for ranking weights">Student feedback noted for ranking weights</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>
                  Moderation Resolution Notes:
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Record resolution rationale for audit log..."
                  rows={3}
                  required
                  className="admin-input"
                  style={{
                    width: '100%',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setResolveModal(null)}
                  className="admin-btn admin-btn-secondary"
                  disabled={resolveSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={resolveSubmitting}
                >
                  {resolveSubmitting ? 'Recording...' : 'Resolve & Log Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
