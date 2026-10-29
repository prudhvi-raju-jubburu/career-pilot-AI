import React from 'react';

/**
 * Modern Skeuomorphic Card Component with layered depth & subtle top highlight
 *
 * @param {('default'|'raised'|'interactive'|'glass'|'outlined'|'flat'|'sunken')} variant
 * @param {boolean} selected
 * @param {boolean} disabled
 */
export function Card({
  title,
  subtitle,
  actions,
  children,
  variant = 'default',
  selected = false,
  disabled = false,
  className = '',
  style = {},
  onClick,
  ...props
}) {
  const isMavens = variant === 'mavens';
  const hasHeaderProps = Boolean(title || subtitle || actions);

  const getVariantClass = () => {
    switch (variant) {
      case 'mavens':
        return 'mavens-card';
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

  const isClickable = Boolean(onClick && !disabled);

  return (
    <div
      className={`${isMavens ? 'mavens-card' : 'card-skeuo'} ${getVariantClass()} ${className}`}
      style={{
        maxWidth: '100%',
        boxSizing: 'border-box',
        cursor: isClickable ? 'pointer' : undefined,
        ...selectedStyles,
        ...disabledStyles,
        ...style,
      }}
      onClick={!disabled ? onClick : undefined}
      tabIndex={isClickable ? (props.tabIndex ?? 0) : props.tabIndex}
      role={isClickable ? (props.role || 'button') : props.role}
      aria-disabled={disabled ? 'true' : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.(e);
        }
        props.onKeyDown?.(e);
      }}
      {...props}
    >
      {isMavens && (
        <>
          <div className="mavens-specular-line" />
          <div className="mavens-corner-bracket" />
          <div className="mavens-card-glow" />
        </>
      )}
      {hasHeaderProps && (
        <CardHeader>
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>
          {actions && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {actions}
            </div>
          )}
        </CardHeader>
      )}
      {hasHeaderProps ? <CardContent>{children}</CardContent> : children}
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
