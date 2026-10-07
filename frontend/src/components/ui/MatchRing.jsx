import React from 'react';
import { motion } from 'framer-motion';
import { SPRINGS } from '../../motion/tokens';

export default function MatchRing({
  score = 88,
  size = 76,
  strokeWidth = 6,
  label = 'AI MATCH',
  showLabel = true,
  glow = true,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (score / 100) * circumference;

  // Color mapping based on score
  const getColor = () => {
    if (score >= 85) return 'var(--accent-cyan, #00f2fe)';
    if (score >= 70) return 'var(--primary, #6366f1)';
    if (score >= 50) return 'var(--accent-amber, #f59e0b)';
    return 'var(--danger, #ef4444)';
  };

  const ringColor = getColor();

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: `${size}px`,
          height: `${size}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Ambient Glow */}
        {glow && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${ringColor} 0%, transparent 70%)`,
              opacity: 0.25,
              filter: 'blur(8px)',
              pointerEvents: 'none',
            }}
          />
        )}

        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--border-control, rgba(255, 255, 255, 0.1))"
            strokeWidth={strokeWidth}
          />
          {/* Animated Value Stroke */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progressOffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Score Readout */}
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: size > 80 ? '1.45rem' : '1.05rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {score}%
          </span>
        </div>
      </div>

      {showLabel && (
        <span
          style={{
            marginTop: '0.4rem',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
