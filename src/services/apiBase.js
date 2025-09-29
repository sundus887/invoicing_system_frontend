// src/services/apiBase.js
// Central API base for fetch-based calls
// For axios, we already use src/services/api.js which sets baseURL based on env

export const API_BASE = 'https://hsoftworks.vercel.app';

// Helper to prefix API_BASE for relative paths and include credentials by default
export async function apiFetch(pathOrUrl, options = {}) {
  const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
  const envApiUrl = process.env.REACT_APP_API_URL?.trim();
  const useProxy = String(process.env.REACT_APP_USE_PROXY || '').toLowerCase() === 'true';
  // Determine base for relative URLs
  const base = useProxy
    ? '/api/proxy'
    : (envApiUrl && envApiUrl.length > 0 ? envApiUrl : API_BASE);

  const url = isAbsolute ? pathOrUrl : `${base}${pathOrUrl}`;
  const { headers = {}, credentials, ...rest } = options;

  // Auto-attach Authorization if present and not provided
  const finalHeaders = { 'Content-Type': 'application/json', ...headers };
  try {
    if (!finalHeaders.Authorization) {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) finalHeaders.Authorization = `Bearer ${token}`;
    }
  } catch (_) { /* ignore */ }

  const finalOptions = {
    credentials: credentials || 'include',
    headers: finalHeaders,
    ...rest,
  };

  return fetch(url, finalOptions);
}
