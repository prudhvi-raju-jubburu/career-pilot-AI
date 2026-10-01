import React from 'react';

export default function Switch({
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
  const inputId = id || name || `switch-${Math.random().toString(36).substr(2, 9)}`;

  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: description ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
      className={className}
      onClick={handleToggle}
    >
      {(label || description) && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {label && (
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {label}
            </span>
          )}
          {description && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {description}
            </span>
          )}
        </div>
      )}

      <div
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleToggle();
          }
        }}
        style={{
          width: '42px',
          height: '24px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: checked ? 'var(--primary)' : 'var(--bg-sunken)',
          border: `1px solid ${checked ? 'var(--primary)' : 'var(--border-control)'}`,
          boxShadow: 'var(--shadow-sunken)',
          position: 'relative',
          transition: 'all var(--transition-normal)',
          flexShrink: 0,
          outline: 'none',
        }}
        {...props}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
            position: 'absolute',
            top: '2px',
            left: checked ? '20px' : '2px',
            transition: 'left var(--transition-fast)',
          }}
        />
      </div>
    </div>
  );
}
