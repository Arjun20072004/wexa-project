const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
let token = localStorage.getItem('Wexa_token');
export const setToken = (value) => { token = value; if (value) localStorage.setItem('Wexa_token', value); else localStorage.removeItem('Wexa_token'); };
export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try { response = await fetch(`${API_URL}${path}`, { ...options, headers }); }
  catch { throw new Error('Cannot reach the server. Check that the API is running and try again.'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login' && path !== '/auth/register') window.dispatchEvent(new Event('Wexa:unauthorized'));
    throw new Error(data.message || 'Request failed. Please try again.');
  }
  return data;
}
