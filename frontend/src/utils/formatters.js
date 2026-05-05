export function formatNumber(n) {
  if (n === null || n === undefined) return '—';
  if (typeof n === 'number') return n.toLocaleString();
  return String(n);
}

export function truncate(val, len = 30) {
  if (val === null || val === undefined) return '—';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function columnTypeBadgeColor(type) {
  if (type === 'number') return 'bg-blue-900 text-blue-300';
  if (type === 'date') return 'bg-purple-900 text-purple-300';
  return 'bg-gray-800 text-gray-400';
}
