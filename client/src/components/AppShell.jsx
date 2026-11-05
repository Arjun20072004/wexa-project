import { useEffect, useMemo, useRef, useState } from 'react';
import { Menu, Search, Bell, ChevronDown, LogOut, UserRound, Package, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function AppShell({ children, title, description, action }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function loadProducts() {
    setSearchLoading(true); setSearchError('');
    try { const result = await api('/products'); setProducts(result.products || []); }
    catch (error) { setSearchError(error.message); }
    finally { setSearchLoading(false); }
  }
  async function loadNotifications() {
    setNotificationLoading(true); setNotificationError('');
    try { const result = await api('/dashboard'); setNotifications(result.lowStockItems || []); }
    catch (error) { setNotificationError(error.message); }
    finally { setNotificationLoading(false); }
  }
  function openSearch() {
    setSearchOpen(true); setNotificationsOpen(false); setProfileOpen(false);
    if (!products.length) loadProducts();
    setTimeout(() => searchRef.current?.focus(), 0);
  }
  function openNotifications() {
    const next = !notificationsOpen;
    setNotificationsOpen(next); setSearchOpen(false); setProfileOpen(false);
    if (next) loadNotifications();
  }
  const matches = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return products.slice(0, 5);
    return products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 7);
  }, [products, searchTerm]);
  function chooseProduct(product) {
    setSearchOpen(false); setSearchTerm('');
    navigate(`/products?search=${encodeURIComponent(product.name)}`);
  }
  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); }
      if (event.key === 'Escape') { setSearchOpen(false); setNotificationsOpen(false); setProfileOpen(false); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return <div className="app-layout">
    <Sidebar mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)}/>
    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={21}/></button>
        <div className="breadcrumb"><span>Workspace</span><span className="crumb-separator">/</span><strong>{title}</strong></div>
        <div className="topbar-right">
          <button className={`topbar-search ${searchOpen ? 'active' : ''}`} onClick={openSearch} aria-label="Search products"><Search size={16}/><span>Search products</span><kbd>Ctrl K</kbd></button>
          <div className="topbar-popover-anchor">
            <button className={`icon-button notification-button ${notificationsOpen ? 'active' : ''}`} onClick={openNotifications} aria-label="Notifications" aria-expanded={notificationsOpen}><Bell size={18}/>{notifications.length > 0 && <i/>}</button>
            {notificationsOpen && <div className="header-popover notification-popover">
              <div className="popover-heading"><div><strong>Notifications</strong><span>Inventory alerts</span></div><button className="popover-close" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={15}/></button></div>
              {notificationLoading ? <div className="popover-empty">Checking inventory…</div> : notificationError ? <div className="popover-empty popover-error">{notificationError}<button onClick={loadNotifications}>Retry</button></div> : notifications.length === 0 ? <div className="popover-empty"><Package size={21}/><strong>You're all caught up</strong><span>No low-stock products right now.</span></div> : <div className="notification-list">{notifications.slice(0, 6).map(item => <button className="notification-item" key={item.id} onClick={() => { setNotificationsOpen(false); navigate('/products?filter=low'); }}><span className="notification-icon"><AlertTriangle size={16}/></span><span className="notification-copy"><strong>{item.name}</strong><small>{item.quantityOnHand} in stock · threshold {item.effectiveThreshold}</small></span></button>)}</div>}
              <button className="popover-footer" onClick={() => { setNotificationsOpen(false); navigate('/products?filter=low'); }}>View low-stock products</button>
            </div>}
          </div>
          <div className="topbar-popover-anchor">
            <button className="topbar-user profile-trigger" onClick={() => { setProfileOpen(v => !v); setSearchOpen(false); setNotificationsOpen(false); }} aria-expanded={profileOpen}><div className="profile-avatar small">{(user?.name || 'U').slice(0,1).toUpperCase()}</div><span className="topbar-user-name">{user?.name || 'Account'}</span><ChevronDown size={15}/></button>
            {profileOpen && <div className="header-popover profile-popover"><div className="profile-popover-user"><div className="profile-avatar">{(user?.name || 'U').slice(0,1).toUpperCase()}</div><span><strong>{user?.name || 'User'}</strong><small>{user?.email || ''}</small></span></div><div className="profile-popover-org">{user?.organizationName || 'My workspace'}</div><button className="profile-logout" onClick={logout}><LogOut size={15}/> Sign out</button></div>}
          </div>
        </div>
      </header>
      {searchOpen && <><button className="popover-backdrop" aria-label="Close search" onClick={() => setSearchOpen(false)}/><div className="global-search-panel"><div className="global-search-input"><Search size={18}/><input ref={searchRef} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search products by name or SKU…"/><kbd>ESC</kbd><button onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={17}/></button></div><div className="global-search-results">{searchLoading ? <div className="popover-empty">Loading products…</div> : searchError ? <div className="popover-empty popover-error">{searchError}<button onClick={loadProducts}>Retry</button></div> : matches.length ? <>{!searchTerm && <div className="search-results-label">RECENT CATALOG</div>}{matches.map(product => <button className="global-search-result" key={product.id} onClick={() => chooseProduct(product)}><span className="search-result-icon"><Package size={16}/></span><span><strong>{product.name}</strong><small>{product.sku}</small></span><span className="search-result-quantity">{product.quantityOnHand} units</span></button>)}</> : <div className="popover-empty"><Package size={21}/><strong>No products found</strong><span>Try another product name or SKU.</span></div>}</div><div className="global-search-hint">Search is limited to products in your workspace.</div></div></>}
      <div className="page-content"><div className="page-heading"><div><div className="eyebrow">YOUR WORKSPACE</div><h1>{title}</h1><p>{description}</p></div>{action && <div className="page-heading-action">{action}</div>}</div>{children}<footer className="app-footer"><span>© {new Date().getFullYear()} Wexa</span><span>Inventory clarity for growing businesses <span className="footer-spark">✦</span></span></footer></div>
    </main>
  </div>;
}
