import { useState, useEffect, useCallback } from 'react';
import profileService from '../services/profileService';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profData, compData] = await Promise.all([
        profileService.getProfile(),
        profileService.getCompletion(),
      ]);
      setProfile(profData);
      setCompletion(compData);
    } catch (err) {
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updatedData) => {
    try {
      const res = await profileService.updateProfile(updatedData);
      setProfile(res);
      return res;
    } catch (err) {
      throw err;
    }
  };

  return {
    profile,
    completion,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
}

export default useProfile;
