import { useState } from 'react';
import { Sparkles, Send, Loader2, MessageSquare, Lightbulb } from 'lucide-react';
import ChartRenderer from './ChartRenderer';
import api from '../utils/api';

export default function InsightsPanel({ datasetId, summary, insights = [] }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function ask() {
    if (!question.trim() || !datasetId) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/analytics/ask', { datasetId, question });
      setResult(data);
    } catch (e) {
      setResult({ answer: e.response?.data?.error || 'Failed to get answer', chartData: null });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* AI Insights */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-800">
          <div className="w-6 h-6 rounded-lg bg-amber-950/60 border border-amber-800/50 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-200">AI Insights</h3>
        </div>

        {summary && (
          <p className="text-xs text-gray-400 leading-relaxed bg-gray-800/50 rounded-lg px-3 py-2">
            {summary}
          </p>
        )}

        {insights.length > 0 ? (
          <ul className="space-y-2">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-950/60 border border-blue-800/50 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-3 h-3 text-blue-400" />
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{insight}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-600 text-center py-4">
            Add <code className="text-gray-500">ANTHROPIC_API_KEY</code> to backend/.env to enable AI insights
          </p>
        )}
      </div>

      {/* Natural Language Query */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-800">
          <div className="w-6 h-6 rounded-lg bg-violet-950/60 border border-violet-800/50 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-200">Ask a Question</h3>
        </div>

        <div className="flex gap-2">
          <input
            className="input flex-1 text-xs"
            placeholder="e.g. Which region has the highest sales?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
          />
          <button
            className="btn-primary px-3 shrink-0"
            onClick={ask}
            disabled={loading || !question.trim()}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Suggested questions */}
        {!result && !loading && (
          <div className="flex flex-wrap gap-1.5">
            {['What is the total?', 'Show top 5', 'What is the average?'].map((q) => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                className="text-xs px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="bg-violet-950/30 border border-violet-800/40 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-200 leading-relaxed">{result.answer}</p>
            </div>
            {result.chartData?.data?.length > 0 && (
              <ChartRenderer chartData={result.chartData} height={200} />
            )}
            <button
              onClick={() => { setResult(null); setQuestion(''); }}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Ask another question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
