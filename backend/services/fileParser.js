const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const XLSX = require('xlsx');

const PREVIEW_ROWS = 50;

function inferType(values) {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (!nonEmpty.length) return 'string';

  const isNum = nonEmpty.every((v) => !isNaN(Number(v)));
  if (isNum) return 'number';

  const isDate = nonEmpty.every((v) => !isNaN(Date.parse(v)) && isNaN(Number(v)));
  if (isDate) return 'date';

  return 'string';
}

function analyzeColumns(rows) {
  if (!rows.length) return [];
  return Object.keys(rows[0]).map((name) => {
    const values = rows.map((r) => r[name]);
    return { name, type: inferType(values) };
  });
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length && result.errors.some((e) => e.type === 'Quotes')) {
    throw new Error('CSV parsing error: ' + result.errors[0].message);
  }

  return { rows: result.data, columns: analyzeColumns(result.data) };
}

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return { rows, columns: analyzeColumns(rows) };
}

function parseSQL(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Match the first INSERT INTO block: INSERT INTO `table` (...cols...) VALUES (...), (...);
  const insertRegex = /INSERT\s+INTO\s+[`"']?(\w+)[`"']?\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+?);/gi;
  const match = insertRegex.exec(content);

  if (!match) throw new Error('No INSERT statements found in SQL file');

  const colNames = match[2].split(',').map((c) => c.trim().replace(/[`"']/g, ''));

  // Parse each VALUES row — handles quoted strings, nulls, numbers
  const valueBlock = match[3];
  const rowRegex = /\(([^)]+)\)/g;
  const rows = [];
  let rowMatch;

  while ((rowMatch = rowRegex.exec(valueBlock)) !== null) {
    const values = splitSQLValues(rowMatch[1]);
    if (values.length !== colNames.length) continue;
    const row = {};
    colNames.forEach((col, i) => {
      const raw = values[i].trim();
      if (raw.toUpperCase() === 'NULL') row[col] = null;
      else if (/^['"]/.test(raw)) row[col] = raw.slice(1, -1).replace(/\\'/g, "'");
      else row[col] = raw;
    });
    rows.push(row);
  }

  if (!rows.length) throw new Error('Could not parse any rows from SQL file');
  return { rows, columns: analyzeColumns(rows) };
}

// Splits a VALUES row string by commas, respecting quoted strings
function splitSQLValues(str) {
  const result = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inQuote) {
      if (ch === '\\') { current += ch + str[++i]; continue; }
      if (ch === quoteChar) inQuote = false;
      current += ch;
    } else {
      if (ch === "'" || ch === '"') { inQuote = true; quoteChar = ch; current += ch; }
      else if (ch === ',') { result.push(current.trim()); current = ''; }
      else current += ch;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') return parseCSV(filePath);
  if (['.xlsx', '.xls'].includes(ext)) return parseExcel(filePath);
  if (ext === '.sql') return parseSQL(filePath);
  throw new Error('Unsupported file type');
}

function getPreview(rows) {
  return rows.slice(0, PREVIEW_ROWS);
}

module.exports = { parseFile, getPreview, analyzeColumns };
