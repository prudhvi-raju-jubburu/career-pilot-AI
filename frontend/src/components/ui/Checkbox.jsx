import React from 'react';
import { Check } from 'lucide-react';

export default function Checkbox({
  label,
  description,
  id,
  name,
  checked = false,
  onChange,
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  const inputId = id || name || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <label
      htmlFor={inputId}
      style={{
        display: 'inline-flex',
        alignItems: description ? 'flex-start' : 'center',
        gap: '0.65rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        userSelect: 'none',
        ...style,
      }}
      className={className}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: description ? '2px' : 0 }}>
        <input
          id={inputId}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
          {...props}
        />
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: checked ? 'var(--primary)' : 'var(--surface)',
            border: `1px solid ${checked ? 'var(--primary)' : 'var(--border-control)'}`,
            boxShadow: checked ? 'var(--shadow-btn-primary)' : 'var(--shadow-sunken)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-fast)',
            color: '#ffffff',
          }}
        >
          {checked && <Check size={13} strokeWidth={3} />}
        </div>
      </div>

      {(label || description) && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {label && (
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {label}
            </span>
          )}
          {description && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}
