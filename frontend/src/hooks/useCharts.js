import { useState, useCallback } from 'react';
import api from '../utils/api';

export function useCharts() {
  const [chartData, setChartData] = useState(null);
  const [savedCharts, setSavedCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/charts/generate', params);
      setChartData(data);
      return data;
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (payload) => {
    try {
      await api.post('/charts/save', payload);
      await fetchSaved(payload.datasetId);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  }, []);

  const fetchSaved = useCallback(async (datasetId) => {
    try {
      const { data } = await api.get('/charts/saved', { params: { datasetId } });
      setSavedCharts(data.charts);
    } catch (_) {}
  }, []);

  const remove = useCallback(async (id) => {
    try {
      await api.delete(`/charts/${id}`);
      setSavedCharts((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  }, []);

  return { chartData, savedCharts, loading, error, generate, save, fetchSaved, remove };
}
