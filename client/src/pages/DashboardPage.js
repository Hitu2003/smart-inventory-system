import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  FiBox, FiTruck, FiTag, FiUsers, FiAlertTriangle,
  FiTrendingUp, FiDollarSign, FiShoppingCart,
} from 'react-icons/fi';
import { fetchDashboardStats, fetchAnalytics } from '../redux/slices/dashboardSlice';
import { fetchLowStockProducts } from '../redux/slices/productSlice';
import { format } from 'date-fns';
import { formatINRShort, formatINRCompact } from '../utils/currency';
import './DashboardPage.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      borderWidth: 1,
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      padding: 10,
      callbacks: {
        label: (ctx) => ` ₹${ctx.parsed.y?.toLocaleString('en-IN') || 0}`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(148,163,184,0.06)', drawBorder: false },
      ticks: { color: '#64748b', font: { size: 11 }, maxTicksLimit: 8 },
    },
    y: {
      grid: { color: 'rgba(148,163,184,0.06)', drawBorder: false },
      ticks: {
        color: '#64748b', font: { size: 11 },
        callback: (v) =>
          v >= 100000 ? `₹${(v / 100000).toFixed(1)}L`
          : v >= 1000 ? `₹${(v / 1000).toFixed(0)}K`
          : `₹${v}`,
      },
    },
  },
};

