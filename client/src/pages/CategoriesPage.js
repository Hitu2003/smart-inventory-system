import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../redux/slices/categorySlice';
import ConfirmModal from '../components/common/ConfirmModal';
import FormField from '../components/common/FormField';
import { categorySchema } from '../utils/validators';

const CategoriesPage = () => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.categories);
  const { user } = useSelector((state) => state.auth);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const canEdit = ['admin', 'manager'].includes(user?.role);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(categorySchema),
    mode: 'onTouched',
    defaultValues: { name: '', description: '', icon: 'box', color: '#6366f1' },
  });

  const watchedColor = watch('color', '#6366f1');

  useEffect(() => { dispatch(fetchCategories()); }, [dispatch]);

  const openAdd = () => {
    setEditItem(null);
    reset({ name: '', description: '', icon: 'box', color: '#6366f1' });
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditItem(cat);
    reset({ name: cat.name, description: cat.description || '', icon: cat.icon || 'box', color: cat.color || '#6366f1' });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    if (editItem) {
      await dispatch(updateCategory({ id: editItem._id, data }));
    } else {
      await dispatch(createCategory(data));
    }
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = async () => {
    if (deleteId) { await dispatch(deleteCategory(deleteId)); setDeleteId(null); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">{items.length} categories</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openAdd}>
            <FiPlus /> Add Category
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {items.map((cat) => (
            <div key={cat._id} className="card" style={{ borderTop: `3px solid ${cat.color}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius)', background: `${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                    📦
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>{cat.name}</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {cat.productCount || 0} products
                    </p>
                  </div>
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(cat)}><FiEdit2 size={13} /></button>
                    <button className="btn btn-icon btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none' }} onClick={() => setDeleteId(cat._id)}><FiTrash2 size={13} /></button>
                  </div>
                )}
              </div>
              {cat.description && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.5 }}>{cat.description}</p>
              )}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat.color}</span>
                <span className={`badge ${cat.isActive ? 'badge-success' : 'badge-secondary'}`} style={{ marginLeft: 'auto' }}>
                  {cat.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state-icon">🏷️</div>
              <p className="empty-state-title">No categories yet</p>
              {canEdit && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}><FiPlus /> Add Category</button>}
            </div>
          )}
        </div>
      )}

      {/* Modal with React Hook Form */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? '✏️ Edit Category' : '➕ Add Category'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="modal-body">
                <FormField
                  label="Category Name"
                  name="name"
                  placeholder="e.g. Electronics"
                  register={register}
                  error={errors.name}
                  required
                  hint="Must be unique across all categories"
                />

                <FormField
                  label="Description"
                  name="description"
                  type="textarea"
                  placeholder="Optional description..."
                  register={register}
                  error={errors.description}
                  rows={2}
                />

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Color <span className="required">*</span></label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="color"
                        {...register('color')}
                        style={{ width: 44, height: 38, padding: 2, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        placeholder="#6366f1"
                        {...register('color')}
                        className={`form-control ${errors.color ? 'error' : ''}`}
                      />
                    </div>
                    {errors.color && <p className="form-error">⚠ {errors.color.message}</p>}
                    {/* Color preview */}
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: watchedColor, border: '1px solid var(--border)' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preview</span>
                    </div>
                  </div>

                  <FormField
                    label="Icon"
                    name="icon"
                    placeholder="box"
                    register={register}
                    error={errors.icon}
                    hint="Icon name (box, cpu, shirt...)"
                  />
                </div>

                {/* Preset colors */}
                <div>
                  <label className="form-label">Quick Colors</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['#6366f1','#10b981','#f59e0b','#ef4444','#0ea5e9','#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => reset({ ...watch(), color: c })}
                        style={{
                          width: 28, height: 28, borderRadius: 6, background: c,
                          border: watchedColor === c ? '3px solid var(--text-primary)' : '2px solid transparent',
                          cursor: 'pointer', transition: 'var(--transition)',
                        }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting
                    ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    : (editItem ? '✓ Update Category' : '✓ Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete Category"
          message="Delete this category? Products in this category will become uncategorized."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          confirmText="Delete"
          danger
        />
      )}
    </div>
  );
};

export default CategoriesPage;
