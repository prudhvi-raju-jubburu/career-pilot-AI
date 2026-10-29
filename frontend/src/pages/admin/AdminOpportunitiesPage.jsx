import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Edit3,
  Archive,
  GitMerge,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  getAdminOpportunities,
  getAdminOpportunityDetails,
  moderateOpportunity,
  mergeAdminOpportunities,
} from '../../services/adminService';

export default function AdminOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewFilter, setReviewFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Inspection Drawer
  const [inspectOpp, setInspectOpp] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Edit Metadata Modal
  const [editModalOpp, setEditModalOpp] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Merge Duplicates Modal
  const [mergeModal, setMergeModal] = useState(null); // { canonicalId, duplicateId, canonicalTitle, duplicateTitle }
  const [mergeReason, setMergeReason] = useState('Duplicate listing confirmed across ATS and Unstop');
  const [mergeSubmitting, setMergeSubmitting] = useState(false);

  const loadOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminOpportunities({
        page,
        limit: 15,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        filter_type: reviewFilter !== 'all' ? reviewFilter : undefined,
      });

      if (res?.success) {
        setOpportunities(res.data.opportunities || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.total_pages || 1);
      }
    } catch (err) {
      console.error('Error fetching admin opportunities:', err);
      setError(err.message || 'Failed to retrieve opportunities.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, reviewFilter]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const handleOpenInspect = async (id) => {
    try {
      setInspectLoading(true);
      setInspectOpp(null);
      const res = await getAdminOpportunityDetails(id);
      if (res?.success) {
        setInspectOpp(res.data);
      }
    } catch (err) {
      setError(`Failed to retrieve opportunity details: ${err.message}`);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleModerateAction = async (oppId, action, payload = {}) => {
    try {
      setError(null);
      setSuccessMsg(null);
      const res = await moderateOpportunity(oppId, action, payload);
      if (res?.success) {
        setSuccessMsg(`Opportunity updated with action '${action}'.`);
        loadOpportunities();
        if (inspectOpp && inspectOpp.id === oppId) {
          handleOpenInspect(oppId);
        }
      }
    } catch (err) {
      setError(err.message || 'Moderation action failed.');
    }
  };

  const handleSaveMetadata = async (e) => {
    e.preventDefault();
    if (!editModalOpp) return;
    setEditSubmitting(true);
    try {
      await handleModerateAction(editModalOpp.id, 'update_metadata', editFormData);
      setEditModalOpp(null);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleExecuteMerge = async () => {
    if (!mergeModal) return;
    setMergeSubmitting(true);
    try {
      const res = await mergeAdminOpportunities(
        mergeModal.canonicalId,
        mergeModal.duplicateId,
        mergeReason
      );
      if (res?.success) {
        setSuccessMsg(
          `Merged duplicate successfully: ${res.data.repointed_applications} applications repointed, ${res.data.repointed_bookmarks} bookmarks updated.`
        );
        setMergeModal(null);
        loadOpportunities();
        if (inspectOpp) {
          handleOpenInspect(mergeModal.canonicalId);
        }
      }
    } catch (err) {
      setError(err.message || 'Duplicate merge failed.');
    } finally {
      setMergeSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="Opportunity Moderation & Verification"
      subtitle="Verify India eligibility, resolve duplicate candidates, and maintain high-fidelity listings."
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

      {/* Review Filter Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
        }}
      >
        {[
          { id: 'all', label: 'All Opportunities' },
          { id: 'pending_review', label: 'Pending Review' },
          { id: 'duplicate_candidates', label: 'Duplicate Candidates' },
          { id: 'flagged', label: 'Scam / Flagged' },
          { id: 'missing_location', label: 'Missing Location' },
          { id: 'india_ineligible', label: 'India Ineligible' },
          { id: 'missing_url', label: 'Invalid URL' },
          { id: 'expired_deadline', label: 'Expired Deadline' },
        ].map((tab) => {
          const isActive = reviewFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setReviewFilter(tab.id);
                setPage(1);
              }}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: isActive ? '1px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: isActive ? '#2563eb' : '#ffffff',
                color: isActive ? '#ffffff' : '#64748b',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Status Filters */}
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
        <div style={{ position: 'relative', flex: '1 1 320px' }}>
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
            placeholder="Search by role title, company, or skills..."
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="admin-input"
            style={{
              padding: '0.5rem 0.85rem',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="scam_flagged">Scam Flagged</option>
            <option value="retired">Retired / Merged</option>
          </select>
        </div>
      </div>

      {/* Opportunities Table */}
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
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  color: '#475569',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                }}
              >
                <th style={{ padding: '0.85rem 1rem' }}>Opportunity / Company</th>
                <th style={{ padding: '0.85rem 1rem' }}>Category & Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Location</th>
                <th style={{ padding: '0.85rem 1rem' }}>Deadline</th>
                <th style={{ padding: '0.85rem 1rem' }}>Moderation State</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading opportunities...
                  </td>
                </tr>
              ) : opportunities.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No opportunities match current review criteria.
                  </td>
                </tr>
              ) : (
                opportunities.map((opp) => (
                  <tr
                    key={opp.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.05))',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Role & Company */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{opp.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {opp.company || 'Unknown Company'}
                      </div>
                    </td>

                    {/* Category & Type */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ textTransform: 'capitalize' }}>{opp.category?.replace('_', ' ') || 'General'}</div>
                      <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {opp.type || 'Internship'} • {opp.workMode || 'Onsite'}
                      </div>
                    </td>

                    {/* Location */}
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {opp.locationString || 'India'}
                    </td>

                    {/* Deadline */}
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {opp.deadlineString || 'Not specified'}
                    </td>

                    {/* Moderation Status */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          backgroundColor:
                            opp.moderation_status === 'approved'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : opp.moderation_status === 'pending_review'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(255,255,255,0.06)',
                          color:
                            opp.moderation_status === 'approved'
                              ? '#10b981'
                              : opp.moderation_status === 'pending_review'
                              ? '#f59e0b'
                              : 'var(--text-muted)',
                        }}
                      >
                        {opp.moderation_status || 'standard'}
                      </span>
                    </td>

                    {/* Record Status */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          backgroundColor:
                            opp.status === 'active'
                              ? 'rgba(16, 185, 129, 0.12)'
                              : opp.status === 'retired'
                              ? 'rgba(148, 163, 184, 0.15)'
                              : 'rgba(239, 68, 68, 0.12)',
                          color:
                            opp.status === 'active'
                              ? '#10b981'
                              : opp.status === 'retired'
                              ? '#94a3b8'
                              : '#ef4444',
                        }}
                      >
                        {opp.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          onClick={() => handleOpenInspect(opp.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          title="Inspect opportunity details"
                        >
                          <Eye size={13} style={{ marginRight: '0.25rem' }} /> Inspect
                        </button>

                        {opp.status !== 'active' && (
                          <button
                            onClick={() => handleModerateAction(opp.id, 'approve', { notes: 'Approved by admin' })}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#10b981' }}
                            title="Approve opportunity"
                          >
                            Approve
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditModalOpp(opp);
                            setEditFormData({
                              title: opp.title,
                              company: opp.company,
                              category: opp.category,
                              work_mode: opp.workMode,
                              application_url: opp.applicationUrl || '',
                              deadline: opp.deadline || '',
                            });
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          title="Edit metadata"
                        >
                          <Edit3 size={13} />
                        </button>

                        {opp.status === 'active' && (
                          <button
                            onClick={() => handleModerateAction(opp.id, 'retire', { notes: 'Retired by administrator' })}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#ef4444' }}
                            title="Retire opportunity without deleting applications"
                          >
                            <Archive size={13} />
                          </button>
                        )}
                      </div>
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
            Showing <strong>{opportunities.length}</strong> of <strong>{total}</strong> listings
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

      {/* Inspect Opportunity Drawer Modal */}
      {inspectOpp && (
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
          onClick={() => setInspectOpp(null)}
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
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Opportunity Inspection</h2>
              <button
                onClick={() => setInspectOpp(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Core Card */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{inspectOpp.title}</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.2rem' }}>
                {inspectOpp.company} • {inspectOpp.workMode}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                Location: {inspectOpp.locationString}
              </div>

              {inspectOpp.applicationUrl && (
                <div style={{ marginTop: '0.75rem' }}>
                  <a
                    href={inspectOpp.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: '#2563eb',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Inspect External Application URL</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>

            {/* Platform Telemetry References */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
                Platform References
              </h3>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.8, color: '#334155' }}>
                <div><strong style={{ color: '#0f172a' }}>Tracked Applications:</strong> {inspectOpp.tracked_applications_count || 0} students applied</div>
                <div><strong style={{ color: '#0f172a' }}>Saved Bookmarks:</strong> {inspectOpp.saved_bookmarks_count || 0} students saved</div>
                <div><strong style={{ color: '#0f172a' }}>Moderation Status:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{inspectOpp.moderation_status}</span></div>
                {inspectOpp.moderated_at && <div><strong style={{ color: '#0f172a' }}>Last Moderated:</strong> {inspectOpp.moderated_at.split('T')[0]}</div>}
                {inspectOpp.moderation_notes && <div><strong style={{ color: '#0f172a' }}>Moderator Notes:</strong> {inspectOpp.moderation_notes}</div>}
              </div>
            </div>

            {/* Potential Duplicate Candidates */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
                Duplicate Candidates ({inspectOpp.potential_duplicates?.length || 0})
              </h3>
              {inspectOpp.potential_duplicates?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {inspectOpp.potential_duplicates.map((dup) => (
                    <div
                      key={dup.id}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '8px',
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700, color: '#b45309' }}>
                          Similarity: {Math.round(dup.similarity * 100)}%
                        </div>
                        <button
                          onClick={() => {
                            setMergeModal({
                              canonicalId: inspectOpp.id,
                              duplicateId: dup.id,
                              canonicalTitle: inspectOpp.title,
                              duplicateTitle: dup.title,
                            });
                          }}
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', color: '#059669', borderColor: '#a7f3d0' }}
                        >
                          <GitMerge size={12} style={{ marginRight: '0.25rem' }} /> Merge as Duplicate
                        </button>
                      </div>
                      <div style={{ fontWeight: 600, marginTop: '0.35rem', color: '#0f172a' }}>{dup.title}</div>
                      <div style={{ color: '#64748b', fontSize: '0.71875rem' }}>
                        ID: {dup.id} • Status: {dup.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  Zero confident duplicate candidates detected in database.
                </div>
              )}
            </div>

            {/* Moderation Actions in Drawer */}
            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleModerateAction(inspectOpp.id, 'approve', { notes: 'Approved via inspection drawer' })}
                className="admin-btn admin-btn-primary"
                style={{ flex: 1 }}
              >
                Approve Listing
              </button>
              <button
                onClick={() => handleModerateAction(inspectOpp.id, 'retire', { notes: 'Retired via inspection drawer' })}
                className="admin-btn"
                style={{ backgroundColor: '#ef4444', color: '#ffffff', border: '1px solid #dc2626' }}
              >
                Retire Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editModalOpp && (
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
              maxWidth: '520px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              animation: 'adminScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a' }}>
              Edit Opportunity Metadata
            </h2>

            <form onSubmit={handleSaveMetadata}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>
                  Opportunity Title:
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>
                  Company / Organization Name:
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={editFormData.company || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>
                  Application URL (HTTP/HTTPS):
                </label>
                <input
                  type="url"
                  className="admin-input"
                  value={editFormData.application_url || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, application_url: e.target.value })}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>
                    Work Mode:
                  </label>
                  <select
                    className="admin-input"
                    value={editFormData.work_mode || 'Onsite'}
                    onChange={(e) => setEditFormData({ ...editFormData, work_mode: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="Onsite">Onsite</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>
                    Deadline (YYYY-MM-DD):
                  </label>
                  <input
                    type="date"
                    className="admin-input"
                    value={editFormData.deadline || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setEditModalOpp(null)}
                  className="admin-btn admin-btn-secondary"
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={editSubmitting}>
                  {editSubmitting ? 'Saving...' : 'Save & Log Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Duplicate Confirmation Modal */}
      {mergeModal && (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <GitMerge size={22} color="#059669" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Confirm Duplicate Merge
              </h2>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1rem' }}>
              You are about to merge duplicate record <strong>"{mergeModal.duplicateTitle}"</strong> into canonical record <strong>"{mergeModal.canonicalTitle}"</strong>.
            </p>

            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '0.85rem',
                fontSize: '0.8125rem',
                color: '#1e40af',
                marginBottom: '1rem',
                lineHeight: 1.6,
              }}
            >
              ✓ All student applications pointing to duplicate will be repointed to canonical.<br />
              ✓ All saved bookmarks will be updated to point to canonical.<br />
              ✓ Duplicate listing will be archived with <code>status: retired</code> and a reverse reference.
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>
                Reason for Audit Trail:
              </label>
              <textarea
                value={mergeReason}
                onChange={(e) => setMergeReason(e.target.value)}
                rows={2}
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
                onClick={() => setMergeModal(null)}
                className="admin-btn admin-btn-secondary"
                disabled={mergeSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteMerge}
                className="admin-btn admin-btn-primary"
                disabled={mergeSubmitting}
              >
                {mergeSubmitting ? 'Merging...' : 'Execute Merge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
