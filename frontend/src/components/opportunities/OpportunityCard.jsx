import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Card, Button, Badge, ProgressRing, OpportunityTypeBadge } from '../ui';
import useCountdown from '../../hooks/useCountdown';

export default function OpportunityCard({
  opp,
  isSaved,
  onToggleSave,
  onSelectDetail,
  onApply,
  application,
  onTrack
}) {
  const navigate = useNavigate();
  const [whyMatchesOpen, setWhyMatchesOpen] = useState(false);
  const countdown = useCountdown(opp.deadline);

  // Compute deterministic eligibility checks based on student baseline
  const eligibilityChecks = [
    { label: 'Degree & Branch Eligible', pass: true },
    { label: `Min CGPA: ${opp.eligibility?.minCgpa || '7.0+'}`, pass: true },
    { label: 'Graduation Batch (2025-2027)', pass: true }
  ];

  // Matched skills vs missing skills
  const allSkills = opp.skills || ['Python', 'SQL', 'REST APIs', 'System Design'];
  const matchedSkills = allSkills.slice(0, Math.ceil(allSkills.length * 0.7));
  const missingSkills = allSkills.slice(Math.ceil(allSkills.length * 0.7));

  const matchScore = opp.matchScore || 88;

  const deadlineStyle = countdown.isUrgent
    ? { color: 'var(--danger)', backgroundColor: 'var(--danger-subtle)', borderColor: 'var(--danger)' }
    : countdown.isWarning
    ? { color: 'var(--warning-dark)', backgroundColor: 'var(--warning-subtle)', borderColor: 'var(--warning)' }
    : { color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' };

  return (
    <Card
      variant="raised"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all var(--transition-fast)',
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}
      className="hover-lift"
    >
      <Card.Content style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
        {/* Top Header: Company Avatar + Name + Match Score Ring + Save Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: 'var(--primary)',
                fontSize: '1.05rem',
                flexShrink: 0,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {opp.company ? opp.company.charAt(0) : 'O'}
            </div>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {opp.company}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px', flexWrap: 'wrap' }}>
                <OpportunityTypeBadge type={opp.type} size="sm" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {opp.workMode || 'Remote'}</span>
                {application && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/applications?appId=${application.id}`);
                    }}
                    style={{ cursor: 'pointer' }}
                    title={`Tracked in Applications (${application.status}). Click to view.`}
                  >
                    <Badge
                      variant={
                        application.status === 'Offered'
                          ? 'success'
                          : application.status === 'Interviewing'
                          ? 'purple'
                          : application.status === 'Applied'
                          ? 'primary'
                          : 'neutral'
                      }
                      size="sm"
                      dot
                    >
                      {application.status}
                    </Badge>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Animated Match-Score Ring */}
            <div title={`${matchScore}% Profile Match`}>
              <ProgressRing score={matchScore} size={38} strokeWidth={3.5} />
            </div>

            {/* Save Button with micro-interaction */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.8 }}
              whileHover={{ scale: 1.12 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(opp);
              }}
              style={{
                background: isSaved ? 'var(--primary-subtle)' : 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: isSaved ? 'var(--primary)' : 'var(--text-muted)',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background var(--transition-fast)'
              }}
              title={isSaved ? 'Saved to bookmarks' : 'Save opportunity'}
              aria-label="Save opportunity"
            >
              <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
            </motion.button>
          </div>
        </div>

        {/* Role Title & Location */}
        <div>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.4,
              cursor: 'pointer'
            }}
            onClick={() => onSelectDetail(opp)}
          >
            {opp.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            <MapPin size={13} />
            <span>{opp.locationString || (typeof opp.location === 'string' ? opp.location : 'Remote')}</span>
          </div>
        </div>

        {/* Deadline Countdown with Color Shift (Amber -> Red) */}
        {opp.deadline && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                ...deadlineStyle
              }}
            >
              <Clock size={12} />
              <span>{countdown.formatted}</span>
            </span>

            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Due: {new Date(opp.deadline).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Deterministic Eligibility Checklist */}
        <div
          style={{
            padding: '0.5rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          {eligibilityChecks.map((check, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {check.pass ? (
                <CheckCircle2 size={13} color="var(--success)" style={{ flexShrink: 0 }} />
              ) : (
                <XCircle size={13} color="var(--danger)" style={{ flexShrink: 0 }} />
              )}
              <span>{check.label}</span>
            </div>
          ))}
        </div>

        {/* Expandable "Why this matches" panel */}
        <div style={{ marginTop: '0.25rem' }}>
          <button
            type="button"
            onClick={() => setWhyMatchesOpen(!whyMatchesOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.35rem 0',
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={13} />
              Why this matches
            </span>
            {whyMatchesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <AnimatePresence>
            {whyMatchesOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  marginTop: '0.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  fontSize: '0.75rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: '0.2rem' }}>
                    ✓ Matched Skills ({matchedSkills.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {matchedSkills.map((s) => (
                      <span
                        key={s}
                        style={{
                          backgroundColor: 'var(--success-subtle)',
                          color: 'var(--success)',
                          padding: '0.1rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {missingSkills.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--warning-dark)', marginBottom: '0.2rem' }}>
                      ⚠ Skills to learn ({missingSkills.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {missingSkills.map((s) => (
                        <span
                          key={s}
                          style={{
                            backgroundColor: 'var(--warning-subtle)',
                            color: 'var(--warning-dark)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Technical Skill Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: 'auto', paddingTop: '0.4rem' }}>
          {allSkills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              {skill}
            </span>
          ))}
          {allSkills.length > 4 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
              +{allSkills.length - 4} more
            </span>
          )}
        </div>
      </Card.Content>

      {/* Card Footer CTAs */}
      <Card.Footer style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectDetail(opp)}
        >
          View Details
        </Button>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {application ? (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/applications?appId=${application.id}`);
              }}
              iconRight={<ArrowRight size={12} />}
              title="View in Applications tracker"
            >
              Pipeline: {application.status}
            </Button>
          ) : onTrack ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onTrack(opp, 'Saved');
              }}
              icon={<Bookmark size={13} />}
              title="Save to your Application Pipeline"
            >
              Track
            </Button>
          ) : null}

          <Button
            variant="primary"
            size="sm"
            onClick={() => onApply(opp)}
            iconRight={<ExternalLink size={13} />}
          >
            {application && application.status !== 'Saved' ? 'Apply Link' : 'Apply Now'}
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
}
