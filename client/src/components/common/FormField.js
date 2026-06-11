import React from 'react';

/**
 * Reusable FormField component
 * Works with React Hook Form's register/errors
 */
const FormField = ({
  label,
  name,
  type = 'text',
  placeholder,
  register,
  error,
  required,
  hint,
  icon,
  rightIcon,
  onRightIconClick,
  children,
  style,
  inputStyle,
  disabled,
  rows,
  options,       // for select: [{value, label}]
  min, max, step,
}) => {
  return (
    <div className="form-group" style={style}>
      {label && (
        <label className="form-label" htmlFor={name}>
          {label}
          {required && <span className="required"> *</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {/* Left icon */}
        {icon && (
          <span style={{
            position: 'absolute', left: 11, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-muted)',
            fontSize: '0.9rem', pointerEvents: 'none', zIndex: 1,
            ...(type === 'textarea' ? { top: 12, transform: 'none' } : {}),
          }}>
            {icon}
          </span>
        )}

        {/* Textarea */}
        {type === 'textarea' ? (
          <textarea
            id={name}
            rows={rows || 3}
            placeholder={placeholder}
            disabled={disabled}
            className={`form-control ${error ? 'error' : ''}`}
            style={{ paddingLeft: icon ? 36 : undefined, ...inputStyle }}
            {...(register ? register(name) : {})}
          />
        ) : type === 'select' ? (
          /* Select */
          <select
            id={name}
            disabled={disabled}
            className={`form-control ${error ? 'error' : ''}`}
            style={{ paddingLeft: icon ? 36 : undefined, ...inputStyle }}
            {...(register ? register(name) : {})}
          >
            {children || options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          /* Input */
          <input
            id={name}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={`form-control ${error ? 'error' : ''}`}
            style={{
              paddingLeft: icon ? 36 : undefined,
              paddingRight: rightIcon ? 40 : undefined,
              ...inputStyle,
            }}
            {...(register ? register(name) : {})}
          />
        )}

        {/* Right icon (e.g. show/hide password) */}
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            style={{
              position: 'absolute', right: 10, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', padding: 4,
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            {rightIcon}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="form-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>⚠</span> {error.message}
        </p>
      )}

      {/* Hint text (only show when no error) */}
      {hint && !error && (
        <p className="form-hint">{hint}</p>
      )}
    </div>
  );
};

export default FormField;
