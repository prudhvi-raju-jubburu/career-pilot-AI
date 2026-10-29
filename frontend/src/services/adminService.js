import api from './api';

/**
 * CareerPilot AI Administrative API Service
 * Backed by real MongoDB queries, aggregations, and server-side RBAC.
 */

// Overview & Telemetry
export const getAdminOverview = async (periodDays = 30) => {
  return await api.get('/api/admin/overview', { params: { period: periodDays } });
};

export const getAdminCharts = async (periodDays = 30) => {
  return await api.get('/api/admin/charts', { params: { period: periodDays } });
};

// User Management
export const getAdminUsers = async (params = {}) => {
  return await api.get('/api/admin/users', { params });
};

export const getAdminUserDetails = async (userId) => {
  return await api.get(`/api/admin/users/${userId}`);
};

export const updateAdminUserStatus = async (userId, status, reason = '') => {
  return await api.patch(`/api/admin/users/${userId}/status`, { status, reason });
};

export const updateAdminUserRole = async (userId, role, reason = '') => {
  return await api.patch(`/api/admin/users/${userId}/role`, { role, reason });
};

export const createAdminUser = async (data) => {
  return await api.post('/api/admin/users/create-admin', data);
};

// Opportunity Moderation & Duplicate Merge
export const getAdminOpportunities = async (params = {}) => {
  return await api.get('/api/admin/opportunities', { params });
};

export const getAdminOpportunityDetails = async (oppId) => {
  return await api.get(`/api/admin/opportunities/${oppId}`);
};

export const moderateOpportunity = async (oppId, action, payload = {}) => {
  return await api.patch(`/api/admin/opportunities/${oppId}/moderate`, { action, payload });
};

export const mergeAdminOpportunities = async (canonicalId, duplicateId, reason = '') => {
  return await api.post('/api/admin/opportunities/merge', {
    canonical_id: canonicalId,
    duplicate_id: duplicateId,
    reason,
  });
};

// Source Health & Ingestion
export const getAdminSourcesStatus = async () => {
  return await api.get('/api/admin/sources');
};

export const getAdminSourceHistory = async (sourceName) => {
  return await api.get(`/api/admin/sources/${sourceName}/history`);
};

export const triggerAdminSourceSync = async () => {
  return await api.post('/api/admin/sources/sync');
};

// Platform Analytics & Feedback
export const getAdminAnalytics = async (periodDays = 30) => {
  return await api.get('/api/admin/analytics', { params: { period: periodDays } });
};

export const getAdminFeedbackReports = async (params = {}) => {
  return await api.get('/api/admin/feedback', { params });
};

export const resolveAdminFeedbackReport = async (feedbackId, resolutionNotes = '', actionTaken = '') => {
  return await api.patch(`/api/admin/feedback/${feedbackId}/resolve`, {
    resolution_notes: resolutionNotes,
    action_taken: actionTaken,
  });
};

// Audit Logs & Settings
export const getAdminAuditLogs = async (params = {}) => {
  return await api.get('/api/admin/audit-logs', { params });
};

export const getAdminSettings = async () => {
  return await api.get('/api/admin/settings');
};
