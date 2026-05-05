const { Client: PgClient } = require('pg');
const mysql = require('mysql2/promise');

// Active connections keyed by sessionId
const connections = new Map();

async function connect({ sessionId, dialect, host, port, user, password, database }) {
  await disconnect(sessionId); // close previous if any

  if (dialect === 'postgresql') {
    const client = new PgClient({ host, port: Number(port), user, password, database, connectionTimeoutMillis: 5000 });
    await client.connect();
    connections.set(sessionId, { client, dialect });
    return { ok: true };
  }

  if (dialect === 'mysql') {
    const conn = await mysql.createConnection({ host, port: Number(port), user, password, database, connectTimeout: 5000 });
    connections.set(sessionId, { client: conn, dialect });
    return { ok: true };
  }

  throw new Error(`Unsupported dialect: ${dialect}`);
}

async function disconnect(sessionId) {
  const entry = connections.get(sessionId);
  if (!entry) return;
  try {
    if (entry.dialect === 'postgresql') await entry.client.end();
    else await entry.client.end();
  } catch (_) {}
  connections.delete(sessionId);
}

async function getTables(sessionId) {
  const entry = getEntry(sessionId);

  if (entry.dialect === 'postgresql') {
    const res = await entry.client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name NOT IN ('Dataset','Chart','_prisma_migrations') ORDER BY table_name`
    );
    return res.rows.map((r) => r.table_name);
  }

  if (entry.dialect === 'mysql') {
    const [rows] = await entry.client.query('SHOW TABLES');
    return rows.map((r) => Object.values(r)[0]);
  }
}

async function getTableData(sessionId, tableName, limit = 500) {
  const entry = getEntry(sessionId);
  const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, '');

  if (entry.dialect === 'postgresql') {
    const res = await entry.client.query(`SELECT * FROM "${safeTable}" LIMIT $1`, [limit]);
    const rows = res.rows.map((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, v !== null && typeof v === 'object' ? JSON.stringify(v) : v])
      )
    );
    return { rows, columns: inferColumnsFromPg(res.fields, res.rows) };
  }

  if (entry.dialect === 'mysql') {
    const [rows, fields] = await entry.client.query(`SELECT * FROM \`${safeTable}\` LIMIT ?`, [limit]);
    return { rows, columns: inferColumnsFromMysql(fields, rows) };
  }
}

function getEntry(sessionId) {
  const entry = connections.get(sessionId);
  if (!entry) throw Object.assign(new Error('No active DB connection for this session'), { status: 400 });
  return entry;
}

function inferColumnsFromPg(fields, rows) {
  // pg type OIDs: 23=int4, 20=int8, 700=float4, 701=float8, 1700=numeric, 1082=date, 1114=timestamp
  const numericOids = new Set([20, 21, 23, 700, 701, 1700]);
  const dateOids = new Set([1082, 1083, 1114, 1184]);
  return fields.map((f) => ({
    name: f.name,
    type: numericOids.has(f.dataTypeID) ? 'number' : dateOids.has(f.dataTypeID) ? 'date' : 'string',
  }));
}

function inferColumnsFromMysql(fields, rows) {
  const { analyzeColumns } = require('./fileParser');
  const plain = rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? '')])));
  return analyzeColumns(plain);
}

module.exports = { connect, disconnect, getTables, getTableData };
