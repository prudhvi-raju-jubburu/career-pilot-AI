import { useState, useEffect, useCallback } from 'react';
import skillGapService from '../services/skillGapService';

export const useSkillGap = (initialRole = 'Full Stack Developer') => {
  const [targetRole, setTargetRole] = useState(initialRole);
  const [data, setData] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSkillGap = useCallback(async (roleToFetch) => {
    const role = roleToFetch || targetRole;
    setLoading(true);
    setError(null);
    try {
      const [gapData, supportedRoles] = await Promise.all([
        skillGapService.getSkillGap(role),
        skillGapService.getSupportedRoles(),
      ]);
      setData(gapData);
      setRoles(supportedRoles);
    } catch (err) {
      setError(err?.message || 'Failed to load skill gap data');
    } finally {
      setLoading(false);
    }
  }, [targetRole]);

  useEffect(() => {
    fetchSkillGap(targetRole);
  }, [fetchSkillGap, targetRole]);

  const changeRole = useCallback((newRole) => {
    setTargetRole(newRole);
  }, []);

  return {
    data,
    roles,
    targetRole,
    changeRole,
    loading,
    error,
    refetch: () => fetchSkillGap(targetRole),
  };
};

export default useSkillGap;
