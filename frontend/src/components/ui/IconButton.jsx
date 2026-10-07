import React from 'react';
import { motion } from 'framer-motion';
import { useMagnetic } from '../../motion/hooks';
import { SPRINGS } from '../../motion/tokens';

export default function IconButton({
  icon,
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'secondary', // 'primary' | 'secondary' | 'ghost' | 'glow'
  magnetic = false,
  tooltip,
  disabled = false,
  onClick,
  className = '',
  style = {},
  'aria-label': ariaLabel,
  ...props
}) {
  const { ref: magneticRef, x, y, bind } = useMagnetic(0.35);

  const sizePixels = size === 'sm' ? 32 : size === 'lg' ? 44 : 38;

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'var(--accent-gradient)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: 'var(--shadow-sm)',
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid transparent',
        };
      case 'glow':
        return {
          background: 'rgba(0, 242, 254, 0.12)',
          color: 'var(--accent-cyan)',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          boxShadow: '0 0 16px rgba(0, 242, 254, 0.25)',
        };
      case 'secondary':
      default:
        return {
          background: 'var(--surface-raised)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-control)',
          boxShadow: 'var(--shadow-sm)',
        };
    }
  };

  return (
    <motion.button
      ref={magnetic ? magneticRef : undefined}
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel || tooltip || 'Action'}
      title={tooltip}
      animate={magnetic ? { x, y } : undefined}
      transition={SPRINGS.snappy}
      whileHover={disabled ? {} : { scale: 1.08 }}
      whileTap={disabled ? {} : { scale: 0.92 }}
      {...(magnetic ? bind : {})}
      style={{
        width: `${sizePixels}px`,
        height: `${sizePixels}px`,
        borderRadius: 'var(--radius-md)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        padding: 0,
        ...getVariantStyles(),
        ...style,
      }}
      className={`icon-btn-kinetic ${className}`}
      {...props}
    >
      {icon}
    </motion.button>
  );
}
