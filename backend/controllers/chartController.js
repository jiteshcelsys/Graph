const { buildChartData, suggestCharts } = require('../services/chartService');
const sessionStore = require('../services/sessionStore');
const { createError } = require('../middleware/errorHandler');

let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (_) {}

async function generateChart(req, res) {
  const { datasetId, xAxis, yAxis, type = 'bar', aggregation = 'sum', limit = 50 } = req.body;

  if (!datasetId) throw createError('datasetId is required');

  const data = sessionStore.get(datasetId);
  if (!data) throw createError('Dataset not found or session expired', 404);

  const chartData = buildChartData(data.rows, { xAxis, yAxis, type, aggregation, limit });
  res.json(chartData);
}

async function saveChart(req, res) {
  if (!prisma) throw createError('Database not configured', 503);

  const { datasetId, title, type, config } = req.body;
  if (!datasetId || !title || !type) throw createError('datasetId, title, and type are required');

  const chart = await prisma.chart.create({ data: { datasetId, title, type, config: config || {} } });
  res.json(chart);
}

async function getSavedCharts(req, res) {
  if (!prisma) return res.json({ charts: [] });

  const { datasetId } = req.query;
  const where = datasetId ? { datasetId } : {};
  const charts = await prisma.chart.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  res.json({ charts });
}

async function deleteChart(req, res) {
  if (!prisma) throw createError('Database not configured', 503);
  await prisma.chart.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
}

module.exports = { generateChart, saveChart, getSavedCharts, deleteChart };
