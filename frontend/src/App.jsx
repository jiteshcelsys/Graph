import { useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import { Toast } from './components/Toast';
import { useDataset } from './hooks/useDataset';
import { useToast } from './hooks/useToast';
import api from './utils/api';

export default function App() {
  const { dataset, loading, setDataset, loadFromFile, loadFromTable } = useDataset();
  const { toasts, remove, success, error } = useToast();
  const sidebarRef = useRef(null);

  async function handleFileUpload(file) {
    try {
      const data = await loadFromFile(file);
      success(
        'Dataset ready to analyze!',
        `${file.name} · ${data.rowCount.toLocaleString()} rows · ${data.persisted ? 'Saved to Postgres' : 'In memory'}`
      );
      sidebarRef.current?.refreshRecent();
    } catch (e) {
      error('Upload failed', e.message);
    }
  }

  async function handleTableSelect(table) {
    try {
      await loadFromTable(table);
      success('Table loaded', `${table} is ready to analyze`);
    } catch (e) {
      error('Failed to load table', e.message);
    }
  }

  async function handleRecentLoad(entry) {
    try {
      const { data } = await api.get(`/upload/datasets/${entry.id}`);
      setDataset(data);
      success('Dataset restored', `${entry.name} · ${data.rowCount.toLocaleString()} rows`);
    } catch (e) {
      error('Failed to load dataset', e.message);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar
        ref={sidebarRef}
        onDatasetLoaded={handleTableSelect}
        onDatasetSelected={handleRecentLoad}
        onFileUpload={handleFileUpload}
        fileLoading={loading}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <Dashboard dataset={dataset} />
      </main>
      <Toast toasts={toasts} remove={remove} />
    </div>
  );
}
