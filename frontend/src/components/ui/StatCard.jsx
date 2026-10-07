import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useCountUp } from '../../motion/hooks';

export default function StatCard({
  title,
  value,
  numericValue,
  unit = '',
  delta,
  deltaType = 'positive', // 'positive' | 'negative' | 'neutral'
  icon,
  sparklineData = [12, 18, 14, 25, 20, 32, 28, 42],
  accentColor = 'var(--primary)',
  className = '',
}) {
  const animatedValue = useCountUp(numericValue || 0, 1000);
  const displayValue = numericValue !== undefined ? `${animatedValue}${unit}` : value;

  // Build SVG sparkline path
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const width = 80;
  const height = 30;

  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border-hairline, var(--border))',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
      className={`stat-card-widget ${className}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </span>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              marginTop: '0.25rem',
              lineHeight: 1.1,
            }}
          >
            {displayValue}
          </div>
        </div>

        {icon && (
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface)',
              border: '1px solid var(--border-control)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-hairline, var(--border))',
        }}
      >
        {delta && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color:
                deltaType === 'positive'
                  ? 'var(--success)'
                  : deltaType === 'negative'
                  ? 'var(--danger)'
                  : 'var(--text-muted)',
            }}
          >
            {deltaType === 'positive' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{delta}</span>
          </div>
        )}

        {/* Dynamic Sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <svg width={width} height={height} style={{ overflow: 'visible' }}>
            <polyline
              fill="none"
              stroke={accentColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        )}
      </div>
    </div>
  );
}
