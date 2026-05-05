import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { FileSpreadsheet, Database, Clock, Trash2, RefreshCw } from 'lucide-react';
import api from '../utils/api';

const SOURCE_ICON = { file: FileSpreadsheet, database: Database };

const RecentDatasets = forwardRef(function RecentDatasets({ onLoad }, ref) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetch() {
    setLoading(true);
    try {
      const { data } = await api.get('/upload/datasets');
      setDatasets(data.datasets);
    } catch (_) {}
    finally { setLoading(false); }
  }

  async function remove(id, e) {
    e.stopPropagation();
    await api.delete(`/upload/datasets/${id}`).catch(() => {});
    setDatasets((prev) => prev.filter((d) => d.id !== id));
  }

  // Expose refresh() to parent via ref
  useImperativeHandle(ref, () => ({ refresh: fetch }));

  useEffect(() => { fetch(); }, []);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="label flex items-center gap-1"><Clock className="w-3 h-3" /> Recent Datasets</p>
        <button onClick={fetch} className="text-gray-600 hover:text-gray-400 transition-colors">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!datasets.length && !loading && (
        <p className="text-xs text-gray-600 py-3 text-center">No previous datasets</p>
      )}

      {loading && !datasets.length && (
        <p className="text-xs text-gray-600 py-3 text-center animate-pulse">Loading…</p>
      )}

      {datasets.map((d) => {
        const Icon = SOURCE_ICON[d.source] || FileSpreadsheet;
        return (
          <button
            key={d.id}
            onClick={() => onLoad(d)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-800 transition-colors text-left group"
          >
            <Icon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">{d.name}</p>
              <p className="text-xs text-gray-600">{d.rowCount?.toLocaleString()} rows · {new Date(d.createdAt).toLocaleDateString()}</p>
            </div>
            <span
              onClick={(e) => remove(d.id, e)}
              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-0.5"
            >
              <Trash2 className="w-3 h-3" />
            </span>
          </button>
        );
      })}
    </div>
  );
});

export default RecentDatasets;
