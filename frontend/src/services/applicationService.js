import api from './api';

export function notifyApplicationsUpdated(detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('careerpilot_applications_updated', { detail }));
  }
}

export const applicationService = {
  async getApplications(params = {}) {
    try {
      const response = await api.get('/api/applications', { params });
      return response.data || [];
    } catch (error) {
      console.warn('Could not fetch applications from API:', error.message || error);
      return [];
    }
  },

  async addApplication(appData) {
    try {
      const response = await api.post('/api/applications', appData);
      const resultApp = response.data || response;
      notifyApplicationsUpdated({ action: 'add', app: resultApp });
      return resultApp;
    } catch (error) {
      throw error;
    }
  },

  async updateStage(appId, newStatus, note = null) {
    try {
      const response = await api.patch(`/api/applications/${appId}/stage`, { status: newStatus, note });
      const updatedApp = response.data || response;
      notifyApplicationsUpdated({ action: 'update', appId, status: newStatus, app: updatedApp });
      return updatedApp;
    } catch (error) {
      throw error;
    }
  },

  async updateApplication(appId, updates) {
    try {
      const response = await api.put(`/api/applications/${appId}`, updates);
      const updatedApp = response.data || response;
      notifyApplicationsUpdated({ action: 'update', appId, app: updatedApp });
      return updatedApp;
    } catch (error) {
      throw error;
    }
  },

  async deleteApplication(appId) {
    try {
      await api.delete(`/api/applications/${appId}`);
      notifyApplicationsUpdated({ action: 'delete', appId });
      return { success: true };
    } catch (error) {
      throw error;
    }
  }
};

export default applicationService;
