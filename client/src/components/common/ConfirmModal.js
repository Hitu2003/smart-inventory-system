import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

const ConfirmModal = ({ title, message, onConfirm, onCancel, confirmText = 'Confirm', danger = false }) => (
  <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
    <div className="modal" style={{ maxWidth: 420 }}>
      <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
        <div style={{
          width: 56, height: 56,
          borderRadius: '50%',
          background: danger ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '1.5rem',
          color: danger ? 'var(--danger)' : 'var(--warning)',
        }}>
          <FiAlertTriangle />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{message}</p>
      </div>
      <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{ minWidth: 100 }}>Cancel</button>
        <button
          className={`btn ${danger ? 'btn-danger' : 'btn-warning'}`}
          onClick={onConfirm}
          style={{ minWidth: 100 }}
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
