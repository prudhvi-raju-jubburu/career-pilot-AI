import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function DeadlineCountdown({ deadline, compact = false, className = '' }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(deadline));

  function calculateTimeLeft(targetDate) {
    if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, totalSeconds: 0 };
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, totalSeconds: 0 };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds, isPast: false, totalSeconds: Math.floor(diff / 1000) };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(deadline));
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft.isPast) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--danger)',
          background: 'rgba(239, 68, 68, 0.12)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
        }}
        className={className}
      >
        <AlertTriangle size={12} />
        Closed
      </span>
    );
  }

  const isUrgent = timeLeft.days < 3;

  if (compact) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          color: isUrgent ? 'var(--accent-amber, #f59e0b)' : 'var(--text-secondary)',
          background: isUrgent ? 'rgba(245, 158, 11, 0.12)' : 'var(--surface-raised)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${isUrgent ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-hairline, var(--border))'}`,
        }}
        className={className}
      >
        <Clock size={12} className={isUrgent ? 'animate-pulse' : ''} />
        <span>{timeLeft.days}d {timeLeft.hours}h left</span>
      </span>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.4rem 0.85rem',
        background: isUrgent ? 'rgba(245, 158, 11, 0.1)' : 'var(--surface-raised)',
        border: `1px solid ${isUrgent ? 'rgba(245, 158, 11, 0.35)' : 'var(--border-control)'}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: isUrgent ? '0 0 12px rgba(245, 158, 11, 0.2)' : 'var(--shadow-sm)',
      }}
      className={className}
    >
      <Clock size={14} style={{ color: isUrgent ? 'var(--accent-amber)' : 'var(--text-secondary)' }} />
      <div style={{ display: 'flex', gap: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700 }}>
        <span style={{ color: 'var(--text-primary)' }}>{timeLeft.days}d</span>
        <span style={{ color: 'var(--text-muted)' }}>:</span>
        <span style={{ color: 'var(--text-primary)' }}>{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span style={{ color: 'var(--text-muted)' }}>:</span>
        <span style={{ color: 'var(--text-primary)' }}>{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span style={{ color: 'var(--text-muted)' }}>:</span>
        <span style={{ color: isUrgent ? 'var(--accent-amber)' : 'var(--accent-cyan)' }}>
          {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
}
