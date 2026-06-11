import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FiUser, FiMail, FiLock, FiSave, FiSun, FiMoon, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import { updateProfile } from '../redux/slices/authSlice';
import { toggleTheme } from '../redux/slices/uiSlice';
import { changePasswordSchema } from '../utils/validators';
import FormField from '../components/common/FormField';
import api from '../services/api';
import toast from 'react-hot-toast';

const roleColors = {
  admin: '#ef4444', manager: '#f59e0b',
  staff: '#3b82f6', viewer: '#94a3b8',
};

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const [activeTab, setActiveTab] = useState('profile');
  const [savingProfile, setSavingProfile] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notifications, setNotifications] = useState(user?.preferences?.notifications || { lowStock: true, newOrder: true, reportReady: false });

  // Profile form
  const profileForm = useForm({
    defaultValues: { name: user?.name || '' },
    mode: 'onTouched',
  });

  // Password form
  const passwordForm = useForm({
    resolver: yupResolver(changePasswordSchema),
    mode: 'onTouched',
  });

  const newPassword = passwordForm.watch('newPassword', '');

  const passwordChecks = [
    { label: '8+ characters', ok: newPassword.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(newPassword) },
    { label: 'Number', ok: /[0-9]/.test(newPassword) },
  ];

  const onProfileSubmit = async (data) => {
    setSavingProfile(true);
    await dispatch(updateProfile({ name: data.name, preferences: { notifications } }));
    setSavingProfile(false);
  };

  const onPasswordSubmit = async (data) => {
    try {
      await api.put('/auth/updatepassword', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('✅ Password updated successfully');
      passwordForm.reset();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password';
      passwordForm.setError('currentPassword', { message: msg });
      toast.error(msg);
    }
  };

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="fade-in" style={{ maxWidth: 820 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile & Settings</h1>
          <p className="page-subtitle">Manage your account preferences</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="avatar avatar-xl">
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : getInitials(user?.name)}
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{user?.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user?.email}</p>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: `${roleColors[user?.role] || '#64748b'}20`, color: roleColors[user?.role] || '#64748b', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                {user?.role}
              </span>
              {user?.isEmailVerified && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--success)' }}>
                  <FiCheckCircle size={12} /> Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 4, width: 'fit-content' }}>
        {['profile', 'password', 'preferences'].map((tab) => (
          <button
            key={tab}
            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(tab)}
            style={{ textTransform: 'capitalize' }}
          >
            {tab === 'profile' ? '👤' : tab === 'password' ? '🔒' : '⚙️'} {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 20 }}>Personal Information</h3>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} noValidate>
            <FormField
              label="Full Name"
              name="name"
              placeholder="Your full name"
              register={profileForm.register}
              error={profileForm.formState.errors.name}
              required
              icon={<FiUser />}
            />

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <FiMail style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-control" style={{ paddingLeft: 36 }} value={user?.email} disabled />
              </div>
              <p className="form-hint">Email address cannot be changed</p>
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile
                ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                : <><FiSave size={14} /> Save Changes</>}
            </button>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 20 }}>Change Password</h3>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} noValidate>
            <FormField
              label="Current Password"
              name="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              placeholder="Enter current password"
              register={passwordForm.register}
              error={passwordForm.formState.errors.currentPassword}
              required
              icon={<FiLock />}
              rightIcon={showCurrent ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              onRightIconClick={() => setShowCurrent(!showCurrent)}
            />

            <FormField
              label="New Password"
              name="newPassword"
              type={showNew ? 'text' : 'password'}
              placeholder="Min 8 characters"
              register={passwordForm.register}
              error={passwordForm.formState.errors.newPassword}
              required
              icon={<FiLock />}
              rightIcon={showNew ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              onRightIconClick={() => setShowNew(!showNew)}
            />

            {/* Password strength indicator */}
            {newPassword && (
              <div style={{ marginBottom: 14, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {passwordChecks.map(({ label, ok }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: ok ? 'var(--success)' : 'var(--text-muted)' }}>
                      <FiCheckCircle size={12} /> {label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FormField
              label="Confirm New Password"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat new password"
              register={passwordForm.register}
              error={passwordForm.formState.errors.confirmPassword}
              required
              icon={<FiLock />}
              rightIcon={showConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              onRightIconClick={() => setShowConfirm(!showConfirm)}
            />

            <button type="submit" className="btn btn-primary" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting
                ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                : <><FiLock size={14} /> Update Password</>}
            </button>
          </form>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 20 }}>Preferences</h3>

          {/* Theme */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Appearance</h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-hover)', borderRadius: 'var(--radius)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {theme === 'dark' ? <FiMoon size={18} /> : <FiSun size={18} />}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Theme</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Currently: {theme} mode</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => dispatch(toggleTheme())}>
                Switch to {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
              </button>
            </div>
          </div>

          {/* Notification toggles */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notifications</h4>
            {[
              { key: 'lowStock', label: 'Low Stock Alerts', desc: 'Get notified when products need restocking' },
              { key: 'newOrder', label: 'New Transactions', desc: 'Get notified for new sales and purchases' },
              { key: 'reportReady', label: 'Reports Ready', desc: 'Get notified when reports are generated' },
            ].map(({ key, label, desc }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-hover)', borderRadius: 'var(--radius)', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{desc}</div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={notifications[key] ?? true}
                    onChange={(e) => setNotifications((n) => ({ ...n, [key]: e.target.checked }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute', inset: 0,
                    background: notifications[key] ? 'var(--primary)' : 'var(--border)',
                    borderRadius: 12, transition: 'var(--transition)',
                  }}>
                    <span style={{
                      position: 'absolute', top: 2,
                      left: notifications[key] ? 22 : 2,
                      width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'var(--transition)',
                    }} />
                  </span>
                </label>
              </div>
            ))}

            <button
              className="btn btn-primary"
              style={{ marginTop: 12 }}
              onClick={() => profileForm.handleSubmit(onProfileSubmit)()}
              disabled={savingProfile}
            >
              {savingProfile
                ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                : <><FiSave size={14} /> Save Preferences</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
