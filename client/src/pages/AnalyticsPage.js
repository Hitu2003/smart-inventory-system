import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar, PolarArea } from 'react-chartjs-2';
import { FiTrendingUp, FiBarChart2, FiPieChart, FiActivity, FiRefreshCw } from 'react-icons/fi';
import { fetchDashboardStats, fetchAnalytics } from '../redux/slices/dashboardSlice';
import { formatINRCompact, formatINRShort } from '../utils/currency';
import api from '../services/api';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler
);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CHART_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#0ea5e9','#8b5cf6','#ec4899','#14b8a6'];

const chartTooltip = {
  backgroundColor: '#1e293b',
  borderColor: '#334155',
  borderWidth: 1,
  titleColor: '#f1f5f9',
  bodyColor: '#94a3b8',
  padding: 10,
};

const AnalyticsPage = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { stats, analytics } = useSelector((state) => state.dashboard);
  const [period, setPeriod] = useState('30');
  const [stockReport, setStockReport] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchAnalytics(period));
    loadReports();
  }, [dispatch, period]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [stockRes, salesRes] = await Promise.all([
        api.get('/reports/inventory'),
        api.get('/reports/sales'),
      ]);
      setStockReport(stockRes.data.data);
      setSalesReport(salesRes.data.data);
    } catch (e) {}
    setLoading(false);
  };

  // Build monthly chart labels
  const buildMonthlyLabels = () => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1, label: MONTH_NAMES[d.getMonth()] };
    });
  };
  const monthlyLabels = buildMonthlyLabels();

  const getMonthlySales = (y, m) => analytics?.monthlySales?.find(d => d._id.year === y && d._id.month === m)?.revenue || 0;
  const getMonthlyPurchases = (y, m) => analytics?.monthlyPurchases?.find(d => d._id.year === y && d._id.month === m)?.cost || 0;

  // ── 1. Revenue vs Cost Monthly Bar ────────────────────────────────
  const revenueCostData = {
    labels: monthlyLabels.map(m => m.label),
    datasets: [
      {
        label: 'Sales Revenue',
        data: monthlyLabels.map(m => getMonthlySales(m.year, m.month)),
        backgroundColor: 'rgba(99,102,241,0.75)',
        borderColor: '#6366f1', borderWidth: 1, borderRadius: 5,
      },
      {
        label: 'Purchase Cost',
        data: monthlyLabels.map(m => getMonthlyPurchases(m.year, m.month)),
        backgroundColor: 'rgba(239,68,68,0.65)',
        borderColor: '#ef4444', borderWidth: 1, borderRadius: 5,
      },
    ],
  };

  // ── 2. Stock Distribution Doughnut ────────────────────────────────
  const stockDist = stats?.stockDistribution || {};
  const stockDistData = {
    labels: ['In Stock', 'Low Stock', 'Out of Stock', 'Overstock'],
    datasets: [{
      data: [stockDist.inStock || 0, stockDist.lowStock || 0, stockDist.outOfStock || 0, stockDist.overstock || 0],
      backgroundColor: ['#10b981','#f59e0b','#ef4444','#3b82f6'],
      borderWidth: 0, hoverOffset: 10,
    }],
  };

  // ── 3. Category Value PolarArea ───────────────────────────────────
  const catData = {
    labels: (stats?.categoryDistribution || []).map(c => c.name),
    datasets: [{
      data: (stats?.categoryDistribution || []).map(c => c.value),
      backgroundColor: CHART_COLORS.map(c => `${c}99`),
      borderColor: CHART_COLORS,
      borderWidth: 2,
    }],
  };

  // ── 4. Top Products Horizontal Bar ───────────────────────────────
  const topProdData = {
    labels: (stats?.topProducts || []).map(p => p.name?.length > 18 ? p.name.substring(0,18)+'...' : p.name),
    datasets: [{
      label: 'Revenue (₹)',
      data: (stats?.topProducts || []).map(p => p.revenue),
      backgroundColor: CHART_COLORS.slice(0,5).map(c => `${c}cc`),
      borderRadius: 5, borderWidth: 0,
    }],
  };

  // ── 5. Profit Margin Radar ────────────────────────────────────────
  const categoryMargins = (stockReport?.categories || []).map(c => ({
    name: c._id || 'Other',
    margin: c.totalCostValue > 0
      ? (((c.totalRetailValue - c.totalCostValue) / c.totalRetailValue) * 100).toFixed(1)
      : 0,
  })).slice(0, 6);

  const radarData = {
    labels: categoryMargins.map(c => c.name),
    datasets: [{
      label: 'Profit Margin %',
      data: categoryMargins.map(c => c.margin),
      backgroundColor: 'rgba(99,102,241,0.2)',
      borderColor: '#6366f1',
      pointBackgroundColor: '#6366f1',
      borderWidth: 2,
    }],
  };

  // ── 6. Daily Sales Line ───────────────────────────────────────────
  const dailyData = {
    labels: (analytics?.salesData || []).map(d => {
      const date = new Date(d._id);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }),
    datasets: [{
      label: 'Revenue (₹)',
      data: (analytics?.salesData || []).map(d => d.revenue),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.1)',
      fill: true, tension: 0.45,
      pointRadius: 3, pointBackgroundColor: '#10b981',
      pointBorderColor: '#fff', pointBorderWidth: 2, borderWidth: 2.5,
    }],
  };

  const chartOptions = (yFormat = 'inr') => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...chartTooltip,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ₹${(ctx.parsed.y || ctx.parsed || 0)?.toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(148,163,184,0.06)' }, ticks: { color: '#64748b', font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(148,163,184,0.06)' },
        ticks: {
          color: '#64748b', font: { size: 11 },
          callback: v => v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : v >= 1000 ? `₹${(v/1000).toFixed(0)}K` : `₹${v}`,
        },
      },
    },
  });

  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '62%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12, boxWidth: 12 } },
      tooltip: { ...chartTooltip },
    },
  };

  const overview = stats?.overview || {};

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiBarChart2 style={{ color: 'var(--primary-light)' }} /> Analytics
          </h1>
          <p className="page-subtitle">Deep insights into your business performance</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['7','30','90','365'].map(p => (
            <button key={p} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPeriod(p)}>
              {p === '365' ? '1Y' : `${p}D`}
            </button>
          ))}
          <button className="btn btn-ghost btn-icon" onClick={loadReports} data-tooltip="Refresh">
            <FiRefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Inventory Value', value: formatINRCompact(overview.totalInventoryValue || 0), color: '#6366f1', icon: '💎' },
          { label: 'Retail Value', value: formatINRCompact(overview.totalRetailValue || 0), color: '#10b981', icon: '🏷️' },
          { label: 'Potential Profit', value: formatINRCompact((overview.totalRetailValue || 0) - (overview.totalInventoryValue || 0)), color: '#f59e0b', icon: '📈' },
          { label: 'Low Stock Items', value: overview.lowStockProducts || 0, color: '#ef4444', icon: '⚠️' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="stat-card" style={{ '--accent-color': color }}>
            <div className="stat-icon" style={{ background: `${color}18`, color, fontSize: '1.3rem' }}>{icon}</div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: '1.3rem' }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Revenue vs Cost + Daily Sales */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📊 Monthly Revenue vs Purchase Cost</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 12 months</span>
          </div>
          <div style={{ height: 280 }}>
            <Bar data={revenueCostData} options={{
              ...chartOptions(),
              plugins: {
                ...chartOptions().plugins,
                legend: { display: true, position: 'top', labels: { color: '#94a3b8', font: { size: 11 }, padding: 16, boxWidth: 12 } },
              },
            }} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📈 {period}D Sales Trend</h3>
          </div>
          <div style={{ height: 280 }}>
            <Line data={dailyData} options={chartOptions()} />
          </div>
        </div>
      </div>

      {/* Row 2: Stock Distribution + Category Values + Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">📦 Stock Distribution</h3></div>
          <div style={{ height: 220 }}>
            <Doughnut data={stockDistData} options={doughnutOptions} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '12px 4px 0' }}>
            {[
              { label: 'In Stock', value: stockDist.inStock || 0, color: '#10b981' },
              { label: 'Low Stock', value: stockDist.lowStock || 0, color: '#f59e0b' },
              { label: 'Out of Stock', value: stockDist.outOfStock || 0, color: '#ef4444' },
              { label: 'Overstock', value: stockDist.overstock || 0, color: '#3b82f6' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, marginLeft: 'auto' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">🎯 Category Values</h3></div>
          <div style={{ height: 260 }}>
            <PolarArea data={catData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, padding: 8, boxWidth: 10 } },
                tooltip: {
                  ...chartTooltip,
                  callbacks: { label: ctx => ` ${ctx.label}: ₹${(ctx.parsed || 0).toLocaleString('en-IN')}` },
                },
              },
              scales: { r: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { display: false } } },
            }} />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">🏆 Top 5 Products</h3></div>
          <div style={{ height: 260 }}>
            <Bar data={topProdData} options={{
              indexAxis: 'y',
              responsive: true, maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  ...chartTooltip,
                  callbacks: { label: ctx => ` Revenue: ₹${(ctx.parsed.x || 0).toLocaleString('en-IN')}` },
                },
              },
              scales: {
                x: {
                  grid: { color: 'rgba(148,163,184,0.06)' },
                  ticks: { color: '#64748b', font: { size: 10 }, callback: v => v >= 1000 ? `₹${(v/1000).toFixed(0)}K` : `₹${v}` },
                },
                y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
              },
            }} />
          </div>
        </div>
      </div>

      {/* Row 3: Profit Margin Radar + Category Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">📡 Profit Margin by Category</h3></div>
          <div style={{ height: 280 }}>
            {categoryMargins.length > 0 ? (
              <Radar data={radarData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { ...chartTooltip, callbacks: { label: ctx => ` Margin: ${ctx.parsed.r}%` } },
                },
                scales: {
                  r: {
                    grid: { color: 'rgba(148,163,184,0.1)' },
                    ticks: { color: '#64748b', font: { size: 9 }, callback: v => `${v}%` },
                    pointLabels: { color: '#94a3b8', font: { size: 10 } },
                  },
                },
              }} />
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">📊</div>
                <p>No category data</p>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <h3 className="card-title">📋 Category Performance</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Products</th>
                  <th style={{ textAlign: 'right' }}>Cost Value</th>
                  <th style={{ textAlign: 'right' }}>Retail Value</th>
                  <th style={{ textAlign: 'right' }}>Profit</th>
                  <th style={{ textAlign: 'center' }}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {(stockReport?.categories || []).map(cat => {
                  const profit = (cat.totalRetailValue || 0) - (cat.totalCostValue || 0);
                  const margin = cat.totalRetailValue > 0 ? ((profit / cat.totalRetailValue) * 100).toFixed(1) : 0;
                  return (
                    <tr key={cat._id}>
                      <td style={{ fontWeight: 500 }}>{cat._id || 'Uncategorized'}</td>
                      <td>{cat.products}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{formatINRShort(cat.totalCostValue)}</td>
                      <td style={{ textAlign: 'right', fontSize: '0.85rem' }}>{formatINRShort(cat.totalRetailValue)}</td>
                      <td style={{ textAlign: 'right', color: profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: '0.85rem' }}>
                        {formatINRShort(profit)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${parseFloat(margin) >= 20 ? 'badge-success' : parseFloat(margin) >= 10 ? 'badge-warning' : 'badge-danger'}`}>
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
