import api from './api';

export const resumeService = {
  /**
   * Uploads resume file (PDF or DOCX) to the backend.
   */
  async upload(formData, onUploadProgress) {
    const response = await api.post('/api/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data || response;
  },

  /**
   * Invokes real backend resume extraction & profile merge.
   */
  async analyze() {
    const response = await api.post('/api/resume/analyze', {}, { timeout: 60000 });
    return response.data || response;
  },

  /**
   * Fetches metadata for current user's uploaded resume from the server.
   */
  async getResumeInfo() {
    const response = await api.get('/api/resume');
    return response.data || response;
  }
};

export default resumeService;
