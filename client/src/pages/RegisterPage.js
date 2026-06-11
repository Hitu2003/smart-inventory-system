import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import { MdInventory } from 'react-icons/md';
import { register as registerUser } from '../redux/slices/authSlice';
import { registerSchema } from '../utils/validators';
import FormField from '../components/common/FormField';
import './AuthPages.css';

const PasswordStrength = ({ password = '' }) => {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One number', ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['', 'var(--danger)', 'var(--warning)', 'var(--success)'];
  const labels = ['', 'Weak', 'Medium', 'Strong'];

  if (!password) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: score >= i ? colors[score] : 'var(--border)', transition: 'var(--transition)' }} />
        ))}
        <span style={{ fontSize: '0.72rem', color: colors[score], fontWeight: 600, marginLeft: 6, minWidth: 45 }}>
          {labels[score]}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {checks.map(({ label, ok }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: ok ? 'var(--success)' : 'var(--text-muted)' }}>
            <FiCheckCircle size={11} /> {label}
          </div>
        ))}
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: 'onTouched',
  });

  const password = watch('password', '');

  const onSubmit = async ({ confirmPassword, ...data }) => {
    await dispatch(registerUser(data));
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-shape shape-1" />
        <div className="auth-bg-shape shape-2" />
      </div>

      <div className="auth-container" style={{ maxWidth: 540 }}>
        <div className="auth-card" style={{ maxWidth: '100%' }}>
          <div className="auth-logo">
            <div className="auth-logo-icon"><MdInventory size={28} color="#fff" /></div>
            <div><h1>SmartInventory</h1><p>Pro Edition</p></div>
          </div>

          <div className="auth-header">
            <h2>Create account</h2>
            <p>Join SmartInventory Pro today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
            <FormField
              label="Full Name"
              name="name"
              placeholder="e.g. Jadav Hitakshi"
              register={register}
              error={errors.name}
              required
              icon={<FiUser />}
            />

            <FormField
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              register={register}
              error={errors.email}
              required
              icon={<FiMail />}
            />

            <div className="form-row">
              <div>
                <FormField
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  register={register}
                  error={errors.password}
                  required
                  icon={<FiLock />}
                  rightIcon={showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  onRightIconClick={() => setShowPassword(!showPassword)}
                />
                <PasswordStrength password={password} />
              </div>

              <FormField
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat password"
                register={register}
                error={errors.confirmPassword}
                required
                icon={<FiLock />}
                rightIcon={showConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                onRightIconClick={() => setShowConfirm(!showConfirm)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading || isSubmitting}
            >
              {(loading || isSubmitting)
                ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
