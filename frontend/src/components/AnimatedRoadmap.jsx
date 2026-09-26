import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  FileText,
  ShieldCheck,
  Target,
  Layers,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Zap,
  Play,
  Pause,
  Award
} from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import ProgressBar from './ui/ProgressBar';

export const ROADMAP_STEPS = [
  {
    step: '01',
    title: 'Create Profile',
    desc: 'Set your university, branch, CGPA, graduation year, and target roles.',
    icon: <GraduationCap size={22} />,
    color: '#2563eb',
    accentBg: 'rgba(37, 99, 235, 0.1)',
    tag: 'Academic Onboarding',
    detailTitle: 'Academic Credentials Intake',
    detailDesc: 'Structured data model captures your verified CGPA, department, graduation year, and primary target job domains with zero ambiguity.',
    telemetry: {
      label: 'Student Profile State',
      metrics: [
        { key: 'Branch', val: 'Computer Science' },
        { key: 'CGPA', val: '8.9 / 10.0' },
        { key: 'Batch', val: '2023–2027' },
        { key: 'Profile Integrity', val: '100% Verified' },
      ],
    },
  },
  {
    step: '02',
    title: 'Upload Resume',
    desc: 'AI parses your PDF once, structuring skills and projects into your profile.',
    icon: <FileText size={22} />,
    color: '#0284c7',
    accentBg: 'rgba(2, 132, 199, 0.1)',
    tag: 'Automated Extraction',
    detailTitle: 'Deep Resume Intelligence',
    detailDesc: 'Extracts programming languages, frameworks, developer tools, and verified achievements from your PDF without manual data entry.',
    telemetry: {
      label: 'Extracted Skills Stream',
      metrics: [
        { key: 'Core Stack', val: 'Python, React, Node.js' },
        { key: 'Databases', val: 'MongoDB, PostgreSQL' },
        { key: 'Tools', val: 'Git, Docker, REST APIs' },
        { key: 'Extraction Accuracy', val: '98.4%' },
      ],
    },
  },
  {
    step: '03',
    title: 'Verify Eligibility',
    desc: 'Deterministic rules guarantee you never apply to a role you do not qualify for.',
    icon: <ShieldCheck size={22} />,
    color: '#7c3aed',
    accentBg: 'rgba(124, 58, 237, 0.1)',
    tag: 'Deterministic Rules',
    detailTitle: 'Binary Eligibility Enforcement',
    detailDesc: 'Deterministic logic rigorously compares your CGPA, branch, and graduation year against employer cutoffs before you waste time applying.',
    telemetry: {
      label: 'Eligibility Evaluation Engine',
      metrics: [
        { key: 'Google Cutoff', val: 'CGPA >= 8.0 (Pass)' },
        { key: 'Stripe Cutoff', val: 'CSE/IT Only (Pass)' },
        { key: 'Batch Rule', val: '2025/2026 Grad (Pass)' },
        { key: 'Disqualification Risk', val: '0% Guaranteed' },
      ],
    },
  },
  {
    step: '04',
    title: 'AI Semantic Match',
    desc: 'Match percentages highlight exact matching skills and missing skill gaps.',
    icon: <Target size={22} />,
    color: '#d97706',
    accentBg: 'rgba(217, 119, 6, 0.1)',
    tag: 'Neural Scoring',
    detailTitle: 'Semantic Compatibility Vector',
    detailDesc: 'Identifies contextual matches between your project experience and job descriptions, providing targeted skill gap recommendations.',
    telemetry: {
      label: 'Job Match Telemetry',
      metrics: [
        { key: 'Top Match Role', val: 'Stripe Core Platform' },
        { key: 'Match Score', val: '94% Exceptional' },
        { key: 'Matching Skills', val: '7 of 8 Acquired' },
        { key: 'Skill Gap', val: '+ Docker Containers' },
      ],
    },
  },
  {
    step: '05',
    title: 'Track to Offer',
    desc: 'Monitor application stages from Assessment to Interview with scheduled alerts.',
    icon: <Layers size={22} />,
    color: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.1)',
    tag: 'Career Conversion',
    detailTitle: 'End-to-End Pipeline Tracker',
    detailDesc: 'Tracks application lifecycle stages from OA links to final interviews with automated deadline reminders and interview prep tips.',
    telemetry: {
      label: 'Pipeline Conversion Status',
      metrics: [
        { key: 'Active Pipeline', val: '4 Applications' },
        { key: 'Next Deadline', val: 'Stripe in 4 Days' },
        { key: 'Interview Stage', val: 'Google Tech Interview' },
        { key: 'Offer Readiness', val: 'High Confidence 🎉' },
      ],
    },
  },
];

