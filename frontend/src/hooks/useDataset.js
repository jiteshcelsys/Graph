import { useState, useCallback } from 'react';
import api from '../utils/api';

export function useDataset() {
  const [dataset, setDataset] = useState(null); // {datasetId, name, columns, rowCount, suggestions, preview}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadFromFile = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/upload', form);
      setDataset(data);
      return data;
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFromTable = useCallback(async (table) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/db/table-data', { params: { table } });
      setDataset(data);
      return data;
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setDataset(null), []);

  return { dataset, loading, error, setDataset, loadFromFile, loadFromTable, clear };
}
