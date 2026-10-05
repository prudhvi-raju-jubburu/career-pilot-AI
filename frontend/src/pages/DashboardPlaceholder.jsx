import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  Briefcase,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useOpportunities } from '../hooks/useOpportunities';
import { useApplications } from '../hooks/useApplications';
import { useSkillGap } from '../hooks/useSkillGap';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge, { MatchBadge, PriorityBadge, OpportunityTypeBadge } from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatShortDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isInterviewStatus(status) {
  return ['Interviewing', 'Interview', 'Assessment', 'Online Assessment'].includes(status);
}

function isOfferStatus(status) {
  return ['Offered', 'Selected', 'Offer'].includes(status);
}

function isSubmittedStatus(status) {
  return status && status !== 'Saved' && status !== 'Rejected';
}

export default function DashboardPlaceholder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, completion, loading: profileLoading } = useProfile();
  const { data: opportunities, pagination, loading: oppsLoading, error: oppsError, refetch: refetchOpps } = useOpportunities();
  const { applications, loading: appsLoading, error: appsError, refetch: refetchApps } = useApplications();
  const { data: skillGap, loading: skillsLoading, error: skillsError, refetch: refetchSkills } = useSkillGap(
    'Full Stack Developer'
  );

  const [savedOppIds, setSavedOppIds] = useState(() => {
    try {
      const saved = localStorage.getItem('careerpilot_saved_opps');
      return saved ? JSON.parse(saved) : ['opp-google-sde-intern'];
    } catch {
      return ['opp-google-sde-intern'];
    }
  });

  const toggleSaveOpp = (oppId, e) => {
    e.stopPropagation();
    setSavedOppIds((prev) => {
      const next = prev.includes(oppId) ? prev.filter((id) => id !== oppId) : [...prev, oppId];
      try {
        localStorage.setItem('careerpilot_saved_opps', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const loading = oppsLoading || appsLoading || skillsLoading || profileLoading;

  const totalOppsCount = pagination?.total ?? opportunities?.length ?? 0;
  const appliedCount = useMemo(
    () => (applications || []).filter((app) => isSubmittedStatus(app.status)).length,
    [applications]
  );

  const completionPercentage = completion?.percentage ?? profile?.profileCompletion ?? 0;
  const missingItem = completion?.missing_items?.[0] || 'Complete your student profile to maximize opportunity discovery.';

  const recentOpportunities = useMemo(() => {
    const list = opportunities || [];
    // Prioritize student-oriented opportunities: internships, hackathons, fellowships, contests
    const studentTypes = ['internship', 'fellowship', 'hackathon', 'coding_contest', 'scholarship'];
    const studentRoles = list.filter((o) => studentTypes.includes(o.type));
    const otherRoles = list.filter((o) => !studentTypes.includes(o.type));
    return [...studentRoles, ...otherRoles].slice(0, 4);
  }, [opportunities]);

  const upcomingDeadlines = useMemo(() => {
    const list = opportunities || [];
    return list
      .filter((opp) => opp.deadline)
      .slice(0, 3)
      .map((opp) => ({
        id: opp.id,
        company: opp.company,
        role: opp.title,
        deadline: opp.deadline,
        type: opp.type,
      }));
  }, [opportunities]);

  const skillsToImprove = useMemo(() => {
    const missing = skillGap?.prioritySpotlight || skillGap?.missingSkills || [];
    return [...missing]
      .map((skill) =>
        typeof skill === 'string'
          ? { name: skill, priority: 'High' }
          : { name: skill.name, priority: skill.priority || skill.importance || 'High' }
      )
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))
      .slice(0, 4);
  }, [skillGap]);

  const pipeline = useMemo(() => {
    const list = applications || [];
    return {
      saved: list.filter((app) => app.status === 'Saved').length,
      applied: list.filter((app) => app.status === 'Applied').length,
      interview: list.filter((app) => isInterviewStatus(app.status)).length,
      offer: list.filter((app) => isOfferStatus(app.status)).length,
    };
  }, [applications]);

  const targetRoleTitle = skillGap?.targetRole || 'Full Stack Developer';
  const readinessScore = skillGap?.readinessScore ?? null;

  return (
    <PageContainer>
      <div className="dashboard-container animate-fade-up">
        {/* Top Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="font-h1" style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {getGreeting()}, {firstName} 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Here is your career progression overview and latest opportunities.
            </p>
          </div>
          <div className="dashboard-header-action">
            <Link to="/opportunities" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="md" iconRight={<ArrowRight size={15} />}>
                Explore Opportunities
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div className="metrics-grid">
              <SkeletonCard height="100px" />
              <SkeletonCard height="100px" />
              <SkeletonCard height="100px" />
              <SkeletonCard height="100px" />
            </div>
            <div className="dashboard-grid">
              <SkeletonCard height="320px" />
              <SkeletonCard height="320px" />
            </div>
          </div>
        ) : (
          <>
            {/* 1. Key Metrics 4-Grid */}
            <div className="metrics-grid">
              <StatTile
                label="Opportunities Available"
                value={totalOppsCount}
                icon={<Briefcase size={20} />}
                subtext="Verified student roles"
              />
              <StatTile
                label="Active Applications"
                value={appliedCount}
                icon={<Layers size={20} />}
                subtext="In active pipeline"
              />
              <StatTile
                label="Profile Completion"
                value={`${completionPercentage}%`}
                icon={<CheckCircle2 size={20} />}
                subtext={completionPercentage >= 80 ? 'Profile verified' : 'Action items pending'}
              />
              <StatTile
                label="Target Role Readiness"
                value={readinessScore ? `${readinessScore}%` : 'Building'}
                icon={<TrendingUp size={20} />}
                subtext={targetRoleTitle}
              />
            </div>

            {/* 2. Main Two-Column Layout */}
            <div className="dashboard-grid">
              {/* Left Column (Primary Content) */}
              <div className="dashboard-main-col">
                {/* Profile Progress Card */}
                <Card variant="raised" style={{ marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                  <Card.Content style={{ padding: '1.25rem 1.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Profile</span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
                          {completionPercentage}% complete
                        </span>
                      </div>
                      <Link to="/profile" style={{ textDecoration: 'none' }}>
                        <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>
                          Complete Profile
                        </Button>
                      </Link>
                    </div>
                    <ProgressBar value={completionPercentage} variant="primary" showPercentage={false} size="sm" />
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.6rem' }}>
                      {missingItem}
                    </div>
                  </Card.Content>
                </Card>

                {/* Latest Opportunities */}
                <DigestSection title="Latest Opportunities">
                  {oppsError ? (
                    <RetryNote message="Could not load opportunities." onRetry={refetchOpps} />
                  ) : recentOpportunities.length === 0 ? (
                    <EmptyState
                      title="No opportunities found"
                      description="Check back soon for freshly discovered student roles."
                      actionLabel="Explore opportunities"
                      onAction={() => navigate('/opportunities')}
                      style={{ padding: '1.75rem 1rem', maxWidth: '100%' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {recentOpportunities.map((opp) => {
                        const isSaved = savedOppIds.includes(opp.id);
                        return (
                          <div key={opp.id} className="digest-opp-card">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                                {opp.company}
                              </div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.45rem', fontWeight: 500 }}>
                                {opp.title}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                <OpportunityTypeBadge type={opp.type} size="sm" />
                                <span>•</span>
                                <span>{opp.locationString || opp.location || 'Remote'}</span>
                                {opp.workMode && (
                                  <>
                                    <span>•</span>
                                    <span>{opp.workMode}</span>
                                  </>
                                )}
                                {opp.deadline && (
                                  <span style={{ color: 'var(--warning-dark)', fontWeight: 600 }}>
                                    • Deadline: {formatShortDate(opp.deadline)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={(e) => toggleSaveOpp(opp.id, e)}
                                className="save-btn"
                                title={isSaved ? 'Saved to bookmarks' : 'Save opportunity'}
                                aria-label="Save opportunity"
                              >
                                {isSaved ? <BookmarkCheck size={18} color="var(--primary)" /> : <Bookmark size={18} />}
                              </button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate(`/opportunities?selected=${opp.id}`)}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                        <Link to="/opportunities" style={{ textDecoration: 'none' }}>
                          <Button variant="outline" size="sm" iconRight={<ArrowRight size={14} />} style={{ width: '100%' }}>
                            View All Opportunities ({totalOppsCount})
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </DigestSection>

                {/* Applications Pipeline */}
                <DigestSection title="My Applications Tracker">
                  {appsError ? (
                    <RetryNote message="Could not load applications." onRetry={refetchApps} />
                  ) : (
                    <>
                      <div className="digest-pipeline">
                        <PipelineStat label="Saved" value={pipeline.saved} />
                        <PipelineStat label="Applied" value={pipeline.applied} />
                        <PipelineStat label="Interview" value={pipeline.interview} />
                        <PipelineStat label="Offer" value={pipeline.offer} />
                      </div>
                      <div style={{ marginTop: '0.85rem' }}>
                        <Link to="/applications" style={{ textDecoration: 'none' }}>
                          <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>
                            Open Application Tracker
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
                </DigestSection>
              </div>

              {/* Right Column (Sidebar Widgets) */}
              <div className="dashboard-sidebar-col">
                {/* Upcoming Deadlines */}
                {upcomingDeadlines.length > 0 && (
                  <DigestSection title="Upcoming Deadlines">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {upcomingDeadlines.map((item) => (
                        <div key={item.id} className="digest-deadline-row">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.company}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.role}
                            </div>
                          </div>
                          <Badge variant="warning" size="sm" dot style={{ flexShrink: 0 }}>
                            {formatShortDate(item.deadline)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </DigestSection>
                )}

                {/* Skills to Improve */}
                <DigestSection title="Skills to Improve">
                  {skillsError ? (
                    <RetryNote message="Could not load your skill plan." onRetry={refetchSkills} />
                  ) : skillsToImprove.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      No high-priority skill gaps for your current target role.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {skillsToImprove.map((skill) => (
                        <div key={skill.name} className="digest-skill-row">
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{skill.name}</span>
                          <PriorityBadge priority={skill.priority} size="sm" />
                        </div>
                      ))}
                      <div style={{ marginTop: '0.5rem' }}>
                        <Link to="/skill-gap" style={{ textDecoration: 'none' }}>
                          <Button variant="outline" size="sm" iconRight={<ArrowRight size={14} />} style={{ width: '100%' }}>
                            View Personalized Roadmap
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </DigestSection>

                {/* Quick Career Actions */}
                <DigestSection title="Quick Career Actions">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <Link to="/resume" style={{ textDecoration: 'none' }}>
                      <div className="quick-action-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="quick-action-icon"><Sparkles size={16} /></div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Analyze Resume</div>
                            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Scan and extract ATS skills</div>
                          </div>
                        </div>
                        <ArrowRight size={14} color="var(--primary)" />
                      </div>
                    </Link>
                    <Link to="/ai-advisor" style={{ textDecoration: 'none' }}>
                      <div className="quick-action-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="quick-action-icon"><Briefcase size={16} /></div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>AI Career Advisor</div>
                            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Interview prep & mentorship</div>
                          </div>
                        </div>
                        <ArrowRight size={14} color="var(--primary)" />
                      </div>
                    </Link>
                  </div>
                </DigestSection>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .dashboard-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
        }
        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.75rem;
          flex-wrap: wrap;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.15rem;
          margin-bottom: 1.75rem;
        }
        @media (max-width: 1100px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 540px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 1.5rem;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
        .digest-section {
          margin-bottom: 1.25rem;
          border: 1px solid var(--border);
        }
        .digest-section-title {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.85rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border);
        }
        .digest-opp-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.9rem 1rem;
          border-radius: var(--radius-md);
          background: var(--surface);
          border: 1px solid var(--border);
          transition: all var(--transition-fast);
        }
        .digest-opp-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
        .save-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .save-btn:hover {
          color: var(--primary);
          border-color: var(--primary);
          background: var(--primary-subtle);
        }
        .digest-deadline-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.75rem 0.9rem;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
        }
        .digest-skill-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.65rem 0.85rem;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
        }
        .digest-pipeline {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.65rem;
        }
        @media (max-width: 540px) {
          .digest-pipeline {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .quick-action-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0.9rem;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          transition: all var(--transition-fast);
        }
        .quick-action-card:hover {
          background: var(--surface);
          border-color: var(--primary);
          transform: translateX(2px);
        }
        .quick-action-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: var(--primary-subtle);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </PageContainer>
  );
}

function StatTile({ label, value, icon, subtext }) {
  return (
    <Card variant="raised" style={{ border: '1px solid var(--border)' }}>
      <Card.Content style={{ padding: '1.1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            {value}
          </div>
          {icon && <span style={{ color: 'var(--primary)', opacity: 0.85 }}>{icon}</span>}
        </div>
        <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700 }}>
          {label}
        </div>
        {subtext && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
            {subtext}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

function DigestSection({ title, children }) {
  return (
    <Card variant="default" className="digest-section">
      <Card.Content style={{ padding: '1.15rem 1.25rem 1.25rem' }}>
        <div className="digest-section-title">{title}</div>
        {children}
      </Card.Content>
    </Card>
  );
}

function PipelineStat({ label, value }) {
  return (
    <div
      style={{
        padding: '0.75rem 0.85rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>{value}</div>
    </div>
  );
}

function RetryNote({ message, onRetry }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{message}</span>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
