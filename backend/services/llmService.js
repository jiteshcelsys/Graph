const { ChatAnthropic } = require('@langchain/anthropic');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

const FALLBACK = { summary: '', insights: [], suggestedCharts: [] };

function getModel() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new ChatAnthropic({
    model: 'claude-sonnet-4-6',
    temperature: 0,
    maxTokens: 1024,
  });
}

// Robustly extract JSON from a response that may have surrounding text/markdown
function extractJSON(text) {
  // Strip markdown code fences
  let cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  // Find the first { ... } block
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    cleaned = cleaned.slice(start, end + 1);
  }
  return JSON.parse(cleaned);
}

async function analyzeDataset(columns, sampleRows) {
  const model = getModel();
  if (!model) return FALLBACK;

  const colSummary = columns.map((c) => `${c.name} (${c.type})`).join(', ');
  const sample = JSON.stringify(sampleRows.slice(0, 10), null, 2);

  const system = [
    'You are a data analyst. Analyze the dataset and respond ONLY with a JSON object.',
    'No markdown, no explanation — raw JSON only.',
    'Shape: {"summary":"...","insights":["...","...","..."],"suggestedCharts":[]}',
    'Keep each insight under 15 words and specific to the actual data values.',
  ].join('\n');

  const human = `Columns: ${colSummary}\n\nSample rows:\n${sample}`;

  try {
    const res = await model.invoke([new SystemMessage(system), new HumanMessage(human)]);
    return extractJSON(res.content);
  } catch (e) {
    console.error('LLM analyzeDataset error:', e.message);
    return FALLBACK;
  }
}

async function answerQuestion(columns, rows, question) {
  const model = getModel();
  if (!model) return { answer: 'LLM not configured. Add ANTHROPIC_API_KEY to .env', chartConfig: null };

  const colList = columns.map((c) => `${c.name} (${c.type})`).join(', ');
  const numericCols = columns.filter((c) => c.type === 'number').map((c) => c.name);
  const sample = JSON.stringify(rows.slice(0, 20), null, 2);

  const system = [
    'You are a data analyst. Answer the user question about the dataset.',
    'Respond ONLY with a raw JSON object — no markdown, no explanation.',
    'Use this exact shape:',
    '{"answer":"one clear sentence answering the question","chartConfig":{"type":"bar","xAxis":"colName","yAxis":"numericColName","aggregation":"sum","limit":10}}',
    'Rules:',
    '- xAxis and yAxis must be exact column names from the dataset',
    `- yAxis must be one of the numeric columns: ${numericCols.join(', ') || 'none'}`,
    '- aggregation must be exactly: sum, avg, or count',
    '- type must be exactly: bar, line, or pie',
    '- If no chart makes sense for the question, set chartConfig to null',
  ].join('\n');

  const human = `Columns: ${colList}\n\nSample data (first 20 rows):\n${sample}\n\nQuestion: ${question}`;

  try {
    const res = await model.invoke([new SystemMessage(system), new HumanMessage(human)]);
    console.log('[LLM raw response]', res.content); // debug log
    const parsed = extractJSON(res.content);

    // Validate chartConfig columns actually exist
    if (parsed.chartConfig) {
      const colNames = columns.map((c) => c.name);
      if (!colNames.includes(parsed.chartConfig.xAxis) || !colNames.includes(parsed.chartConfig.yAxis)) {
        console.warn('[LLM] chartConfig references unknown columns, dropping chart');
        parsed.chartConfig = null;
      }
    }

    return parsed;
  } catch (e) {
    console.error('LLM answerQuestion error:', e.message, '\nRaw:', e.raw || '');
    return { answer: 'Could not process question. Try rephrasing.', chartConfig: null };
  }
}

module.exports = { analyzeDataset, answerQuestion };
