import { useState, useEffect, useCallback } from 'react';
import resumeService from '../services/resumeService';

export const useResume = () => {
  const [resumeInfo, setResumeInfo] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const fetchResumeInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await resumeService.getResumeInfo();
      setResumeInfo(data);
    } catch (err) {
      setError(err?.message || 'Failed to fetch resume details');
    } finally {
      setLoading(false);
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const result = await resumeService.analyze();
      setAnalysis(result);
      return result;
    } catch (err) {
      setError(err?.message || 'Resume analysis failed. Please try again.');
      throw err;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    fetchResumeInfo();
  }, [fetchResumeInfo]);

  return {
    resumeInfo,
    analysis,
    loading,
    analyzing,
    error,
    refetch: fetchResumeInfo,
    runAnalysis,
  };
};

export default useResume;
