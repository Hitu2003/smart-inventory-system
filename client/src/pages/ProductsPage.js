import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiRefreshCw,
  FiFilter, FiX, FiChevronDown, FiChevronUp,
} from 'react-icons/fi';
import { fetchProducts, deleteProduct, fetchLowStockProducts } from '../redux/slices/productSlice';
import { fetchCategories } from '../redux/slices/categorySlice';
import { fetchSuppliers } from '../redux/slices/supplierSlice';
import ProductModal from '../components/products/ProductModal';
import ConfirmModal from '../components/common/ConfirmModal';
import ExportButton from '../components/common/ExportButton';
import { formatINRFull } from '../utils/currency';
import { generateInventoryReportPDF } from '../services/pdfService';
import './ProductsPage.css';

const stockStatusConfig = {
  in_stock: { label: 'In Stock', class: 'badge-success' },
  low_stock: { label: 'Low Stock', class: 'badge-warning' },
  out_of_stock: { label: 'Out of Stock', class: 'badge-danger' },
  overstock: { label: 'Overstock', class: 'badge-info' },
};

const EXPORT_COLUMNS = [
  { key: 'name', label: 'Product Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'category.name', label: 'Category' },
  { key: 'supplier.name', label: 'Supplier' },
  { key: 'quantity', label: 'Stock Qty' },
  { key: 'reorderPoint', label: 'Reorder Point' },
  { key: 'price.cost', label: 'Cost Price (₹)' },
  { key: 'price.selling', label: 'Selling Price (₹)' },
  { key: 'profitMargin', label: 'Margin (%)' },
  { key: 'stockStatus', label: 'Stock Status' },
];

const ProductsPage = () => {
  const dispatch = useDispatch();
  const { items: products, loading, total, pages } = useSelector((state) => state.products);
  const { items: categories } = useSelector((state) => state.categories);
  const { items: suppliers } = useSelector((state) => state.suppliers);
  const { user } = useSelector((state) => state.auth);

  // Basic filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [page, setPage] = useState(1);

  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const canEdit = ['admin', 'manager'].includes(user?.role);

  // Count active advanced filters
  const advancedFilterCount = [supplierFilter, minPrice, maxPrice]
    .filter(Boolean).length + (sortBy !== 'createdAt' || sortDir !== 'desc' ? 1 : 0);

  const buildParams = useCallback(() => {
    const params = { page, limit: 15 };
    if (search) params.search = search;
    if (categoryFilter) params.category = categoryFilter;
    if (stockFilter) params.stockStatus = stockFilter;
    if (supplierFilter) params.supplier = supplierFilter;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (sortBy) params.sort = sortDir === 'desc' ? `-${sortBy}` : sortBy;
    return params;
  }, [page, search, categoryFilter, stockFilter, supplierFilter, minPrice, maxPrice, sortBy, sortDir]);

  const loadProducts = useCallback(() => {
    dispatch(fetchProducts(buildParams()));
  }, [dispatch, buildParams]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchSuppliers({ limit: 200 }));
    dispatch(fetchLowStockProducts());
  }, [dispatch]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStockFilter('');
    setSupplierFilter('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt');
    setSortDir('desc');
    setPage(1);
  };

  const hasActiveFilters = search || categoryFilter || stockFilter || supplierFilter || minPrice || maxPrice;

  const handleEdit = (product) => {
    setEditProduct(product);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await dispatch(deleteProduct(deleteId));
      setDeleteId(null);
    }
  };

  return (
    <div className="products-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{total} products in inventory</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ExportButton
            data={products}
            filename="products-export"
            columns={EXPORT_COLUMNS}
            sheetName="Products"
            onPDFExport={() => generateInventoryReportPDF({ categories: [], totals: {} })}
          />
          {canEdit && (
            <button className="btn btn-primary" onClick={() => { setEditProduct(null); setShowModal(true); }}>
              <FiPlus /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        {/* Primary filter row */}
        <div className="filters-row" style={{ marginBottom: showAdvanced ? 14 : 0 }}>
          <div className="search-input-wrapper" style={{ flex: 2 }}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, SKU, barcode…"
              value={search}
              onChange={handleSearch}
            />
          </div>

          <select
            className="form-control"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            style={{ flex: 1 }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <select
            className="form-control"
            value={stockFilter}
            onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
            style={{ flex: 1 }}
          >
            <option value="">All Stock Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="overstock">Overstock</option>
          </select>

          {/* Advanced toggle */}
          <button
            className={`btn btn-sm ${showAdvanced ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setShowAdvanced((v) => !v)}
            style={{ position: 'relative', whiteSpace: 'nowrap' }}
          >
            <FiFilter size={13} />
            Advanced
            {advancedFilterCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: 'var(--danger)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {advancedFilterCount}
              </span>
            )}
            {showAdvanced ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
          </button>

          <button className="btn btn-ghost btn-icon" onClick={loadProducts} data-tooltip="Refresh">
            <FiRefreshCw />
          </button>
        </div>

        {/* Advanced filter row */}
        {showAdvanced && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 12,
              paddingTop: 14,
              borderTop: '1px solid var(--border)',
            }}
          >
            {/* Supplier */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Supplier
              </label>
              <select
                className="form-control"
                value={supplierFilter}
                onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Min Price (₹)
              </label>
              <input
                type="number"
                className="form-control"
                placeholder="0"
                value={minPrice}
                min="0"
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
              />
            </div>

            {/* Max Price */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Max Price (₹)
              </label>
              <input
                type="number"
                className="form-control"
                placeholder="Any"
                value={maxPrice}
                min="0"
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
              />
            </div>

            {/* Sort By */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Sort By
              </label>
              <select
                className="form-control"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              >
                <option value="createdAt">Date Added</option>
                <option value="name">Name</option>
                <option value="price.selling">Price</option>
                <option value="quantity">Stock</option>
                <option value="profitMargin">Margin</option>
              </select>
            </div>

            {/* Sort Direction */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Direction
              </label>
              <select
                className="form-control"
                value={sortDir}
                onChange={(e) => { setSortDir(e.target.value); setPage(1); }}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            {/* Clear button */}
            {hasActiveFilters && (
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleClearFilters}
                  style={{ color: 'var(--danger)', width: '100%' }}
                >
                  <FiX size={13} /> Clear All
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && !showAdvanced && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {search && (
              <FilterChip label={`Search: "${search}"`} onRemove={() => { setSearch(''); setPage(1); }} />
            )}
            {categoryFilter && (
              <FilterChip
                label={`Category: ${categories.find((c) => c._id === categoryFilter)?.name || categoryFilter}`}
                onRemove={() => { setCategoryFilter(''); setPage(1); }}
              />
            )}
            {stockFilter && (
              <FilterChip
                label={`Stock: ${stockStatusConfig[stockFilter]?.label}`}
                onRemove={() => { setStockFilter(''); setPage(1); }}
              />
            )}
            {supplierFilter && (
              <FilterChip
                label={`Supplier: ${suppliers.find((s) => s._id === supplierFilter)?.name || supplierFilter}`}
                onRemove={() => { setSupplierFilter(''); setPage(1); }}
              />
            )}
            {(minPrice || maxPrice) && (
              <FilterChip
                label={`Price: ₹${minPrice || '0'} – ₹${maxPrice || '∞'}`}
                onRemove={() => { setMinPrice(''); setMaxPrice(''); setPage(1); }}
              />
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleClearFilters}
              style={{ color: 'var(--danger)', fontSize: '0.75rem', padding: '2px 8px' }}
            >
              <FiX size={11} /> Clear all
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p className="empty-state-title">No products found</p>
            <p className="empty-state-text">Try adjusting your search or filters</p>
            {canEdit && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                <FiPlus /> Add First Product
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Cost Price</th>
                    <th>Selling Price</th>
                    <th>Status</th>
                    {canEdit && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="product-cell">
                          <div className="product-thumb">
                            {product.images?.[0]?.url ? (
                              <img src={product.images[0].url} alt={product.name} />
                            ) : (
                              <span>📦</span>
                            )}
                          </div>
                          <div>
                            <Link to={`/products/${product._id}`} className="product-name-link">
                              {product.name}
                            </Link>
                            {product.isFeatured && (
                              <span className="badge badge-primary" style={{ marginLeft: 6, fontSize: '0.65rem' }}>
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td><code className="sku-code">{product.sku}</code></td>
                      <td>
                        {product.category && (
                          <span
                            className="category-pill"
                            style={{ background: `${product.category.color}20`, color: product.category.color }}
                          >
                            {product.category.name}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="stock-cell">
                          <span className={`stock-dot ${product.stockStatus}`} />
                          <span style={{ fontWeight: 600 }}>{product.quantity}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            / {product.reorderPoint} min
                          </span>
                        </div>
                      </td>
                      <td>{formatINRFull(product.price?.cost)}</td>
                      <td>
                        <div>
                          <div>{formatINRFull(product.price?.selling)}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                            {product.profitMargin}% margin
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${stockStatusConfig[product.stockStatus]?.class}`}>
                          {stockStatusConfig[product.stockStatus]?.label}
                        </span>
                      </td>
                      {canEdit && (
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => handleEdit(product)}
                              data-tooltip="Edit"
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button
                              className="btn btn-icon btn-sm"
                              style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none' }}
                              onClick={() => setDeleteId(product._id)}
                              data-tooltip="Delete"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination" style={{ padding: '12px 20px' }}>
              <span className="pagination-info">
                Showing {products.length} of {total} products
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
                ))}
                <button className="page-btn" disabled={page === pages} onClick={() => setPage(page + 1)}>›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <ProductModal
          product={editProduct}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSuccess={loadProducts}
        />
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete Product"
          message="Are you sure you want to delete this product? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          confirmText="Delete"
          danger
        />
      )}
    </div>
  );
};

// Small filter chip component
const FilterChip = ({ label, onRemove }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: 'rgba(99,102,241,0.12)',
      color: 'var(--primary-light)',
      borderRadius: 20,
      padding: '3px 10px',
      fontSize: '0.75rem',
      fontWeight: 500,
    }}
  >
    {label}
    <button
      onClick={onRemove}
      style={{
        background: 'none',
        border: 'none',
        color: 'inherit',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        opacity: 0.7,
      }}
      aria-label={`Remove filter: ${label}`}
    >
      <FiX size={11} />
    </button>
  </span>
);

export default ProductsPage;
