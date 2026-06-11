import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';
import { userSchema } from '../utils/validators';
import FormField from '../components/common/FormField';
import ConfirmModal from '../components/common/ConfirmModal';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const roleColors = {
  admin: 'badge-danger',
  manager: 'badge-warning',
  staff: 'badge-info',
  viewer: 'badge-secondary',
};

const UsersPage = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(userSchema),
    context: { isEdit: !!editItem },
    mode: 'onTouched',
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data.data);
    } catch { toast.error('Failed to load users'); }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const openAdd = () => {
    setEditItem(null);
    reset({ name: '', email: '', password: '', role: 'staff' });
    setShowPassword(false);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditItem(u);
    reset({ name: u.name, email: u.email, password: '', role: u.role });
    setShowPassword(false);
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editItem) {
        const { password, ...updateData } = data;
        await api.put(`/users/${editItem._id}`, updateData);
        toast.success('✅ User updated successfully');
      } else {
        await api.post('/users', data);
        toast.success('✅ User created successfully');
      }
      await loadUsers();
      setShowModal(false);
      setEditItem(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save user';
      toast.error(msg);
      if (msg.includes('email')) {
        // Set field-level error
      }
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await api.delete(`/users/${deleteId}`);
        toast.success('User deactivated');
        loadUsers();
      } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
      setDeleteId(null);
    }
  };

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{users.length} team members</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><FiPlus /> Add User</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar">
                          {u.avatar
                            ? <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            : getInitials(u.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {u.name}
                            {u._id === currentUser?._id && <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>You</span>}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                    <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-secondary'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {u.lastLogin ? format(new Date(u.lastLogin), 'dd MMM yyyy') : 'Never'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {format(new Date(u.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(u)}><FiEdit2 size={13} /></button>
                        {u._id !== currentUser?._id && (
                          <button className="btn btn-icon btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none' }} onClick={() => setDeleteId(u._id)}>
                            <FiTrash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal with React Hook Form */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? '✏️ Edit User' : '➕ Add User'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="modal-body">
                <FormField
                  label="Full Name"
                  name="name"
                  placeholder="e.g. Rahul Sharma"
                  register={register}
                  error={errors.name}
                  required
                />

                <FormField
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  register={register}
                  error={errors.email}
                  required
                  disabled={!!editItem}
                  hint={editItem ? 'Email cannot be changed after creation' : ''}
                />

                {!editItem && (
                  <FormField
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    register={register}
                    error={errors.password}
                    required
                    rightIcon={showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    onRightIconClick={() => setShowPassword(!showPassword)}
                    hint="Must contain uppercase letter and number"
                  />
                )}

                <div className="form-group">
                  <label className="form-label">Role <span className="required">*</span></label>
                  <select className={`form-control ${errors.role ? 'error' : ''}`} {...register('role')}>
                    <option value="admin">👑 Admin — Full access</option>
                    <option value="manager">👔 Manager — Add/Edit products & transactions</option>
                    <option value="staff">👷 Staff — Update stock & create transactions</option>
                    <option value="viewer">👁️ Viewer — View only, no edits</option>
                  </select>
                  {errors.role && <p className="form-error">⚠ {errors.role.message}</p>}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting
                    ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    : (editItem ? '✓ Update User' : '✓ Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          title="Deactivate User"
          message="This will deactivate the user account. They will no longer be able to log in."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          confirmText="Deactivate"
          danger
        />
      )}
    </div>
  );
};

export default UsersPage;
