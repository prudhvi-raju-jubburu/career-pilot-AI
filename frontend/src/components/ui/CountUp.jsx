import React, { useState, useEffect } from 'react';

export default function CountUp({ end, duration = 1000, prefix = '', suffix = '' }) {
  const numericEnd = typeof end === 'number' ? end : parseFloat(String(end).replace(/[^0-9.]/g, '')) || 0;
  const isNumeric = !isNaN(numericEnd) && numericEnd > 0;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isNumeric) {
      setDisplayValue(end);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(numericEnd);
      return;
    }

    let startTime = null;
    let animationFrameId;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(easeProgress * numericEnd);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(numericEnd);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [numericEnd, duration, isNumeric, end]);

  if (!isNumeric) {
    return <span>{end}</span>;
  }

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}
