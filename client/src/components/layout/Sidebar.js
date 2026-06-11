import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiGrid, FiBox, FiTag, FiTruck, FiRepeat,
  FiBarChart2, FiUsers, FiSettings, FiLogOut, FiUserCheck, FiShield,
} from 'react-icons/fi';
import { MdInventory } from 'react-icons/md';
import { logout } from '../../redux/slices/authSlice';
import './Layout.css';

const navSections = [
  {
    section: 'Main',
    items: [
      { to: '/dashboard', icon: <FiGrid />, label: 'Dashboard' },
    ],
  },
  {
    section: 'Inventory',
    items: [
      { to: '/products', icon: <FiBox />, label: 'Products', showBadge: true },
      { to: '/categories', icon: <FiTag />, label: 'Categories' },
      { to: '/suppliers', icon: <FiTruck />, label: 'Suppliers' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { to: '/transactions', icon: <FiRepeat />, label: 'Transactions' },
      { to: '/customers', icon: <FiUserCheck />, label: 'Customers' },
      { to: '/reports', icon: <FiBarChart2 />, label: 'Reports' },
    ],
  },
  {
    section: 'Admin',
    items: [
      { to: '/users', icon: <FiUsers />, label: 'Users', roles: ['admin'] },
      { to: '/audit-log', icon: <FiShield />, label: 'Audit Log', roles: ['admin'] },
      { to: '/profile', icon: <FiSettings />, label: 'Settings' },
    ],
  },
];

const Sidebar = () => {
  const dispatch = useDispatch();
  const { sidebarCollapsed } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const { lowStockItems } = useSelector((state) => state.products);

  const handleLogout = () => dispatch(logout());
  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <Link to="/dashboard" className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <MdInventory color="#fff" size={18} />
        </div>
        <div className="sidebar-logo-text">
          <h2>SmartInventory</h2>
          <span>Pro Edition</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(user?.role)
          );
          if (!visibleItems.length) return null;

          return (
            <div key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  data-tooltip={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.showBadge && lowStockItems?.length > 0 && (
                    <span className="nav-badge">{lowStockItems.length}</span>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link to="/profile" className="sidebar-user">
          <div className="avatar avatar-sm">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              getInitials(user?.name)
            )}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </Link>

        <button
          className="nav-item"
          onClick={handleLogout}
          style={{ width: '100%', background: 'none', border: 'none', marginTop: 2, color: 'var(--text-muted)' }}
          data-tooltip={sidebarCollapsed ? 'Logout' : undefined}
        >
          <span className="nav-icon"><FiLogOut /></span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
