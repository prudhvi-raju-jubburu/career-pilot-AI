import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  X,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  UserPlus,
  ShieldCheck,
  Lock,
  Mail,
  EyeOff,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  getAdminUsers,
  getAdminUserDetails,
  updateAdminUserStatus,
  updateAdminUserRole,
  createAdminUser,
} from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Inspection Drawer
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Action Confirmation Dialogs
  const [actionDialog, setActionDialog] = useState(null); // { type: 'suspend'|'reactivate'|'role', user: {...} }
  const [actionReason, setActionReason] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Add Administrator Modal State
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');
  const [newAdminReason, setNewAdminReason] = useState('');
  const [newAdminShowPassword, setNewAdminShowPassword] = useState(false);
  const [createAdminSubmitting, setCreateAdminSubmitting] = useState(false);
  const [createAdminError, setCreateAdminError] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminUsers({
        page,
        limit: 15,
        search: search.trim() || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (res?.success) {
        setUsers(res.data.users || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.total_pages || 1);
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
      setError(err.message || 'Failed to retrieve users.');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleOpenDetails = async (u) => {
    try {
      setDrawerLoading(true);
      setSelectedUser(null);
      const res = await getAdminUserDetails(u.id);
      if (res?.success) {
        setSelectedUser(res.data);
      }
    } catch (err) {
      setError(`Failed to retrieve user details: ${err.message}`);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionDialog) return;
    const { type, user: target } = actionDialog;
    setActionSubmitting(true);
    setSuccessMsg(null);
    setError(null);

    try {
      if (type === 'suspend') {
        const res = await updateAdminUserStatus(target.id, 'suspended', actionReason);
        if (res?.success) {
          setSuccessMsg(`User ${target.email} has been suspended.`);
        }
      } else if (type === 'reactivate') {
        const res = await updateAdminUserStatus(target.id, 'active', actionReason);
        if (res?.success) {
          setSuccessMsg(`User ${target.email} has been reactivated.`);
        }
      } else if (type === 'role') {
        const res = await updateAdminUserRole(target.id, newRole, actionReason);
        if (res?.success) {
          setSuccessMsg(`User ${target.email} role changed to ${newRole}.`);
        }
      }

      setActionDialog(null);
      setActionReason('');
      loadUsers();
      if (selectedUser && selectedUser.user?.id === target.id) {
        handleOpenDetails(target);
      }
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    setCreateAdminError('');

    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword) {
      setCreateAdminError('Full name, email address, and initial password are required.');
      return;
    }

    if (newAdminPassword.length < 8) {
      setCreateAdminError('Password must be at least 8 characters in length.');
      return;
    }

    if (newAdminPassword !== newAdminConfirmPassword) {
      setCreateAdminError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setCreateAdminSubmitting(true);
      const res = await createAdminUser({
        name: newAdminName.trim(),
        email: newAdminEmail.trim().toLowerCase(),
        password: newAdminPassword,
        reason: newAdminReason.trim() || 'New platform administrator provisioned via Admin Control',
      });

      if (res?.success) {
        setSuccessMsg(`Administrator '${newAdminName}' (${newAdminEmail}) provisioned successfully!`);
        setCreateAdminOpen(false);
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        setNewAdminConfirmPassword('');
        setNewAdminReason('');
        setRoleFilter('admin');
        setPage(1);
        loadUsers();
      }
    } catch (err) {
      console.error('Error creating administrator:', err);
      setCreateAdminError(err.message || 'Failed to create administrator account.');
    } finally {
      setCreateAdminSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="User Management"
      subtitle="Inspect platform accounts, review profile verification, and control access permissions."
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

      {/* Search & Filter Bar */}
      <div
        className="admin-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          padding: '1.15rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--admin-text-muted)',
              }}
            />
            <input
              type="text"
              className="admin-input"
              placeholder="Search by student name or email..."
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
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Role Filter */}
          <select
            className="admin-select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* Add Administrator Button */}
          <button
            type="button"
            onClick={() => {
              setCreateAdminError('');
              setCreateAdminOpen(true);
            }}
            className="admin-btn admin-btn-primary"
            style={{
              whiteSpace: 'nowrap',
            }}
          >
            <UserPlus size={15} />
            <span>Add Administrator</span>
          </button>
        </div>
      </div>

      {/* Users Data Table */}
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
                <th style={{ padding: '0.85rem 1rem' }}>User / Candidate</th>
                <th style={{ padding: '0.85rem 1rem' }}>Email Address</th>
                <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Profile Verification</th>
                <th style={{ padding: '0.85rem 1rem' }}>Joined Date</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No user accounts match current search & filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrentAdmin = currentAdmin?.id === u.id || currentAdmin?.email === u.email;

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.05))',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Name & Avatar */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: u.role === 'admin' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.08)',
                              color: u.role === 'admin' ? 'var(--primary, #3b82f6)' : 'var(--text-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                            }}
                          >
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {u.name || 'Unnamed Candidate'}
                            </div>
                            <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              ID: {u.id?.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                        {u.email}
                      </td>

                      {/* Role Badge */}
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
                            backgroundColor: u.role === 'admin' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.06)',
                            color: u.role === 'admin' ? 'var(--primary, #3b82f6)' : 'var(--text-muted)',
                            border: `1px solid ${u.role === 'admin' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                          }}
                        >
                          {u.role === 'admin' && <Shield size={11} />}
                          {u.role}
                        </span>
                      </td>

                      {/* Status Badge */}
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
                            backgroundColor: u.status === 'suspended' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: u.status === 'suspended' ? '#ef4444' : '#10b981',
                            border: `1px solid ${u.status === 'suspended' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                          }}
                        >
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              backgroundColor: u.status === 'suspended' ? '#ef4444' : '#10b981',
                            }}
                          />
                          {u.status || 'active'}
                        </span>
                      </td>

                      {/* Profile Status */}
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {u.profile_completed ? (
                          <span style={{ color: '#10b981', fontWeight: 600 }}>Verified Profile</span>
                        ) : (
                          <span>Needs Review</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {u.created_at ? u.created_at.split('T')[0] : '—'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={() => handleOpenDetails(u)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            title="Inspect user details"
                          >
                            <Eye size={13} style={{ marginRight: '0.3rem' }} /> Details
                          </button>

                          {/* Suspend / Reactivate */}
                          {u.status === 'suspended' ? (
                            <button
                              onClick={() => {
                                setActionDialog({ type: 'reactivate', user: u });
                                setActionReason('');
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#10b981' }}
                              title="Reactivate account"
                            >
                              <UserCheck size={13} style={{ marginRight: '0.3rem' }} /> Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActionDialog({ type: 'suspend', user: u });
                                setActionReason('');
                              }}
                              disabled={isCurrentAdmin}
                              className="btn btn-secondary"
                              style={{
                                padding: '0.35rem 0.65rem',
                                fontSize: '0.75rem',
                                color: isCurrentAdmin ? 'var(--text-muted)' : '#ef4444',
                                opacity: isCurrentAdmin ? 0.4 : 1,
                                cursor: isCurrentAdmin ? 'not-allowed' : 'pointer',
                              }}
                              title={isCurrentAdmin ? 'Cannot suspend your own account' : 'Suspend account'}
                            >
                              <UserX size={13} style={{ marginRight: '0.3rem' }} /> Suspend
                            </button>
                          )}

                          {/* Role Action */}
                          <button
                            onClick={() => {
                              setActionDialog({ type: 'role', user: u });
                              setNewRole(u.role === 'admin' ? 'student' : 'admin');
                              setActionReason('');
                            }}
                            disabled={isCurrentAdmin}
                            className="btn btn-secondary"
                            style={{
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              opacity: isCurrentAdmin ? 0.4 : 1,
                              cursor: isCurrentAdmin ? 'not-allowed' : 'pointer',
                            }}
                            title={isCurrentAdmin ? 'Cannot change your own role' : 'Change account role'}
                          >
                            Role
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
            Showing <strong>{users.length}</strong> of <strong>{total}</strong> users
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

      {/* Details Drawer Modal */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 1000,
          }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'var(--bg-card, #131924)',
              borderLeft: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              height: '100%',
              overflowY: 'auto',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Candidate Profile Overview</h2>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Basic Info */}
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedUser.user.name}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{selectedUser.user.email}</div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(59,130,246,0.15)', color: 'var(--primary)' }}>
                  ROLE: {selectedUser.user.role}
                </span>
                <span style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: selectedUser.user.status === 'suspended' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: selectedUser.user.status === 'suspended' ? '#ef4444' : '#10b981' }}>
                  STATUS: {selectedUser.user.status}
                </span>
              </div>
            </div>

            {/* Profile Summary */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Profile Summary
              </h3>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                <div><strong>Target Role:</strong> {selectedUser.profile_summary?.target_role || 'Not declared'}</div>
                <div><strong>Verification:</strong> {selectedUser.profile_summary?.verification_status}</div>
                <div><strong>Extracted Skills:</strong> {selectedUser.profile_summary?.skills_count || 0} skills on file</div>
                <div><strong>Saved Opportunities:</strong> {selectedUser.profile_summary?.saved_opportunities_count || 0} bookmarks</div>
              </div>
            </div>

            {/* Activity Summary */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Career Tracking Activity
              </h3>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                <div><strong>Total Tracked Applications:</strong> {selectedUser.activity_summary?.total_applications || 0}</div>
                <div><strong>Feedback Signals Recorded:</strong> {selectedUser.activity_summary?.feedback_events || 0}</div>
              </div>
            </div>

            {/* Recent Application History */}
            {selectedUser.activity_summary?.recent_activity?.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Recent Applications
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedUser.activity_summary.recent_activity.map((act) => (
                    <div
                      key={act.id}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{act.company} — {act.role}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.71875rem', marginTop: '0.2rem' }}>
                        Status: <span style={{ color: 'var(--primary)' }}>{act.status}</span> • Updated: {act.updated_at ? act.updated_at.split('T')[0] : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {actionDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--bg-card, #131924)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: actionDialog.type === 'suspend' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                  color: actionDialog.type === 'suspend' ? '#ef4444' : 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                {actionDialog.type === 'suspend'
                  ? 'Confirm Account Suspension'
                  : actionDialog.type === 'reactivate'
                  ? 'Confirm Account Reactivation'
                  : 'Confirm Role Mutation'}
              </h2>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
              Target user: <strong>{actionDialog.user.email}</strong>
              <br />
              {actionDialog.type === 'suspend'
                ? 'This user will be immediately blocked from logging in or making API requests.'
                : actionDialog.type === 'reactivate'
                ? 'This user will have full access restored to student services.'
                : `Update role to '${newRole}'.`}
            </p>

            {actionDialog.type === 'role' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Target Role:
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="student">Student</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Reason for Audit Trail (Required):
              </label>
              <textarea
                placeholder="State reason for compliance / audit records..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setActionDialog(null)}
                className="btn btn-secondary"
                disabled={actionSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionSubmitting || !actionReason.trim()}
                className={actionDialog.type === 'suspend' ? 'btn btn-danger' : 'btn btn-primary'}
                style={{
                  backgroundColor: actionDialog.type === 'suspend' ? '#ef4444' : undefined,
                  borderColor: actionDialog.type === 'suspend' ? '#ef4444' : undefined,
                }}
              >
                {actionSubmitting ? 'Recording...' : 'Confirm & Log Audit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Administrator Modal */}
      {createAdminOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--bg-card, #131924)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
              borderRadius: '14px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#f1f5f9' }}>
                    Add Platform Administrator
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                    Grant full administrative authority to a new operator
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCreateAdminOpen(false)}
                disabled={createAdminSubmitting}
                style={{
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
                <X size={18} />
              </button>
            </div>

            {createAdminError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '0.8125rem',
                  lineHeight: 1.4,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{createAdminError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Full Name */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#cbd5e1' }}>
                  Administrator Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Elena Rostova"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  required
                  disabled={createAdminSubmitting}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              {/* Email Address */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#cbd5e1' }}>
                  Work / System Email *
                </label>
                <input
                  type="email"
                  placeholder="e.g. elena@careerpilot.ai"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                  disabled={createAdminSubmitting}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              {/* Passwords */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#cbd5e1' }}>
                    Password *
                  </label>
                  <input
                    type={newAdminShowPassword ? 'text' : 'password'}
                    placeholder="Min 8 chars"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={createAdminSubmitting}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#cbd5e1' }}>
                    Confirm Password *
                  </label>
                  <input
                    type={newAdminShowPassword ? 'text' : 'password'}
                    placeholder="Re-enter"
                    value={newAdminConfirmPassword}
                    onChange={(e) => setNewAdminConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={createAdminSubmitting}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              {/* Show Password Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  id="toggle-admin-pw"
                  type="checkbox"
                  checked={newAdminShowPassword}
                  onChange={(e) => setNewAdminShowPassword(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="toggle-admin-pw" style={{ fontSize: '0.78rem', color: '#94a3b8', cursor: 'pointer' }}>
                  Show password characters
                </label>
              </div>

              {/* Clearance Note / Reason */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#cbd5e1' }}>
                  Department / Clearance Note (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Platform Operations Lead, Tier-2 Support"
                  value={newAdminReason}
                  onChange={(e) => setNewAdminReason(e.target.value)}
                  disabled={createAdminSubmitting}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    color: '#ffffff',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>

              {/* Audit Warning */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#64748b',
                  fontSize: '0.75rem',
                  paddingTop: '0.25rem',
                }}
              >
                <Shield size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <span>Action will be recorded permanently in the platform audit log.</span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCreateAdminOpen(false)}
                  className="btn btn-secondary"
                  disabled={createAdminSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAdminSubmitting}
                  className="btn btn-primary"
                  style={{
                    backgroundColor: '#2563eb',
                    backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    border: 'none',
                    fontWeight: 600,
                  }}
                >
                  {createAdminSubmitting ? 'Provisioning...' : 'Authorize & Provision Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
