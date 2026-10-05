import { useState, useEffect, useCallback } from 'react';
import opportunityService from '../services/opportunityService';

export function useOpportunities(initialFilters = {}) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await opportunityService.getOpportunities(filters);
      if (result && result.items) {
        setItems(result.items);
        if (result.pagination) setPagination(result.pagination);
      } else if (Array.isArray(result)) {
        setItems(result);
        setPagination({ page: 1, limit: result.length, total: result.length, pages: 1 });
      } else {
        setItems([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load opportunities');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return {
    data: items, // backward-compatibility alias
    opportunities: items,
    pagination,
    loading,
    error,
    refetch: fetchOpportunities,
    filters,
    updateFilters,
  };
}

export default useOpportunities;