export default function AnimatedRoadmap() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-progress the roadmap animation every 4 seconds unless user pauses
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % ROADMAP_STEPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const current = ROADMAP_STEPS[activeStep];

  return (
    <div className="animated-roadmap-container" style={{ position: 'relative' }}>
      {/* 1. Desktop Interactive Roadmap Track (Beam & Connecting Progress) */}
      <div
        className="roadmap-track-wrapper"
        style={{
          position: 'relative',
          padding: '1.5rem 0 2.5rem',
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
        {/* Background track line */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '5%',
            right: '5%',
            height: '4px',
            backgroundColor: 'var(--border-control)',
            borderRadius: 'var(--radius-full)',
            zIndex: 1,
          }}
        />

        {/* Dynamic Glowing Beam Progress Line */}
        <div
          className="roadmap-beam"
          style={{
            position: 'absolute',
            top: '39px',
            left: '5%',
            width: `${(activeStep / (ROADMAP_STEPS.length - 1)) * 90}%`,
            height: '6px',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 2,
            boxShadow: '0 0 12px rgba(37, 99, 235, 0.6)',
          }}
        />

        {/* Milestone Checkpoints along the Highway */}
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {ROADMAP_STEPS.map((s, idx) => {
            const isCurrent = activeStep === idx;
            const isCompleted = activeStep > idx;

            return (
              <button
                key={s.step}
                onClick={() => {
                  setActiveStep(idx);
                  setIsPlaying(false);
                }}
                title={`Go to Step ${s.step}: ${s.title}`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0 0.5rem',
                  outline: 'none',
                }}
              >
                <div
                  className={isCurrent ? 'roadmap-checkpoint-active' : ''}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? s.color : isCompleted ? '#10b981' : 'var(--color-surface)',
                    color: isCurrent || isCompleted ? '#ffffff' : 'var(--color-text-muted)',
                    border: `2px solid ${isCurrent ? '#ffffff' : isCompleted ? '#10b981' : 'var(--border-control)'}`,
                    boxShadow: isCurrent
                      ? `0 0 0 4px ${s.color}40, 0 4px 10px rgba(0,0,0,0.15)`
                      : 'var(--shadow-raised-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={18} /> : s.step}
                </div>
                <span
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: isCurrent ? 800 : 600,
                    color: isCurrent ? s.color : 'var(--color-text-muted)',
                    marginTop: '0.45rem',
                    whiteSpace: 'nowrap',
                    transition: 'color var(--transition-fast)',
                  }}
                >
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive 5 Roadmap Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {ROADMAP_STEPS.map((item, idx) => {
          const isSelected = activeStep === idx;
          const isPassed = activeStep > idx;

          return (
            <div
              key={item.step}
              onClick={() => {
                setActiveStep(idx);
                setIsPlaying(false);
              }}
              style={{ cursor: 'pointer', height: '100%' }}
            >
              <Card
                variant="raised"
                className={`hover-lift ${isSelected ? 'roadmap-active-card' : ''}`}
                style={{
                  height: '100%',
                  borderLeft: isSelected ? `4px solid ${item.color}` : isPassed ? '4px solid #10b981' : undefined,
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  backgroundColor: isSelected ? 'var(--color-surface)' : 'var(--color-surface)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Active Indicator Top Light Bar */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: `linear-gradient(90deg, ${item.color}, #10b981)`,
                    }}
                  />
                )}

                <Card.Content style={{ padding: '1.35rem 1.25rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: item.accentBg,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-raised-sm)',
                        transition: 'transform 0.3s ease',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {item.icon}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {isSelected && (
                        <span
                          style={{
                            fontSize: '0.625rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: item.color,
                            color: '#ffffff',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          Active
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 900,
                          color: isSelected ? item.color : 'var(--border-control)',
                          transition: 'color var(--transition-fast)',
                        }}
                      >
                        {item.step}
                      </span>
                    </div>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      marginBottom: '0.35rem',
                      color: isSelected ? 'var(--color-primary-700)' : 'var(--color-text)',
                      transition: 'color var(--transition-fast)',
                    }}
                  >
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0, flex: 1 }}>
                    {item.desc}
                  </p>

                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.725rem', fontWeight: 700, color: item.color }}>
                    <span>{item.tag}</span>
                    <ChevronRight size={13} style={{ transform: isSelected ? 'translateX(2px)' : 'none', transition: 'transform 0.2s ease' }} />
                  </div>
                </Card.Content>
              </Card>
            </div>
          );
        })}
      </div>

      {/* 3. Live Interactive Telemetry Console for Selected Step */}
      <div
        className="roadmap-detail-panel"
        style={{
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--border-control)',
          boxShadow: 'var(--shadow-raised-lg), 0 12px 30px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Header of Detail Box */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: current.color,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
              }}
            >
              {current.step}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                Stage {current.step} — {current.detailTitle}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                CareerPilot AI Autonomous Pipeline Active
              </div>
            </div>
          </div>

          {/* Stepper Controls: Play/Pause, Prev, Next */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause Auto-Play' : 'Resume Auto-Play'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              <span>{isPlaying ? 'Auto-Cycle ON' : 'Paused'}</span>
            </button>

            <button
              onClick={() => {
                setActiveStep((prev) => (prev - 1 + ROADMAP_STEPS.length) % ROADMAP_STEPS.length);
                setIsPlaying(false);
              }}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              ◀ Prev
            </button>

            <button
              onClick={() => {
                setActiveStep((prev) => (prev + 1) % ROADMAP_STEPS.length);
                setIsPlaying(false);
              }}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: current.color,
                border: 'none',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Next ▶
            </button>
          </div>
        </div>

        {/* Body of Detail Box */}
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.25rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
                <Badge variant="purple" size="sm">
                  {current.tag}
                </Badge>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Milestone {activeStep + 1} of 5
                </span>
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.4rem' }}>
                {current.title}
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                {current.detailDesc}
              </p>

              {/* Progress bar across the 5 steps */}
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                  <span>Roadmap Progress to Placement</span>
                  <span style={{ color: current.color, fontWeight: 800 }}>
                    {((activeStep + 1) * 20)}% Complete
                  </span>
                </div>
                <ProgressBar
                  value={(activeStep + 1) * 20}
                  variant="primary"
                  size="sm"
                  showPercentage={false}
                />
              </div>
            </div>

            {/* Live Telemetry Preview Card for this step */}
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                border: '1px solid var(--border-control)',
                boxShadow: 'var(--shadow-raised-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {current.telemetry.label}
                </span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: current.color, boxShadow: `0 0 8px ${current.color}` }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {current.telemetry.metrics.map((m, mIdx) => (
                  <div
                    key={mIdx}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      {m.key}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
