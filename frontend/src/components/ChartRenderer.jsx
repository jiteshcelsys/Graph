import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line,
  PieChart, Pie, Cell,
} from 'recharts';
import { formatNumber, truncate } from '../utils/formatters';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];

const TOOLTIP_STYLE = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: 8,
  color: '#e5e7eb',
  fontSize: 12,
};

function TickLabel({ x, y, payload }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="end" fill="#9ca3af" fontSize={11} transform="rotate(-35)">
        {truncate(String(payload.value), 20)}
      </text>
    </g>
  );
}

export default function ChartRenderer({ chartData, height = 340 }) {
  if (!chartData || !chartData.data?.length) return null;

  const { type, data, xAxis, yAxis } = chartData;

  const commonProps = {
    data,
    margin: { top: 10, right: 20, left: 0, bottom: 60 },
  };

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="name" tick={<TickLabel />} interval={0} />
            <YAxis tickFormatter={formatNumber} tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [formatNumber(v), yAxis]} />
            <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : type === 'line' ? (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="name" tick={<TickLabel />} interval={0} />
            <YAxis tickFormatter={formatNumber} tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [formatNumber(v), yAxis]} />
            <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 3, fill: COLORS[0] }} />
          </LineChart>
        ) : (
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              outerRadius={height * 0.32}
              label={({ name, percent }) => `${truncate(name, 14)} ${(percent * 100).toFixed(1)}%`}
              labelLine={{ stroke: '#4b5563' }}
            >
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [formatNumber(v), yAxis]} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
