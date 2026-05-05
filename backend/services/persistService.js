const { Client } = require('pg');
require('dotenv').config();

// Maps our inferred types to Postgres column types
const PG_TYPE = { number: 'NUMERIC', date: 'TIMESTAMPTZ', string: 'TEXT' };

function getAppClient() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// Build a readable PG table name from the original file name
// e.g. "sales data 2024.csv" → "sales_data_2024"
function tableNameFor(datasetId, fileName) {
  if (fileName) {
    const base = fileName
      .replace(/\.[^.]+$/, '')        // strip extension
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')   // non-alphanumeric → underscore
      .replace(/^_+|_+$/g, '')       // trim leading/trailing underscores
      .slice(0, 40);                  // max 40 chars to stay under PG limit
    if (base) return base;
  }
  return `ds_${datasetId.replace(/-/g, '_')}`;
}

async function persistRows(datasetId, columns, rows, fileName) {
  if (!process.env.DATABASE_URL) return null;

  const client = getAppClient();
  await client.connect();

  // If a table with this name already exists (same file uploaded again), append short id suffix
  let tableName = tableNameFor(datasetId, fileName);
  const exists = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
    [tableName]
  );
  if (exists.rows.length) tableName = `${tableName}_${datasetId.slice(0, 6)}`;

  try {
    // Build CREATE TABLE
    const colDefs = columns
      .map((c) => `"${sanitizeCol(c.name)}" ${PG_TYPE[c.type] || 'TEXT'}`)
      .join(', ');
    await client.query(`DROP TABLE IF EXISTS "${tableName}"`);
    await client.query(`CREATE TABLE "${tableName}" (${colDefs})`);

    // Batch insert in chunks of 500
    const colNames = columns.map((c) => `"${sanitizeCol(c.name)}"`).join(', ');
    const CHUNK = 500;

    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const placeholders = chunk
        .map((_, ri) => `(${columns.map((_, ci) => `$${ri * columns.length + ci + 1}`).join(', ')})`)
        .join(', ');
      const values = chunk.flatMap((row) =>
        columns.map((c) => {
          const v = row[c.name];
          if (v === null || v === undefined || v === '') return null;
          if (c.type === 'number') return isNaN(Number(v)) ? null : Number(v);
          if (c.type === 'date') return isNaN(Date.parse(v)) ? null : new Date(v).toISOString();
          return String(v);
        })
      );
      await client.query(`INSERT INTO "${tableName}" (${colNames}) VALUES ${placeholders}`, values);
    }

    return tableName;
  } finally {
    await client.end();
  }
}

async function fetchPersistedRows(tableName, limit = 50, offset = 0) {
  const client = getAppClient();
  await client.connect();
  try {
    const res = await client.query(`SELECT * FROM "${tableName}" LIMIT $1 OFFSET $2`, [limit, offset]);
    const countRes = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
    return { rows: res.rows, total: parseInt(countRes.rows[0].count) };
  } finally {
    await client.end();
  }
}

async function dropPersistedTable(tableName) {
  const client = getAppClient();
  await client.connect();
  try {
    await client.query(`DROP TABLE IF EXISTS "${tableName}"`);
  } finally {
    await client.end();
  }
}

function sanitizeCol(name) {
  return name.replace(/"/g, '').trim();
}

module.exports = { persistRows, fetchPersistedRows, dropPersistedTable, tableNameFor };

