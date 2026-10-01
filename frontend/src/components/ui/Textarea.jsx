import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function Textarea({
  label,
  error,
  helper,
  id,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  const inputId = id || name || `textarea-${Math.random().toString(36).substr(2, 9)}`;

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

      <textarea
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.65rem 0.95rem',
          fontSize: '0.875rem',
          fontFamily: 'inherit',
          color: 'var(--text-primary)',
          backgroundColor: disabled ? 'var(--bg-sunken)' : 'var(--surface)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border-control)'}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sunken)',
          resize: 'vertical',
          outline: 'none',
          lineHeight: 1.5,
        }}
        className={`input-tactile ${error ? 'error' : ''} ${className}`}
        {...props}
      />

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
