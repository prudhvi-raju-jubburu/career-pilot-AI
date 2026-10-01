import React from 'react';

/**
 * Reusable Modern Skeuomorphic ProgressBar Component
 *
 * @param {number} value - 0 to 100
 * @param {string} label - Optional label above progress
 * @param {boolean} showPercentage - Whether to show number on right
 * @param {('primary'|'success'|'accent'|'secondary'|'danger'|'warning')} variant
 * @param {('sm'|'md'|'lg')} size
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showPercentage = true,
  variant = 'primary',
  size = 'md',
  className = '',
  style = {},
  ...props
}) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const getVariantGradient = () => {
    switch (variant) {
      case 'success':
        return 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
      case 'secondary':
        return 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)';
      case 'accent':
        return 'linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)';
      case 'danger':
        return 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
      case 'warning':
        return 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
      case 'primary':
      default:
        return 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)';
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'sm': return '6px';
      case 'lg': return '12px';
      case 'md':
      default: return '8px';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%', ...style }} className={className} {...props}>
      {(label || showPercentage) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
          {label && <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>}
          {showPercentage && (
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
              {percentage}%
            </span>
          )}
        </div>
      )}

      {/* Inset track */}
      <div
        style={{
          width: '100%',
          height: getHeight(),
          backgroundColor: 'var(--bg-sunken)',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-sunken)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Raised gradient fill */}
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: getVariantGradient(),
            borderRadius: 'var(--radius-full)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 1px 2px rgba(0, 0, 0, 0.25)',
            transition: 'width var(--transition-slow)',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Circular / Radial Progress Indicator
 */
export function CircularProgress({
  value = 0,
  size = 72,
  strokeWidth = 6,
  variant = 'primary',
  label,
  children,
}) {
  const percentage = Math.min(Math.max(Math.round(value), 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let strokeColor = 'var(--primary)';
  if (variant === 'success') strokeColor = 'var(--success)';
  else if (variant === 'warning') strokeColor = 'var(--warning)';
  else if (variant === 'danger') strokeColor = 'var(--danger)';
  else if (variant === 'accent') strokeColor = 'var(--accent)';

  return (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--bg-sunken)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{ transition: 'stroke-dashoffset var(--transition-slow)' }}
        />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children || (
          <span style={{ fontSize: `${Math.round(size * 0.26)}px`, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {percentage}%
          </span>
        )}
        {label && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{label}</span>}
      </div>
    </div>
  );
}
