import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiPlus, FiDownload, FiEye, FiTrash2, FiRefreshCw,
  FiSearch, FiCheckCircle, FiClock, FiAlertCircle,
} from 'react-icons/fi';
import { fetchTransactions, deleteTransaction } from '../redux/slices/transactionSlice';
import { format } from 'date-fns';
import { generateInvoicePDF } from '../services/pdfService';
import { formatINRFull } from '../utils/currency';
import TransactionModal from '../components/transactions/TransactionModal';
import TransactionDetailModal from '../components/transactions/TransactionDetailModal';
import ConfirmModal from '../components/common/ConfirmModal';
import api from '../services/api';
import toast from 'react-hot-toast';

const typeColors = {
  sale: 'badge-success', purchase: 'badge-danger',
  adjustment: 'badge-warning', transfer: 'badge-info',
  return: 'badge-secondary', damage: 'badge-danger',
};

const txStatusColors = {
  completed: 'badge-success', pending: 'badge-warning',
  cancelled: 'badge-secondary', partial: 'badge-info',
};

// ── Payment status config ─────────────────────────────────────────────
const paymentStatusConfig = {
  paid: { label: 'Paid', class: 'badge-success', icon: <FiCheckCircle size={10} />, color: 'var(--success)' },
  unpaid: { label: 'Unpaid', class: 'badge-danger', icon: <FiAlertCircle size={10} />, color: 'var(--danger)' },
  partial: { label: 'Partial', class: 'badge-warning', icon: <FiClock size={10} />, color: 'var(--warning)' },
};

// Payment summary card
const PaymentSummaryCard = ({ label, value, amount, color, icon }) => (
  <div className="stat-card" style={{ '--accent-color': color }}>
    <div className="stat-icon" style={{ background: `${color}18`, color, fontSize: '1.3rem' }}>{icon}</div>
    <div className="stat-info">
      <div className="stat-value" style={{ fontSize: '1.4rem' }}>{value}</div>
      <div className="stat-label">{label}</div>
      {amount !== undefined && (
        <div style={{ fontSize: '0.78rem', color, fontWeight: 600, marginTop: 3 }}>
          {formatINRFull(amount)}
        </div>
      )}
    </div>
  </div>
);

