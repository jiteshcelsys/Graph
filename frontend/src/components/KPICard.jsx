import { DollarSign, Star, Hash, Percent, BarChart2 } from 'lucide-react';

const ICONS = {
  dollar:  { Icon: DollarSign, bg: 'bg-blue-500',   text: 'text-white' },
  star:    { Icon: Star,       bg: 'bg-amber-500',  text: 'text-white' },
  hash:    { Icon: Hash,       bg: 'bg-violet-500', text: 'text-white' },
  percent: { Icon: Percent,    bg: 'bg-emerald-500',text: 'text-white' },
  bar:     { Icon: BarChart2,  bg: 'bg-rose-500',   text: 'text-white' },
};

const CARD_ACCENTS = [
  'border-blue-800/60 bg-blue-950/30',
  'border-amber-800/60 bg-amber-950/20',
  'border-violet-800/60 bg-violet-950/20',
  'border-emerald-800/60 bg-emerald-950/20',
];

export default function KPICard({ kpi, index = 0 }) {
  const { Icon, bg } = ICONS[kpi.icon] || ICONS.bar;
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];

  return (
    <div className={`rounded-2xl border p-5 flex items-start justify-between gap-4 ${accent}`}>
      <div className="space-y-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider truncate">{kpi.label}</p>
        <p className="text-2xl font-bold text-gray-100 tabular-nums leading-tight">{kpi.value}</p>
        {kpi.agg && (
          <p className="text-xs text-gray-600 capitalize">{kpi.agg} · {kpi.column || 'all rows'}</p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}
