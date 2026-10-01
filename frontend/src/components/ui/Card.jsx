import React from 'react';

/**
 * Modern Skeuomorphic Card Component with layered depth & subtle top highlight
 *
 * @param {('default'|'raised'|'interactive'|'glass'|'outlined'|'flat'|'sunken')} variant
 * @param {boolean} selected
 * @param {boolean} disabled
 */
export function Card({
  children,
  variant = 'default',
  selected = false,
  disabled = false,
  className = '',
  style = {},
  onClick,
  ...props
}) {
  const getVariantClass = () => {
    switch (variant) {
      case 'raised':
        return 'raised';
      case 'interactive':
        return 'interactive';
      case 'glass':
        return 'glass';
      case 'sunken':
        return 'sunken';
      case 'flat':
        return 'flat';
      case 'outlined':
        return 'outlined';
      case 'default':
      default:
        return '';
    }
  };

  const selectedStyles = selected
    ? {
        borderColor: 'var(--primary)',
        boxShadow: '0 0 0 2px var(--primary-subtle), var(--shadow-raised)',
      }
    : {};

  const disabledStyles = disabled
    ? {
        opacity: 0.6,
        pointerEvents: 'none',
        filter: 'grayscale(0.2)',
      }
    : {};

  return (
    <div
      className={`card-skeuo ${getVariantClass()} ${className}`}
      style={{
        ...selectedStyles,
        ...disabledStyles,
        ...style,
      }}
      onClick={!disabled ? onClick : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', style = {}, ...props }) {
  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        ...style,
      }}
      className={`card-header ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', style = {}, ...props }) {
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
}

export function CardFooter({ children, className = '', style = {}, ...props }) {
  return (
    <div
      style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '0.75rem',
        flexWrap: 'wrap',
        ...style,
      }}
      className={`card-footer ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', style = {}, ...props }) {
  return (
    <h3
      style={{
        fontSize: '1.1rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '-0.015em',
        margin: 0,
        ...style,
      }}
      className={`card-title ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', style = {}, ...props }) {
  return (
    <p
      style={{
        fontSize: '0.8125rem',
        color: 'var(--text-secondary)',
        marginTop: '0.2rem',
        margin: 0,
        lineHeight: 1.5,
        ...style,
      }}
      className={`card-description ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

// Attach subcomponents to default Card object
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;
Card.Title = CardTitle;
Card.Description = CardDescription;

export default Card;
