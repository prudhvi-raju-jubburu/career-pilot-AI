import React from 'react';

/**
 * Reusable Modern Skeuomorphic ProgressBar Component
 *
 * @param {number} value - 0 to 100
 * @param {string} label - Optional label above progress
 * @param {boolean} showPercentage - Whether to show number on right
 * @param {('primary'|'success'|'accent'|'purple')} variant
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
      case 'accent':
        return 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)';
      case 'danger':
        return 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
      case 'purple':
        return 'linear-gradient(90deg, #7c3aed 0%, #9333ea 100%)';
      case 'primary':
      default:
        return 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)';
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
          {label && <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{label}</span>}
          {showPercentage && (
            <span style={{ fontWeight: 700, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
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
          backgroundColor: 'var(--color-bg-sunken)',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-sunken)',
          border: '1px solid var(--border-subtle)',
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
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 1px 2px rgba(0, 0, 0, 0.15)',
            transition: 'width var(--transition-slow)',
          }}
        />
      </div>
    </div>
  );
}
