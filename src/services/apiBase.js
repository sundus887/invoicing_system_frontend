// src/services/apiBase.js
// Central API base for fetch-based calls
// For axios, we already use src/services/api.js which sets baseURL based on env

export const API_BASE = 'https://hsoftworks.vercel.app';

// Helper to prefix API_BASE for relative paths and include credentials by default
export async function apiFetch(pathOrUrl, options = {}) {
  const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
  const url = isAbsolute ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  const { headers = {}, credentials, ...rest } = options;
  const finalOptions = {
    credentials: credentials || 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  };
  return fetch(url, finalOptions);
}