const TransactionsPage = () => {
  const dispatch = useDispatch();
  const { items, loading, total, pages } = useSelector((state) => state.transactions);
  const { user } = useSelector((state) => state.auth);

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewTransaction, setViewTransaction] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [updatingPayment, setUpdatingPayment] = useState(null);

  const canDelete = user?.role === 'admin';
  const canEdit = ['admin', 'manager'].includes(user?.role);

  const loadTransactions = () => {
    const params = { page, limit: 15 };
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    if (paymentFilter) params.paymentStatus = paymentFilter;
    dispatch(fetchTransactions(params));
  };

  useEffect(() => { loadTransactions(); }, [dispatch, page, typeFilter, statusFilter, paymentFilter]);

  const handleDelete = async () => {
    if (deleteId) { await dispatch(deleteTransaction(deleteId)); setDeleteId(null); }
  };

  // Mark payment status directly from the table
  const markPaymentStatus = async (txId, newStatus) => {
    setUpdatingPayment(txId);
    try {
      await api.patch(`/transactions/${txId}/payment-status`, { paymentStatus: newStatus });
      toast.success(`Payment marked as ${newStatus}`);
      loadTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment status');
    }
    setUpdatingPayment(null);
  };

  // ── Summary stats from current page ────────────────────────────────
  const salesTx = items.filter((t) => t.type === 'sale');
  const paidTotal = salesTx.filter((t) => t.paymentStatus === 'paid').reduce((s, t) => s + (t.netAmount || 0), 0);
  const unpaidTotal = salesTx.filter((t) => t.paymentStatus === 'unpaid').reduce((s, t) => s + (t.netAmount || 0), 0);
  const partialTotal = salesTx.filter((t) => t.paymentStatus === 'partial').reduce((s, t) => s + (t.netAmount || 0), 0);

  // Filter by search client-side (for transaction number / customer name)
  const filteredItems = searchQuery
    ? items.filter((t) =>
        t.transactionNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{total} total transactions</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={loadTransactions}><FiRefreshCw size={14} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}><FiPlus /> New Transaction</button>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <PaymentSummaryCard
          label="Paid Sales"
          value={salesTx.filter((t) => t.paymentStatus === 'paid').length}
          amount={paidTotal}
          color="var(--success)"
          icon="✅"
        />
        <PaymentSummaryCard
          label="Unpaid Sales"
          value={salesTx.filter((t) => t.paymentStatus === 'unpaid').length}
          amount={unpaidTotal}
          color="var(--danger)"
          icon="❌"
        />
        <PaymentSummaryCard
          label="Partial Payment"
          value={salesTx.filter((t) => t.paymentStatus === 'partial').length}
          amount={partialTotal}
          color="var(--warning)"
          icon="⏳"
        />
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div className="search-input-wrapper" style={{ flex: 2, minWidth: 200 }}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Search by transaction #, customer, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Type */}
          <select className="form-control" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} style={{ width: 140 }}>
            <option value="">All Types</option>
            {['sale', 'purchase', 'adjustment', 'transfer', 'return', 'damage'].map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>

          {/* Transaction Status */}
          <select className="form-control" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: 140 }}>
            <option value="">All Statuses</option>
            {['pending', 'completed', 'cancelled', 'partial'].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          {/* Payment Status filter */}
          <select
            className="form-control"
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            style={{ width: 150 }}
          >
            <option value="">All Payments</option>
            <option value="paid">✅ Paid</option>
            <option value="unpaid">❌ Unpaid</option>
            <option value="partial">⏳ Partial</option>
          </select>

          {(typeFilter || statusFilter || paymentFilter || searchQuery) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setTypeFilter(''); setStatusFilter(''); setPaymentFilter(''); setSearchQuery(''); setPage(1); }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-title">No transactions found</p>
            <p className="empty-state-text">Create your first transaction to get started</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreateModal(true)}>
              <FiPlus /> Create Transaction
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Transaction #</th>
                    <th>Type</th>
                    <th>Customer / Supplier</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Tx Status</th>
                    <th>Payment Status</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((tx) => {
                    const ps = paymentStatusConfig[tx.paymentStatus] || paymentStatusConfig.unpaid;
                    return (
                      <tr key={tx._id}>
                        {/* Transaction # */}
                        <td>
                          <code style={{ fontSize: '0.78rem', background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 4, color: 'var(--primary-light)' }}>
                            {tx.transactionNumber}
                          </code>
                        </td>

                        {/* Type */}
                        <td>
                          <span className={`badge ${typeColors[tx.type] || 'badge-secondary'}`}>{tx.type}</span>
                        </td>

                        {/* Customer / Supplier */}
                        <td>
                          {tx.type === 'sale' && tx.customer?.name ? (
                            <div>
                              <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{tx.customer.name}</div>
                              {tx.customer.phone && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📞 {tx.customer.phone}</div>}
                            </div>
                          ) : tx.supplier?.name ? (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🚚 {tx.supplier.name}</div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                          )}
                        </td>

                        {/* Items */}
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{tx.items?.length} item(s)</td>

                        {/* Amount */}
                        <td>
                          <div style={{ fontWeight: 700, color: tx.type === 'sale' ? 'var(--success)' : 'var(--danger)' }}>
                            {tx.type === 'sale' ? '+' : '-'}{formatINRFull(tx.netAmount)}
                          </div>
                        </td>

                        {/* Transaction Status */}
                        <td>
                          <span className={`badge ${txStatusColors[tx.status] || 'badge-secondary'}`}>{tx.status}</span>
                        </td>

                        {/* Payment Status — clickable dropdown for sales */}
                        <td>
                          {tx.type === 'sale' ? (
                            canEdit ? (
                              <div className="payment-status-dropdown">
                                <select
                                  value={tx.paymentStatus || 'unpaid'}
                                  disabled={updatingPayment === tx._id}
                                  onChange={(e) => markPaymentStatus(tx._id, e.target.value)}
                                  style={{
                                    background: `${ps.color}15`,
                                    color: ps.color,
                                    border: `1px solid ${ps.color}40`,
                                    borderRadius: 20,
                                    padding: '3px 10px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    outline: 'none',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    appearance: 'none',
                                    minWidth: 90,
                                    textAlign: 'center',
                                  }}
                                >
                                  <option value="paid">✅ Paid</option>
                                  <option value="unpaid">❌ Unpaid</option>
                                  <option value="partial">⏳ Partial</option>
                                </select>
                              </div>
                            ) : (
                              <span className={`badge ${ps.class}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {ps.icon} {ps.label}
                              </span>
                            )
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>N/A</span>
                          )}
                        </td>

                        {/* Payment Method */}
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textTransform: 'capitalize' }}>
                          {tx.paymentMethod?.replace('_', ' ')}
                        </td>

                        {/* Date */}
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                          {format(new Date(tx.createdAt), 'dd MMM yyyy')}
                        </td>

                        {/* Actions */}
                        <td>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setViewTransaction(tx)} data-tooltip="View Details">
                              <FiEye size={13} />
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => generateInvoicePDF(tx)} data-tooltip="Download PDF">
                              <FiDownload size={13} />
                            </button>
                            {canDelete && tx.status !== 'completed' && (
                              <button className="btn btn-icon btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none' }} onClick={() => setDeleteId(tx._id)} data-tooltip="Delete">
                                <FiTrash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination" style={{ padding: '12px 20px' }}>
              <span className="pagination-info">Showing {filteredItems.length} of {total} transactions</span>
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

      {/* Modals */}
      {showCreateModal && <TransactionModal onClose={() => { setShowCreateModal(false); loadTransactions(); }} />}
      {viewTransaction && <TransactionDetailModal transaction={viewTransaction} onClose={() => setViewTransaction(null)} />}
      {deleteId && (
        <ConfirmModal
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          confirmText="Delete"
          danger
        />
      )}
    </div>
  );
};

export default TransactionsPage;
