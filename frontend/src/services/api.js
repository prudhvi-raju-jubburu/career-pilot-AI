import axios from 'axios';

// Base URL configured from environment variable or defaulting to localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for attaching JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent response data handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };
    return Promise.reject(customError);
  }
);

// Health check service
export const checkHealth = async () => {
  return await api.get('/api/health');
};

// Authentication services
export const registerUser = async (userData) => {
  return await api.post('/api/auth/register', userData);
};

export const loginUser = async (credentials) => {
  return await api.post('/api/auth/login', credentials);
};

export const getCurrentUser = async () => {
  return await api.get('/api/auth/me');
};

export const refreshToken = async () => {
  return await api.post('/api/auth/refresh');
};

export const logoutUser = async () => {
  return await api.post('/api/auth/logout');
};

// Resume Services
export const uploadResume = async (formData) => {
  return await api.post('/api/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const analyzeResume = async () => {
  return await api.post('/api/resume/analyze', {}, { timeout: 60000 });
};

export const getResumeInfo = async () => {
  return await api.get('/api/resume');
};

// Profile Services
export const getProfile = async () => {
  return await api.get('/api/profile');
};

export const updateProfile = async (profileData) => {
  return await api.put('/api/profile', profileData);
};

export const verifyProfile = async () => {
  return await api.post('/api/profile/verify');
};

export const getProfileCompletion = async () => {
  return await api.get('/api/profile/completion');
};

// Skill Gap & Learning Roadmap Services
export const getSkillGap = async (targetRole) => {
  const url = targetRole ? `/api/skill-gap?targetRole=${encodeURIComponent(targetRole)}` : '/api/skill-gap';
  return await api.get(url);
};

export const analyzeSkillGap = async (payload) => {
  return await api.post('/api/skill-gap/analyze', payload);
};

export const getSkillRoadmap = async (targetRole) => {
  const url = targetRole ? `/api/skill-gap/roadmap?targetRole=${encodeURIComponent(targetRole)}` : '/api/skill-gap/roadmap';
  return await api.get(url);
};

export const getSupportedRoles = async () => {
  return await api.get('/api/skill-gap/roles');
};

export const getLearningResources = async (skill) => {
  const url = skill ? `/api/skill-gap/resources/${encodeURIComponent(skill)}` : '/api/skill-gap/resources';
  return await api.get(url);
};

export const getLearningProgress = async () => {
  return await api.get('/api/skill-gap/progress');
};

export const updateLearningProgress = async (skill, progressData) => {
  return await api.put(`/api/skill-gap/progress/${encodeURIComponent(skill)}`, progressData);
};

// Opportunity Discovery Services
export const getOpportunities = async (params = {}) => {
  return await api.get('/api/opportunities', { params });
};

export const getOpportunityById = async (id) => {
  return await api.get(`/api/opportunities/${id}`);
};

export const getOpportunityCategories = async () => {
  return await api.get('/api/opportunities/categories');
};

export const getOpportunityFilters = async () => {
  return await api.get('/api/opportunities/filters');
};

export const saveOpportunity = async (oppId) => {
  return await api.post(`/api/opportunities/${oppId}/save`);
};

export const unsaveOpportunity = async (oppId) => {
  return await api.post(`/api/opportunities/${oppId}/unsave`);
};

export const getSavedOpportunities = async () => {
  return await api.get('/api/opportunities/saved');
};

export const getOpportunityEligibility = async (oppId) => {
  return await api.get(`/api/opportunities/${oppId}/eligibility`);
};

export const getOpportunityMatch = async (oppId) => {
  return await api.get(`/api/opportunities/${oppId}/match`);
};

// Applications Services (Real MongoDB CRUD)
export const getApplications = async (params = {}) => {
  return await api.get('/api/applications', { params });
};

export const createApplication = async (appData) => {
  return await api.post('/api/applications', appData);
};

export const getApplicationById = async (id) => {
  return await api.get(`/api/applications/${id}`);
};

export const updateApplication = async (id, appData) => {
  return await api.put(`/api/applications/${id}`, appData);
};

export const updateApplicationStage = async (id, status, note = null) => {
  return await api.patch(`/api/applications/${id}/stage`, { status, note });
};

export const deleteApplication = async (id) => {
  return await api.delete(`/api/applications/${id}`);
};

// Dashboard Services (Real Computed Telemetry)
export const getDashboardStats = async () => {
  return await api.get('/api/dashboard/stats');
};

// Notifications & Daily Digest Services
export const getNotifications = async () => {
  return await api.get('/api/notifications');
};

export const markNotificationRead = async (id) => {
  return await api.patch(`/api/notifications/${id}/read`);
};

export const markAllNotificationsRead = async () => {
  return await api.post('/api/notifications/read-all');
};

export const getDailyDigest = async () => {
  return await api.get('/api/notifications/digest');
};

// AI Career Advisor Services
export const getAdvisorHistory = async () => {
  return await api.get('/api/advisor/history');
};

export const sendAdvisorMessage = async (message) => {
  return await api.post('/api/advisor/chat', { message });
};

export const clearAdvisorHistory = async () => {
  return await api.delete('/api/advisor/history');
};

// Data Sources & Ingestion Status
export const getSourcesStatus = async () => {
  return await api.get('/api/sources/status');
};

export const triggerSourcesSync = async () => {
  return await api.post('/api/sources/sync');
};

export default api;
