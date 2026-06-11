import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FiX, FiInfo } from 'react-icons/fi';
import { createProduct, updateProduct } from '../../redux/slices/productSlice';
import { fetchCategories } from '../../redux/slices/categorySlice';
import { fetchSuppliers } from '../../redux/slices/supplierSlice';
import FormField from '../common/FormField';
import { productSchema } from '../../utils/validators';

const TABS = ['basic', 'pricing', 'stock', 'location'];

const ProductModal = ({ product, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { items: categories } = useSelector((state) => state.categories);
  const { items: suppliers } = useSelector((state) => state.suppliers);
  const [activeTab, setActiveTab] = useState('basic');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      description: '',
      category: '',
      supplier: '',
      'price.cost': '',
      'price.selling': '',
      quantity: 0,
      unit: 'piece',
      reorderPoint: 10,
      reorderQuantity: 50,
      maxStock: 1000,
      'location.warehouse': '',
      'location.aisle': '',
      'location.shelf': '',
      'location.bin': '',
      tags: '',
      notes: '',
      isActive: true,
      isFeatured: false,
    },
  });

  const costPrice = parseFloat(watch('price.cost')) || 0;
  const sellingPrice = parseFloat(watch('price.selling')) || 0;
  const profit = sellingPrice - costPrice;
  const margin = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(1) : 0;

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchSuppliers({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (product) {
      reset({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        description: product.description || '',
        category: product.category?._id || product.category || '',
        supplier: product.supplier?._id || product.supplier || '',
        'price.cost': product.price?.cost || '',
        'price.selling': product.price?.selling || '',
        quantity: product.quantity ?? 0,
        unit: product.unit || 'piece',
        reorderPoint: product.reorderPoint ?? 10,
        reorderQuantity: product.reorderQuantity ?? 50,
        maxStock: product.maxStock ?? 1000,
        'location.warehouse': product.location?.warehouse || '',
        'location.aisle': product.location?.aisle || '',
        'location.shelf': product.location?.shelf || '',
        'location.bin': product.location?.bin || '',
        tags: product.tags?.join(', ') || '',
        notes: product.notes || '',
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false,
      });
    }
  }, [product, reset]);

  // Tab error indicators
  const tabHasError = (tab) => {
    const tabFields = {
      basic: ['name', 'sku', 'category'],
      pricing: ['price.cost', 'price.selling'],
      stock: ['quantity', 'reorderPoint'],
      location: [],
    };
    return tabFields[tab]?.some((f) => errors[f] || errors[f?.split('.')[0]]);
  };

  const onSubmit = async (data) => {
    const payload = {
      name: data.name,
      sku: data.sku,
      barcode: data.barcode || undefined,
      description: data.description,
      category: data.category || undefined,
      supplier: data.supplier || undefined,
      price: {
        cost: parseFloat(data['price.cost']),
        selling: parseFloat(data['price.selling']),
      },
      quantity: parseInt(data.quantity) || 0,
      unit: data.unit,
      reorderPoint: parseInt(data.reorderPoint) || 10,
      reorderQuantity: parseInt(data.reorderQuantity) || 50,
      maxStock: parseInt(data.maxStock) || 1000,
      location: {
        warehouse: data['location.warehouse'] || undefined,
        aisle: data['location.aisle'] || undefined,
        shelf: data['location.shelf'] || undefined,
        bin: data['location.bin'] || undefined,
      },
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      notes: data.notes,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
    };

    // Remove undefined nested location fields
    Object.keys(payload.location).forEach((k) => {
      if (!payload.location[k]) delete payload.location[k];
    });

    let result;
    if (product) {
      result = await dispatch(updateProduct({ id: product._id, data: payload }));
    } else {
      result = await dispatch(createProduct(payload));
    }

    if (!result.error) {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">{product ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><FiX /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
          {TABS.map((tab) => {
            const hasError = tabHasError(tab);
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '11px 18px',
                  background: 'none', border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                  color: hasError ? 'var(--danger)' : activeTab === tab ? 'var(--primary-light)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: '0.875rem', cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'var(--transition)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {tab === 'basic' && '📝'}
                {tab === 'pricing' && '💰'}
                {tab === 'stock' && '📦'}
                {tab === 'location' && '📍'}
                {tab}
                {hasError && <span style={{ color: 'var(--danger)', fontSize: '0.7rem' }}>●</span>}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="modal-body">

            {/* ── BASIC TAB ─────────────────────────────────── */}
            {activeTab === 'basic' && (
              <div>
                <div className="form-row">
                  <FormField
                    label="Product Name"
                    name="name"
                    placeholder="e.g. iPhone 15 Pro"
                    register={register}
                    error={errors.name}
                    required
                  />
                  <FormField
                    label="SKU"
                    name="sku"
                    placeholder="e.g. ELEC-001"
                    register={register}
                    error={errors.sku}
                    required
                    hint="Unique product identifier"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category <span className="required">*</span></label>
                    <select className={`form-control ${errors.category ? 'error' : ''}`} {...register('category')}>
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                    {errors.category && <p className="form-error">⚠ {errors.category.message}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Supplier</label>
                    <select className="form-control" {...register('supplier')}>
                      <option value="">Select supplier (optional)</option>
                      {suppliers.map((s) => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <FormField
                    label="Barcode"
                    name="barcode"
                    placeholder="Optional barcode"
                    register={register}
                    error={errors.barcode}
                  />
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <select className="form-control" {...register('unit')}>
                      {['piece','kg','liter','meter','box','pack','dozen','set'].map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <p className="form-hint">How this product is measured/sold</p>
                  </div>
                </div>

                <FormField
                  label="Description"
                  name="description"
                  type="textarea"
                  placeholder="Product description..."
                  register={register}
                  error={errors.description}
                  rows={3}
                />

                <FormField
                  label="Tags"
                  name="tags"
                  placeholder="electronics, laptop, apple (comma separated)"
                  register={register}
                  error={errors.tags}
                  hint="Comma-separated tags for better search"
                />

                <div style={{ display: 'flex', gap: 24 }}>
                  <label className="checkbox-label">
                    <input type="checkbox" {...register('isActive')} />
                    <span>Active</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" {...register('isFeatured')} />
                    <span>Featured</span>
                  </label>
                </div>
              </div>
            )}

            {/* ── PRICING TAB ───────────────────────────────── */}
            {activeTab === 'pricing' && (
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Cost Price (₹) <span className="required">*</span></label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                      <input
                        type="number" step="0.01" min="0"
                        placeholder="0.00"
                        className={`form-control ${errors['price.cost'] ? 'error' : ''}`}
                        style={{ paddingLeft: 28 }}
                        {...register('price.cost')}
                      />
                    </div>
                    {errors['price.cost'] && <p className="form-error">⚠ {errors['price.cost'].message}</p>}
                    <p className="form-hint">What you pay to the supplier</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Selling Price (₹) <span className="required">*</span></label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                      <input
                        type="number" step="0.01" min="0"
                        placeholder="0.00"
                        className={`form-control ${errors['price.selling'] ? 'error' : ''}`}
                        style={{ paddingLeft: 28 }}
                        {...register('price.selling')}
                      />
                    </div>
                    {errors['price.selling'] && <p className="form-error">⚠ {errors['price.selling'].message}</p>}
                    <p className="form-hint">What you charge the customer</p>
                  </div>
                </div>

                {/* Live profit calculator */}
                {costPrice > 0 && sellingPrice > 0 && (
                  <div style={{ background: profit >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${profit >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 'var(--radius)', padding: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      {[
                        { label: 'Profit per unit', value: `₹${profit.toFixed(2)}`, color: profit >= 0 ? 'var(--success)' : 'var(--danger)' },
                        { label: 'Profit Margin', value: `${margin}%`, color: profit >= 0 ? 'var(--success)' : 'var(--danger)' },
                        { label: 'Markup', value: costPrice > 0 ? `${((profit / costPrice) * 100).toFixed(1)}%` : '—', color: 'var(--info)' },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{value}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    {profit < 0 && (
                      <p style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiInfo size={13} /> Selling price is below cost price — you will lose money on each sale!
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── STOCK TAB ─────────────────────────────────── */}
            {activeTab === 'stock' && (
              <div>
                <div className="form-row-3">
                  <FormField
                    label="Current Quantity"
                    name="quantity"
                    type="number"
                    min={0}
                    register={register}
                    error={errors.quantity}
                    hint="Current stock level"
                  />
                  <FormField
                    label="Reorder Point"
                    name="reorderPoint"
                    type="number"
                    min={0}
                    register={register}
                    error={errors.reorderPoint}
                    hint="Alert when stock falls below this"
                  />
                  <FormField
                    label="Reorder Quantity"
                    name="reorderQuantity"
                    type="number"
                    min={0}
                    register={register}
                    error={errors.reorderQuantity}
                    hint="How much to order when restocking"
                  />
                </div>

                <FormField
                  label="Max Stock"
                  name="maxStock"
                  type="number"
                  min={0}
                  register={register}
                  error={errors.maxStock}
                  hint="Maximum stock capacity"
                />

                {/* Stock level visual guide */}
                <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 10, color: 'var(--text-secondary)' }}>
                    📊 Stock Level Guide
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { color: 'var(--danger)', dot: true, label: 'Out of Stock', desc: 'quantity = 0' },
                      { color: 'var(--warning)', dot: true, label: 'Low Stock', desc: 'quantity ≤ reorder point' },
                      { color: 'var(--success)', dot: true, label: 'In Stock', desc: 'quantity > reorder point' },
                      { color: 'var(--info)', dot: true, label: 'Overstock', desc: 'quantity > max stock' },
                    ].map(({ color, label, desc }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <strong style={{ color }}>{label}</strong>
                        <span style={{ color: 'var(--text-muted)' }}>— {desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <FormField
                  label="Notes"
                  name="notes"
                  type="textarea"
                  placeholder="Additional notes about this product..."
                  register={register}
                  error={errors.notes}
                  rows={3}
                  style={{ marginTop: 14 }}
                />
              </div>
            )}

            {/* ── LOCATION TAB ──────────────────────────────── */}
            {activeTab === 'location' && (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16, background: 'var(--bg-hover)', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
                  📍 Specify where this product is stored in your warehouse.
                </p>
                <div className="form-row">
                  <FormField label="Warehouse" name="location.warehouse" placeholder="e.g. Warehouse A" register={register} error={errors['location.warehouse']} />
                  <FormField label="Aisle" name="location.aisle" placeholder="e.g. A3" register={register} error={errors['location.aisle']} />
                </div>
                <div className="form-row">
                  <FormField label="Shelf" name="location.shelf" placeholder="e.g. Shelf 2" register={register} error={errors['location.shelf']} />
                  <FormField label="Bin / Slot" name="location.bin" placeholder="e.g. Bin 5" register={register} error={errors['location.bin']} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>

            {/* Tab navigation */}
            <div style={{ display: 'flex', gap: 8, marginRight: 'auto' }}>
              {activeTab !== 'basic' && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setActiveTab(TABS[TABS.indexOf(activeTab) - 1])}>
                  ← Prev
                </button>
              )}
              {activeTab !== 'location' && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab(TABS[TABS.indexOf(activeTab) + 1])}>
                  Next →
                </button>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                : (product ? '✓ Update Product' : '✓ Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
