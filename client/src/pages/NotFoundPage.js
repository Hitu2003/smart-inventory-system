import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', flexDirection: 'column', gap: 16, textAlign: 'center', padding: 20 }}>
    <div style={{ fontSize: '6rem', lineHeight: 1 }}>404</div>
    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Page Not Found</h1>
    <p style={{ color: 'var(--text-secondary)', maxWidth: 360 }}>The page you're looking for doesn't exist or has been moved.</p>
    <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: 8 }}>Go to Dashboard</Link>
  </div>
);

export default NotFoundPage;
