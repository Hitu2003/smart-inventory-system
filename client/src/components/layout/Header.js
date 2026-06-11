import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiBell, FiSun, FiMoon, FiSearch, FiCheck, FiMenu, FiX } from 'react-icons/fi';
import { toggleSidebar, toggleTheme } from '../../redux/slices/uiSlice';
import { fetchNotifications, markAsRead, markAllAsRead } from '../../redux/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';
import api from '../../services/api';
import './Layout.css';

const notifIcons = {
  low_stock: '⚠️', out_of_stock: '🚫',
  new_transaction: '💰', system: '⚙️', alert: '🔔', info: 'ℹ️',
};

const routeLabels = {
  '/dashboard': 'Dashboard', '/products': 'Products', '/categories': 'Categories',
  '/suppliers': 'Suppliers', '/transactions': 'Transactions', '/customers': 'Customers',
  '/reports': 'Reports', '/users': 'Users', '/profile': 'Settings', '/audit-log': 'Audit Log',
};

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, theme } = useSelector((state) => state.ui);
  const { items: notifications, unreadCount } = useSelector((state) => state.notifications);
  const { user } = useSelector((state) => state.auth);

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const searchTimer = useRef(null);

  const currentPage = routeLabels[location.pathname] ||
    (location.pathname.startsWith('/products/') ? 'Product Detail' : '');

  // Load notifications on mount and every 60s
  useEffect(() => {
    dispatch(fetchNotifications());
    const interval = setInterval(() => dispatch(fetchNotifications()), 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    clearTimeout(searchTimer.current);
    if (!val.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setShowSearchResults(true);
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/products', { params: { search: val, limit: 6 } });
        setSearchResults(data.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  const handleResultClick = (productId) => {
    navigate(`/products/${productId}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleNotifClick = (notif) => {
    if (!notif.isRead) dispatch(markAsRead(notif._id));
    setShowNotifications(false);
  };

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const stockStatusColor = {
    in_stock: 'var(--success)',
    low_stock: 'var(--warning)',
    out_of_stock: 'var(--danger)',
    overstock: 'var(--info)',
  };

  return (
    <header className={`header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Left */}
      <div className="header-left">
        <button className="toggle-btn" onClick={() => dispatch(toggleSidebar())} aria-label="Toggle sidebar">
          <FiMenu />
        </button>
        {currentPage && (
          <div className="header-breadcrumb">
            SmartInventory &rsaquo; <span>{currentPage}</span>
          </div>
        )}
      </div>

      {/* Center — Search */}
      <div className="header-search-wrapper" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="header-search-input"
            placeholder="Search products, SKU..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <FiX size={14} />
            </button>
          )}
        </form>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="search-dropdown">
            {searchLoading ? (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <div className="spinner" style={{ width: 20, height: 20, margin: '0 auto' }} />
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                No products found for "{searchQuery}"
              </div>
            ) : (
              <>
                {searchResults.map((product) => (
                  <div
                    key={product._id}
                    className="search-result-item"
                    onClick={() => handleResultClick(product._id)}
                  >
                    <div className="search-result-thumb">
                      {product.images?.[0]?.url ? (
                        <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
                      ) : (
                        <span style={{ fontSize: '1.1rem' }}>📦</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 2 }}>
                        <span>{product.sku}</span>
                        {product.category?.name && <span>· {product.category.name}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        ₹{product.price?.selling?.toLocaleString('en-IN')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: stockStatusColor[product.stockStatus] || 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{product.quantity} in stock</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div
                  style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 500 }}
                  onClick={handleSearchSubmit}
                >
                  View all results for "{searchQuery}" →
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="header-right">
        {/* Theme toggle */}
        <button className="toggle-btn" onClick={() => dispatch(toggleTheme())} data-tooltip={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {theme === 'dark' ? <FiSun size={15} /> : <FiMoon size={15} />}
        </button>

        {/* Notifications */}
        <div className="notification-btn" ref={notifRef}>
          <button className="toggle-btn" onClick={() => setShowNotifications(!showNotifications)} style={{ position: 'relative' }}>
            <FiBell size={15} />
            {unreadCount > 0 && (
              <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Notifications</span>
                  {unreadCount > 0 && <span className="badge badge-danger">{unreadCount}</span>}
                </div>
                {unreadCount > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => dispatch(markAllAsRead())} style={{ gap: 4 }}>
                    <FiCheck size={11} /> All read
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔔</div>
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div key={notif._id} className={`notification-item ${!notif.isRead ? 'unread' : ''}`} onClick={() => handleNotifClick(notif)}>
                      <div className={`notification-icon ${notif.type}`}>{notifIcons[notif.type] || '🔔'}</div>
                      <div className="notification-content">
                        <div className="notification-title">{notif.title}</div>
                        <div className="notification-message">{notif.message}</div>
                        <div className="notification-time">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</div>
                      </div>
                      {!notif.isRead && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 6 }} />}
                    </div>
                  ))
                )}
              </div>
              <div className="notification-footer">
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{notifications.length} total notifications</span>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <Link to="/profile" style={{ marginLeft: 4 }}>
          <div className="avatar avatar-sm" data-tooltip={user?.name} style={{ cursor: 'pointer' }}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : getInitials(user?.name)}
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Header;
