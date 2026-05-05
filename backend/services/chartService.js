/**
 * Converts raw rows + config into structured Recharts-ready data.
 * Also suggests chart types based on column analysis.
 */

function suggestCharts(columns) {
  const numeric = columns.filter((c) => c.type === 'number').map((c) => c.name);
  const categorical = columns.filter((c) => c.type === 'string').map((c) => c.name);
  const dates = columns.filter((c) => c.type === 'date').map((c) => c.name);

  const suggestions = [];

  // Bar: categorical × numeric
  if (categorical.length && numeric.length) {
    suggestions.push({ type: 'bar', xAxis: categorical[0], yAxis: numeric[0], reason: 'Categorical vs numeric' });
  }

  // Line: date × numeric
  if (dates.length && numeric.length) {
    suggestions.push({ type: 'line', xAxis: dates[0], yAxis: numeric[0], reason: 'Time series' });
  }

  // Pie: categorical distribution
  if (categorical.length && numeric.length) {
    suggestions.push({ type: 'pie', xAxis: categorical[0], yAxis: numeric[0], reason: 'Category distribution' });
  }

  // Fallback bar
  if (!suggestions.length && numeric.length >= 2) {
    suggestions.push({ type: 'bar', xAxis: numeric[0], yAxis: numeric[1], reason: 'Numeric comparison' });
  }

  return suggestions;
}

function buildChartData(rows, { xAxis, yAxis, type, aggregation = 'sum', limit = 50 }) {
  if (!xAxis || !yAxis) throw new Error('xAxis and yAxis are required');

  // Aggregate by xAxis value
  const aggMap = new Map();
  for (const row of rows) {
    const x = String(row[xAxis] ?? '');
    const y = parseFloat(row[yAxis]) || 0;
    if (!aggMap.has(x)) aggMap.set(x, { values: [], count: 0 });
    aggMap.get(x).values.push(y);
    aggMap.get(x).count++;
  }

  let data = [...aggMap.entries()].map(([name, { values, count }]) => {
    let value;
    if (aggregation === 'avg') value = values.reduce((a, b) => a + b, 0) / count;
    else if (aggregation === 'count') value = count;
    else value = values.reduce((a, b) => a + b, 0); // sum
    return { name, value: parseFloat(value.toFixed(4)) };
  });

  // Sort and limit
  data = data.sort((a, b) => b.value - a.value).slice(0, limit);

  return { type, xAxis, yAxis, aggregation, data };
}

module.exports = { suggestCharts, buildChartData };
