import { useState, useCallback, useRef } from 'react';
import api from '../utils/api';

export function useAutoDashboard() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheRef = useRef({});

  const load = useCallback(async (datasetId) => {
    if (!datasetId) return;

    // Return cached result if available
    if (cacheRef.current[datasetId]) {
      setResult(cacheRef.current[datasetId]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/analytics/auto-dashboard', { datasetId });
      cacheRef.current[datasetId] = data;
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to generate dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setResult(null), []);

  return { result, loading, error, load, clear };
}
