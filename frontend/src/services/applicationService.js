import api from './api';
import { mockApplications } from './mockData';

const STORAGE_KEY = 'careerpilot_applications_v2';

export const applicationService = {
  async getApplications() {
    try {
      const response = await api.get('/api/applications');
      return response.data || response;
    } catch {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
      return mockApplications;
    }
  },

  async addApplication(appData) {
    try {
      const response = await api.post('/api/applications', appData);
      return response.data || response;
    } catch {
      const current = await this.getApplications();
      const newApp = {
        id: `app-${Date.now()}`,
        appliedDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        timeline: [{ date: new Date().toISOString().split('T')[0], event: `Tracked in ${appData.status}` }],
        matchScore: 88,
        ...appData,
      };
      const updated = [newApp, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newApp;
    }
  },

  async updateStage(appId, newStatus) {
    try {
      const response = await api.put(`/api/applications/${appId}/stage`, { status: newStatus });
      return response.data || response;
    } catch {
      const current = await this.getApplications();
      const updated = current.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            status: newStatus,
            lastUpdated: new Date().toISOString().split('T')[0],
            timeline: [
              ...(app.timeline || []),
              { date: new Date().toISOString().split('T')[0], event: `Moved to ${newStatus}` },
            ],
          };
        }
        return app;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated.find((a) => a.id === appId);
    }
  },

  async deleteApplication(appId) {
    try {
      await api.delete(`/api/applications/${appId}`);
      return { success: true };
    } catch {
      const current = await this.getApplications();
      const filtered = current.filter((a) => a.id !== appId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return { success: true };
    }
  }
};

export default applicationService;
