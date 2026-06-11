import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';
import { setTheme } from '../../redux/slices/uiSlice';
import './Layout.css';

const Layout = () => {
  const dispatch = useDispatch();
  const { sidebarCollapsed, theme } = useSelector((state) => state.ui);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    dispatch(setTheme(theme));
  }, [theme, dispatch]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
