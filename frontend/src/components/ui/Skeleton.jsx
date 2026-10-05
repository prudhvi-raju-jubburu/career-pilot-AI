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

export function SkeletonStats({ count = 4 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        width: '100%',
      }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div className="skeleton-shimmer" style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton-shimmer" style={{ height: '14px', width: '50%', borderRadius: 'var(--radius-xs)', marginBottom: '0.4rem' }} />
            <div className="skeleton-shimmer" style={{ height: '22px', width: '35%', borderRadius: 'var(--radius-xs)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          gap: '1.25rem',
          alignItems: 'center',
        }}
      >
        <SkeletonAvatar size={68} />
        <div style={{ flex: 1 }}>
          <div className="skeleton-shimmer" style={{ height: '22px', width: '40%', borderRadius: 'var(--radius-xs)', marginBottom: '0.5rem' }} />
          <div className="skeleton-shimmer" style={{ height: '14px', width: '60%', borderRadius: 'var(--radius-xs)', marginBottom: '0.35rem' }} />
          <div className="skeleton-shimmer" style={{ height: '14px', width: '30%', borderRadius: 'var(--radius-xs)' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <SkeletonCard height="180px" />
        <SkeletonCard height="180px" />
      </div>
    </div>
  );
}

export function SkeletonChatMessage({ sender = 'assistant' }) {
  const isUser = sender === 'user';
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        width: '100%',
        margin: '0.5rem 0',
      }}
    >
      <SkeletonAvatar size={34} rounded={true} />
      <div
        style={{
          padding: '1rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: isUser ? 'var(--primary-subtle)' : 'var(--surface-raised)',
          border: '1px solid var(--border)',
          maxWidth: '75%',
          width: '320px',
        }}
      >
        <SkeletonText lines={2} height="13px" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
      {/* Header bar shimmer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="skeleton-shimmer" style={{ height: '28px', width: '240px', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }} />
          <div className="skeleton-shimmer" style={{ height: '16px', width: '380px', borderRadius: 'var(--radius-xs)' }} />
        </div>
        <div className="skeleton-shimmer" style={{ height: '40px', width: '120px', borderRadius: 'var(--radius-md)' }} />
      </div>

      {/* Metric Cards Grid shimmer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', width: '100%' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="skeleton-shimmer" style={{ height: '14px', width: '50%', borderRadius: 'var(--radius-xs)', marginBottom: '0.75rem' }} />
            <div className="skeleton-shimmer" style={{ height: '28px', width: '40%', borderRadius: 'var(--radius-sm)' }} />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', minHeight: '300px' }}>
        <div className="skeleton-shimmer" style={{ height: '20px', width: '30%', borderRadius: 'var(--radius-xs)', marginBottom: '1.5rem' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton-shimmer" style={{ height: '48px', width: '100%', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton-shimmer" style={{ height: '48px', width: '100%', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton-shimmer" style={{ height: '48px', width: '100%', borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
    </div>
  );
}

export default {
  Text: SkeletonText,
  Avatar: SkeletonAvatar,
  Card: SkeletonCard,
  Opportunity: SkeletonOpportunity,
  Table: SkeletonTable,
  Stats: SkeletonStats,
  Profile: SkeletonProfile,
  ChatMessage: SkeletonChatMessage,
  Page: PageSkeleton,
};


