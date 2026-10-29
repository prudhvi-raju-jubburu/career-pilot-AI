import api from './api';

export const resumeBuilderService = {
  /**
   * Fetches the student's profile, uploaded resume metadata, and version count.
   */
  async getSourceData() {
    const res = await api.get('/api/resume-builder/source-data');
    return res.data || res;
  },

  /**
   * Safely merges uploaded resume extraction with the student's saved profile.
   */
  async mergeSources(extractedResume = null) {
    const res = await api.post('/api/resume-builder/merge', {
      extracted_resume: extractedResume,
    });
    return res.data || res;
  },

  /**
   * Uploads a PDF or DOCX resume, triggers AI text extraction, and merges with student profile.
   */
  async uploadAndExtractResume(file) {
    const formData = new FormData();
    formData.append('resume', file);
    await api.post('/api/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Trigger AI analysis on the uploaded resume
    await api.post('/api/resume/analyze');
    // Fetch newly merged data
    const mergedRes = await this.mergeSources();
    return mergedRes.data || mergedRes;
  },

  /**
   * Extracts requirements & keywords from an opportunity ID or pasted job description.
   */
  async analyzeJob({ opportunityId, jobDescription, targetRole }) {
    const res = await api.post('/api/resume-builder/analyze-job', {
      opportunity_id: opportunityId,
      job_description: jobDescription,
      target_role: targetRole,
    });
    return res.data || res;
  },

  /**
   * Computes the deterministic 100-pt ATS Readiness score across 5 categories.
   */
  async calculateScore({ resumeData, targetRole, targetJobDescription }) {
    const res = await api.post('/api/resume-builder/score', {
      resume_data: resumeData,
      target_role: targetRole,
      target_job_description: targetJobDescription,
    });
    return res.data || res;
  },

  /**
   * Generates grounded rewrite suggestions for project and experience bullets.
   */
  async getImprovements({ resumeData, targetRole, targetJobDescription }) {
    const res = await api.post('/api/resume-builder/improve', {
      resume_data: resumeData,
      target_role: targetRole,
      target_job_description: targetJobDescription,
    });
    return res.data || res;
  },

  /**
   * Generates 3 grounded professional summary alternatives.
   */
  async getSummaries({ resumeData, targetRole }) {
    const res = await api.post('/api/resume-builder/summaries', {
      resume_data: resumeData,
      target_role: targetRole,
    });
    return res.data || res;
  },

  /**
   * Fetches the template catalog and configuration options.
   */
  async getTemplates() {
    const res = await api.get('/api/resume-builder/templates');
    return res.data || res;
  },

  /**
   * Lists all saved resume versions for the authenticated user.
   */
  async listVersions() {
    const res = await api.get('/api/resume-builder/versions');
    return res.data || res;
  },

  /**
   * Saves a new resume version.
   */
  async createVersion(versionPayload) {
    const res = await api.post('/api/resume-builder/versions', versionPayload);
    return res.data || res;
  },

  /**
   * Retrieves a single saved version by ID.
   */
  async getVersion(versionId) {
    const res = await api.get(`/api/resume-builder/versions/${versionId}`);
    return res.data || res;
  },

  /**
   * Updates an existing saved version.
   */
  async updateVersion(versionId, updates) {
    const res = await api.put(`/api/resume-builder/versions/${versionId}`, updates);
    return res.data || res;
  },

  /**
   * Deletes a saved version.
   */
  async deleteVersion(versionId) {
    const res = await api.delete(`/api/resume-builder/versions/${versionId}`);
    return res.data || res;
  },

  /**
   * Duplicates an existing version.
   */
  async duplicateVersion(versionId, newTitle = null) {
    const res = await api.post(`/api/resume-builder/versions/${versionId}/duplicate`, {
      title: newTitle,
    });
    return res.data || res;
  },

  /**
   * Downloads an authentic PDF or DOCX binary stream from the server.
   */
  async exportDocument({ resumeData, templateId, formatting, format = 'pdf' }) {
    const response = await api.post(
      '/api/resume-builder/export',
      {
        resume_data: resumeData,
        template_id: templateId,
        formatting,
        format,
      },
      {
        responseType: 'blob',
      }
    );

    // Trigger browser download
    const blob = new Blob([response], {
      type: format === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf',
    });

    const candidateName = resumeData?.personal?.fullName || 'Resume';
    const safeName = candidateName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeName}_CareerPilot_Resume.${format}`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  },
};

export default resumeBuilderService;
