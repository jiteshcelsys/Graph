const { Client } = require('pg');
require('dotenv').config();

// Maps our inferred types to Postgres column types
const PG_TYPE = { number: 'NUMERIC', date: 'TIMESTAMPTZ', string: 'TEXT' };

function getAppClient() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// Sanitize dataset ID into a valid PG table name
function tableNameFor(datasetId) {
  return `ds_${datasetId.replace(/-/g, '_')}`;
}

async function persistRows(datasetId, columns, rows) {
  if (!process.env.DATABASE_URL) return null;

  const client = getAppClient();
  await client.connect();
  const tableName = tableNameFor(datasetId);

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
