import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

/**
 * Reusable Modern Skeuomorphic Input Field
 *
 * @param {string} label
 * @param {string} error
 * @param {string} helper
 * @param {React.ReactNode} icon - Left icon
 */
export default function Input({
  label,
  error,
  helper,
  icon,
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;
  const isPasswordType = type === 'password';
  const effectiveType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%', ...style }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '0.84375rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-subtle)',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </span>
        )}

        <input
          id={inputId}
          name={name}
          type={effectiveType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          style={{
            width: '100%',
            padding: `0.6rem 0.95rem 0.6rem ${icon ? '2.4rem' : '0.95rem'}`,
            paddingRight: isPasswordType ? '2.5rem' : '0.95rem',
            fontSize: '0.9375rem',
            fontFamily: 'inherit',
            color: 'var(--color-text)',
            backgroundColor: disabled ? 'var(--color-bg-alt)' : 'var(--color-surface)',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--border-control)'}`,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sunken)',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast)',
            outline: 'none',
          }}
          className={`input-tactile ${error ? 'error' : ''} ${className}`}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--color-primary-500)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15), var(--shadow-sunken)';
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--border-control)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sunken)';
            }
          }}
          {...props}
        />

        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            style={{
              position: 'absolute',
              right: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-subtle)',
              padding: '0.2rem',
              borderRadius: 'var(--radius-sm)',
            }}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error ? (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.78125rem',
            color: 'var(--color-danger)',
            fontWeight: 500,
          }}
        >
          <AlertCircle size={14} />
          {error}
        </span>
      ) : helper ? (
        <span style={{ fontSize: '0.78125rem', color: 'var(--color-text-subtle)' }}>
          {helper}
        </span>
      ) : null}
    </div>
  );
}
