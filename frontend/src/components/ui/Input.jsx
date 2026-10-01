import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * Reusable Modern Skeuomorphic Input Field
 *
 * @param {string} label
 * @param {string} error
 * @param {string} helper
 * @param {boolean} success
 * @param {boolean} loading
 * @param {React.ReactNode} icon - Left icon
 */
export default function Input({
  label,
  error,
  helper,
  success = false,
  loading = false,
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

  let borderColor = 'var(--border-control)';
  if (error) borderColor = 'var(--danger)';
  else if (success) borderColor = 'var(--success)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%', ...style }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--danger)' }}>*</span>}
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
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              zIndex: 1,
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
            paddingRight: isPasswordType || loading || error || success ? '2.5rem' : '0.95rem',
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            color: 'var(--text-primary)',
            backgroundColor: disabled ? 'var(--bg-sunken)' : 'var(--surface)',
            border: `1px solid ${borderColor}`,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sunken)',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast)',
            outline: 'none',
          }}
          className={`input-tactile ${error ? 'error' : ''} ${className}`}
          {...props}
        />

        {/* Right Status Indicators */}
        <div
          style={{
            position: 'absolute',
            right: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          {loading && <Loader2 size={16} className="animate-spin text-muted" />}
          {!loading && success && <CheckCircle2 size={16} className="text-success" />}
          {!loading && error && <AlertCircle size={16} className="text-danger" />}
          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Helper text or error message */}
      {error && (
        <div style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}
      {!error && helper && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {helper}
        </div>
      )}
    </div>
  );
}
