import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';

export default function ResumeAtsMeter({ score = 94, missingKeywords = [], suggestions = [] }) {
  const getScoreColor = (s) => {
    if (s >= 85) return { text: '#137a44', bg: 'rgba(19, 122, 68, 0.1)', ring: '#137a44', label: 'Recruiter Ready' };
    if (s >= 70) return { text: '#2B57FF', bg: 'rgba(43, 87, 255, 0.1)', ring: '#2B57FF', label: 'Good Match' };
    return { text: '#D97706', bg: 'rgba(217, 119, 6, 0.1)', ring: '#D97706', label: 'Needs Improvement' };
  };

  const status = getScoreColor(score);

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid var(--lx-line)',
        padding: '1.25rem',
        boxShadow: '0 4px 20px rgba(14, 17, 22, 0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--lx-ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--lx-gold)',
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lx-txt-3)' }}>
              ATS Diagnostic
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--lx-ink)' }}>
              Resume Match Score
            </div>
          </div>
        </div>

        <span
          style={{
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: status.bg,
            color: status.text,
          }}
        >
          {status.label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.75rem 0', borderBottom: '1px solid var(--lx-line-2)' }}>
        <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
          <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#EDEFF3"
              strokeWidth="3.6"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={status.ring}
              strokeWidth="3.6"
              strokeDasharray={`${score}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--lx-ink)', lineHeight: 1 }}>{score}%</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--lx-txt-3)' }}>ATS</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--lx-txt-2)', lineHeight: 1.45 }}>
            {score >= 90
              ? 'Excellent ATS pass probability! Matches 90%+ automated screening criteria.'
              : score >= 75
              ? 'Strong baseline. Address missing keywords to boost top recruiter visibility.'
              : 'Add relevant action verbs and quantifiable metrics to bypass initial ATS filters.'}
          </div>
        </div>
      </div>

      {missingKeywords.length > 0 && (
        <div style={{ marginTop: '0.85rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--lx-txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Recommended Keywords
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {missingKeywords.map((kw, i) => (
              <span
                key={i}
                style={{
                  background: 'var(--lx-surface-2)',
                  border: '1px solid var(--lx-line)',
                  borderRadius: '6px',
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--lx-blue)',
                }}
              >
                + {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div style={{ marginTop: '0.85rem', display: 'grid', gap: '0.4rem' }}>
          {suggestions.slice(0, 3).map((tip, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--lx-txt-2)' }}>
              <CheckCircle2 size={14} color="#137a44" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
