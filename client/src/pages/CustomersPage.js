import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiUser,
  FiPhone, FiMail, FiMapPin, FiRefreshCw, FiEye,
} from 'react-icons/fi';
import {
  fetchCustomers, createCustomer, updateCustomer,
  deleteCustomer, fetchCustomerStats,
} from '../redux/slices/customerSlice';
import ConfirmModal from '../components/common/ConfirmModal';
import { formatINRShort } from '../utils/currency';
import { format } from 'date-fns';

const defaultForm = {
  fullName: '', phone: '', phone2: '', email: '',
  address: '', address2: '', city: '', state: '',
  district: '', pincode: '', status: 'active', notes: '',
};

const indianStates = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry',
];

const CustomersPage = () => {
  const dispatch = useDispatch();
  const { items, loading, total, pages, stats } = useSelector((state) => state.customers);
  const { user } = useSelector((state) => state.auth);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const canEdit = ['admin', 'manager', 'staff'].includes(user?.role);

  const loadCustomers = () => {
    const params = { page, limit: 15 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchCustomers(params));
  };

  useEffect(() => {
    loadCustomers();
    dispatch(fetchCustomerStats());
  }, [page, search, statusFilter]);

  const openAdd = () => {
    setEditItem(null);
    setForm(defaultForm);
    setActiveTab('basic');
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditItem(c);
    setForm({
      fullName: c.fullName || '', phone: c.phone || '', phone2: c.phone2 || '',
      email: c.email || '', address: c.address || '', address2: c.address2 || '',
      city: c.city || '', state: c.state || '', district: c.district || '',
      pincode: c.pincode || '', status: c.status || 'active', notes: c.notes || '',
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (editItem) {
      await dispatch(updateCustomer({ id: editItem._id, data: form }));
    } else {
      await dispatch(createCustomer(form));
    }
    setSaving(false);
    setShowModal(false);
    setEditItem(null);
    setForm(defaultForm);
  };

  const handleDelete = async () => {
    if (deleteId) { await dispatch(deleteCustomer(deleteId)); setDeleteId(null); }
  };

  const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'C';

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{total} registered customers</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openAdd}>
            <FiPlus /> Add Customer
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total Customers', value: stats.total, color: '#6366f1', icon: '👥' },
            { label: 'Active Customers', value: stats.active, color: '#10b981', icon: '✅' },
            { label: 'Inactive Customers', value: stats.inactive, color: '#94a3b8', icon: '⏸️' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="stat-card" style={{ '--accent-color': color }}>
              <div className="stat-icon" style={{ background: `${color}20`, color, fontSize: '1.4rem' }}>{icon}</div>
              <div className="stat-info">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-wrapper" style={{ flex: 2, minWidth: 220 }}>
            <FiSearch className="search-icon" />
            <input
              type="text" className="form-control"
              placeholder="Search by name, phone, email, ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="form-control" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: 160 }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="btn btn-ghost btn-icon" onClick={loadCustomers} data-tooltip="Refresh">
            <FiRefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p className="empty-state-title">No customers found</p>
            <p className="empty-state-text">Add your first customer to get started</p>
            {canEdit && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}>
                <FiPlus /> Add Customer
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Customer ID</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Total Spent</th>
                    <th>Purchases</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}>
                            {getInitials(c.fullName)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{c.fullName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Added {format(new Date(c.createdAt), 'dd MMM yyyy')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem', background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 4, color: 'var(--primary-light)' }}>
                          {c.customerId}
                        </code>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.875rem' }}>
                          <FiPhone size={12} style={{ color: 'var(--text-muted)' }} /> {c.phone}
                        </div>
                        {c.phone2 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.phone2}</div>}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {c.email ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <FiMail size={12} /> {c.email}
                          </div>
                        ) : '-'}
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>
                        {c.city ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <FiMapPin size={12} style={{ color: 'var(--text-muted)' }} /> {c.city}
                          </div>
                        ) : '-'}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                        {c.totalSpent > 0 ? formatINRShort(c.totalSpent) : '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-info">{c.totalPurchases}</span>
                      </td>
                      <td>
                        <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setViewItem(c); setShowDetailModal(true); }} data-tooltip="View">
                            <FiEye size={13} />
                          </button>
                          {canEdit && (
                            <>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)} data-tooltip="Edit">
                                <FiEdit2 size={13} />
                              </button>
                              <button className="btn btn-icon btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none' }} onClick={() => setDeleteId(c._id)} data-tooltip="Deactivate">
                                <FiTrash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination" style={{ padding: '12px 20px' }}>
              <span className="pagination-info">Showing {items.length} of {total} customers</span>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, padding: '0 24px', borderBottom: '1px solid var(--border)' }}>
              {['basic', 'address', 'other'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '10px 16px', background: 'none', border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === tab ? 'var(--primary-light)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: '0.875rem', cursor: 'pointer', textTransform: 'capitalize',
                }}>
                  {tab === 'basic' ? '👤 Basic Info' : tab === 'address' ? '📍 Address' : '📝 Other'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">

                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Full Name <span className="required">*</span></label>
                        <div style={{ position: 'relative' }}>
                          <FiUser style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input name="fullName" className="form-control" style={{ paddingLeft: 36 }} value={form.fullName} onChange={handleChange} required placeholder="e.g. Ramesh Kumar" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Status</label>
                        <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Phone (Mobile) <span className="required">*</span></label>
                        <div style={{ position: 'relative' }}>
                          <FiPhone style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input name="phone" className="form-control" style={{ paddingLeft: 36 }} value={form.phone} onChange={handleChange} required placeholder="+91 98765 43210" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone 2 (Optional)</label>
                        <div style={{ position: 'relative' }}>
                          <FiPhone style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input name="phone2" className="form-control" style={{ paddingLeft: 36 }} value={form.phone2} onChange={handleChange} placeholder="Alternate number" />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <div style={{ position: 'relative' }}>
                        <FiMail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input name="email" type="email" className="form-control" style={{ paddingLeft: 36 }} value={form.email} onChange={handleChange} placeholder="customer@email.com" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Address Tab */}
                {activeTab === 'address' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Address Line 1 <span className="required">*</span></label>
                      <input name="address" className="form-control" value={form.address} onChange={handleChange} required placeholder="House No., Street, Area" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Address Line 2</label>
                      <input name="address2" className="form-control" value={form.address2} onChange={handleChange} placeholder="Landmark, Near..." />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input name="city" className="form-control" value={form.city} onChange={handleChange} placeholder="e.g. Ahmedabad" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">District</label>
                        <input name="district" className="form-control" value={form.district} onChange={handleChange} placeholder="e.g. Gandhinagar" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <select name="state" className="form-control" value={form.state} onChange={handleChange}>
                          <option value="">Select State</option>
                          {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">PIN Code</label>
                        <input name="pincode" className="form-control" value={form.pincode} onChange={handleChange} placeholder="e.g. 380001" maxLength={6} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Other Tab */}
                {activeTab === 'other' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Notes</label>
                      <textarea name="notes" className="form-control" value={form.notes} onChange={handleChange} rows={4} placeholder="Any special notes about this customer..." />
                    </div>
                    {editItem && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>TOTAL PURCHASES</div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{editItem.totalPurchases}</div>
                        </div>
                        <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>TOTAL SPENT</div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success)' }}>{formatINRShort(editItem.totalSpent)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  const tabs = ['basic', 'address', 'other'];
                  const idx = tabs.indexOf(activeTab);
                  if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
                }}>
                  Next →
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : (editItem ? '✓ Update Customer' : '✓ Add Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {showDetailModal && viewItem && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDetailModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">Customer Details</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {canEdit && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setShowDetailModal(false); openEdit(viewItem); }}>
                    <FiEdit2 size={13} /> Edit
                  </button>
                )}
                <button className="btn btn-ghost btn-icon" onClick={() => setShowDetailModal(false)}>✕</button>
              </div>
            </div>
            <div className="modal-body">
              {/* Profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '16px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-lg)' }}>
                <div className="avatar avatar-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', fontSize: '1.6rem' }}>
                  {getInitials(viewItem.fullName)}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{viewItem.fullName}</h2>
                  <code style={{ fontSize: '0.8rem', color: 'var(--primary-light)' }}>{viewItem.customerId}</code>
                  <div style={{ marginTop: 6 }}>
                    <span className={`badge ${viewItem.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>{viewItem.status}</span>
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Spent</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>{formatINRShort(viewItem.totalSpent)}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{viewItem.totalPurchases} purchases</div>
                </div>
              </div>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card" style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Info</h4>
                  {[
                    { icon: <FiPhone size={13} />, label: 'Phone', value: viewItem.phone },
                    { icon: <FiPhone size={13} />, label: 'Phone 2', value: viewItem.phone2 },
                    { icon: <FiMail size={13} />, label: 'Email', value: viewItem.email },
                  ].filter((i) => i.value).map(({ icon, label, value }) => (
                    <div key={label} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--primary-light)', marginTop: 2 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
                        <div style={{ fontWeight: 500 }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</h4>
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                    <FiMapPin size={13} style={{ color: 'var(--primary-light)', marginRight: 6 }} />
                    {[viewItem.address, viewItem.address2, viewItem.city, viewItem.district, viewItem.state, viewItem.pincode].filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>

              {viewItem.notes && (
                <div style={{ marginTop: 16, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>NOTES</div>
                  <p style={{ fontSize: '0.875rem' }}>{viewItem.notes}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {deleteId && (
        <ConfirmModal
          title="Deactivate Customer"
          message="This will deactivate the customer. Their transaction history will be preserved."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          confirmText="Deactivate"
          danger
        />
      )}
    </div>
  );
};

export default CustomersPage;
