import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * Reusable Error State Component with recovery actions
 */
export default function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this data. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  loading = false,
  style = {},
  className = '',
}) {
  return (
    <div
      style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--danger-bg)',
        border: '1px solid var(--danger-border)',
        borderRadius: 'var(--radius-xl)',
        maxWidth: '560px',
        margin: '0 auto',
        ...style,
      }}
      className={`animate-fade-in ${className}`}
      role="alert"
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <AlertCircle size={28} />
      </div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', letterSpacing: '-0.015em' }}>
        {title}
      </h3>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5, marginBottom: onRetry ? '1.5rem' : 0 }}>
        {message}
      </p>

      {onRetry && (
        <Button
          variant="secondary"
          onClick={onRetry}
          loading={loading}
          icon={<RefreshCw size={15} />}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
