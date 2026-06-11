import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { MdInventory } from 'react-icons/md';
import { login } from '../redux/slices/authSlice';
import { loginSchema } from '../utils/validators';
import FormField from '../components/common/FormField';
import './AuthPages.css';

const LoginPage = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    await dispatch(login(data));
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setValue('email', 'jadavhitakshi@gmail.com', { shouldValidate: true });
      setValue('password', 'Admin@123456', { shouldValidate: true });
    } else {
      setValue('email', 'nandanisoni8686@gmail.com', { shouldValidate: true });
      setValue('password', 'Manager@123456', { shouldValidate: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-shape shape-1" />
        <div className="auth-bg-shape shape-2" />
        <div className="auth-bg-shape shape-3" />
      </div>

      <div className="auth-container">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <MdInventory size={28} color="#fff" />
            </div>
            <div>
              <h1>SmartInventory</h1>
              <p>Pro Edition</p>
            </div>
          </div>

          <div className="auth-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {/* Demo Buttons */}
          <div className="demo-buttons">
            <button type="button" className="demo-btn" onClick={() => fillDemo('admin')}>
              <span>👑</span> Admin Demo
            </button>
            <button type="button" className="demo-btn" onClick={() => fillDemo('manager')}>
              <span>👔</span> Manager Demo
            </button>
          </div>

          <div className="auth-divider"><span>or sign in manually</span></div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
            <FormField
              label="Email Address"
              name="email"
              type="email"
              placeholder="jadavhitakshi@gmail.com"
              register={register}
              error={errors.email}
              required
              icon={<FiMail />}
            />

            <FormField
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              register={register}
              error={errors.password}
              required
              icon={<FiLock />}
              rightIcon={showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              onRightIconClick={() => setShowPassword(!showPassword)}
            />

            <div className="auth-options">
              <label className="checkbox-label">
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading || isSubmitting}
            >
              {(loading || isSubmitting)
                ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/register" className="auth-link">Create one</Link>
          </p>
        </div>

        {/* Side panel */}
        <div className="auth-side">
          <div className="auth-side-content">
            <h2>Manage your inventory smarter</h2>
            <p>Real-time tracking, smart alerts, and powerful analytics — all in one place.</p>
            <div className="auth-features">
              {[
                'Real-time stock tracking',
                'Low stock alerts & emails',
                'Sales analytics & charts',
                'PDF invoice generation',
                'Multi-user role system',
                'Supplier management',
                'Customer billing system',
              ].map((f) => (
                <div key={f} className="auth-feature-item">
                  <span className="auth-feature-check">✓</span> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
