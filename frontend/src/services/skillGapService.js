import api from './api';
import { mockSkillRequirements, mockSupportedRoles } from './skillCatalog';

export const skillGapService = {
  async getSkillGap(targetRole = 'Full Stack Developer') {
    try {
      const response = await api.get(`/api/skill-gap?targetRole=${encodeURIComponent(targetRole)}`);
      return response.data || response;
    } catch {
      const roleData = mockSkillRequirements[targetRole] || mockSkillRequirements['Full Stack Developer'];
      return {
        targetRole,
        readinessScore: 78,
        acquiredSkills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'Git', 'REST APIs'],
        missingSkills: roleData.skills.filter((s) => s.priority === 'High' || s.priority === 'Medium').slice(0, 4),
        totalRequired: roleData.skills.length,
      };
    }
  },

  async getSupportedRoles() {
    try {
      const response = await api.get('/api/skill-gap/roles');
      return response.data || response;
    } catch {
      return mockSupportedRoles;
    }
  },

  async getRoadmap(targetRole = 'Full Stack Developer') {
    try {
      const response = await api.get(`/api/skill-gap/roadmap?targetRole=${encodeURIComponent(targetRole)}`);
      return response.data || response;
    } catch {
      return null;
    }
  },

  async getLearningResources(skill) {
    try {
      const response = await api.get(`/api/skill-gap/resources/${encodeURIComponent(skill)}`);
      return response.data || response;
    } catch {
      return [];
    }
  },

  async updateProgress(skill, progressData) {
    try {
      const response = await api.put(`/api/skill-gap/progress/${encodeURIComponent(skill)}`, progressData);
      return response.data || response;
    } catch {
      return { skill, ...progressData, updatedAt: new Date().toISOString() };
    }
  }
};

export default skillGapService;
