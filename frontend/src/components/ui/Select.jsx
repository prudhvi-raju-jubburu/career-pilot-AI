import React from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export default function Select({
  label,
  error,
  helper,
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  const selectId = id || name || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%', ...style }}>
      {label && (
        <label
          htmlFor={selectId}
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
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          style={{
            width: '100%',
            appearance: 'none',
            padding: '0.6rem 2.25rem 0.6rem 0.95rem',
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            color: value ? 'var(--text-primary)' : 'var(--text-muted)',
            backgroundColor: disabled ? 'var(--bg-sunken)' : 'var(--surface)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border-control)'}`,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sunken)',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          className={`input-tactile ${error ? 'error' : ''} ${className}`}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val} style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
                {lbl}
              </option>
            );
          })}
        </select>

        <span
          style={{
            position: 'absolute',
            right: '0.85rem',
            pointerEvents: 'none',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronDown size={16} />
        </span>
      </div>

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
