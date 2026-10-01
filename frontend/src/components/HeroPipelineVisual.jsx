import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  FileText,
  Sparkles,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';

export default function HeroPipelineVisual() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 'profile',
      label: 'Student Profile',
      tag: 'Academic Onboarding',
      icon: <UserCheck size={20} className="text-primary" />,
      title: 'B.Tech CSE (8.4 CGPA)',
      subtitle: 'Graduation Batch 2026',
      badge: 'Verified',
      badgeVariant: 'success',
    },
    {
      id: 'resume',
      label: 'Resume PDF',
      tag: 'Deep Parser',
      icon: <FileText size={20} className="text-accent" />,
      title: '14 Core Skills Extracted',
      subtitle: 'Python, React, SQL, APIs',
      badge: '98% Accuracy',
      badgeVariant: 'primary',
    },
    {
      id: 'ai',
      label: 'AI Analysis',
      tag: 'Gemini Intelligence',
      icon: <Sparkles size={20} className="text-purple-600" />,
      title: 'ATS Score 88/100',
      subtitle: 'Entity graph & benchmarks',
      badge: 'Indexed',
      badgeVariant: 'secondary',
    },
    {
      id: 'opp',
      label: 'Discovery',
      tag: 'Opportunity Stream',
      icon: <Briefcase size={20} className="text-warning" />,
      title: 'Stripe Core Platform',
      subtitle: 'Software Eng. Intern',
      badge: '₹1,25,000 / mo',
      badgeVariant: 'warning',
    },
    {
      id: 'match',
      label: 'Decision',
      tag: 'Deterministic + Fit',
      icon: <CheckCircle2 size={20} className="text-success" />,
      title: '94% Match Score',
      subtitle: 'Deterministic Eligibility Passed',
      badge: 'Ready to Apply',
      badgeVariant: 'success',
    },
  ];

  // Auto-cycle through pipeline stages every 2.8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div
      style={{
        maxWidth: '1060px',
        margin: '0 auto',
        padding: '1.5rem',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-raised)',
      }}
      className="animate-fade-up"
    >
      {/* Pipeline Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingBottom: '1.25rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--success)',
              boxShadow: '0 0 0 3px var(--success-bg)',
            }}
          />
          <span style={{ fontSize: '0.84375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Live Intelligent Matching Pipeline
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Step {activeStep + 1} of {steps.length}: <strong style={{ color: 'var(--primary)' }}>{steps[activeStep].label}</strong>
        </div>
      </div>

      {/* Horizontal Pipeline Steps */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '0.75rem',
          position: 'relative',
        }}
        className="hero-pipeline-grid"
      >
        {steps.map((step, idx) => {
          const isActive = idx === activeStep;
          const isPassed = idx < activeStep;

          return (
            <div
              key={step.id}
              onClick={() => setActiveStep(idx)}
              style={{
                padding: '1rem 0.85rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: isActive ? 'var(--surface-raised)' : 'var(--bg-secondary)',
                border: `1px solid ${isActive ? 'var(--primary)' : isPassed ? 'var(--border-hover)' : 'var(--border)'}`,
                boxShadow: isActive ? '0 0 0 2px var(--primary-subtle), var(--shadow-md)' : 'var(--shadow-sm)',
                transition: 'all var(--transition-normal)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                position: 'relative',
              }}
            >
              {/* Step indicator top */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive ? 'var(--surface)' : 'var(--bg-sunken)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {step.icon}
                </div>
                <Badge variant={step.badgeVariant} size="sm">
                  {step.badge}
                </Badge>
              </div>

              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  {step.tag}
                </div>
                <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.3 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                  {step.subtitle}
                </div>
              </div>

              {/* Progress active bar */}
              <div
                style={{
                  height: '3px',
                  width: '100%',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isActive ? 'var(--primary)' : isPassed ? 'var(--success)' : 'var(--border)',
                  marginTop: 'auto',
                  transition: 'background-color var(--transition-fast)',
                }}
              />
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 860px) {
          .hero-pipeline-grid {
            grid-template-columns: 1fr !important;
            gap: 0.65rem !important;
          }
        }
      `}</style>
    </div>
  );
}
