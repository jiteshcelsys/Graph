const { v4: uuidv4 } = require('uuid');
const dbConnector = require('../services/dbConnector');
const sessionStore = require('../services/sessionStore');
const { suggestCharts } = require('../services/chartService');
const { createError } = require('../middleware/errorHandler');

async function connectDB(req, res) {
  const { dialect = 'postgresql', host, port, user, password, database } = req.body;

  if (!host || !user || !database) throw createError('host, user, and database are required');

  const sessionId = req.headers['x-session-id'] || uuidv4();
  await dbConnector.connect({ sessionId, dialect, host, port: port || 5432, user, password, database });

  res.json({ sessionId, message: 'Connected successfully' });
}

async function disconnectDB(req, res) {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) throw createError('x-session-id header required');
  await dbConnector.disconnect(sessionId);
  res.json({ message: 'Disconnected' });
}

async function getTables(req, res) {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) throw createError('x-session-id header required');
  const tables = await dbConnector.getTables(sessionId);
  res.json({ tables });
}

async function getTableData(req, res) {
  const sessionId = req.headers['x-session-id'];
  const { table, limit = 500 } = req.query;
  if (!sessionId) throw createError('x-session-id header required');
  if (!table) throw createError('table query param required');

  const { rows, columns } = await dbConnector.getTableData(sessionId, table, Number(limit));

  const datasetId = uuidv4();
  sessionStore.set(datasetId, { rows, columns });

  res.json({
    datasetId,
    table,
    rowCount: rows.length,
    columns,
    suggestions: suggestCharts(columns),
    preview: rows.slice(0, 50),
  });
}

module.exports = { connectDB, disconnectDB, getTables, getTableData };