const StatCard = ({ icon, label, value, change, color, prefix = '', suffix = '' }) => (
  <div className="stat-card" style={{ '--accent-color': color }}>
    <div className="stat-icon" style={{ background: `${color}20`, color }}>
      {icon}
    </div>
    <div className="stat-info">
      <div className="stat-value">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}</div>
      <div className="stat-label">{label}</div>
      {change !== undefined && (
        <div className={`stat-change ${change >= 0 ? 'up' : 'down'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      )}
    </div>
  </div>
);

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { stats, analytics, loading } = useSelector((state) => state.dashboard);
  const { lowStockItems } = useSelector((state) => state.products);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchLowStockProducts());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAnalytics(period));
  }, [dispatch, period]);

  const overview = stats?.overview || {};

  // ── Revenue line chart ──────────────────────────────────────────────────────
  const salesChartData = {
    labels: analytics?.salesData?.map((d) => {
      const date = new Date(d._id);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }) || [],
    datasets: [
      {
        label: 'Revenue (₹)',
        data: analytics?.salesData?.map((d) => d.revenue) || [],
        borderColor: '#6366f1',
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
          gradient.addColorStop(0, 'rgba(99,102,241,0.3)');
          gradient.addColorStop(1, 'rgba(99,102,241,0.02)');
          return gradient;
        },
        fill: true,
        tension: 0.45,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2.5,
      },
    ],
  };

  // ── Category doughnut ───────────────────────────────────────────────────────
  const categoryChartData = {
    labels: stats?.categoryDistribution?.map((c) => c.name) || [],
    datasets: [{
      data: stats?.categoryDistribution?.map((c) => c.count) || [],
      backgroundColor: stats?.categoryDistribution?.map((c) => c.color) || ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  // ── Monthly Sales vs Purchases bar chart ────────────────────────────────────
  // Build a unified 12-month label set
  const buildMonthlyLabels = () => {
    const now = new Date();
    const labels = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: MONTH_NAMES[d.getMonth()] });
    }
    return labels;
  };

  const monthlyLabels = buildMonthlyLabels();

  const getMonthlySalesValue = (year, month) => {
    const entry = analytics?.monthlySales?.find(
      (d) => d._id.year === year && d._id.month === month
    );
    return entry?.revenue || 0;
  };

  const getMonthlyPurchaseValue = (year, month) => {
    const entry = analytics?.monthlyPurchases?.find(
      (d) => d._id.year === year && d._id.month === month
    );
    return entry?.cost || 0;
  };

  const monthlyComparisonData = {
    labels: monthlyLabels.map((m) => m.label),
    datasets: [
      {
        label: 'Sales Revenue',
        data: monthlyLabels.map((m) => getMonthlySalesValue(m.year, m.month)),
        backgroundColor: 'rgba(99,102,241,0.75)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Purchase Cost',
        data: monthlyLabels.map((m) => getMonthlyPurchaseValue(m.year, m.month)),
        backgroundColor: 'rgba(239,68,68,0.65)',
        borderColor: '#ef4444',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const monthlyBarOptions = {
    ...chartDefaults,
    plugins: {
      ...chartDefaults.plugins,
      legend: {
        display: true,
        position: 'top',
        labels: { color: '#94a3b8', font: { size: 11 }, padding: 16, boxWidth: 12 },
      },
      tooltip: {
        ...chartDefaults.plugins.tooltip,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.parsed.y?.toLocaleString('en-IN') || 0}`,
        },
      },
    },
  };

  // ── Top products horizontal bar ─────────────────────────────────────────────
  const topProductsChartData = {
    labels: stats?.topProducts?.map((p) => p.name) || [],
    datasets: [{
      label: 'Revenue (₹)',
      data: stats?.topProducts?.map((p) => p.revenue) || [],
      backgroundColor: [
        'rgba(99,102,241,0.75)',
        'rgba(14,165,233,0.75)',
        'rgba(16,185,129,0.75)',
        'rgba(245,158,11,0.75)',
        'rgba(239,68,68,0.75)',
      ],
      borderRadius: 4,
      borderWidth: 0,
    }],
  };

  const topProductsOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        padding: 10,
        callbacks: {
          label: (ctx) => ` ₹${ctx.parsed.x?.toLocaleString('en-IN') || 0}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(148,163,184,0.06)', drawBorder: false },
        ticks: {
          color: '#64748b', font: { size: 10 },
          callback: (v) =>
            v >= 100000 ? `₹${(v / 100000).toFixed(1)}L`
            : v >= 1000 ? `₹${(v / 1000).toFixed(0)}K`
            : `₹${v}`,
        },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
    },
  };

  // ── Stock distribution doughnut ─────────────────────────────────────────────
  const stockDist = stats?.stockDistribution || {};
  const stockDistributionData = {
    labels: ['In Stock', 'Low Stock', 'Out of Stock', 'Overstock'],
    datasets: [{
      data: [
        stockDist.inStock || 0,
        stockDist.lowStock || 0,
        stockDist.outOfStock || 0,
        stockDist.overstock || 0,
      ],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { size: 11 }, padding: 12, boxWidth: 12 },
      },
    },
    cutout: '65%',
  };

  if (loading && !stats) {
    return (
      <div className="loading-overlay">
        <div className="spinner" style={{ width: 48, height: 48 }} />
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening with your inventory.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['7', '30', '90', '365'].map((p) => (
            <button
              key={p}
              className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPeriod(p)}
            >
              {p === '365' ? '1Y' : `${p}D`}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard icon={<FiBox />} label="Total Products" value={overview.totalProducts || 0} color="#6366f1" />
        <StatCard icon={<FiDollarSign />} label="Inventory Value" value={formatINRCompact(overview.totalInventoryValue || 0)} color="#10b981" />
        <StatCard icon={<FiAlertTriangle />} label="Low Stock Items" value={overview.lowStockProducts || 0} color="#f59e0b" />
        <StatCard icon={<FiShoppingCart />} label="Out of Stock" value={overview.outOfStockProducts || 0} color="#ef4444" />
        <StatCard icon={<FiTruck />} label="Suppliers" value={overview.totalSuppliers || 0} color="#0ea5e9" />
        <StatCard icon={<FiTag />} label="Categories" value={overview.totalCategories || 0} color="#8b5cf6" />
        <StatCard icon={<FiUsers />} label="Users" value={overview.totalUsers || 0} color="#ec4899" />
        <StatCard icon={<FiTrendingUp />} label="Retail Value" value={formatINRCompact(overview.totalRetailValue || 0)} color="#14b8a6" />
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Sales Line Chart */}
        <div className="card chart-card-wide">
          <div className="card-header">
            <h3 className="card-title">Revenue Overview</h3>
            <span className="badge badge-success">Live</span>
          </div>
          <div style={{ height: 260 }}>
            <Line data={salesChartData} options={chartDefaults} />
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">By Category</h3>
          </div>
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut data={categoryChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="dashboard-bottom">
        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <FiAlertTriangle style={{ color: 'var(--warning)', marginRight: 6 }} />
              Low Stock Alerts
            </h3>
            <Link to="/products?filter=low_stock" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {lowStockItems.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div className="empty-state-icon">✅</div>
              <p className="empty-state-title">All stocked up!</p>
              <p className="empty-state-text">No low stock items at the moment.</p>
            </div>
          ) : (
            <div className="low-stock-list">
              {lowStockItems.slice(0, 6).map((item) => (
                <Link key={item._id} to={`/products/${item._id}`} className="low-stock-item">
                  <div className="low-stock-info">
                    <span className={`stock-dot ${item.stockStatus}`} />
                    <div>
                      <div className="low-stock-name">{item.name}</div>
                      <div className="low-stock-sku">{item.sku}</div>
                    </div>
                  </div>
                  <div className="low-stock-qty">
                    <span className={`badge ${item.quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                      {item.quantity === 0 ? 'Out of Stock' : `${item.quantity} left`}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Transactions</h3>
            <Link to="/transactions" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {!stats?.recentTransactions?.length ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-title">No transactions yet</p>
            </div>
          ) : (
            <div className="recent-tx-list">
              {stats.recentTransactions.slice(0, 6).map((tx) => (
                <div key={tx._id} className="recent-tx-item">
                  <div className={`tx-type-badge tx-${tx.type}`}>
                    {tx.type === 'sale' ? '↑' : tx.type === 'purchase' ? '↓' : '⟳'}
                  </div>
                  <div className="tx-info">
                    <div className="tx-number">{tx.transactionNumber}</div>
                    <div className="tx-date">{format(new Date(tx.createdAt), 'MMM d, yyyy')}</div>
                  </div>
                  <div className="tx-amount">
                    <span className={tx.type === 'sale' ? 'text-success' : 'text-danger'}>
                      {tx.type === 'sale' ? '+' : '-'}₹{tx.netAmount?.toFixed(2)}
                    </span>
                    <span className={`badge badge-${tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'secondary'}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Selling Products</h3>
          </div>
          {!stats?.topProducts?.length ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div className="empty-state-icon">📦</div>
              <p className="empty-state-title">No sales data yet</p>
            </div>
          ) : (
            <div className="top-products-list">
              {stats.topProducts.map((p, i) => (
                <div key={p._id} className="top-product-item">
                  <div className="top-product-rank">{i + 1}</div>
                  <div className="top-product-info">
                    <div className="top-product-name">{p.name}</div>
                    <div className="top-product-sku">{p.sku}</div>
                  </div>
                  <div className="top-product-stats">
                    <div className="top-product-revenue">₹{p.revenue?.toFixed(0)}</div>
                    <div className="top-product-sold">{p.totalSold} sold</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Analytics Section ─────────────────────────────────────────────────── */}
      <div className="analytics-section-header">
        <h2 className="section-title">Analytics</h2>
        <p className="section-subtitle">Deep-dive into sales trends and stock health</p>
      </div>

      <div className="analytics-grid">
        {/* Monthly Sales vs Purchases Bar Chart */}
        <div className="card analytics-chart-wide">
          <div className="card-header">
            <h3 className="card-title">Monthly Revenue vs Purchase Cost</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 12 months</span>
          </div>
          <div style={{ height: 280 }}>
            <Bar data={monthlyComparisonData} options={monthlyBarOptions} />
          </div>
        </div>

        {/* Stock Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Stock Distribution</h3>
          </div>
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut data={stockDistributionData} options={doughnutOptions} />
          </div>
          {/* Summary numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '12px 16px 4px' }}>
            {[
              { label: 'In Stock', value: stockDist.inStock || 0, color: '#10b981' },
              { label: 'Low Stock', value: stockDist.lowStock || 0, color: '#f59e0b' },
              { label: 'Out of Stock', value: stockDist.outOfStock || 0, color: '#ef4444' },
              { label: 'Overstock', value: stockDist.overstock || 0, color: '#3b82f6' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginLeft: 'auto' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products by Revenue — Horizontal Bar */}
      {stats?.topProducts?.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3 className="card-title">Top 5 Products by Revenue</h3>
          </div>
          <div style={{ height: 220 }}>
            <Bar data={topProductsChartData} options={topProductsOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
