import React, { useState, useRef, useEffect } from 'react';
import { FiDownload, FiChevronDown, FiFileText, FiGrid, FiFile } from 'react-icons/fi';
import { exportToCSV, exportToExcel } from '../../services/exportService';
import toast from 'react-hot-toast';

/**
 * ExportButton — dropdown with CSV, Excel, PDF options
 *
 * Props:
 *   data        {Array}    - rows to export
 *   filename    {string}   - base filename (no extension)
 *   columns     {Array}    - [{key, label}] for CSV/Excel
 *   sheetName   {string}   - Excel sheet name (optional)
 *   onPDFExport {Function} - callback for PDF export (optional)
 *   disabled    {boolean}  - disable the button
 *   size        {string}   - 'sm' | 'md' (default 'md')
 */
const ExportButton = ({
  data = [],
  filename = 'export',
  columns = [],
  sheetName = 'Data',
  onPDFExport,
  disabled = false,
  size = 'md',
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCSV = async () => {
    setLoading('csv');
    setOpen(false);
    try {
      exportToCSV(data, filename, columns);
      toast.success('CSV exported successfully');
    } catch (err) {
      toast.error('CSV export failed');
    } finally {
      setLoading(null);
    }
  };

  const handleExcel = async () => {
    setLoading('excel');
    setOpen(false);
    try {
      await exportToExcel(data, filename, sheetName, columns);
      toast.success('Excel exported successfully');
    } catch (err) {
      toast.error('Excel export failed');
    } finally {
      setLoading(null);
    }
  };

  const handlePDF = () => {
    setOpen(false);
    if (onPDFExport) {
      onPDFExport();
    } else {
      toast.error('PDF export not configured');
    }
  };

  const btnClass = size === 'sm' ? 'btn btn-ghost btn-sm' : 'btn btn-ghost';

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className={btnClass}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || loading !== null}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {loading ? (
          <span className="spinner" style={{ width: 14, height: 14 }} />
        ) : (
          <FiDownload size={14} />
        )}
        Export
        <FiChevronDown
          size={12}
          style={{
            transition: 'transform 0.18s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
            minWidth: 180,
            zIndex: 1000,
            overflow: 'hidden',
          }}
          role="menu"
        >
          <button
            className="export-menu-item"
            onClick={handleCSV}
            role="menuitem"
            style={menuItemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <FiFileText size={14} style={{ color: '#10b981' }} />
            <span>Export CSV</span>
          </button>

          <button
            className="export-menu-item"
            onClick={handleExcel}
            role="menuitem"
            style={menuItemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <FiGrid size={14} style={{ color: '#0ea5e9' }} />
            <span>Export Excel</span>
          </button>

          {onPDFExport && (
            <button
              className="export-menu-item"
              onClick={handlePDF}
              role="menuitem"
              style={menuItemStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <FiFile size={14} style={{ color: '#ef4444' }} />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const menuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '10px 16px',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.15s',
};

export default ExportButton;
