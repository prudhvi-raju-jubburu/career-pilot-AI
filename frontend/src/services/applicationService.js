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
  },

  // --------------------------------------------------------------------------
  // Phase 5: Interview Scheduling & Calendar
  // --------------------------------------------------------------------------

  async getEvents(appId) {
    try {
      const response = await api.get(`/api/applications/${appId}/events`);
      return response.data || [];
    } catch (error) {
      console.warn('Could not fetch events for application:', error.message || error);
      return [];
    }
  },

  async addEvent(appId, eventData) {
    try {
      const response = await api.post(`/api/applications/${appId}/events`, eventData);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  async updateEvent(appId, eventId, eventData) {
    try {
      const response = await api.put(`/api/applications/${appId}/events/${eventId}`, eventData);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  async deleteEvent(appId, eventId) {
    try {
      const response = await api.delete(`/api/applications/${appId}/events/${eventId}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  getCalendarIcsUrl(appId, eventId) {
    const baseURL = api.defaults.baseURL || '';
    return `${baseURL}/api/applications/${appId}/events/${eventId}/calendar.ics`;
  },

  async downloadCalendarIcs(appId, eventId) {
    try {
      const response = await api.get(`/api/applications/${appId}/events/${eventId}/calendar.ics`, {
        responseType: 'blob'
      });
      const blob = new Blob([response], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `interview_${eventId}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error downloading .ics calendar:', error);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // Phase 5: Grounded Interview Preparation & Interactive Checklist
  // --------------------------------------------------------------------------

  async getInterviewPrep(appId, forceRefresh = false) {
    try {
      const response = await api.post(`/api/applications/${appId}/prep`, { force_refresh: forceRefresh });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  async toggleChecklistItem(appId, taskId, completed) {
    try {
      const response = await api.patch(`/api/applications/${appId}/prep/checklist`, {
        taskId,
        completed
      });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  async addSkillToRoadmap(appId, skillName) {
    try {
      const response = await api.post(`/api/applications/${appId}/prep/add-skill-to-roadmap`, {
        skill_name: skillName
      });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // Stage 5: Mock Test Engine
  // --------------------------------------------------------------------------

  async getMockTests(appId) {
    try {
      const response = await api.get(`/api/applications/${appId}/mock-tests`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  async startMockTest(appId, config = {}) {
    try {
      const response = await api.post(`/api/applications/${appId}/mock-tests/start`, config);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  async getMockTestAttempt(appId, testId) {
    try {
      const response = await api.get(`/api/applications/${appId}/mock-tests/${testId}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  async saveMockTestAnswers(appId, testId, answers) {
    try {
      const response = await api.put(`/api/applications/${appId}/mock-tests/${testId}/answers`, {
        answers
      });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  async submitMockTest(appId, testId, answers = {}) {
    try {
      const response = await api.post(`/api/applications/${appId}/mock-tests/${testId}/submit`, {
        answers
      });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  async getMockTestResult(appId, testId) {
    try {
      const response = await api.get(`/api/applications/${appId}/mock-tests/${testId}/result`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  async addWeakTopicToRoadmap(appId, testId, topicName) {
    try {
      const response = await api.post(`/api/applications/${appId}/mock-tests/${testId}/add-weak-topic-to-roadmap`, {
        topic: topicName
      });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }
};

export default applicationService;

