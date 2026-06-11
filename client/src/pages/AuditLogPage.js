import React, { useEffect, useState, useCallback } from 'react';
import { FiSearch, FiRefreshCw, FiFilter, FiEye, FiShield, FiActivity } from 'react-icons/fi';
import api from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import usePermissions from '../hooks/usePermissions';

const actionColors = {
  LOGIN: 'badge-success', LOGOUT: 'badge-secondary',
  PRODUCT_CREATE: 'badge-primary', PRODUCT_UPDATE: 'badge-info', PRODUCT_DELETE: 'badge-danger',
  STOCK_UPDATE: 'badge-warning',
  TRANSACTION_CREATE: 'badge-success', TRANSACTION_DELETE: 'badge-danger',
  USER_CREATE: 'badge-primary', USER_UPDATE: 'badge-info', USER_DELETE: 'badge-danger',
  CATEGORY_CREATE: 'badge-primary', SUPPLIER_CREATE: 'badge-primary',
  CUSTOMER_CREATE: 'badge-primary', CUSTOMER_UPDATE: 'badge-info',
  PERMISSION_DENIED: 'badge-danger',
  PASSWORD_CHANGE: 'badge-warning',
  REPORT_EXPORT: 'badge-info',
};

const statusColors = { success: 'badge-success', failed: 'badge-danger', warning: 'badge-warning' };

const moduleIcons = {
  auth: '🔐', product: '📦', stock: '📊', transaction: '💰',
  user: '👤', category: '🏷️', supplier: '🚚', customer: '👥',
  report: '📈', auditLog: '🛡️',
};

const roleColors = {
  admin: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  manager: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  staff: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  viewer: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
};

