import React from 'react';

/**
 * Modern Skeuomorphic Card Component with layered depth & subtle top highlight
 *
 * @param {('default'|'raised'|'interactive'|'sunken')} variant
 */
export default function Card({
  children,
  variant = 'default',
  className = '',
  style = {},
  onClick,
  ...props
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'raised':
        return {
          backgroundColor: 'var(--color-surface)',
          boxShadow: 'var(--shadow-raised)',
          border: '1px solid var(--border-card)',
        };
      case 'sunken':
        return {
          backgroundColor: 'var(--color-bg-sunken)',
          boxShadow: 'var(--shadow-sunken)',
          border: '1px solid var(--border-subtle)',
        };
      case 'interactive':
        return {
          backgroundColor: 'var(--color-surface)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-card)',
          cursor: 'pointer',
          transition: 'transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast)',
        };
      case 'default':
      default:
        return {
          backgroundColor: 'var(--color-surface)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-card)',
        };
    }
  };

  const baseStyles = {
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    position: 'relative',
    ...getVariantStyles(),
    ...style,
  };

  return (
    <div
      style={baseStyles}
      className={`card-skeuo ${variant} ${className}`}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (variant === 'interactive') {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-raised-hover)';
          e.currentTarget.style.borderColor = 'var(--color-primary-400)';
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'interactive') {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
          e.currentTarget.style.borderColor = 'var(--border-card)';
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className = '', style = {}, ...props }) {
  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style,
      }}
      className={`card-header ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Title = function CardTitle({ children, className = '', style = {}, ...props }) {
  return (
    <h3
      style={{
        fontSize: '1.15rem',
        fontWeight: 700,
        color: 'var(--color-text)',
        letterSpacing: '-0.015em',
        ...style,
      }}
      className={`card-title ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

Card.Description = function CardDescription({ children, className = '', style = {}, ...props }) {
  return (
    <p
      style={{
        fontSize: '0.875rem',
        color: 'var(--color-text-muted)',
        marginTop: '0.2rem',
        ...style,
      }}
      className={`card-description ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

Card.Content = function CardContent({ children, className = '', style = {}, ...props }) {
  return (
    <div
      style={{
        padding: '1.5rem',
        ...style,
      }}
      className={`card-content ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className = '', style = {}, ...props }) {
  return (
    <div
      style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--color-bg-alt)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style,
      }}
      className={`card-footer ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
