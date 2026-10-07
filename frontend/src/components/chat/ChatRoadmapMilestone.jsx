import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Clock, ArrowRight, BookOpen } from 'lucide-react';
import Badge from '../ui/Badge';

export default function ChatRoadmapMilestone({ step, index }) {
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      style={{
        marginTop: '0.6rem',
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.85rem',
        transition: 'all var(--transition-fast)',
      }}
    >
      <button
        onClick={() => setCompleted(!completed)}
        title={completed ? 'Mark incomplete' : 'Mark complete'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginTop: '2px',
          color: completed ? 'var(--success)' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color var(--transition-fast)',
        }}
      >
        {completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--primary)',
              letterSpacing: '0.04em',
            }}
          >
            Step {index + 1}
          </span>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', textDecoration: completed ? 'line-through' : 'none' }}>
            {step.title}
          </span>
          {step.priority && (
            <Badge variant={step.priority === 'High' ? 'danger' : 'warning'} size="sm">
              {step.priority} Priority
            </Badge>
          )}
          {step.duration && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={12} /> {step.duration}
            </span>
          )}
        </div>

        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
          {step.description}
        </p>

        {step.skills && step.skills.length > 0 && (
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
            {step.skills.map((skill, sIdx) => (
              <span
                key={sIdx}
                style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
