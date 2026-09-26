import React from 'react';

/**
 * Reusable Modern Skeuomorphic Badge / Tag Component
 *
 * @param {('default'|'primary'|'success'|'warning'|'danger'|'neutral'|'purple')} variant
 * @param {('sm'|'md')} size
 * @param {boolean} dot - Whether to show a colored status dot
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  style = {},
  ...props
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-primary-50)',
          color: 'var(--color-primary-700)',
          border: '1px solid var(--color-primary-100)',
          dotColor: 'var(--color-primary-600)',
        };
      case 'success':
        return {
          backgroundColor: 'var(--color-success-bg)',
          color: 'var(--color-success-dark)',
          border: '1px solid var(--color-success-border)',
          dotColor: 'var(--color-success)',
        };
      case 'warning':
        return {
          backgroundColor: 'var(--color-warning-bg)',
          color: 'var(--color-warning-dark)',
          border: '1px solid var(--color-warning-border)',
          dotColor: 'var(--color-warning)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--color-danger-bg)',
          color: 'var(--color-danger-dark)',
          border: '1px solid var(--color-danger-border)',
          dotColor: 'var(--color-danger)',
        };
      case 'purple':
        return {
          backgroundColor: 'var(--color-purple-50)',
          color: 'var(--color-purple-600)',
          border: '1px solid var(--color-purple-100)',
          dotColor: 'var(--color-purple-600)',
        };
      case 'neutral':
        return {
          backgroundColor: 'var(--color-bg-alt)',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--border-subtle)',
          dotColor: 'var(--color-text-subtle)',
        };
      case 'default':
      default:
        return {
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--border-control)',
          dotColor: 'var(--color-primary-500)',
        };
    }
  };

  const currentStyles = getVariantStyles();

  const sizeStyles = size === 'sm' ? {
    padding: '0.15rem 0.5rem',
    fontSize: '0.71875rem',
    gap: '0.3rem',
  } : {
    padding: '0.25rem 0.65rem',
    fontSize: '0.78125rem',
    gap: '0.4rem',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        lineHeight: 1.25,
        letterSpacing: '0.01em',
        ...currentStyles,
        ...sizeStyles,
        ...style,
      }}
      className={`badge-skeuo ${variant} ${className}`}
      {...props}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: currentStyles.dotColor,
            flexShrink: 0,
            boxShadow: `0 0 0 2px rgba(255, 255, 255, 0.8)`,
          }}
        />
      )}
      {children}
    </span>
  );
}
