const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { parseFile, getPreview } = require('../services/fileParser');
const { suggestCharts } = require('../services/chartService');
const sessionStore = require('../services/sessionStore');
const { persistRows, fetchPersistedRows, dropPersistedTable } = require('../services/persistService');
const { createError } = require('../middleware/errorHandler');

let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (_) {}

async function uploadFile(req, res) {
  if (!req.file) throw createError('No file uploaded');

  const { rows, columns } = parseFile(req.file.path);
  fs.unlink(req.file.path, () => {});

  const datasetId = uuidv4();

  let tableName = null;
  try {
    tableName = await persistRows(datasetId, columns, rows);
  } catch (e) {
    console.warn('Could not persist rows to DB:', e.message);
  }

  sessionStore.set(datasetId, { rows, columns });

  if (prisma) {
    await prisma.dataset.create({
      data: { id: datasetId, name: req.file.originalname, source: 'file', columns, rowCount: rows.length, tableName },
    });
  }

  res.json({
    datasetId,
    name: req.file.originalname,
    rowCount: rows.length,
    columns,
    suggestions: suggestCharts(columns),
    preview: getPreview(rows),
    persisted: !!tableName,
  });
}

async function getDataPreview(req, res) {
  const { datasetId, page = 0, pageSize = 50 } = req.query;
  if (!datasetId) throw createError('datasetId is required');

  if (prisma) {
    const dataset = await prisma.dataset.findUnique({ where: { id: datasetId } });
    if (dataset?.tableName) {
      const { rows, total } = await fetchPersistedRows(dataset.tableName, Number(pageSize), Number(page) * Number(pageSize));
      return res.json({ columns: dataset.columns, preview: rows, rowCount: total, persisted: true });
    }
  }

  const data = sessionStore.get(datasetId);
  if (!data) throw createError('Dataset not found or session expired', 404);

  const offset = Number(page) * Number(pageSize);
  res.json({ columns: data.columns, preview: data.rows.slice(offset, offset + Number(pageSize)), rowCount: data.rows.length, persisted: false });
}

async function listDatasets(req, res) {
  if (!prisma) return res.json({ datasets: [] });
  const datasets = await prisma.dataset.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: { id: true, name: true, source: true, rowCount: true, columns: true, tableName: true, createdAt: true },
  });
  res.json({ datasets });
}

async function loadDataset(req, res) {
  if (!prisma) throw createError('Database not configured', 503);
  const dataset = await prisma.dataset.findUnique({ where: { id: req.params.id } });
  if (!dataset) throw createError('Dataset not found', 404);

  let preview = [];
  let rowCount = dataset.rowCount;

  if (dataset.tableName) {
    const result = await fetchPersistedRows(dataset.tableName, 50, 0);
    preview = result.rows;
    rowCount = result.total;
    // Reload rows into session store for chart generation
    const allRows = await fetchPersistedRows(dataset.tableName, rowCount, 0);
    sessionStore.set(dataset.id, { rows: allRows.rows, columns: dataset.columns });
  } else {
    const mem = sessionStore.get(dataset.id);
    if (mem) preview = getPreview(mem.rows);
  }

  res.json({
    datasetId: dataset.id,
    name: dataset.name,
    rowCount,
    columns: dataset.columns,
    suggestions: suggestCharts(dataset.columns),
    preview,
    persisted: !!dataset.tableName,
  });
}

async function deleteDataset(req, res) {
  if (!prisma) throw createError('Database not configured', 503);
  const dataset = await prisma.dataset.findUnique({ where: { id: req.params.id } });
  if (!dataset) throw createError('Dataset not found', 404);

  if (dataset.tableName) await dropPersistedTable(dataset.tableName);
  await prisma.chart.deleteMany({ where: { datasetId: dataset.id } });
  await prisma.dataset.delete({ where: { id: dataset.id } });
  sessionStore.remove(dataset.id);

  res.json({ message: 'Deleted' });
}

module.exports = { uploadFile, getDataPreview, listDatasets, loadDataset, deleteDataset };
