import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach session ID for DB operations
api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('db_session_id');
  if (sessionId) config.headers['x-session-id'] = sessionId;
  return config;
});

export default api;
