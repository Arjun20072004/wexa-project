import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setToken } from '../services/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const handleUnauthorized = () => { setToken(null); setUser(null); };
    window.addEventListener('Wexa:unauthorized', handleUnauthorized);
    if (localStorage.getItem('Wexa_token')) api('/auth/me').then(data => setUser(data.user)).catch(() => setToken(null)).finally(() => setLoading(false));
    else setLoading(false);
    return () => window.removeEventListener('Wexa:unauthorized', handleUnauthorized);
  }, []);
  const value = useMemo(() => ({ user, loading, async login(payload) { const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(payload) }); setToken(data.token); setUser(data.user); }, async register(payload) { const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(payload) }); setToken(data.token); setUser(data.user); }, logout() { setToken(null); setUser(null); } }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
