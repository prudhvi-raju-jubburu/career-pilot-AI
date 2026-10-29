import React from 'react';
import { X, ArrowRight, CheckCircle2, AlertCircle, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';

export default function ResumeComparisonModal({
  isOpen,
  onClose,
  originalData,
  improvedData,
  originalScore,
  improvedScore,
  originalIssues = [],
  improvedIssues = [],
  onApplyImproved
}) {
  if (!isOpen) return null;

  const scoreDiff = (improvedScore?.score || 0) - (originalScore?.score || 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Original vs. Optimized Resume Comparison
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.3rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Score Comparison Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              gap: '1.5rem',
              padding: '1.25rem',
              borderRadius: '12px',
              background: 'rgba(37, 94, 255, 0.04)',
              border: '1px solid rgba(37, 94, 255, 0.15)',
            }}
          >
            {/* Original Score Box */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Original Resume Score
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#64748b', marginTop: '0.2rem' }}>
                {originalScore?.score || 0} <span style={{ fontSize: '1rem', fontWeight: 600 }}>/ 100</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {originalIssues.length} identified issues
              </div>
            </div>

            {/* Differential Arrow */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <ArrowRight size={24} color="var(--primary)" />
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: scoreDiff >= 0 ? '#10b981' : '#ef4444',
                  background: scoreDiff >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                }}
              >
                {scoreDiff >= 0 ? `+${scoreDiff} pts` : `${scoreDiff} pts`}
              </span>
            </div>

            {/* Improved Score Box */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>
                Optimized Resume Score
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
                {improvedScore?.score || 0} <span style={{ fontSize: '1rem', fontWeight: 600 }}>/ 100</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {improvedIssues.length} remaining recommendations
              </div>
            </div>
          </div>

          {/* Side-by-Side Detailed Panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Original Column */}
            <div
              style={{
                borderRadius: '12px',
                border: '1px solid var(--border)',
                padding: '1.25rem',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                Original Version
              </div>

              {/* Summary */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Professional Summary
                </div>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: '#64748b', fontStyle: originalData?.summary ? 'normal' : 'italic' }}>
                  {originalData?.summary || 'No summary provided.'}
                </p>
              </div>

              {/* Top Projects Bullets */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Sample Project Bullet Points
                </div>
                <div style={{ marginTop: '0.4rem', display: 'grid', gap: '0.4rem' }}>
                  {originalData?.projects?.[0]?.bullets?.slice(0, 2).map((b, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', color: '#64748b', background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                      • {b}
                    </div>
                  )) || <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No project bullets</span>}
                </div>
              </div>

              {/* Issues Count */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Open Issues ({originalIssues.length})
                </div>
                <div style={{ display: 'grid', gap: '0.3rem' }}>
                  {originalIssues.slice(0, 3).map((iss, i) => (
                    <div key={i} style={{ fontSize: '0.76rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <AlertCircle size={12} /> {iss.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Optimized Column */}
            <div
              style={{
                borderRadius: '12px',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                padding: '1.25rem',
                background: 'rgba(16, 185, 129, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#047857', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: '0.5rem' }}>
                Optimized Version
              </div>

              {/* Summary */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                  Enhanced Summary
                </div>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: '#1e293b', fontWeight: 500 }}>
                  {improvedData?.summary || 'Optimized summary generated.'}
                </p>
              </div>

              {/* Top Projects Bullets */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                  Upgraded Action-Oriented Bullets
                </div>
                <div style={{ marginTop: '0.4rem', display: 'grid', gap: '0.4rem' }}>
                  {improvedData?.projects?.[0]?.bullets?.slice(0, 2).map((b, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', color: '#0f172a', background: 'rgba(16, 185, 129, 0.08)', padding: '0.4rem 0.6rem', borderRadius: '6px', fontWeight: 500 }}>
                      ✓ {b}
                    </div>
                  )) || <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No project bullets</span>}
                </div>
              </div>

              {/* Resolved Strengths */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Key Optimizations Applied
                </div>
                <div style={{ display: 'grid', gap: '0.3rem' }}>
                  <div style={{ fontSize: '0.76rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={12} /> Decisive technical action verbs (Developed, Implemented, Engineered)
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={12} /> Target-role keyword alignment without fabricating metrics
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={12} /> Structured formatting matching ATS single-column standards
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          <Button variant="outline" onClick={onClose}>
            Keep Current Draft
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onApplyImproved && onApplyImproved();
              onClose();
            }}
          >
            Apply Optimized Version
          </Button>
        </div>
      </div>
    </div>
  );
}
