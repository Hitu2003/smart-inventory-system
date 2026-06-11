import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, useFieldArray } from 'react-hook-form';
import { FiX, FiPlus, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { createTransaction } from '../../redux/slices/transactionSlice';
import { fetchProducts } from '../../redux/slices/productSlice';
import { fetchSuppliers } from '../../redux/slices/supplierSlice';
import { formatINRFull } from '../../utils/currency';

const PAYMENT_METHODS = ['cash','card','bank_transfer','check','online'];
const GST_RATES = [0, 5, 12, 18, 28];

const TransactionModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const { items: products } = useSelector((state) => state.products);
  const { items: suppliers } = useSelector((state) => state.suppliers);

  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(18);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      type: 'sale',
      status: 'completed',
      paymentMethod: 'cash',
      supplier: '',
      reference: '',
      notes: '',
      'customer.name': '',
      'customer.email': '',
      'customer.phone': '',
      items: [{ product: '', quantity: 1, unitPrice: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchType = watch('type');
  const watchItems = watch('items');

  useEffect(() => {
    dispatch(fetchProducts({ limit: 200 }));
    dispatch(fetchSuppliers({}));
  }, [dispatch]);

  // Auto-fill price when product selected
  const handleProductChange = (index, productId) => {
    const product = products.find((p) => p._id === productId);
    if (product) {
      const price = watchType === 'sale' ? product.price.selling : product.price.cost;
      setValue(`items.${index}.unitPrice`, price);
    }
  };

  // Calculations
  const getSubtotal = () =>
    watchItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0);

  const getDiscountAmount = () => (getSubtotal() * (parseFloat(discountPercent) || 0)) / 100;
  const getTaxAmount = () => ((getSubtotal() - getDiscountAmount()) * (parseFloat(taxPercent) || 0)) / 100;
  const getTotal = () => getSubtotal() - getDiscountAmount() + getTaxAmount();

  // Check if product has enough stock
  const getStockWarning = (productId, quantity) => {
    if (watchType !== 'sale') return null;
    const product = products.find((p) => p._id === productId);
    if (!product) return null;
    if (parseInt(quantity) > product.quantity) {
      return `Only ${product.quantity} in stock`;
    }
    return null;
  };

  const onSubmit = async (data) => {
    const payload = {
      type: data.type,
      status: data.status,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      reference: data.reference,
      discount: parseFloat(getDiscountAmount().toFixed(2)),
      tax: parseFloat(getTaxAmount().toFixed(2)),
      items: data.items.map((item) => ({
        product: item.product,
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseInt(item.quantity) * parseFloat(item.unitPrice),
      })),
    };

    if (data.type === 'purchase' && data.supplier) {
      payload.supplier = data.supplier;
    }
    if (data.type === 'sale') {
      payload.customer = {
        name: data['customer.name'],
        email: data['customer.email'],
        phone: data['customer.phone'],
      };
    }

    const result = await dispatch(createTransaction(payload));
    if (!result.error) onClose();
  };

  const subtotal = getSubtotal();
  const discountAmt = getDiscountAmount();
  const taxAmt = getTaxAmount();
  const total = getTotal();

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-xl">
        <div className="modal-header">
          <h3 className="modal-title">💰 New Transaction</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="modal-body">

            {/* Type / Status / Payment */}
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Type <span className="required">*</span></label>
                <select className="form-control" {...register('type')}>
                  <option value="sale">🛒 Sale — Sell to Customer</option>
                  <option value="purchase">📦 Purchase — Buy from Supplier</option>
                  <option value="adjustment">🔧 Adjustment — Fix stock count</option>
                  <option value="transfer">🔄 Transfer — Move between locations</option>
                  <option value="return">↩️ Return — Customer returned</option>
                  <option value="damage">💔 Damage — Items damaged/lost</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" {...register('status')}>
                  <option value="completed">✅ Completed</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="partial">🔶 Partial</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-control" {...register('paymentMethod')}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Supplier (purchase only) */}
            {watchType === 'purchase' && (
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <select className="form-control" {...register('supplier')}>
                  <option value="">Select supplier (optional)</option>
                  {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
            )}

            {/* Customer (sale only) */}
            {watchType === 'sale' && (
              <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  👤 Customer Details (for invoice email)
                </div>
                <div className="form-row-3">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Name</label>
                    <input className="form-control" placeholder="Customer name" {...register('customer.name')} style={{ fontSize: '0.85rem' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Email <span style={{ fontSize: '0.7rem', color: 'var(--success)' }}>(for invoice)</span></label>
                    <input type="email" className="form-control" placeholder="customer@email.com" {...register('customer.email')} style={{ fontSize: '0.85rem' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Phone</label>
                    <input className="form-control" placeholder="+91 98765 43210" {...register('customer.phone')} style={{ fontSize: '0.85rem' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Items Table */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>
                  Items <span className="required">*</span>
                </label>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => append({ product: '', quantity: 1, unitPrice: '' })}
                >
                  <FiPlus size={13} /> Add Item
                </button>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-hover)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Product</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', width: 90 }}>Qty</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', width: 130 }}>Unit Price (₹)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', width: 120 }}>Total</th>
                      <th style={{ width: 36 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, i) => {
                      const stockWarning = getStockWarning(watchItems[i]?.product, watchItems[i]?.quantity);
                      return (
                        <tr key={field.id} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px 10px' }}>
                            <select
                              className={`form-control ${errors.items?.[i]?.product ? 'error' : ''}`}
                              style={{ fontSize: '0.85rem' }}
                              {...register(`items.${i}.product`, { required: 'Select a product' })}
                              onChange={(e) => {
                                register(`items.${i}.product`).onChange(e);
                                handleProductChange(i, e.target.value);
                              }}
                            >
                              <option value="">Select product</option>
                              {products.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name} ({p.sku}) — Stock: {p.quantity}
                                </option>
                              ))}
                            </select>
                            {errors.items?.[i]?.product && (
                              <p style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: 2 }}>⚠ {errors.items[i].product.message}</p>
                            )}
                            {stockWarning && (
                              <p style={{ fontSize: '0.72rem', color: 'var(--warning)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <FiAlertTriangle size={11} /> {stockWarning}
                              </p>
                            )}
                          </td>

                          <td style={{ padding: '8px 6px' }}>
                            <input
                              type="number" min="1"
                              className={`form-control ${errors.items?.[i]?.quantity ? 'error' : ''}`}
                              style={{ textAlign: 'center', fontSize: '0.85rem' }}
                              {...register(`items.${i}.quantity`, { required: true, min: 1 })}
                            />
                          </td>

                          <td style={{ padding: '8px 6px' }}>
                            <input
                              type="number" step="0.01" min="0"
                              className={`form-control ${errors.items?.[i]?.unitPrice ? 'error' : ''}`}
                              style={{ textAlign: 'right', fontSize: '0.85rem' }}
                              {...register(`items.${i}.unitPrice`, { required: true, min: 0 })}
                            />
                          </td>

                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: '0.875rem' }}>
                            ₹{((parseFloat(watchItems[i]?.quantity) || 0) * (parseFloat(watchItems[i]?.unitPrice) || 0)).toFixed(2)}
                          </td>

                          <td style={{ padding: '8px 6px' }}>
                            {fields.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-icon btn-sm"
                                style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none' }}
                                onClick={() => remove(i)}
                              >
                                <FiTrash2 size={12} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Discount / Tax / Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: 340 }}>
                {/* Discount & Tax inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Discount %</label>
                    <div style={{ position: 'relative' }}>
                      <input type="number" min="0" max="100" step="0.1" className="form-control" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} style={{ paddingRight: 30 }} />
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>%</span>
                    </div>
                    {parseFloat(discountPercent) > 0 && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: 3 }}>−₹{discountAmt.toFixed(2)}</p>
                    )}
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>GST / Tax %</label>
                    <div style={{ position: 'relative' }}>
                      <input type="number" min="0" max="100" step="0.1" className="form-control" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} style={{ paddingRight: 30 }} />
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>%</span>
                    </div>
                    {parseFloat(taxPercent) > 0 && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--warning)', marginTop: 3 }}>+₹{taxAmt.toFixed(2)}</p>
                    )}
                  </div>
                </div>

                {/* GST presets */}
                <div style={{ display: 'flex', gap: 5, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GST:</span>
                  {GST_RATES.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      className={`btn btn-sm ${parseFloat(taxPercent) === rate ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ padding: '2px 9px', fontSize: '0.72rem' }}
                      onClick={() => setTaxPercent(rate)}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>

                {/* Summary */}
                <div style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  {[
                    { label: 'Subtotal', value: `₹${subtotal.toFixed(2)}`, color: 'var(--text-primary)' },
                    { label: `Discount (${discountPercent || 0}%)`, value: `−₹${discountAmt.toFixed(2)}`, color: 'var(--success)' },
                    { label: `GST/Tax (${taxPercent || 0}%)`, value: `+₹${taxAmt.toFixed(2)}`, color: 'var(--warning)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ color, fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(99,102,241,0.1)' }}>
                    <span style={{ fontWeight: 700 }}>Net Total</span>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-light)' }}>
                      ₹{total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-control" rows={2} placeholder="Any additional notes..." {...register('notes')} />
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                : '✓ Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
