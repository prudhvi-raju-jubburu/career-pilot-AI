import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useMagnetic } from '../../motion/hooks';
import { SPRINGS } from '../../motion/tokens';

/**
 * CareerPilot AI — High Performance Kinetic Button
 * Supports 6 visual variants, magnetic cursor attraction, loading states, and tactile springs.
 */
export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glow'
  size = 'md',         // 'sm' | 'md' | 'lg'
  magnetic = false,
  loading = false,
  loadingText,
  disabled = false,
  icon,
  iconLeft,
  iconRight,
  className = '',
  style = {},
  type = 'button',
  onClick,
  ...props
}) {
  const { ref: magneticRef, x, y, bind } = useMagnetic(0.25);

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          background: 'var(--surface-raised)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-control)',
          boxShadow: 'var(--shadow-sm)',
        };
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-control)',
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid transparent',
        };
      case 'danger':
        return {
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.35)',
        };
      case 'glow':
        return {
          background: 'linear-gradient(135deg, #00f2fe 0%, #8b5cf6 100%)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 0 24px rgba(0, 242, 254, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
        };
      case 'primary':
      default:
        return {
          background: 'var(--accent-gradient)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 4px 16px -2px rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.4rem 0.85rem',
          fontSize: '0.8125rem',
          borderRadius: 'var(--radius-sm)',
          gap: '0.4rem',
        };
      case 'lg':
        return {
          padding: '0.75rem 1.6rem',
          fontSize: '1rem',
          borderRadius: 'var(--radius-lg)',
          gap: '0.6rem',
          fontWeight: 600,
        };
      case 'md':
      default:
        return {
          padding: '0.55rem 1.25rem',
          fontSize: '0.875rem',
          borderRadius: 'var(--radius-md)',
          gap: '0.5rem',
          fontWeight: 500,
        };
    }
  };

  const Component = magnetic ? motion.button : motion.button;

  return (
    <Component
      ref={magnetic ? magneticRef : undefined}
      type={type}
      disabled={disabled || loading}
      aria-disabled={disabled || loading ? 'true' : undefined}
      aria-busy={loading ? 'true' : undefined}
      onClick={disabled || loading ? undefined : onClick}
      animate={magnetic ? { x, y } : undefined}
      transition={SPRINGS.snappy}
      whileHover={disabled || loading ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled || loading ? {} : { scale: 0.98, y: 0.5 }}
      {...(magnetic ? bind : {})}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        userSelect: 'none',
        whiteSpace: 'nowrap',
        letterSpacing: '-0.01em',
        fontFamily: 'inherit',
        maxWidth: '100%',
        boxSizing: 'border-box',
        touchAction: 'manipulation',
        transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      className={`btn-kinetic ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
          <span>{loadingText || (typeof children === 'string' ? children : 'Processing...')}</span>
        </>
      ) : (
        <>
          {(icon || iconLeft) && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon || iconLeft}</span>}
          <span>{children}</span>
          {iconRight && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{iconRight}</span>}
        </>
      )}
    </Component>
  );
}
