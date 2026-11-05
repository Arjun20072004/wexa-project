import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Settings from './pages/Settings';
import Toast from './components/Toast';
import './styles.css';
function Protected({ children }) { const { user, loading } = useAuth(); if (loading) return <div className="app-loading"><div className="loading-mark">S</div><span>Preparing your workspace…</span></div>; return user ? children : <Navigate to="/login" replace/>; }
function AppContent() {
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, type='success') => setToast({message,type,id:Date.now()}), []);
  return <><Routes><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/register" element={<AuthPage mode="register"/>}/><Route path="/" element={<Protected><Dashboard notify={notify}/></Protected>}/><Route path="/products" element={<Protected><Products notify={notify}/></Protected>}/><Route path="/settings" element={<Protected><Settings notify={notify}/></Protected>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes><Toast toast={toast} onClose={()=>setToast(null)}/></>;
}
export default function App() { return <BrowserRouter><AuthProvider><AppContent/></AuthProvider></BrowserRouter>; }
