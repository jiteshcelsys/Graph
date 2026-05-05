const sessionStore = require('../services/sessionStore');
const { buildAutoDashboard } = require('../services/analyticsService');
const { analyzeDataset, answerQuestion } = require('../services/llmService');
const { buildChartData } = require('../services/chartService');
const { createError } = require('../middleware/errorHandler');

async function autoDashboard(req, res) {
  const { datasetId } = req.body;
  if (!datasetId) throw createError('datasetId is required');

  const data = sessionStore.get(datasetId);
  if (!data) throw createError('Dataset not found or session expired', 404);

  const { rows, columns } = data;

  // Run analytics + LLM in parallel
  const [dashboard, llmResult] = await Promise.all([
    Promise.resolve(buildAutoDashboard(columns, rows)),
    analyzeDataset(columns, rows),
  ]);

  res.json({
    kpis: dashboard.kpis,
    charts: dashboard.charts,
    summary: llmResult.summary,
    insights: llmResult.insights,
  });
}

async function askQuestion(req, res) {
  const { datasetId, question } = req.body;
  if (!datasetId) throw createError('datasetId is required');
  if (!question) throw createError('question is required');

  const data = sessionStore.get(datasetId);
  if (!data) throw createError('Dataset not found or session expired', 404);

  const { rows, columns } = data;
  const { answer, chartConfig } = await answerQuestion(columns, rows, question);

  let chartData = null;
  if (chartConfig && chartConfig.xAxis && chartConfig.yAxis) {
    try {
      chartData = buildChartData(rows, chartConfig);
    } catch (_) {}
  }

  res.json({ answer, chartData });
}

module.exports = { autoDashboard, askQuestion };
