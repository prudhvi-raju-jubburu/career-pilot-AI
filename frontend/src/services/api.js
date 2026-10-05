import axios from 'axios';

// Base URL configured from environment variable or defaulting to proxy/localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for attaching JWT token in future phases
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

export default api;

