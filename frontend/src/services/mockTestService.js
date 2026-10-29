import api from './api';

export const mockTestService = {
  /**
   * Retrieves available categories with question counts and past attempt history.
   */
  async getMockTests(appId) {
    try {
      const response = await api.get(`/api/applications/${appId}/mock-tests`);
      return response.data || response;
    } catch (error) {
      console.warn('Could not fetch mock tests:', error.message || error);
      throw error;
    }
  },

  /**
   * Starts a new mock test or resumes an active in-progress test.
   */
  async startMockTest(appId, config = {}) {
    try {
      const response = await api.post(`/api/applications/${appId}/mock-tests/start`, config);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetches an attempt payload (correct answers hidden while in-progress).
   */
  async getAttempt(appId, testId) {
    try {
      const response = await api.get(`/api/applications/${appId}/mock-tests/${testId}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Saves candidate answers periodically during the active test.
   */
  async saveAnswers(appId, testId, answers) {
    try {
      const response = await api.put(`/api/applications/${appId}/mock-tests/${testId}/answers`, {
        answers
      });
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Submits the mock test for deterministic grading and explanation review.
   */
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

  /**
   * Retrieves completed result with score, topic breakdown, explanations, and revisions.
   */
  async getResult(appId, testId) {
    try {
      const response = await api.get(`/api/applications/${appId}/mock-tests/${testId}/result`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Appends a weak topic identified in the test to the preparation checklist roadmap.
   */
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

export default mockTestService;
