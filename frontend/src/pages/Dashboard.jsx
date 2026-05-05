import { useState, useEffect } from 'react';
import { Table2, BarChart2, BookMarked, Database, FileSpreadsheet, Loader2, AlertCircle, LayoutDashboard } from 'lucide-react';
import DataTable from '../components/DataTable';
import SavedCharts from '../components/SavedCharts';
import KPICard from '../components/KPICard';
import AutoChartGrid from '../components/AutoChartGrid';
import InsightsPanel from '../components/InsightsPanel';
import { useCharts } from '../hooks/useCharts';
import { useAutoDashboard } from '../hooks/useAutoDashboard';

const TABS = [
  { id: 'overview', label: 'Overview',     Icon: LayoutDashboard },
  { id: 'data',     label: 'Data Preview', Icon: Table2          },
  { id: 'saved',    label: 'Saved Charts', Icon: BookMarked      },
];

export default function Dashboard({ dataset }) {
  const [tab, setTab] = useState('overview');
  const { savedCharts, fetchSaved, remove } = useCharts();
  const { result, loading, error, load } = useAutoDashboard();

  useEffect(() => {
    if (dataset?.datasetId) {
      fetchSaved(dataset.datasetId);
      setTab('overview');
      load(dataset.datasetId);
    }
  }, [dataset?.datasetId]);

  if (!dataset) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-6">
        <div className="w-20 h-20 rounded-3xl bg-gray-800/80 border border-gray-700/50 flex items-center justify-center">
          <BarChart2 className="w-9 h-9 text-gray-600" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-gray-300">No data loaded</h2>
          <p className="text-sm text-gray-600 max-w-xs">
            Upload a CSV, Excel, or SQL file — or connect to a database using the sidebar
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs text-gray-700">
          <span className="flex items-center gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5" /> CSV / XLSX / SQL</span>
          <span className="w-px h-4 bg-gray-800" />
          <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> PostgreSQL / MySQL</span>
        </div>
      </div>
    );
  }

  const sourceIcon = dataset.source === 'database'
    ? <Database className="w-4 h-4 text-blue-400" />
    : <FileSpreadsheet className="w-4 h-4 text-blue-400" />;

  return (
    <div className="flex-1 flex flex-col min-h-0">

      {/* Sticky header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-950/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-900/50 flex items-center justify-center shrink-0">
            {sourceIcon}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-gray-100 truncate">{dataset.name || dataset.table}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">
                {dataset.rowCount?.toLocaleString()} rows · {dataset.columns?.length} columns
              </span>
              {dataset.persisted && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-950/60 border border-green-800/60 text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Postgres
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-gray-800/80 rounded-xl p-1 gap-0.5 border border-gray-700/50">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg font-medium transition-all whitespace-nowrap
                ${tab === id ? 'bg-gray-700 text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === 'saved' && savedCharts.length > 0 && (
                <span className="ml-0.5 text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {savedCharts.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-5">

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <>
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-300">Analyzing your data…</p>
                  <p className="text-xs text-gray-600 mt-0.5">Generating charts and AI insights</p>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {result && !loading && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {result.kpis.map((kpi, i) => (
                    <KPICard key={i} kpi={kpi} index={i} />
                  ))}
                </div>

                {/* Auto Charts */}
                <AutoChartGrid charts={result.charts} />

                {/* AI Insights + NL Query */}
                <InsightsPanel
                  datasetId={dataset.datasetId}
                  summary={result.summary}
                  insights={result.insights}
                />
              </>
            )}
          </>
        )}

        {/* ── DATA PREVIEW TAB ── */}
        {tab === 'data' && (
          <div className="card">
            <DataTable columns={dataset.columns} rows={dataset.preview} rowCount={dataset.rowCount} />
          </div>
        )}

        {/* ── SAVED CHARTS TAB ── */}
        {tab === 'saved' && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
              <BookMarked className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-gray-200">Saved Charts</h2>
              {savedCharts.length > 0 && (
                <span className="ml-auto text-xs text-gray-600">{savedCharts.length} chart{savedCharts.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <SavedCharts charts={savedCharts} onDelete={remove} />
          </div>
        )}
      </div>
    </div>
  );
}
