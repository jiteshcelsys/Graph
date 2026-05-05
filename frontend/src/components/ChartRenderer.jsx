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

// For bar charts: rotate and truncate every label
function BarTickLabel({ x, y, payload }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="end" fill="#9ca3af" fontSize={11} transform="rotate(-35)">
        {truncate(String(payload.value), 18)}
      </text>
    </g>
  );
}

// For line charts: smart sparse labels — show max 8 evenly spaced
function computeInterval(dataLength) {
  if (dataLength <= 8) return 0;           // show all
  return Math.ceil(dataLength / 8) - 1;   // show ~8 ticks
}

// Format a date/timestamp tick to a short readable form
function formatDateTick(val) {
  if (!val) return '';
  // If it looks like a date string, format it
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  return truncate(String(val), 12);
}

function LineTickLabel({ x, y, payload, isDate }) {
  const label = isDate ? formatDateTick(payload.value) : truncate(String(payload.value), 12);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={14} textAnchor="middle" fill="#9ca3af" fontSize={10}>
        {label}
      </text>
    </g>
  );
}

// Detect if the x values look like dates
function looksLikeDates(data) {
  if (!data?.length) return false;
  const sample = data.slice(0, 5).map((d) => d.name);
  return sample.every((v) => !isNaN(Date.parse(v)) && isNaN(Number(v)));
}

export default function ChartRenderer({ chartData, height = 340 }) {
  if (!chartData || !chartData.data?.length) return null;

  const { type, data, xAxis, yAxis } = chartData;
  const isDate = looksLikeDates(data);
  const lineInterval = computeInterval(data.length);

  const commonProps = {
    data,
    margin: { top: 10, right: 20, left: 0, bottom: type === 'bar' ? 70 : 30 },
  };

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="name" tick={<BarTickLabel />} interval={0} />
            <YAxis tickFormatter={formatNumber} tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [formatNumber(v), yAxis]} />
            <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>

        ) : type === 'line' ? (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="name"
              interval={lineInterval}
              tick={(props) => <LineTickLabel {...props} isDate={isDate} />}
              tickLine={false}
            />
            <YAxis tickFormatter={formatNumber} tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(v) => isDate ? new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : v}
              formatter={(v) => [formatNumber(v), yAxis]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={COLORS[0]}
              strokeWidth={2}
              dot={data.length <= 30 ? { r: 3, fill: COLORS[0] } : false}
              activeDot={{ r: 5 }}
            />
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
