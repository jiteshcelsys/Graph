import { useState, useEffect } from 'react';
import { Table2, BarChart2, BookMarked, AlertCircle, Database, FileSpreadsheet } from 'lucide-react';
import DataTable from '../components/DataTable';
import ChartBuilder from '../components/ChartBuilder';
import ChartRenderer from '../components/ChartRenderer';
import SavedCharts from '../components/SavedCharts';
import { useCharts } from '../hooks/useCharts';

const TABS = [
  { id: 'data',  label: 'Data Preview',  Icon: Table2     },
  { id: 'chart', label: 'Chart Builder', Icon: BarChart2  },
  { id: 'saved', label: 'Saved Charts',  Icon: BookMarked },
];

export default function Dashboard({ dataset }) {
  const [tab, setTab] = useState('data');
  const { chartData, savedCharts, loading, error, generate, save, fetchSaved, remove } = useCharts();

  useEffect(() => {
    if (dataset?.datasetId) {
      fetchSaved(dataset.datasetId);
      setTab('data');
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

      {/* Header */}
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
                ${tab === id
                  ? 'bg-gray-700 text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'}`}
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
      <div className="flex-1 overflow-auto p-5">

        {tab === 'data' && (
          <div className="card">
            <DataTable columns={dataset.columns} rows={dataset.preview} rowCount={dataset.rowCount} />
          </div>
        )}

        {tab === 'chart' && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 h-full">

            {/* Left — config panel */}
            <div className="xl:col-span-2 card overflow-y-auto">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-gray-200">Configure Chart</h2>
              </div>
              <ChartBuilder
                dataset={dataset}
                onGenerate={generate}
                onSave={(payload) => save({
                datasetId: payload.datasetId,
                title: `${payload.type} — ${payload.xAxis} × ${payload.yAxis}`,
                type: payload.type,
                config: {
                  xAxis: payload.xAxis,
                  yAxis: payload.yAxis,
                  aggregation: payload.aggregation,
                  limit: payload.limit,
                },
              })}
                loading={loading}
              />
            </div>

            {/* Right — chart preview */}
            <div className="xl:col-span-3 card flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
                <h2 className="text-sm font-semibold text-gray-200">
                  {chartData
                    ? `${chartData.type.charAt(0).toUpperCase() + chartData.type.slice(1)} — ${chartData.xAxis} × ${chartData.yAxis}`
                    : 'Chart Preview'}
                </h2>
                {chartData && (
                  <span className="text-xs text-gray-600">{chartData.data?.length} data points</span>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg p-3 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              {chartData ? (
                <div className="flex-1 min-h-0">
                  <ChartRenderer chartData={chartData} height={360} />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-gray-800/60 border border-gray-700/50 flex items-center justify-center">
                    <BarChart2 className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">No chart generated yet</p>
                    <p className="text-xs text-gray-700 mt-0.5">Select axes and click Generate Chart</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
