import React from 'react';

export default function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  label,
  suffix = '',
  className = '',
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }} className={className}>
      {(label || suffix) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {label && (
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              {label}
            </span>
          )}
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              color: 'var(--primary)',
            }}
          >
            {value}{suffix}
          </span>
        </div>
      )}

      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange && onChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: '6px',
            appearance: 'none',
            WebkitAppearance: 'none',
            borderRadius: '999px',
            background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percentage}%, var(--border-control) ${percentage}%, var(--border-control) 100%)`,
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </div>
    </div>
  );
}
