import { useState, useEffect, useCallback } from 'react';
import applicationService from '../services/applicationService';

export function useApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await applicationService.getApplications();
      setApplications(result);
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const addApplication = async (appData) => {
    const newApp = await applicationService.addApplication(appData);
    setApplications((prev) => [newApp, ...prev]);
    return newApp;
  };

  const updateStage = async (appId, newStatus) => {
    const updated = await applicationService.updateStage(appId, newStatus);
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, ...updated } : app))
    );
    return updated;
  };

  const deleteApplication = async (appId) => {
    await applicationService.deleteApplication(appId);
    setApplications((prev) => prev.filter((app) => app.id !== appId));
  };

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
    addApplication,
    updateStage,
    deleteApplication,
  };
}

export default useApplications;
