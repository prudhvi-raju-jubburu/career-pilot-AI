import api from './api';

export const profileService = {
  async getProfile() {
    const response = await api.get('/api/profile');
    return response.data || response;
  },

  async updateProfile(profileData) {
    const response = await api.put('/api/profile', profileData);
    return response.data || response;
  },

  async verifyProfile() {
    const response = await api.post('/api/profile/verify');
    return response.data || response;
  },

  async getCompletion() {
    const response = await api.get('/api/profile/completion');
    return response.data || response;
  }
};

export default profileService;
