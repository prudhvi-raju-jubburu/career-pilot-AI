import React from 'react';

export function SkeletonText({ lines = 3, height = '14px', width = '100%', style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', ...style }}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton-shimmer"
          style={{
            height,
            width: idx === lines - 1 && lines > 1 ? '65%' : width,
            borderRadius: 'var(--radius-xs)',
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 42, rounded = true }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: rounded ? '50%' : 'var(--radius-md)',
        flexShrink: 0,
      }}
    />
  );
}

export function SkeletonCard({ height = '160px', style = {} }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        height,
        width: '100%',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        ...style,
      }}
    />
  );
}

export function SkeletonOpportunity() {
  return (
    <div
      style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <SkeletonAvatar size={48} rounded={false} />
        <div style={{ flex: 1 }}>
          <div className="skeleton-shimmer" style={{ height: '18px', width: '70%', borderRadius: 'var(--radius-xs)', marginBottom: '0.4rem' }} />
          <div className="skeleton-shimmer" style={{ height: '14px', width: '40%', borderRadius: 'var(--radius-xs)' }} />
        </div>
      </div>
      <div className="skeleton-shimmer" style={{ height: '40px', width: '100%', borderRadius: 'var(--radius-xs)' }} />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div className="skeleton-shimmer" style={{ height: '22px', width: '60px', borderRadius: 'var(--radius-full)' }} />
        <div className="skeleton-shimmer" style={{ height: '22px', width: '80px', borderRadius: 'var(--radius-full)' }} />
        <div className="skeleton-shimmer" style={{ height: '22px', width: '70px', borderRadius: 'var(--radius-full)' }} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 4, cols = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <div className="skeleton-shimmer" style={{ height: '40px', width: '100%', borderRadius: 'var(--radius-md)' }} />
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          style={{
            display: 'flex',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="skeleton-shimmer"
              style={{
                height: '16px',
                flex: cIdx === 0 ? 2 : 1,
                borderRadius: 'var(--radius-xs)',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default {
  Text: SkeletonText,
  Avatar: SkeletonAvatar,
  Card: SkeletonCard,
  Opportunity: SkeletonOpportunity,
  Table: SkeletonTable,
};
