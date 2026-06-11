import React, { useState, useEffect } from 'react';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../services/api';
import { generateInventoryReportPDF, generateSalesReportPDF } from '../services/pdfService';
import { formatINRShort, formatINRFull } from '../utils/currency';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState('inventory');
  const [inventoryData, setInventoryData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const loadInventoryReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/inventory');
      setInventoryData(data.data);
    } catch (err) {
      toast.error('Failed to load inventory report');
    }
    setLoading(false);
  };

  const loadSalesReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/sales', { params: dateRange });
      setSalesData(data.data);
    } catch (err) {
      toast.error('Failed to load sales report');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeReport === 'inventory') loadInventoryReport();
    else if (activeReport === 'sales') loadSalesReport();
  }, [activeReport]);

  const inventoryChartData = {
    labels: inventoryData?.categories?.map((c) => c._id || 'Other') || [],
    datasets: [
      {
        label: 'Cost Value ($)',
        data: inventoryData?.categories?.map((c) => c.totalCostValue) || [],
        backgroundColor: 'rgba(99,102,241,0.7)',
        borderRadius: 6,
      },
      {
        label: 'Retail Value ($)',
        data: inventoryData?.categories?.map((c) => c.totalRetailValue) || [],
        backgroundColor: 'rgba(16,185,129,0.7)',
        borderRadius: 6,
      },
    ],
  };

  const salesChartData = {
    labels: salesData?.salesData?.map((d) => d._id) || [],
    datasets: [{
      label: 'Revenue ($)',
      data: salesData?.salesData?.map((d) => d.revenue) || [],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
    },
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Comprehensive business insights</p>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="card" style={{ padding: '4px', marginBottom: 20, display: 'inline-flex', gap: 4 }}>
        {['inventory', 'sales', 'stock-movement'].map((r) => (
          <button
            key={r}
            className={`btn btn-sm ${activeReport === r ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveReport(r)}
            style={{ textTransform: 'capitalize' }}
          >
            {r.replace('-', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : (
        <>
          {/* Inventory Report */}
          {activeReport === 'inventory' && inventoryData && (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                {[
                  { label: 'Total Products', value: inventoryData.totals?.products, color: '#6366f1' },
                  { label: 'Total Cost Value', value: formatINRShort(inventoryData.totals?.totalCostValue), color: '#10b981' },
                  { label: 'Total Retail Value', value: formatINRShort(inventoryData.totals?.totalRetailValue), color: '#0ea5e9' },
                  { label: 'Low Stock Items', value: inventoryData.totals?.lowStockItems, color: '#f59e0b' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="stat-card" style={{ '--accent-color': color }}>
                    <div className="stat-info">
                      <div className="stat-value" style={{ fontSize: '1.4rem' }}>{value}</div>
                      <div className="stat-label">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                  <h3 className="card-title">Inventory Value by Category</h3>
                  <button className="btn btn-primary btn-sm" onClick={() => generateInventoryReportPDF(inventoryData)}>
                    <FiDownload size={14} /> Export PDF
                  </button>
                </div>
                <div style={{ height: 300 }}>
                  <Bar data={inventoryChartData} options={chartOptions} />
                </div>
              </div>

              {/* Table */}
              <div className="card" style={{ padding: 0 }}>
                <div className="card-header" style={{ padding: '16px 20px' }}>
                  <h3 className="card-title">Category Breakdown</h3>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Products</th>
                        <th>Total Qty</th>
                        <th>Cost Value</th>
                        <th>Retail Value</th>
                        <th>Potential Profit</th>
                        <th>Low Stock</th>
                        <th>Out of Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryData.categories?.map((cat) => (
                        <tr key={cat._id}>
                          <td style={{ fontWeight: 500 }}>{cat._id || 'Uncategorized'}</td>
                          <td>{cat.products}</td>
                          <td>{cat.totalQuantity}</td>
                          <td>₹{cat.totalCostValue?.toFixed(2)}</td>
                          <td>₹{cat.totalRetailValue?.toFixed(2)}</td>
                          <td style={{ color: 'var(--success)' }}>
                            ₹{(cat.totalRetailValue - cat.totalCostValue)?.toFixed(2)}
                          </td>
                          <td>
                            {cat.lowStockItems > 0 ? (
                              <span className="badge badge-warning">{cat.lowStockItems}</span>
                            ) : <span className="badge badge-success">0</span>}
                          </td>
                          <td>
                            {cat.outOfStockItems > 0 ? (
                              <span className="badge badge-danger">{cat.outOfStockItems}</span>
                            ) : <span className="badge badge-success">0</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--bg-hover)', fontWeight: 700 }}>
                        <td>TOTAL</td>
                        <td>{inventoryData.totals?.products}</td>
                        <td>-</td>
                        <td>₹{inventoryData.totals?.totalCostValue?.toFixed(2)}</td>
                        <td>₹{inventoryData.totals?.totalRetailValue?.toFixed(2)}</td>
                        <td style={{ color: 'var(--success)' }}>
                          ₹{(inventoryData.totals?.totalRetailValue - inventoryData.totals?.totalCostValue)?.toFixed(2)}
                        </td>
                        <td>{inventoryData.totals?.lowStockItems}</td>
                        <td>{inventoryData.totals?.outOfStockItems}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sales Report */}
          {activeReport === 'sales' && (
            <div>
              <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-control" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-control" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
                  </div>
                  <button className="btn btn-primary" onClick={loadSalesReport}><FiRefreshCw size={14} /> Apply</button>
                  {salesData && (
                    <button className="btn btn-ghost" onClick={() => generateSalesReportPDF(salesData.salesData, salesData.summary)}>
                      <FiDownload size={14} /> Export PDF
                    </button>
                  )}
                </div>
              </div>

              {salesData && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                    {[
                      { label: 'Total Revenue', value: `$${salesData.summary?.totalRevenue?.toFixed(2) || '0.00'}`, color: '#10b981' },
                      { label: 'Total Transactions', value: salesData.summary?.totalTransactions || 0, color: '#6366f1' },
                      { label: 'Avg Order Value', value: `$${salesData.summary?.avgOrderValue?.toFixed(2) || '0.00'}`, color: '#0ea5e9' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="stat-card" style={{ '--accent-color': color }}>
                        <div className="stat-info">
                          <div className="stat-value" style={{ fontSize: '1.4rem' }}>{value}</div>
                          <div className="stat-label">{label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Sales Trend</h3>
                    </div>
                    <div style={{ height: 300 }}>
                      <Line data={salesChartData} options={chartOptions} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeReport === 'stock-movement' && (
            <div>
              <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-control" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-control" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
                  </div>
                  <button className="btn btn-primary" onClick={async () => {
                    setLoading(true);
                    try {
                      const { data } = await api.get('/reports/stock-movement', { params: dateRange });
                      setSalesData({ stockMovements: data.data });
                    } catch (err) { toast.error('Failed to load report'); }
                    setLoading(false);
                  }}><FiRefreshCw size={14} /> Load Report</button>
                </div>
              </div>

              {salesData?.stockMovements?.length > 0 ? (
                <div className="card" style={{ padding: 0 }}>
                  <div className="card-header" style={{ padding: '16px 20px' }}>
                    <h3 className="card-title">Stock Movement Details</h3>
                  </div>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Type</th>
                          <th style={{ textAlign: 'center' }}>Qty Moved</th>
                          <th style={{ textAlign: 'right' }}>Total Value</th>
                          <th style={{ textAlign: 'center' }}>Transactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.stockMovements.map((m, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500 }}>{m.productName}</td>
                            <td><code style={{ fontSize: '0.8rem', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4 }}>{m.sku}</code></td>
                            <td><span className={`badge ${m.type === 'sale' ? 'badge-success' : m.type === 'purchase' ? 'badge-info' : 'badge-warning'}`}>{m.type}</span></td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{m.totalQuantity}</td>
                            <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>${m.totalValue?.toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}>{m.transactions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <p className="empty-state-title">No stock movement data</p>
                    <p className="empty-state-text">Select a date range and click Load Report, or create transactions to see movement data.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;
