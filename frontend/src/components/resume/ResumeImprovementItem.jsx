import React, { useState } from 'react';
import { Sparkles, Check, X, Edit3, ArrowRight, CornerDownRight } from 'lucide-react';
import Button from '../ui/Button';

export default function ResumeImprovementItem({
  suggestion,
  onAccept,
  onReject,
  onEditApply
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(suggestion.suggested_text);

  const handleApplyCustomEdit = () => {
    if (editedText.trim()) {
      onEditApply && onEditApply(suggestion, editedText.trim());
      setIsEditing(false);
    }
  };

  return (
    <div
      style={{
        borderRadius: '12px',
        border: '1px solid var(--border)',
        padding: '1rem 1.15rem',
        background: '#ffffff',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Section Tag & Reason */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '0.2rem 0.55rem',
            borderRadius: '4px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          {suggestion.section}
        </span>
        {suggestion.keywords_addressed?.length > 0 && (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {suggestion.keywords_addressed.map((kw, i) => (
              <span
                key={i}
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  background: 'rgba(37, 94, 255, 0.08)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                }}
              >
                +{kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Before and After Phrasing */}
      <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.82rem' }}>
        {/* Original */}
        <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            Original Phrasing
          </div>
          <div style={{ color: '#64748b', textDecoration: 'line-through' }}>
            {suggestion.original_text}
          </div>
        </div>

        {/* Suggested / Edited */}
        <div style={{ background: 'rgba(16, 185, 129, 0.04)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Sparkles size={11} /> Suggested ATS Enhancement
          </div>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.3rem' }}>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.4rem',
                  borderRadius: '4px',
                  border: '1px solid var(--primary)',
                  fontSize: '0.82rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                <Button size="xs" variant="primary" onClick={handleApplyCustomEdit}>
                  Apply Edit
                </Button>
                <Button size="xs" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ color: '#0f172a', fontWeight: 500, lineHeight: 1.45 }}>
              {suggestion.suggested_text}
            </div>
          )}
        </div>
      </div>

      {/* Reason Explainer */}
      <div style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
        <CornerDownRight size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>{suggestion.reason}</span>
      </div>

      {/* Action Buttons */}
      {!isEditing && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem' }}>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => onReject && onReject(suggestion)}
            style={{ color: '#64748b' }}
          >
            <X size={13} /> Dismiss
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 size={13} /> Edit
          </Button>
          <Button
            size="xs"
            variant="primary"
            onClick={() => onAccept && onAccept(suggestion)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Check size={13} /> Accept Suggestion
          </Button>
        </div>
      )}
    </div>
  );
}