const AuditLogPage = () => {
  const { isAdmin } = usePermissions();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  const [filters, setFilters] = useState({
    search: '', module: '', action: '', status: '',
    startDate: '', endDate: '',
  });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const { data } = await api.get('/audit-logs', { params });
      setLogs(data.data);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      toast.error('Failed to load audit logs');
    }
    setLoading(false);
  }, [page, filters]);

  const loadStats = async () => {
    try {
      const { data } = await api.get('/audit-logs/stats');
      setStats(data.data);
    } catch (err) {}
  };

  useEffect(() => { loadLogs(); }, [loadLogs]);
  useEffect(() => { loadStats(); }, []);

  if (!isAdmin) {
    return (
      <div className="fade-in">
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔒</div>
          <p className="empty-state-title">Access Restricted</p>
          <p className="empty-state-text">Only administrators can view audit logs.</p>
        </div>
      </div>
    );
  }

  const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiShield style={{ color: 'var(--primary-light)' }} /> Audit Log
          </h1>
          <p className="page-subtitle">Complete trail of all system activities — who did what and when</p>
        </div>
        <button className="btn btn-ghost" onClick={loadLogs}>
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Events', value: stats.totalLogs, color: '#6366f1', icon: '📋' },
            { label: 'Last 30 Days', value: stats.recentLogs, color: '#10b981', icon: '📅' },
            { label: 'Failed Attempts', value: stats.failedAttempts, color: '#ef4444', icon: '🚫' },
            { label: 'Active Users', value: stats.byUser?.length || 0, color: '#f59e0b', icon: '👥' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="stat-card" style={{ '--accent-color': color }}>
              <div className="stat-icon" style={{ background: `${color}18`, color, fontSize: '1.3rem' }}>{icon}</div>
              <div className="stat-info">
                <div className="stat-value">{value?.toLocaleString()}</div>
                <div className="stat-label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Users Activity */}
      {stats?.byUser?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3 className="card-title"><FiActivity style={{ marginRight: 6, color: 'var(--primary-light)' }} />Most Active Users (Last 30 Days)</h3>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {stats.byUser.map((u) => {
              const rc = roleColors[u.role] || roleColors.viewer;
              return (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: '10px 14px', minWidth: 180 }}>
                  <div className="avatar avatar-sm" style={{ background: `linear-gradient(135deg, ${rc.color}, #6366f1)` }}>
                    {getInitials(u.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.72rem', color: rc.color, fontWeight: 600, textTransform: 'uppercase' }}>{u.role} · {u.count} actions</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 18, padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-wrapper" style={{ flex: 2, minWidth: 200 }}>
            <FiSearch className="search-icon" />
            <input type="text" className="form-control" placeholder="Search description, user, target..."
              value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <select className="form-control" value={filters.module} onChange={(e) => setFilters({ ...filters, module: e.target.value })} style={{ width: 140 }}>
            <option value="">All Modules</option>
            {['auth','product','stock','transaction','user','category','supplier','customer','report'].map((m) => (
              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
          <select className="form-control" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={{ width: 130 }}>
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="warning">Warning</option>
          </select>
          <input type="date" className="form-control" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} style={{ width: 150 }} />
          <input type="date" className="form-control" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} style={{ width: 150 }} />
          {Object.values(filters).some(Boolean) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ search: '', module: '', action: '', status: '', startDate: '', endDate: '' }); setPage(1); }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛡️</div>
            <p className="empty-state-title">No audit logs found</p>
            <p className="empty-state-text">Activity logs will appear here as users interact with the system.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Module</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const rc = roleColors[log.performedByRole] || roleColors.viewer;
                    return (
                      <tr key={log._id}>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          <div>{format(new Date(log.createdAt), 'dd MMM yyyy')}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{format(new Date(log.createdAt), 'HH:mm:ss')}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="avatar avatar-sm" style={{ background: `linear-gradient(135deg, ${rc.color}, #6366f1)`, fontSize: '0.65rem' }}>
                              {getInitials(log.performedByName)}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{log.performedByName || 'System'}</div>
                          </div>
                        </td>
                        <td>
                          <span style={{ background: rc.bg, color: rc.color, padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            {log.performedByRole}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem' }}>
                            {moduleIcons[log.module]} {log.module}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${actionColors[log.action] || 'badge-secondary'}`} style={{ fontSize: '0.65rem' }}>
                            {log.action?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 280 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.description}
                          </div>
                          {log.targetName && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>→ {log.targetName}</div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${statusColors[log.status] || 'badge-secondary'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedLog(log)} data-tooltip="View Details">
                            <FiEye size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination" style={{ padding: '12px 18px' }}>
              <span className="pagination-info">Showing {logs.length} of {total} events</span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={page === pages || pages === 0} onClick={() => setPage(page + 1)}>›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedLog(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">🛡️ Audit Log Detail</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedLog(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Meta grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
                {[
                  { label: 'Timestamp', value: format(new Date(selectedLog.createdAt), 'dd MMM yyyy, HH:mm:ss') },
                  { label: 'User', value: selectedLog.performedByName },
                  { label: 'Role', value: selectedLog.performedByRole },
                  { label: 'Module', value: `${moduleIcons[selectedLog.module]} ${selectedLog.module}` },
                  { label: 'Action', value: selectedLog.action?.replace(/_/g, ' ') },
                  { label: 'Status', value: selectedLog.status },
                  { label: 'IP Address', value: selectedLog.ipAddress || '-' },
                  { label: 'Target', value: selectedLog.targetName || '-' },
                  { label: 'Target Model', value: selectedLog.targetModel || '-' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, textTransform: 'capitalize' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>DESCRIPTION</div>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{selectedLog.description}</p>
              </div>

              {/* Changes */}
              {selectedLog.changes && (selectedLog.changes.before || selectedLog.changes.after) && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 10, color: 'var(--text-secondary)' }}>CHANGES</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {selectedLog.changes.before && (
                      <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 700, marginBottom: 8 }}>BEFORE</div>
                        <pre style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {JSON.stringify(selectedLog.changes.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.changes.after && (
                      <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 700, marginBottom: 8 }}>AFTER</div>
                        <pre style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {JSON.stringify(selectedLog.changes.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedLog(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
