import React, { useEffect, useState } from 'react';

/**
 * Animated SVG circular progress ring
 * Uses strokeDashoffset animation to visually highlight match percentages
 */
export function ProgressRing({
  radius = 28,
  stroke = 5,
  progress = 85,
  color = null,
  size = 'md',
  showLabel = true,
  labelSuffix = '%',
}) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  // Determine dynamic ring color based on score if not explicitly passed
  let ringColor = color;
  if (!ringColor) {
    if (progress >= 80) ringColor = '#10b981'; // Green
    else if (progress >= 60) ringColor = '#6366f1'; // Indigo
    else if (progress >= 40) ringColor = '#f59e0b'; // Amber
    else ringColor = '#64748b'; // Muted
  }

  const svgSize = radius * 2;

  return (
    <div
      style={{
        position: 'relative',
        width: `${svgSize}px`,
        height: `${svgSize}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        height={svgSize}
        width={svgSize}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      >
        {/* Background track circle */}
        <circle
          stroke="var(--border)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Animated colored progress stroke */}
        <circle
          stroke={ringColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{
            strokeDashoffset,
            transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease',
            strokeLinecap: 'round',
          }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      {showLabel && (
        <span
          style={{
            position: 'absolute',
            fontSize: size === 'sm' ? '0.7rem' : size === 'lg' ? '1rem' : '0.8rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          {animatedProgress}
          <span style={{ fontSize: '0.65em', fontWeight: 600, opacity: 0.8 }}>{labelSuffix}</span>
        </span>
      )}
    </div>
  );
}

export default ProgressRing;
