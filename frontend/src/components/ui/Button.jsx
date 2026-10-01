import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Tactile Modern Skeuomorphic Button Component
 *
 * @param {('primary'|'secondary'|'outline'|'ghost'|'danger'|'success'|'icon')} variant
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
  const getVariantClass = () => {
    switch (variant) {
      case 'secondary':
        return 'btn-skeuo-secondary';
      case 'outline':
        return 'btn-skeuo-outline';
      case 'ghost':
        return 'btn-skeuo-ghost';
      case 'danger':
        return 'btn-skeuo-danger';
      case 'success':
        return 'btn-skeuo-success';
      case 'icon':
        return 'btn-skeuo-secondary';
      case 'primary':
      default:
        return 'btn-skeuo-primary';
    }
  };

  const getSizeStyles = () => {
    if (variant === 'icon') {
      switch (size) {
        case 'sm':
          return { width: '32px', height: '32px', padding: 0, borderRadius: 'var(--radius-sm)' };
        case 'lg':
          return { width: '44px', height: '44px', padding: 0, borderRadius: 'var(--radius-lg)' };
        case 'md':
        default:
          return { width: '38px', height: '38px', padding: 0, borderRadius: 'var(--radius-md)' };
      }
    }

    switch (size) {
      case 'sm':
        return {
          padding: '0.4rem 0.8rem',
          fontSize: '0.8125rem',
          gap: '0.375rem',
          borderRadius: 'var(--radius-sm)',
        };
      case 'lg':
        return {
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          gap: '0.625rem',
          borderRadius: 'var(--radius-lg)',
        };
      case 'md':
      default:
        return {
          padding: '0.55rem 1.15rem',
          fontSize: '0.875rem',
          gap: '0.5rem',
          borderRadius: 'var(--radius-md)',
        };
    }
  };

  return (
    <button
      type={type}
      className={`btn-skeuo ${getVariantClass()} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        ...getSizeStyles(),
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="animate-spin" />
      ) : (
        icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && iconRight && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{iconRight}</span>
      )}
    </button>
  );
}
