import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, PieChart, Loader2, Sparkles, Zap, BookmarkPlus } from 'lucide-react';

const CHART_TYPES = [
  { value: 'bar',  label: 'Bar',  Icon: BarChart2  },
  { value: 'line', label: 'Line', Icon: TrendingUp  },
  { value: 'pie',  label: 'Pie',  Icon: PieChart    },
];

const AGG_OPTIONS = [
  { value: 'sum',   label: 'Sum'      },
  { value: 'avg',   label: 'Average'  },
  { value: 'count', label: 'Count'    },
];

export default function ChartBuilder({ dataset, onGenerate, onSave, loading }) {
  const [config, setConfig] = useState({ type: 'bar', xAxis: '', yAxis: '', aggregation: 'sum', limit: 50 });

  const { columns = [], suggestions = [] } = dataset || {};
  const numericCols = columns.filter((c) => c.type === 'number');
  const allCols = columns;

  useEffect(() => {
    if (suggestions.length) {
      const s = suggestions[0];
      setConfig((c) => ({ ...c, type: s.type, xAxis: s.xAxis, yAxis: s.yAxis }));
    }
  }, [suggestions]);

  function set(key, val) {
    setConfig((c) => ({ ...c, [key]: val }));
  }

  const canGenerate = config.xAxis && config.yAxis && dataset;

  return (
    <div className="space-y-5">

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-yellow-500" /> Auto Suggestions
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setConfig((c) => ({ ...c, type: s.type, xAxis: s.xAxis, yAxis: s.yAxis }))}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                  bg-blue-950/50 border border-blue-800/70 text-blue-300
                  hover:bg-blue-900/60 hover:border-blue-600 transition-all"
              >
                <Zap className="w-3 h-3" />
                {s.type} · {s.xAxis} × {s.yAxis}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart type */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Chart Type</p>
        <div className="grid grid-cols-3 gap-2">
          {CHART_TYPES.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => set('type', value)}
              className={`flex flex-col items-center gap-2 py-3 rounded-xl border text-xs font-medium transition-all
                ${config.type === value
                  ? 'border-blue-500 bg-blue-950/50 text-blue-300 shadow-lg shadow-blue-950/50'
                  : 'border-gray-700/60 bg-gray-800/50 text-gray-500 hover:border-gray-600 hover:text-gray-300 hover:bg-gray-800'}`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800" />

      {/* Axes */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Axes</p>
        <div className="space-y-2.5">
          <div>
            <label className="label">X Axis <span className="text-gray-600 normal-case font-normal">(category)</span></label>
            <div className="relative">
              <select
                className="input appearance-none pr-8"
                value={config.xAxis}
                onChange={(e) => set('xAxis', e.target.value)}
              >
                <option value="">— select column —</option>
                {allCols.map((c) => (
                  <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                ))}
              </select>
              <ChevronIcon />
            </div>
          </div>

          <div>
            <label className="label">Y Axis <span className="text-gray-600 normal-case font-normal">(numeric value)</span></label>
            <div className="relative">
              <select
                className="input appearance-none pr-8"
                value={config.yAxis}
                onChange={(e) => set('yAxis', e.target.value)}
              >
                <option value="">— select column —</option>
                {numericCols.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronIcon />
            </div>
            {!numericCols.length && (
              <p className="text-xs text-amber-600 mt-1">No numeric columns detected in this dataset</p>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800" />

      {/* Settings */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Settings</p>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="label">Aggregation</label>
            <div className="relative">
              <select
                className="input appearance-none pr-8"
                value={config.aggregation}
                onChange={(e) => set('aggregation', e.target.value)}
              >
                {AGG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronIcon />
            </div>
          </div>
          <div>
            <label className="label">Max points</label>
            <input
              type="number"
              className="input"
              value={config.limit}
              min={5}
              max={200}
              onChange={(e) => set('limit', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          className="btn-primary flex-1 justify-center"
          disabled={!canGenerate || loading}
          onClick={() => onGenerate({ datasetId: dataset.datasetId, ...config })}
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            : <><Zap className="w-4 h-4" /> Generate Chart</>}
        </button>

        {onSave && (
          <button
            className="btn-secondary px-3"
            title="Save chart"
            disabled={!canGenerate}
            onClick={() => onSave({
              datasetId: dataset.datasetId,
              title: `${config.type} — ${config.xAxis} × ${config.yAxis}`,
              ...config,
            })}
          >
            <BookmarkPlus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
