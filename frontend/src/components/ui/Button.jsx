import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Tactile Modern Skeuomorphic Button Component
 *
 * @param {('primary'|'secondary'|'outline'|'ghost'|'danger'|'accent')} variant
 * @param {('sm'|'md'|'lg')} size
 * @param {boolean} loading
 * @param {boolean} disabled
 * @param {React.ReactNode} icon - Left icon
 * @param {React.ReactNode} iconRight - Right icon
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  className = '',
  style = {},
  type = 'button',
  onClick,
  ...props
}) {
  // Styles based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-primary-600)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-btn-primary)',
          border: '1px solid rgba(29, 78, 216, 0.6)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
          boxShadow: 'var(--shadow-btn-secondary)',
          border: '1px solid var(--border-control)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-primary-600)',
          border: '1px solid var(--color-primary-600)',
          boxShadow: 'none',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-text-muted)',
          border: '1px solid transparent',
          boxShadow: 'none',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--color-danger)',
          color: '#ffffff',
          boxShadow: '0 1px 2px rgba(239, 68, 68, 0.25), 0 3px 6px -1px rgba(239, 68, 68, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
          border: '1px solid var(--color-danger-dark)',
        };
      case 'accent':
        return {
          backgroundColor: 'var(--color-accent-600)',
          color: '#ffffff',
          boxShadow: '0 1px 2px rgba(79, 70, 229, 0.25), 0 3px 6px -1px rgba(79, 70, 229, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
          border: '1px solid var(--color-accent-700)',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.4rem 0.75rem',
          fontSize: '0.8125rem',
          gap: '0.35rem',
          borderRadius: 'var(--radius-sm)',
        };
      case 'lg':
        return {
          padding: '0.75rem 1.45rem',
          fontSize: '1rem',
          gap: '0.6rem',
          borderRadius: 'var(--radius-lg)',
        };
      case 'md':
      default:
        return {
          padding: '0.55rem 1.05rem',
          fontSize: '0.875rem',
          gap: '0.5rem',
          borderRadius: 'var(--radius-md)',
        };
    }
  };

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    userSelect: 'none',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style,
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={baseStyles}
      className={`btn-tactile ${variant} ${className}`}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          if (variant === 'primary') e.currentTarget.style.boxShadow = 'var(--shadow-btn-primary-hover)';
          if (variant === 'secondary') e.currentTarget.style.boxShadow = 'var(--shadow-btn-secondary-hover)';
          if (variant === 'ghost') e.currentTarget.style.backgroundColor = 'var(--color-bg-alt)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(0)';
          if (variant === 'primary') e.currentTarget.style.boxShadow = 'var(--shadow-btn-primary)';
          if (variant === 'secondary') e.currentTarget.style.boxShadow = 'var(--shadow-btn-secondary)';
          if (variant === 'ghost') e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(1px)';
          if (variant === 'primary') e.currentTarget.style.boxShadow = 'var(--shadow-btn-primary-active)';
          if (variant === 'secondary') e.currentTarget.style.boxShadow = 'var(--shadow-btn-secondary-active)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          if (variant === 'primary') e.currentTarget.style.boxShadow = 'var(--shadow-btn-primary-hover)';
          if (variant === 'secondary') e.currentTarget.style.boxShadow = 'var(--shadow-btn-secondary-hover)';
        }
      }}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className="spin" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
          <span>{children}</span>
          {iconRight && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{iconRight}</span>}
        </>
      )}
    </button>
  );
}
