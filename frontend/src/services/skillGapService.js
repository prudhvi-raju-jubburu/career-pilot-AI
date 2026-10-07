import api from './api';

export const skillGapService = {
  async getSkillGap(targetRole = 'Full Stack Developer') {
    const response = await api.get(`/api/skill-gap?targetRole=${encodeURIComponent(targetRole)}`);
    return response.data?.data || response.data || response;
  },

  async getSupportedRoles() {
    const response = await api.get('/api/skill-gap/roles');
    return response.data?.data || response.data || response;
  },

  async getRoadmap(targetRole = 'Full Stack Developer') {
    const response = await api.get(`/api/skill-gap/roadmap?targetRole=${encodeURIComponent(targetRole)}`);
    return response.data?.data || response.data || response;
  },

  async getLearningResources(skill) {
    const response = await api.get(`/api/skill-gap/resources/${encodeURIComponent(skill)}`);
    return response.data?.data || response.data || response;
  },

  async updateProgress(skill, progressData) {
    const response = await api.put(`/api/skill-gap/progress/${encodeURIComponent(skill)}`, progressData);
    return response.data?.data || response.data || response;
  }
};

export default skillGapService;
