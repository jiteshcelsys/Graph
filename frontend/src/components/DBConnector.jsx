import { useState, useEffect } from 'react';
import { Database, ChevronDown, Loader2, Unplug, Table, WifiOff, RefreshCw } from 'lucide-react';
import api from '../utils/api';

const STORAGE_KEY = 'dataviz_db_config';
const DEFAULT_FORM = { dialect: 'postgresql', host: 'localhost', port: '5432', user: '', password: '', database: '' };

function loadSavedConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_FORM, ...JSON.parse(raw) } : DEFAULT_FORM;
  } catch {
    return DEFAULT_FORM;
  }
}

function saveConfig(form) {
  // Never persist password
  const { password, ...safe } = form;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}

function clearConfig() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('db_session_id');
}

export default function DBConnector({ onConnected }) {
  const [form, setForm] = useState(loadSavedConfig);
  const [loading, setLoading] = useState(false);
  const [autoConnecting, setAutoConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [tables, setTables] = useState([]);

  // Auto-reconnect on mount if a previous config exists
  useEffect(() => {
    const saved = loadSavedConfig();
    const sessionId = localStorage.getItem('db_session_id');
    if (sessionId && saved.host && saved.user && saved.database) {
      autoReconnect(saved);
    }
  }, []);

  async function autoReconnect(saved) {
    setAutoConnecting(true);
    try {
      // Check if existing session still alive
      const tablesRes = await api.get('/db/tables');
      setTables(tablesRes.data.tables);
      setForm(saved);
      setConnected(true);
    } catch {
      // Session expired — silently clear session ID, keep form filled
      localStorage.removeItem('db_session_id');
    } finally {
      setAutoConnecting(false);
    }
  }

  function field(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function connect(overrideForm) {
    const f = overrideForm || form;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/db/connect', f);
      localStorage.setItem('db_session_id', data.sessionId);
      saveConfig(f);

      const tablesRes = await api.get('/db/tables');
      setTables(tablesRes.data.tables);
      setConnected(true);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Connection failed');
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    await api.post('/db/disconnect').catch(() => {});
    clearConfig();
    setConnected(false);
    setTables([]);
    setForm(DEFAULT_FORM);
    setError(null);
  }

  // Auto-connecting splash
  if (autoConnecting) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        <div>
          <p className="text-sm font-medium text-gray-300">Reconnecting…</p>
          <p className="text-xs text-gray-600 mt-0.5">{form.database} @ {form.host}</p>
        </div>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="space-y-3">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-green-950/40 border border-green-800/60 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-green-300 truncate">{form.database}</p>
              <p className="text-xs text-green-800">{form.user}@{form.host}:{form.port}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={() => connect()}
              title="Reconnect"
              className="p-1.5 text-gray-600 hover:text-blue-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={disconnect}
              title="Disconnect"
              className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
            >
              <Unplug className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table list */}
        <div className="space-y-1.5">
          <p className="label">Select a table</p>
          <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
            {tables.map((t) => (
              <button
                key={t}
                onClick={() => onConnected(t)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-800/80 hover:bg-gray-800
                  border border-gray-700/60 hover:border-blue-700 text-left transition-all group"
              >
                <Table className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors shrink-0" />
                <span className="text-xs text-gray-300 group-hover:text-gray-100 transition-colors">{t}</span>
              </button>
            ))}
            {!tables.length && (
              <p className="text-xs text-gray-600 text-center py-4">No tables found</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Previously used hint */}
      {form.host && form.user && form.database && (
        <div className="flex items-center gap-2 bg-blue-950/30 border border-blue-900/40 rounded-lg px-3 py-2">
          <WifiOff className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-300 truncate">Last used: <span className="font-medium">{form.database}</span> @ {form.host}</p>
            <p className="text-xs text-blue-800">Enter password to reconnect</p>
          </div>
        </div>
      )}

      {/* Dialect */}
      <div>
        <label className="label">Dialect</label>
        <div className="relative">
          <select value={form.dialect} onChange={field('dialect')} className="input appearance-none pr-8">
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
          </select>
          <ChevronIcon />
        </div>
      </div>

      {/* Host + Port */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="label">Host</label>
          <input className="input" value={form.host} onChange={field('host')} placeholder="localhost" />
        </div>
        <div>
          <label className="label">Port</label>
          <input className="input" value={form.port} onChange={field('port')} placeholder="5432" />
        </div>
      </div>

      {/* User + Password */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Username</label>
          <input className="input" value={form.user} onChange={field('user')} placeholder="postgres" />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={form.password} onChange={field('password')}
            placeholder="••••••" onKeyDown={(e) => e.key === 'Enter' && connect()} />
        </div>
      </div>

      {/* Database */}
      <div>
        <label className="label">Database</label>
        <input className="input" value={form.database} onChange={field('database')} placeholder="my_database"
          onKeyDown={(e) => e.key === 'Enter' && connect()} />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Connect */}
      <button
        className="btn-primary w-full justify-center"
        onClick={() => connect()}
        disabled={loading || !form.host || !form.user || !form.database}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
          : <><Database className="w-4 h-4" /> Connect</>}
      </button>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
      fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
