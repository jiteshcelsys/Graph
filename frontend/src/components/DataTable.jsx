import { useState } from 'react';
import { columnTypeBadgeColor, truncate } from '../utils/formatters';

const PAGE_SIZE = 20;

export default function DataTable({ columns = [], rows = [], rowCount }) {
  const [page, setPage] = useState(0);

  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);

  if (!columns.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {columns.map((c) => (
            <span key={c.name} className={`text-xs px-2 py-0.5 rounded-full font-mono ${columnTypeBadgeColor(c.type)}`}>
              {c.name} <span className="opacity-60">({c.type})</span>
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-500 shrink-0 ml-2">{rowCount?.toLocaleString()} rows</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              {columns.map((c) => (
                <th key={c.name} className="px-3 py-2 text-left font-medium text-gray-400 whitespace-nowrap">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i} className="border-b border-gray-800/60 hover:bg-gray-800/40 transition-colors">
                {columns.map((c) => (
                  <td key={c.name} className="px-3 py-1.5 text-gray-300 whitespace-nowrap font-mono">
                    {truncate(row[c.name])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-1">
            <button className="btn-secondary py-1 px-2 text-xs" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <button className="btn-secondary py-1 px-2 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
