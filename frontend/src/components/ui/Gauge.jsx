import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, FileText, Zap } from 'lucide-react';

/**
 * Animated Score Gauge (0-100) with detailed metric breakdown:
 * - ATS Fit
 * - Impact & Metrics
 * - Keywords Alignment
 * - Structure & Formatting
 */
export function Gauge({
  score = 82,
  breakdown = {
    atsFit: 88,
    impact: 78,
    keywords: 85,
    formatting: 92,
  },
  title = 'Overall Resume ATS Score',
}) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 150);
    return () => clearTimeout(timer);
  }, [score]);

  // Semi-circle arc calculations
  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * Math.PI; // Half-circle
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  let scoreColor = '#10b981';
  let badgeText = 'Excellent ATS Fit';
  if (score < 60) {
    scoreColor = '#ef4444';
    badgeText = 'Needs Optimization';
  } else if (score < 75) {
    scoreColor = '#f59e0b';
    badgeText = 'Moderate Fit';
  }

  return (
    <div className="glass-card" style={{ padding: '1.75rem', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {title}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Benchmarked against 5,000+ candidate screening algorithms
        </p>
      </div>

      {/* SVG Arc Gauge */}
      <div style={{ position: 'relative', width: '180px', height: '110px', margin: '0 auto 1.5rem', overflow: 'hidden' }}>
        <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-180deg)' }}>
          {/* Background Arc */}
          <circle
            cx="90"
            cy="90"
            r={normalizedRadius}
            stroke="var(--border)"
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Progress Arc */}
          <circle
            cx="90"
            cy="90"
            r={normalizedRadius}
            stroke={scoreColor}
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease',
            }}
          />
        </svg>

        {/* Center score readout */}
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1 }}>
            {animatedScore}
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div
            style={{
              display: 'inline-block',
              marginTop: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: `${scoreColor}18`,
              color: scoreColor,
              fontSize: '0.725rem',
              fontWeight: 700,
            }}
          >
            {badgeText}
          </div>
        </div>
      </div>

      {/* 4-Item Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
        <BreakdownItem
          icon={<CheckCircle2 size={15} color="#10b981" />}
          label="ATS Readability"
          value={breakdown.atsFit ?? 88}
        />
        <BreakdownItem
          icon={<Zap size={15} color="#6366f1" />}
          label="Impact & Metrics"
          value={breakdown.impact ?? 78}
        />
        <BreakdownItem
          icon={<AlertTriangle size={15} color="#f59e0b" />}
          label="Key Skill Density"
          value={breakdown.keywords ?? 85}
        />
        <BreakdownItem
          icon={<FileText size={15} color="#06b6d4" />}
          label="Structure & Length"
          value={breakdown.formatting ?? 92}
        />
      </div>
    </div>
  );
}

function BreakdownItem({ icon, label, value }) {
  return (
    <div
      style={{
        padding: '0.75rem 0.9rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {icon}
          <span>{label}</span>
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}%</span>
      </div>
      {/* Mini Progress track */}
      <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            backgroundColor: value >= 80 ? 'var(--primary)' : value >= 60 ? 'var(--warning)' : 'var(--danger)',
            borderRadius: '2px',
            transition: 'width 0.8s ease',
          }}
        />
      </div>
    </div>
  );
}

export default Gauge;
