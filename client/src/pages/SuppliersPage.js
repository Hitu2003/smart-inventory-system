import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FiPlus, FiEdit2, FiTrash2, FiMail, FiPhone, FiStar } from 'react-icons/fi';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../redux/slices/supplierSlice';
import ConfirmModal from '../components/common/ConfirmModal';
import FormField from '../components/common/FormField';
import { supplierSchema } from '../utils/validators';

const TABS = ['basic', 'contact', 'address'];

const indianStates = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir',
  'Ladakh','Puducherry','Chandigarh',
];

const SuppliersPage = () => {
  const dispatch = useDispatch();
  const { items, loading, total } = useSelector((state) => state.suppliers);
  const { user } = useSelector((state) => state.auth);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  const canEdit = ['admin', 'manager'].includes(user?.role);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(supplierSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '', email: '', phone: '', website: '',
      'contactPerson.name': '', 'contactPerson.email': '', 'contactPerson.phone': '',
      'address.street': '', 'address.city': '', 'address.state': '',
      'address.country': 'India', 'address.zipCode': '',
      paymentTerms: 'net30', rating: 3, notes: '',
    },
  });

  useEffect(() => { dispatch(fetchSuppliers({})); }, [dispatch]);

  const openAdd = () => {
    setEditItem(null);
    setActiveTab('basic');
    reset({
      name: '', email: '', phone: '', website: '',
      'contactPerson.name': '', 'contactPerson.email': '', 'contactPerson.phone': '',
      'address.street': '', 'address.city': '', 'address.state': '',
      'address.country': 'India', 'address.zipCode': '',
      paymentTerms: 'net30', rating: 3, notes: '',
    });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditItem(s);
    setActiveTab('basic');
    reset({
      name: s.name || '', email: s.email || '', phone: s.phone || '', website: s.website || '',
      'contactPerson.name': s.contactPerson?.name || '',
      'contactPerson.email': s.contactPerson?.email || '',
      'contactPerson.phone': s.contactPerson?.phone || '',
      'address.street': s.address?.street || '',
      'address.city': s.address?.city || '',
      'address.state': s.address?.state || '',
      'address.country': s.address?.country || 'India',
      'address.zipCode': s.address?.zipCode || '',
      paymentTerms: s.paymentTerms || 'net30',
      rating: s.rating || 3,
      notes: s.notes || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    const payload = {
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      website: data.website || undefined,
      contactPerson: {
        name: data['contactPerson.name'] || undefined,
        email: data['contactPerson.email'] || undefined,
        phone: data['contactPerson.phone'] || undefined,
      },
      address: {
        street: data['address.street'] || undefined,
        city: data['address.city'] || undefined,
        state: data['address.state'] || undefined,
        country: data['address.country'] || 'India',
        zipCode: data['address.zipCode'] || undefined,
      },
      paymentTerms: data.paymentTerms,
      rating: parseInt(data.rating),
      notes: data.notes || undefined,
    };

    if (editItem) {
      await dispatch(updateSupplier({ id: editItem._id, data: payload }));
    } else {
      await dispatch(createSupplier(payload));
    }
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = async () => {
    if (deleteId) { await dispatch(deleteSupplier(deleteId)); setDeleteId(null); }
  };

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < (rating || 3) ? '#f59e0b' : 'var(--border)', fontSize: '0.9rem' }}>★</span>
    ));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">{total} suppliers</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openAdd}><FiPlus /> Add Supplier</button>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚚</div>
            <p className="empty-state-title">No suppliers yet</p>
            {canEdit && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}><FiPlus /> Add Supplier</button>}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Code</th>
                  <th>Contact</th>
                  <th>Payment Terms</th>
                  <th>Rating</th>
                  <th>Status</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      {s.email && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <FiMail size={11} /> {s.email}
                        </div>
                      )}
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem', background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 4 }}>
                        {s.code}
                      </code>
                    </td>
                    <td>
                      {s.contactPerson?.name && <div style={{ fontSize: '0.85rem' }}>{s.contactPerson.name}</div>}
                      {s.phone && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FiPhone size={11} /> {s.phone}
                        </div>
                      )}
                    </td>
                    <td><span className="badge badge-info">{s.paymentTerms?.toUpperCase()}</span></td>
                    <td><div style={{ letterSpacing: 2 }}>{renderStars(s.rating)}</div></td>
                    <td><span className={`badge ${s.isActive ? 'badge-success' : 'badge-secondary'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                    {canEdit && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(s)}><FiEdit2 size={13} /></button>
                          <button className="btn btn-icon btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none' }} onClick={() => setDeleteId(s._id)}>
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? '✏️ Edit Supplier' : '➕ Add Supplier'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {TABS.map((tab) => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{
                  padding: '10px 18px', background: 'none', border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === tab ? 'var(--primary-light)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: '0.875rem', cursor: 'pointer', textTransform: 'capitalize',
                }}>
                  {tab === 'basic' ? '🏢' : tab === 'contact' ? '👤' : '📍'} {tab}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="modal-body">

                {/* Basic Tab */}
                {activeTab === 'basic' && (
                  <div>
                    <FormField label="Supplier Name" name="name" placeholder="Company name" register={register} error={errors.name} required />
                    <div className="form-row">
                      <FormField label="Email" name="email" type="email" placeholder="company@email.com" register={register} error={errors.email} />
                      <FormField label="Phone" name="phone" placeholder="+91 98765 43210" register={register} error={errors.phone} />
                    </div>
                    <FormField label="Website" name="website" placeholder="https://supplier.com" register={register} error={errors.website} />
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Payment Terms <span className="required">*</span></label>
                        <select className="form-control" {...register('paymentTerms')}>
                          {['net15','net30','net45','net60','cod','prepaid'].map((t) => (
                            <option key={t} value={t}>{t.toUpperCase()}</option>
                          ))}
                        </select>
                        {errors.paymentTerms && <p className="form-error">⚠ {errors.paymentTerms.message}</p>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Rating (1–5)</label>
                        <input type="number" min="1" max="5" className="form-control" {...register('rating')} />
                        {errors.rating && <p className="form-error">⚠ {errors.rating.message}</p>}
                      </div>
                    </div>
                    <FormField label="Notes" name="notes" type="textarea" placeholder="Additional notes..." register={register} error={errors.notes} rows={2} />
                  </div>
                )}

                {/* Contact Tab */}
                {activeTab === 'contact' && (
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 14, background: 'var(--bg-hover)', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
                      👤 Person to contact at this supplier company.
                    </p>
                    <FormField label="Contact Person Name" name="contactPerson.name" placeholder="John Doe" register={register} error={errors['contactPerson.name']} />
                    <div className="form-row">
                      <FormField label="Contact Email" name="contactPerson.email" type="email" placeholder="john@company.com" register={register} error={errors['contactPerson.email']} />
                      <FormField label="Contact Phone" name="contactPerson.phone" placeholder="+91 98765 43210" register={register} error={errors['contactPerson.phone']} />
                    </div>
                  </div>
                )}

                {/* Address Tab */}
                {activeTab === 'address' && (
                  <div>
                    <FormField label="Street Address" name="address.street" placeholder="123 Industrial Area" register={register} error={errors['address.street']} />
                    <div className="form-row">
                      <FormField label="City" name="address.city" placeholder="e.g. Mumbai" register={register} error={errors['address.city']} />
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <select className="form-control" {...register('address.state')}>
                          <option value="">Select State</option>
                          {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <FormField label="Country" name="address.country" placeholder="India" register={register} error={errors['address.country']} />
                      <FormField label="PIN Code" name="address.zipCode" placeholder="400001" register={register} error={errors['address.zipCode']} />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <div style={{ display: 'flex', gap: 8, marginRight: 'auto' }}>
                  {activeTab !== 'basic' && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setActiveTab(TABS[TABS.indexOf(activeTab) - 1])}>← Prev</button>
                  )}
                  {activeTab !== 'address' && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab(TABS[TABS.indexOf(activeTab) + 1])}>Next →</button>
                  )}
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting
                    ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    : (editItem ? '✓ Update Supplier' : '✓ Add Supplier')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal title="Delete Supplier" message="Delete this supplier? Their products will become unassigned." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} confirmText="Delete" danger />
      )}
    </div>
  );
};

export default SuppliersPage;
