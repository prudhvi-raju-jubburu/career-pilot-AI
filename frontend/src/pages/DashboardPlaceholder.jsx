import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Briefcase,
  Layers,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Bookmark,
  ExternalLink,
  MapPin,
  Calendar,
  AlertTriangle,
  Award,
  Zap,
  Target,
  FileCheck,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge, { StatusBadge, MatchBadge, EligibilityBadge } from '../components/ui/Badge';
import ProgressBar, { CircularProgress } from '../components/ui/ProgressBar';
import {
  mockOpportunities,
  mockApplications,
  mockSkillGapData,
  mockStudentProfile
} from '../services/mockData';

export default function DashboardPlaceholder() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [savedOpportunities, setSavedOpportunities] = useState(new Set(['opp-stripe-sde']));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const toggleSave = (id, title) => {
    setSavedOpportunities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info(`Removed ${title} from saved items`);
      } else {
        next.add(id);
        toast.success(`Saved ${title} to your tracker!`);
      }
      return next;
    });
  };

  const topOpportunities = mockOpportunities.slice(0, 3);
  const activeApplications = mockApplications.filter((a) => a.status !== 'Rejected');
  const targetRole = mockSkillGapData.targetRoles[0];
  const missingSkills = mockSkillGapData.skillsBreakdown['role-fullstack'].requiredSkills.filter(
    (s) => s.status === 'missing'
  );

  return (
    <PageContainer>
      {/* 1. Welcome & Telemetry Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--surface-raised) 0%, var(--surface) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem 2.25rem',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-raised)',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="animate-fade-up"
      >
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--primary-subtle) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Badge variant="primary" size="sm" dot>
                CareerPilot AI Telemetry Active
              </Badge>
              <Badge variant="success" size="sm">
                Student Profile 88% Complete
              </Badge>
            </div>
            <h1 className="font-h1" style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: '640px', lineHeight: 1.5 }}>
              We analyzed your student profile and resume against <strong style={{ color: 'var(--primary)' }}>2,400+ active roles</strong>. You have <strong>18 high-match opportunities</strong> eligible for immediate application.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/opportunities">
              <Button variant="primary" size="md" icon={<Briefcase size={16} />}>
                Explore Matches
              </Button>
            </Link>
            <Link to="/ai-advisor">
              <Button variant="secondary" size="md" icon={<Sparkles size={16} className="text-secondary" />}>
                Ask AI Advisor
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Statistics Grid */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <Card variant="raised" className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <Card.Content style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
              <span className="font-caption" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Matching Roles
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Briefcase size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                18
              </span>
              <Badge variant="success" size="sm">+4 new</Badge>
            </div>
            <p className="font-small" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              94% highest student match score
            </p>
          </Card.Content>
        </Card>

        <Card variant="raised" className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <Card.Content style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
              <span className="font-caption" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Active Applications
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--secondary-subtle)',
                  color: 'var(--secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {activeApplications.length}
              </span>
              <Badge variant="accent" size="sm">1 Offer</Badge>
            </div>
            <p className="font-small" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              1 Interview • 1 Assessment in flight
            </p>
          </Card.Content>
        </Card>

        <Card variant="raised" className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <Card.Content style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
              <span className="font-caption" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Upcoming Deadlines
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--warning-bg)',
                  color: 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                2
              </span>
              <Badge variant="warning" size="sm">&lt; 7 Days</Badge>
            </div>
            <p className="font-small" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Stripe closes in 4 days
            </p>
          </Card.Content>
        </Card>

        <Card variant="raised" className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <Card.Content style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
              <span className="font-caption" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Profile Readiness
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Award size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                88%
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified</span>
            </div>
            <p className="font-small" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Resume ATS Score: 88/100
            </p>
          </Card.Content>
        </Card>
      </div>

      {/* 3. Main Dashboard Body: Left Column (Recommended Opps + Pipeline) & Right Column (Skill Gap & Deadlines) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }} className="dashboard-main-grid">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section: Recommended Opportunities */}
          <Card variant="default">
            <Card.Header>
              <div>
                <h3 className="font-h3" style={{ color: 'var(--text-primary)' }}>
                  Recommended For You
                </h3>
                <p className="font-small" style={{ color: 'var(--text-secondary)' }}>
                  Tailored based on your extracted skills, verified CGPA, and graduation year
                </p>
              </div>
              <Link to="/opportunities">
                <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>
                  View all 18
                </Button>
              </Link>
            </Card.Header>

            <Card.Content style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {topOpportunities.map((opp) => {
                const isSaved = savedOpportunities.has(opp.id);

                return (
                  <div
                    key={opp.id}
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem',
                      transition: 'all var(--transition-fast)',
                    }}
                    className="hover-lift"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
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
                            fontSize: '1rem',
                            flexShrink: 0,
                          }}
                        >
                          {opp.company.charAt(0)}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {opp.company}
                            </span>
                            <Badge variant="primary" size="sm">{opp.type}</Badge>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {opp.location}</span>
                          </div>
                          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                            {opp.title}
                          </h4>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSave(opp.id, opp.company)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: isSaved ? 'var(--primary)' : 'var(--text-muted)',
                          padding: '4px',
                        }}
                        title={isSaved ? 'Remove from saved' : 'Save opportunity'}
                      >
                        <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <MatchBadge score={opp.matchScore} size="sm" />
                        <EligibilityBadge eligible={opp.eligibility.isEligible} size="sm" />
                        <span style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={12} />
                          {opp.daysLeft} days left
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/opportunities?selected=${opp.id}`)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            toast.success(`Started application process for ${opp.company}!`);
                            navigate('/applications');
                          }}
                        >
                          Quick Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card.Content>
          </Card>

          {/* Section: Application Pipeline Progress */}
          <Card variant="default">
            <Card.Header>
              <div>
                <h3 className="font-h3" style={{ color: 'var(--text-primary)' }}>
                  Application Pipeline Tracker
                </h3>
                <p className="font-small" style={{ color: 'var(--text-secondary)' }}>
                  Real-time status of your active submissions and upcoming interview milestones
                </p>
              </div>
              <Link to="/applications">
                <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>
                  Open Kanban Board
                </Button>
              </Link>
            </Card.Header>

            <Card.Content style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeApplications.map((app) => (
                  <div
                    key={app.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                        }}
                      >
                        {app.company.charAt(0)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            {app.company}
                          </span>
                          <StatusBadge status={app.status} size="sm" />
                        </div>
                        <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
                          {app.role}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                        {app.nextAction}
                      </div>
                      <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                        Target: {app.nextActionDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Right Column: Skill Gap Snapshot & AI Advisor Quick Launcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Target Role & Skill Gap Snapshot */}
          <Card variant="raised">
            <Card.Header>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={18} className="text-primary" />
                <h3 className="font-h3" style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Skill Gap Snapshot
                </h3>
              </div>
              <Link to="/skill-gap">
                <Button variant="ghost" size="sm">
                  Roadmap
                </Button>
              </Link>
            </Card.Header>

            <Card.Content style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Target Specialization
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {targetRole.title}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {targetRole.currentFit}%
                  </span>
                  <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>Alignment</div>
                </div>
              </div>

              <ProgressBar value={targetRole.currentFit} variant="primary" size="sm" showPercentage={false} style={{ marginBottom: '1.25rem' }} />

              <div style={{ fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                High-Impact Missing Skills:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {missingSkills.slice(0, 3).map((skill) => (
                  <div
                    key={skill.name}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78125rem',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{skill.name}</span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{skill.demand}</div>
                    </div>
                    <Badge variant="warning" size="sm">High Priority</Badge>
                  </div>
                ))}
              </div>

              <Link to="/skill-gap" style={{ textDecoration: 'none', display: 'block', marginTop: '1rem' }}>
                <Button variant="outline" size="sm" style={{ width: '100%' }} iconRight={<ChevronRight size={14} />}>
                  View Tailored Learning Roadmap
                </Button>
              </Link>
            </Card.Content>
          </Card>

          {/* AI Career Advisor Prompt Shortcut */}
          <Card
            variant="default"
            style={{
              background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-raised) 100%)',
              border: '1px solid var(--border)',
            }}
          >
            <Card.Content style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--secondary-subtle)',
                    color: 'var(--secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={17} />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Ask AI Career Advisor
                </h4>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Prepare for technical interviews, analyze resume match for any job link, or generate targeted prep notes.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {[
                  'What skills should I learn for an SDE role?',
                  'How can I improve my resume for ATS?',
                  'Prepare me for a React & Python interview'
                ].map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => navigate(`/ai-advisor?prompt=${encodeURIComponent(promptText)}`)}
                    style={{
                      textAlign: 'left',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      fontSize: '0.78125rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.color = 'var(--primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .dashboard-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </PageContainer>
  );
}
