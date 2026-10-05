import React from 'react';
import { CheckCircle2, XCircle, Sparkles, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

/**
 * Reusable Modern Skeuomorphic Badge / Tag Component
 *
 * @param {('default'|'primary'|'secondary'|'accent'|'success'|'warning'|'danger'|'purple'|'neutral')} variant
 * @param {('sm'|'md'|'lg')} size
 * @param {boolean} dot - Whether to show a colored status dot
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  style = {},
  ...props
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--primary-subtle)',
          color: 'var(--primary)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          dotColor: 'var(--primary)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--secondary-subtle)',
          color: 'var(--secondary)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          dotColor: 'var(--secondary)',
        };
      case 'accent':
        return {
          backgroundColor: 'var(--accent-subtle)',
          color: 'var(--accent)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          dotColor: 'var(--accent)',
        };
      case 'success':
        return {
          backgroundColor: 'var(--success-bg)',
          color: 'var(--success)',
          border: '1px solid var(--success-border)',
          dotColor: 'var(--success)',
        };
      case 'warning':
        return {
          backgroundColor: 'var(--warning-bg)',
          color: 'var(--warning)',
          border: '1px solid var(--warning-border)',
          dotColor: 'var(--warning)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger)',
          border: '1px solid var(--danger-border)',
          dotColor: 'var(--danger)',
        };
      case 'purple':
        return {
          backgroundColor: 'var(--color-purple-50)',
          color: 'var(--color-purple-600)',
          border: '1px solid var(--color-purple-100)',
          dotColor: 'var(--color-purple-600)',
        };
      case 'neutral':
        return {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
          dotColor: 'var(--text-muted)',
        };
      case 'default':
      default:
        return {
          backgroundColor: 'var(--surface)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-control)',
          dotColor: 'var(--primary)',
        };
    }
  };

  const currentStyles = getVariantStyles();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '0.15rem 0.5rem', fontSize: '0.71875rem', gap: '0.3rem' };
      case 'lg':
        return { padding: '0.35rem 0.85rem', fontSize: '0.84375rem', gap: '0.45rem' };
      case 'md':
      default:
        return { padding: '0.25rem 0.65rem', fontSize: '0.78125rem', gap: '0.375rem' };
    }
  };

  return (
    <span
      style={{
        ...currentStyles,
        ...getSizeStyles(),
        ...style,
      }}
      className={`badge-skeuo ${className}`}
      {...props}
    >
      {dot && (
        <span
          className="badge-dot"
          style={{ backgroundColor: currentStyles.dotColor }}
        />
      )}
      {children}
    </span>
  );
}

/**
 * StatusBadge for Application Pipeline tracking
 */
export function StatusBadge({ status, size = 'sm' }) {
  switch (status) {
    case 'Saved':
      return <Badge variant="neutral" size={size} dot>Saved</Badge>;
    case 'Applied':
      return <Badge variant="primary" size={size} dot>Applied</Badge>;
    case 'Assessment':
    case 'Online Assessment':
      return <Badge variant="accent" size={size} dot>Assessment</Badge>;
    case 'Interviewing':
    case 'Interview':
      return <Badge variant="secondary" size={size} dot>Interviewing</Badge>;
    case 'Offered':
    case 'Selected':
      return <Badge variant="success" size={size} dot>Offered 🎉</Badge>;
    case 'Rejected':
      return <Badge variant="danger" size={size} dot>Rejected</Badge>;
    default:
      return <Badge variant="default" size={size}>{status}</Badge>;
  }
}

/**
 * MatchBadge with tiered color thresholds
 */
export function MatchBadge({ score, size = 'sm', showIcon = true }) {
  let variant = 'danger';
  if (score >= 90) variant = 'success';
  else if (score >= 80) variant = 'primary';
  else if (score >= 70) variant = 'accent';
  else if (score >= 50) variant = 'warning';

  return (
    <Badge variant={variant} size={size}>
      {showIcon && <Sparkles size={11} />}
      <span>{score}% Match</span>
    </Badge>
  );
}

/**
 * EligibilityBadge
 */
export function EligibilityBadge({ eligible = true, size = 'sm' }) {
  return eligible ? (
    <Badge variant="success" size={size}>
      <CheckCircle2 size={12} />
      <span>Eligible</span>
    </Badge>
  ) : (
    <Badge variant="danger" size={size}>
      <XCircle size={12} />
      <span>Not Eligible</span>
    </Badge>
  );
}

/**
 * OpportunityTypeBadge
 */
export function OpportunityTypeBadge({ type, size = 'sm' }) {
  switch (type) {
    case 'Internship':
      return <Badge variant="primary" size={size}>Internship</Badge>;
    case 'Full-Time':
      return <Badge variant="secondary" size={size}>Full-Time</Badge>;
    case 'Hackathons':
    case 'Hackathon':
      return <Badge variant="accent" size={size}>Hackathon</Badge>;
    case 'Coding Contests':
    case 'Coding Contest':
      return <Badge variant="purple" size={size}>Coding Contest</Badge>;
    case 'Scholarships':
    case 'Scholarship':
      return <Badge variant="warning" size={size}>Scholarship</Badge>;
    case 'Conferences':
    case 'Conference':
      return <Badge variant="neutral" size={size}>Conference</Badge>;
    default:
      return <Badge variant="default" size={size}>{type}</Badge>;
  }
}

/**
 * PriorityBadge for skill priority (Critical, High, Medium, Low)
 */
export function PriorityBadge({ priority = 'Medium', size = 'sm' }) {
  let variant = 'neutral';
  if (priority === 'Critical') variant = 'danger';
  else if (priority === 'High') variant = 'warning';
  else if (priority === 'Medium') variant = 'primary';
  else if (priority === 'Low') variant = 'neutral';

  return (
    <Badge variant={variant} size={size} dot>
      {priority} Priority
    </Badge>
  );
}

/**
 * SkillBadge for skills with optional source tag or removable action
 */
export function SkillBadge({ name, verified = true, onRemove, size = 'sm' }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: size === 'sm' ? '0.2rem 0.55rem' : '0.3rem 0.75rem',
        fontSize: size === 'sm' ? '0.75rem' : '0.8125rem',
        fontWeight: 600,
        backgroundColor: verified ? 'var(--bg-secondary)' : 'var(--warning-bg)',
        color: verified ? 'var(--text-primary)' : 'var(--warning-dark)',
        border: `1px solid ${verified ? 'var(--border)' : 'var(--warning-border)'}`,
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span>{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            color: 'var(--text-muted)',
          }}
          title={`Remove ${name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

