import { BarChart2, Trash2, TrendingUp, PieChart } from 'lucide-react';

const ICONS = { bar: BarChart2, line: TrendingUp, pie: PieChart };

export default function SavedCharts({ charts, onDelete, onLoad }) {
  if (!charts.length) return (
    <div className="text-center text-gray-600 py-8 text-sm">No saved charts yet</div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {charts.map((c) => {
        const Icon = ICONS[c.type] || BarChart2;
        return (
          <div key={c.id} className="card flex items-center justify-between gap-3 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <Icon className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{c.title}</p>
                <p className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onLoad && (
                <button onClick={() => onLoad(c)} className="btn-secondary py-1 px-2 text-xs">Load</button>
              )}
              <button onClick={() => onDelete(c.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
