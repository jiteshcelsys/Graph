const { buildChartData } = require('./chartService');

// Columns whose names suggest meaningful KPI aggregations
const KPI_PRIORITY = ['amount', 'total', 'sales', 'revenue', 'salary', 'price', 'profit', 'score', 'rating', 'count', 'quantity', 'value'];

function pickIcon(colName) {
  const n = colName.toLowerCase();
  if (/amount|sales|revenue|price|salary|profit|total/.test(n)) return 'dollar';
  if (/rating|score|rank/.test(n)) return 'star';
  if (/count|quantity|num|qty/.test(n)) return 'hash';
  if (/percent|rate|ratio/.test(n)) return 'percent';
  return 'bar';
}

function computeKPIs(columns, rows) {
  const numericCols = columns.filter((c) => c.type === 'number');
  if (!numericCols.length) return [{ label: 'Total Rows', value: rows.length.toLocaleString(), raw: rows.length, icon: 'hash' }];

  // Sort by priority keyword match
  const sorted = [...numericCols].sort((a, b) => {
    const ai = KPI_PRIORITY.findIndex((k) => a.name.toLowerCase().includes(k));
    const bi = KPI_PRIORITY.findIndex((k) => b.name.toLowerCase().includes(k));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const kpis = [];

  // Always add total row count as first KPI
  kpis.push({ label: 'Total Records', value: rows.length.toLocaleString(), raw: rows.length, icon: 'hash', agg: 'count' });

  for (const col of sorted.slice(0, 3)) {
    const vals = rows.map((r) => parseFloat(r[col.name])).filter((v) => !isNaN(v));
    if (!vals.length) continue;

    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = sum / vals.length;
    const max = Math.max(...vals);

    // Pick the most meaningful single stat for this column
    const name = col.name.toLowerCase();
    if (/count|qty|quantity|num/.test(name)) {
      kpis.push({ label: `Total ${formatLabel(col.name)}`, value: Math.round(sum).toLocaleString(), raw: sum, icon: pickIcon(col.name), agg: 'sum', column: col.name });
    } else if (/rating|score|rate|percent/.test(name)) {
      kpis.push({ label: `Avg ${formatLabel(col.name)}`, value: avg.toFixed(2), raw: avg, icon: pickIcon(col.name), agg: 'avg', column: col.name });
    } else {
      kpis.push({ label: `Total ${formatLabel(col.name)}`, value: formatValue(sum), raw: sum, icon: pickIcon(col.name), agg: 'sum', column: col.name });
    }

    if (kpis.length >= 4) break;
  }

  // Pad to 4 if needed with avg of last numeric col
  if (kpis.length < 4 && sorted.length >= 1) {
    const col = sorted[0];
    const vals = rows.map((r) => parseFloat(r[col.name])).filter((v) => !isNaN(v));
    if (vals.length) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      kpis.push({ label: `Avg ${formatLabel(col.name)}`, value: avg.toFixed(2), raw: avg, icon: 'bar', agg: 'avg', column: col.name });
    }
  }

  return kpis.slice(0, 4);
}

function buildAutoDashboard(columns, rows) {
  const numeric = columns.filter((c) => c.type === 'number');
  const categorical = columns.filter((c) => c.type === 'string');
  const dates = columns.filter((c) => c.type === 'date');

  const kpis = computeKPIs(columns, rows);
  const charts = [];

  // Chart 1: Bar — best categorical × best numeric
  if (categorical.length && numeric.length) {
    const xAxis = categorical[0].name;
    const yAxis = pickBestNumeric(numeric);
    charts.push({
      id: 'bar-main',
      type: 'bar',
      title: `${formatLabel(yAxis)} by ${formatLabel(xAxis)}`,
      ...buildChartData(rows, { xAxis, yAxis, type: 'bar', aggregation: 'sum', limit: 10 }),
    });
  }

  // Chart 2: Donut — categorical distribution
  if (categorical.length) {
    const xAxis = categorical.length > 1 ? categorical[1].name : categorical[0].name;
    const yAxis = numeric.length ? pickBestNumeric(numeric) : null;
    if (yAxis) {
      charts.push({
        id: 'donut-main',
        type: 'pie',
        title: `${formatLabel(xAxis)} Distribution`,
        ...buildChartData(rows, { xAxis, yAxis, type: 'pie', aggregation: 'count', limit: 6 }),
      });
    }
  }

  // Chart 3: Line/Area — date × numeric OR second categorical × numeric
  if (dates.length && numeric.length) {
    const xAxis = dates[0].name;
    const yAxis = pickBestNumeric(numeric);
    charts.push({
      id: 'line-main',
      type: 'line',
      title: `${formatLabel(yAxis)} Over Time`,
      ...buildChartData(rows, { xAxis, yAxis, type: 'line', aggregation: 'sum', limit: 30 }),
    });
  } else if (categorical.length >= 2 && numeric.length) {
    const xAxis = categorical[1].name;
    const yAxis = pickBestNumeric(numeric);
    charts.push({
      id: 'line-main',
      type: 'line',
      title: `${formatLabel(yAxis)} by ${formatLabel(xAxis)}`,
      ...buildChartData(rows, { xAxis, yAxis, type: 'line', aggregation: 'sum', limit: 20 }),
    });
  }

  return { kpis, charts };
}

function pickBestNumeric(numericCols) {
  const sorted = [...numericCols].sort((a, b) => {
    const ai = KPI_PRIORITY.findIndex((k) => a.name.toLowerCase().includes(k));
    const bi = KPI_PRIORITY.findIndex((k) => b.name.toLowerCase().includes(k));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return sorted[0].name;
}

function formatLabel(col) {
  return col.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

module.exports = { buildAutoDashboard, computeKPIs };
