import React, { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2,
  Sparkles, Info, ChevronDown, ChevronUp, Layers, Target, FileText, Check
} from 'lucide-react';

export default function ResumeQualityBreakdown({ assessment = null, onSelectMissingKeyword = null }) {
  const [expandedSection, setExpandedSection] = useState('categories'); // 'categories' | 'keywords' | 'issues' | 'strengths'

  if (!assessment) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No quality assessment available. Click 'Analyze Resume' to run diagnostic.
      </div>
    );
  }

  const {
    score = 0,
    disclaimer = '',
    category_scores = {},
    strengths = [],
    issues = [],
    recommendations = [],
    keyword_analysis = {},
    target_role = '',
    has_job_description = false
  } = assessment;

  const getScoreTheme = (s) => {
    if (s >= 85) return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', ring: '#10b981', label: 'Strong ATS Readiness' };
    if (s >= 70) return { color: '#255eff', bg: 'rgba(37, 94, 255, 0.1)', ring: '#255eff', label: 'Competitive Baseline' };
    if (s >= 50) return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', ring: '#f59e0b', label: 'Needs Optimization' };
    return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', ring: '#ef4444', label: 'Incomplete / Missing Core' };
  };

  const theme = getScoreTheme(score);

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        padding: '1.4rem',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
      }}
    >
      {/* Top Banner with Score Gauge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div
            style={{
              position: 'relative',
              width: '64px',
              height: '64px',
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="3.6"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={theme.ring}
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
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Deterministic Quality Diagnostic
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ATS Readiness Score
            </div>
            <span
              style={{
                display: 'inline-block',
                marginTop: '0.2rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.74rem',
                fontWeight: 700,
                background: theme.bg,
                color: theme.color,
              }}
            >
              {theme.label}
            </span>
          </div>
        </div>

        {target_role && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            Target: <strong>{target_role}</strong> {has_job_description ? '✓ Custom JD' : '(General Role)'}
          </div>
        )}
      </div>

      {/* Honest Disclaimer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
          padding: '0.65rem 0.85rem',
          background: 'rgba(248, 250, 252, 0.85)',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          fontSize: '0.74rem',
          color: '#64748b',
          lineHeight: 1.45,
          marginBottom: '1rem',
        }}
      >
        <Info size={14} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>{disclaimer || "An estimate of your resume's formatting, structure, readability, and relevance. Actual ATS results vary by employer and system."}</span>
      </div>

      {/* Dimension Breakdown Cards */}
      <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.2rem' }}>
        {Object.entries(category_scores).map(([key, cat]) => (
          <div
            key={key}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cat.name}</span>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                {cat.score} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/ {cat.max} pts</span>
              </span>
            </div>
            <div style={{ height: '6px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${cat.percentage}%`,
                  backgroundColor: cat.percentage >= 80 ? '#10b981' : (cat.percentage >= 60 ? '#255eff' : '#f59e0b'),
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Keyword Coverage Analysis */}
      {keyword_analysis && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)' }}>
              Keyword & Skill Alignment
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>
              {keyword_analysis.match_percentage}% Coverage
            </span>
          </div>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {/* Present Keywords */}
            {keyword_analysis.present?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={12} /> Confirmed in Resume ({keyword_analysis.present.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {keyword_analysis.present.map((kw, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.73rem',
                        fontWeight: 600,
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        color: '#065f46',
                      }}
                    >
                      ✓ {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related Keywords */}
            {keyword_analysis.related?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d97706', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Sparkles size={12} /> Related / Partially Covered ({keyword_analysis.related.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {keyword_analysis.related.map((kw, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.73rem',
                        fontWeight: 600,
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        color: '#92400e',
                      }}
                    >
                      ~ {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing or Unconfirmed Keywords */}
            {keyword_analysis.missing_or_unconfirmed?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6d28d9', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={12} /> Missing or Unconfirmed ({keyword_analysis.missing_or_unconfirmed.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.4rem' }}>
                  {keyword_analysis.missing_or_unconfirmed.map((kw, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => onSelectMissingKeyword && onSelectMissingKeyword(kw)}
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.73rem',
                        fontWeight: 600,
                        background: 'rgba(109, 40, 217, 0.08)',
                        border: '1px solid rgba(109, 40, 217, 0.25)',
                        color: '#6d28d9',
                        cursor: onSelectMissingKeyword ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                      title="Click to add if you possess this verified skill"
                    >
                      + {kw}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>
                  * {keyword_analysis.disclaimer || "Missing or unconfirmed keywords should only be added if you genuinely possess those skills."}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actionable Recommendations List */}
      {recommendations?.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Actionable Recommendations ({recommendations.length})
          </div>
          <div style={{ display: 'grid', gap: '0.45rem' }}>
            {recommendations.slice(0, 4).map((rec, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  fontSize: '0.77rem',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-secondary)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}
              >
                <Check size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{rec.title}: </strong>
                  <span>{rec.suggestion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
