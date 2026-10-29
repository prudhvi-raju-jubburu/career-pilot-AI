import api from './api';

export const opportunityService = {
  async getOpportunities(filters = {}) {
    const params = {};
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    if (filters.search) params.search = filters.search;
    if (filters.type && filters.type !== 'All') params.type = filters.type;
    if (filters.category && filters.category !== 'All') params.category = filters.category;
    if (filters.location) params.location = filters.location;
    if (filters.workMode && filters.workMode !== 'All') params.work_mode = filters.workMode;
    if (filters.remote !== undefined) params.remote = filters.remote;
    if (filters.deadlineBefore) params.deadline_before = filters.deadlineBefore;
    if (filters.sort) params.sort = filters.sort;
    if (filters.matched !== undefined) params.matched = filters.matched;

    const response = await api.get('/api/opportunities', { params });
    const payload = response.data || response;
    // Normalize return so components receive items and pagination
    if (payload.items) {
      return payload;
    }
    return {
      items: Array.isArray(payload) ? payload : [],
      pagination: { page: 1, limit: 20, total: payload.length || 0, pages: 1 }
    };
  },

  async getRecommendations(params = {}) {
    const response = await api.get('/api/recommendations', { params });
    const payload = response.data?.data || response.data || response;
    return payload;
  },

  async getOpportunityById(id) {
    const response = await api.get(`/api/opportunities/${id}`);
    return response.data || response;
  },

  async getCategories() {
    const response = await api.get('/api/opportunities/categories');
    return response.data || response;
  },

  async getFilters() {
    const response = await api.get('/api/opportunities/filters');
    return response.data || response;
  },

  async saveOpportunity(id) {
    try {
      const response = await api.post(`/api/opportunities/${id}/save`);
      return response.data || response;
    } catch (e) {
      console.warn('Could not persist bookmark to server:', e);
    }
  },

  async unsaveOpportunity(id) {
    try {
      const response = await api.delete(`/api/opportunities/${id}/save`);
      return response.data || response;
    } catch (e) {
      console.warn('Could not remove bookmark on server:', e);
    }
  },

  async getSavedOpportunities() {
    try {
      const response = await api.get('/api/saved-opportunities');
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('Could not fetch saved opportunities:', e);
      return [];
    }
  },

  async toggleBookmark(id) {
    const savedBookmarks = JSON.parse(localStorage.getItem('careerpilot_bookmarked_opps') || '[]');
    let updated;
    const exists = savedBookmarks.includes(id);
    if (exists) {
      updated = savedBookmarks.filter((item) => item !== id);
      this.unsaveOpportunity(id);
    } else {
      updated = [...savedBookmarks, id];
      this.saveOpportunity(id);
    }
    localStorage.setItem('careerpilot_bookmarked_opps', JSON.stringify(updated));
    return { bookmarked: !exists };
  },

  async submitFeedback(oppId, rating, reason = null) {
    try {
      const response = await api.post(`/api/opportunities/${oppId}/feedback`, { rating, reason });
      return response.data || response;
    } catch (e) {
      console.warn('Could not submit feedback:', e);
      throw e;
    }
  },

  async getFeedback(oppId) {
    try {
      const response = await api.get(`/api/opportunities/${oppId}/feedback`);
      return response.data?.data || response.data || null;
    } catch (e) {
      return null;
    }
  },

  async deleteFeedback(oppId) {
    try {
      const response = await api.delete(`/api/opportunities/${oppId}/feedback`);
      return response.data || response;
    } catch (e) {
      console.warn('Could not delete feedback:', e);
      throw e;
    }
  },

  async dismissOpportunity(oppId, reason = 'not_interested') {
    try {
      const response = await api.post(`/api/opportunities/${oppId}/dismiss`, { reason });
      return response.data || response;
    } catch (e) {
      console.warn('Could not dismiss opportunity:', e);
      throw e;
    }
  },

  async recordView(oppId) {
    try {
      await api.post(`/api/opportunities/${oppId}/view`);
    } catch (e) {
      // Non-blocking telemetry
    }
  },

  async getFeedbackSummary() {
    try {
      const response = await api.get('/api/recommendations/feedback-summary');
      return response.data?.data || response.data || null;
    } catch (e) {
      return null;
    }
  }
};

export default opportunityService;

