import React from 'react';
import Button from './Button';

/**
 * Reusable Empty State Component
 *
 * @param {React.ReactNode} icon
 * @param {string} title
 * @param {string} description
 * @param {string} actionLabel
 * @param {function} onAction
 * @param {React.ReactNode} actionElement
 */
export default function EmptyState({
  icon,
  title = 'No items found',
  description = 'There is currently no data to display.',
  actionLabel,
  onAction,
  actionElement,
  style = {},
  className = '',
}) {
  return (
    <div
      style={{
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px dashed var(--border-control)',
        maxWidth: '560px',
        margin: '0 auto',
        ...style,
      }}
      className={`animate-fade-in ${className}`}
    >
      {icon && (
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            boxShadow: 'var(--shadow-sunken)',
          }}
        >
          {icon}
        </div>
      )}

      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', letterSpacing: '-0.015em' }}>
        {title}
      </h3>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.5, marginBottom: actionLabel || actionElement ? '1.5rem' : 0 }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}

      {actionElement}
    </div>
  );
}
