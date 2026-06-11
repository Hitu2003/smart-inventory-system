import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiEdit2, FiArrowLeft, FiPackage, FiTrendingUp, FiAlertTriangle } from 'react-icons/fi';
import { fetchProduct } from '../redux/slices/productSlice';
import ProductModal from '../components/products/ProductModal';
import ProductImageUpload from '../components/products/ProductImageUpload';
import { formatINRFull, formatINRShort } from '../utils/currency';

const stockStatusConfig = {
  in_stock: { label: 'In Stock', class: 'badge-success', color: 'var(--success)' },
  low_stock: { label: 'Low Stock', class: 'badge-warning', color: 'var(--warning)' },
  out_of_stock: { label: 'Out of Stock', class: 'badge-danger', color: 'var(--danger)' },
  overstock: { label: 'Overstock', class: 'badge-info', color: 'var(--info)' },
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentProduct: product, loading } = useSelector((state) => state.products);
  const { user } = useSelector((state) => state.auth);
  const [showEdit, setShowEdit] = useState(false);

  const canEdit = ['admin', 'manager'].includes(user?.role);

  useEffect(() => {
    dispatch(fetchProduct(id));
  }, [dispatch, id]);

  if (loading || !product) {
    return <div className="loading-overlay"><div className="spinner" /></div>;
  }

  const status = stockStatusConfig[product.stockStatus] || stockStatusConfig.in_stock;
  const stockPercent = Math.min((product.quantity / (product.maxStock || 100)) * 100, 100);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}><FiArrowLeft /></button>
          <div>
            <h1 className="page-title">{product.name}</h1>
            <p className="page-subtitle">SKU: {product.sku}</p>
          </div>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowEdit(true)}>
            <FiEdit2 size={14} /> Edit Product
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Main Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Overview Card */}
          <div className="card">
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 120, height: 120, borderRadius: 'var(--radius-lg)', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', flexShrink: 0 }}>
                {product.images?.[0]?.url ? (
                  <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }} />
                ) : '📦'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{product.name}</h2>
                  <span className={`badge ${status.class}`}>{status.label}</span>
                  {product.isFeatured && <span className="badge badge-primary">Featured</span>}
                </div>
                {product.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 12 }}>{product.description}</p>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.tags?.map((tag) => (
                    <span key={tag} style={{ background: 'var(--bg-hover)', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Cost Price', value: formatINRFull(product.price?.cost), icon: '💰', color: '#6366f1' },
              { label: 'Selling Price', value: formatINRFull(product.price?.selling), icon: '🏷️', color: '#10b981' },
              { label: 'Profit Margin', value: `${product.profitMargin}%`, icon: '📈', color: '#0ea5e9' },
              { label: 'Total Value', value: formatINRShort(product.totalValue), icon: '💎', color: '#8b5cf6' },
              { label: 'Current Stock', value: `${product.quantity} ${product.unit}`, icon: '📦', color: status.color },
              { label: 'Reorder Point', value: product.reorderPoint, icon: '⚠️', color: '#f59e0b' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="card" style={{ padding: '16px', borderTop: `2px solid ${color}` }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Stock Level */}
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Stock Level</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current: <strong>{product.quantity}</strong></span>
              <span style={{ color: 'var(--text-secondary)' }}>Max: <strong>{product.maxStock}</strong></span>
            </div>
            <div style={{ height: 10, background: 'var(--bg-hover)', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${stockPercent}%`, background: status.color, borderRadius: 5, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Reorder at: {product.reorderPoint}</span>
              <span>{stockPercent.toFixed(0)}% capacity</span>
            </div>
          </div>

          {/* Product Images */}
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Product Images</h3>
            <ProductImageUpload
              productId={product._id}
              images={product.images || []}
              readOnly={!canEdit}
              onUpdate={(updatedProduct) => dispatch(fetchProduct(id))}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Details */}
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>Product Details</h3>
            {[
              { label: 'Category', value: product.category?.name },
              { label: 'Supplier', value: product.supplier?.name },
              { label: 'Barcode', value: product.barcode || '-' },
              { label: 'Unit', value: product.unit },
              { label: 'Reorder Qty', value: product.reorderQuantity },
              { label: 'Status', value: product.isActive ? 'Active' : 'Inactive' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{value || '-'}</span>
              </div>
            ))}
          </div>

          {/* Location */}
          {(product.location?.warehouse || product.location?.aisle) && (
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>📍 Location</h3>
              {[
                { label: 'Warehouse', value: product.location?.warehouse },
                { label: 'Aisle', value: product.location?.aisle },
                { label: 'Shelf', value: product.location?.shelf },
                { label: 'Bin', value: product.location?.bin },
              ].filter((i) => i.value).map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Low stock warning */}
          {product.stockStatus === 'low_stock' && (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--warning)', fontWeight: 600, marginBottom: 6 }}>
                <FiAlertTriangle /> Low Stock Warning
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Stock is below reorder point ({product.reorderPoint}). Consider reordering {product.reorderQuantity} units.
              </p>
            </div>
          )}

          {product.stockStatus === 'out_of_stock' && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--danger)', fontWeight: 600, marginBottom: 6 }}>
                🚫 Out of Stock
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                This product is out of stock. Immediate restocking required.
              </p>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <ProductModal
          product={product}
          onClose={() => setShowEdit(false)}
          onSuccess={() => dispatch(fetchProduct(id))}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;
