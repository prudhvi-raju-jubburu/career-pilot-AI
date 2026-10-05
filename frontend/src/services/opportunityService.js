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

  async toggleBookmark(id) {
    const savedBookmarks = JSON.parse(localStorage.getItem('careerpilot_bookmarked_opps') || '[]');
    let updated;
    const exists = savedBookmarks.includes(id);
    if (exists) {
      updated = savedBookmarks.filter((item) => item !== id);
    } else {
      updated = [...savedBookmarks, id];
    }
    localStorage.setItem('careerpilot_bookmarked_opps', JSON.stringify(updated));
    return { bookmarked: !exists };
  }
};

export default opportunityService;
