import ChartRenderer from './ChartRenderer';
import { BarChart2, TrendingUp, PieChart } from 'lucide-react';

const TYPE_ICON = { bar: BarChart2, line: TrendingUp, pie: PieChart };

function ChartCard({ chart, height }) {
  const Icon = TYPE_ICON[chart.type] || BarChart2;
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-200">{chart.title}</h3>
        </div>
        <span className="text-xs text-gray-600">{chart.data?.length} points</span>
      </div>
      <ChartRenderer chartData={chart} height={height || 260} />
    </div>
  );
}

export default function AutoChartGrid({ charts = [] }) {
  if (!charts.length) return null;

  const [first, second, third] = charts;

  return (
    <div className="space-y-4">
      {/* Row 1: Bar (2/3) + Donut (1/3) */}
      {(first || second) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {first && (
            <div className="lg:col-span-2">
              <ChartCard chart={first} height={280} />
            </div>
          )}
          {second && (
            <div className="lg:col-span-1">
              <ChartCard chart={second} height={280} />
            </div>
          )}
        </div>
      )}

      {/* Row 2: Line/Area full width */}
      {third && <ChartCard chart={third} height={240} />}
    </div>
  );
}
