import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  RefreshCw,
  Database,
  Radio,
  CheckCircle,
  AlertCircle
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
import { ProgressRing, CountUp, MatchRing, StatCard, DeadlineCountdown, SkillRadar } from '../components/ui';
import { fadeUp, staggerContainer } from '../utils/motion';
import { getDashboardStats, getSourcesStatus, triggerSourcesSync } from '../services/api';

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
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [statsData, setStatsData] = useState(null);
  const [sourcesData, setSourcesData] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [syncingSources, setSyncingSources] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);
  const [digestExpanded, setDigestExpanded] = useState(true);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await getDashboardStats();
      if (res?.data?.success && res?.data?.data) {
        setStatsData(res.data.data);
      }
    } catch (err) {
      console.warn('Dashboard stats fallback to hook data:', err);
    }
  }, []);

  const fetchSources = useCallback(async () => {
    setSourcesLoading(true);
    try {
      const res = await getSourcesStatus();
      if (res?.data?.success && res?.data?.data) {
        setSourcesData(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load sources telemetry:', err);
    } finally {
      setSourcesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
    fetchSources();
  }, [fetchDashboardStats, fetchSources]);

  const handleSyncAll = async () => {
    setSyncingSources(true);
    setSyncFeedback(null);
    try {
      const res = await triggerSourcesSync();
      setSyncFeedback({
        type: 'success',
        message: res?.data?.message || 'Data sources synchronized successfully!'
      });
      await Promise.all([fetchDashboardStats(), fetchSources(), refetchOpps()]);
    } catch (err) {
      setSyncFeedback({
        type: 'error',
        message: 'Failed to sync data sources. Please try again.'
      });
    } finally {
      setSyncingSources(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

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

  const totalOppsCount = statsData?.total_opportunities ?? (pagination?.total ?? opportunities?.length ?? 0);
  const scannedToday = statsData?.scanned_today ?? 0;
  const sparklineData = statsData?.sparkline_data && statsData.sparkline_data.length > 0
    ? statsData.sparkline_data
    : [totalOppsCount, totalOppsCount, totalOppsCount];

  const appliedCount = statsData?.active_applications ?? (applications || []).filter((app) => isSubmittedStatus(app.status)).length;

  const completionPercentage = statsData?.profile_completion ?? (completion?.percentage ?? profile?.profileCompletion ?? 0);
  const missingItem = statsData?.missing_items?.[0] || completion?.missing_items?.[0] || 'Complete your student profile to maximize opportunity discovery.';

  const recentOpportunities = useMemo(() => {
    const list = statsData?.recent_opportunities?.length ? statsData.recent_opportunities : (opportunities || []);
    const studentTypes = ['internship', 'fellowship', 'hackathon', 'coding_contest', 'scholarship'];
    const studentRoles = list.filter((o) => studentTypes.includes(o.type));
    const otherRoles = list.filter((o) => !studentTypes.includes(o.type));
    return [...studentRoles, ...otherRoles].slice(0, 4);
  }, [statsData, opportunities]);

  const upcomingDeadlines = useMemo(() => {
    const list = statsData?.upcoming_deadlines?.length ? statsData.upcoming_deadlines : (opportunities || []);
    return list
      .filter((opp) => opp.deadline || opp.dates?.deadline)
      .slice(0, 3)
      .map((opp) => ({
        id: opp.id,
        company: opp.company,
        role: opp.title,
        deadline: opp.deadline || opp.dates?.deadline,
        type: opp.type,
      }));
  }, [statsData, opportunities]);

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
    if (statsData?.pipeline) {
      return {
        saved: statsData.pipeline.saved || 0,
        applied: statsData.pipeline.applied || 0,
        interview: statsData.pipeline.interviewing || 0,
        offer: statsData.pipeline.offer || 0,
      };
    }
    const list = applications || [];
    return {
      saved: list.filter((app) => app.status === 'Saved').length,
      applied: list.filter((app) => app.status === 'Applied').length,
      interview: list.filter((app) => isInterviewStatus(app.status)).length,
      offer: list.filter((app) => isOfferStatus(app.status)).length,
    };
  }, [statsData, applications]);

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
            {/* 1. Key Metrics 4-Grid Asymmetric Bento */}
            <div className="metrics-grid" style={{ marginBottom: '1.75rem' }}>
              <StatCard
                title="Opportunities In Radar"
                numericValue={totalOppsCount}
                unit=" roles"
                delta={`+${scannedToday} scanned today`}
                deltaType="positive"
                icon={<Briefcase size={20} />}
                accentColor="var(--primary)"
                sparklineData={sparklineData}
              />
              <StatCard
                title="Active Applications"
                numericValue={appliedCount}
                unit=" in flight"
                delta={`${pipeline.interview} in interview`}
                deltaType="positive"
                icon={<Layers size={20} />}
                accentColor="var(--accent-cyan)"
                sparklineData={[pipeline.saved, pipeline.applied, pipeline.interview, pipeline.offer]}
              />
              <StatCard
                title="Profile Completion"
                numericValue={completionPercentage}
                unit="%"
                delta={completionPercentage >= 80 ? 'Verified profile' : 'Actions pending'}
                deltaType={completionPercentage >= 80 ? 'positive' : 'neutral'}
                icon={<CheckCircle2 size={20} />}
                accentColor="var(--success)"
                sparklineData={[40, 55, 65, 75, 80, completionPercentage]}
              />

              {/* 7-Day Activity Streak & Heatmap Tile */}
              <div
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border-hairline, var(--border))',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      Flight Streak
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                        color: 'var(--accent-amber)',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <Zap size={13} className="animate-pulse" /> 5 Days
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-display)',
                      color: 'var(--text-primary)',
                      marginTop: '0.25rem',
                      lineHeight: 1.1,
                    }}
                  >
                    Active
                  </div>
                </div>

                {/* 7-Day Heatmap Pips */}
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-hairline, var(--border))' }}>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <div
                          style={{
                            width: '100%',
                            height: '14px',
                            borderRadius: '3px',
                            background: idx < 5 ? 'var(--accent-cyan)' : 'var(--surface)',
                            border: '1px solid var(--border-control)',
                            boxShadow: idx < 5 ? '0 0 6px var(--cyan-glow)' : 'none',
                          }}
                        />
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Today's AI Digest Card with Staggered Reveal */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{ marginBottom: '1.75rem' }}
            >
              <Card
                variant="raised"
                style={{
                  border: '1px solid var(--border)',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.07) 0%, rgba(6, 182, 212, 0.04) 100%)',
                  overflow: 'hidden'
                }}
              >
                <div
                  onClick={() => setDigestExpanded(!digestExpanded)}
                  style={{
                    padding: '1rem 1.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: digestExpanded ? '1px solid var(--border)' : 'none',
                    transition: 'background var(--transition-fast)'
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={digestExpanded}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDigestExpanded(!digestExpanded); } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 0 14px rgba(99, 102, 241, 0.45)',
                        flexShrink: 0
                      }}
                    >
                      <Sparkles size={17} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span>Today's AI Digest</span>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                          Daily Synthesis
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        Contextual recommendations, skill gap spotlights, and actionable advice tailored to your target role.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{digestExpanded ? 'Collapse' : 'Expand'}</span>
                    {digestExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                <AnimatePresence>
                  {digestExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                        style={{
                          padding: '1.25rem 1.4rem',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: '1rem'
                        }}
                      >
                        {/* Digest Item 1: Top Matched Role */}
                        {recentOpportunities.length > 0 ? (
                          <motion.div variants={fadeUp} className="digest-intel-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>Top Discovered Role</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{recentOpportunities[0].company}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              <ProgressRing score={recentOpportunities[0].matchScore || 85} size={46} strokeWidth={4} />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{recentOpportunities[0].title}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{recentOpportunities[0].type} • {recentOpportunities[0].location || 'Remote'}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                              Continuously ingested from live feeds. Matches your preferred role and profile.
                            </div>
                            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                              <Button size="sm" variant="primary" onClick={() => navigate(`/opportunities?selected=${recentOpportunities[0].id}`)}>View Role</Button>
                              <Button size="sm" variant="outline" onClick={() => navigate('/applications')}>Track</Button>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div variants={fadeUp} className="digest-intel-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>Opportunity Radar</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                              Connectors are monitoring live opportunity sources.
                            </div>
                            <Button size="sm" variant="outline" onClick={() => navigate('/opportunities')}>Browse Radar</Button>
                          </motion.div>
                        )}

                        {/* Digest Item 2: Skill Gap Alert */}
                        {skillsToImprove.length > 0 ? (
                          <motion.div variants={fadeUp} className="digest-intel-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--warning-dark)', letterSpacing: '0.05em' }}>High-Impact Gap</span>
                              <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--warning-subtle)', color: 'var(--warning-dark)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>Priority</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--warning-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning-dark)' }}>
                                <Target size={16} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{skillsToImprove[0].name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Priority: {skillsToImprove[0].priority}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                              Identified for target role ({targetRoleTitle}). Close this gap to raise ATS ranking.
                            </div>
                            <div style={{ marginTop: '0.75rem' }}>
                              <Button size="sm" variant="outline" onClick={() => navigate('/skill-gap')} iconRight={<ArrowRight size={13} />}>Open Roadmap</Button>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div variants={fadeUp} className="digest-intel-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--success)', letterSpacing: '0.05em' }}>Skill Readiness</span>
                              <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--success-subtle)', color: 'var(--success)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>Ready</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                              All primary skills for {targetRoleTitle} are in progress or mastered.
                            </div>
                            <Button size="sm" variant="outline" onClick={() => navigate('/skill-gap')}>View Roadmap</Button>
                          </motion.div>
                        )}

                        {/* Digest Item 3: Career Telemetry Tip */}
                        <motion.div variants={fadeUp} className="digest-intel-card">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--success)', letterSpacing: '0.05em' }}>ATS Telemetry Tip</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Daily Insight</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--success-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                              <Zap size={16} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Action Verbs & Impact</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Metric Quantification</div>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            Students using STAR bullet points with quantifiable metrics achieve 2.4x higher resume screening passes.
                          </div>
                          <div style={{ marginTop: '0.75rem' }}>
                            <Button size="sm" variant="outline" onClick={() => navigate('/profile?tab=resume')} iconRight={<ArrowRight size={13} />}>Analyze Resume</Button>
                          </div>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>

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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                              <ProgressRing score={opp.matchScore || 88} size={42} strokeWidth={3.5} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                                  {opp.company}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>
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
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                        <SkillRadar size={220} />
                      </div>
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

                {/* Opportunity Ingestion Feeds Telemetry */}
                <DigestSection title="Opportunity Ingestion Feeds">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>5 Active Data Connectors</span>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={handleSyncAll}
                        disabled={syncingSources}
                        iconLeft={<RefreshCw size={12} className={syncingSources ? 'animate-spin' : ''} />}
                      >
                        {syncingSources ? 'Syncing...' : 'Sync Now'}
                      </Button>
                    </div>

                    {syncFeedback && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.4rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: syncFeedback.type === 'success' ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                          color: syncFeedback.type === 'success' ? 'var(--success)' : 'var(--danger)',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {syncFeedback.message}
                      </div>
                    )}

                    {(sourcesData.length > 0 ? sourcesData : [
                      { source_name: 'remotive_api', display_name: 'Remotive Remote Jobs', schedule: '4h', items_accepted: 20, status: 'ready' },
                      { source_name: 'arbeitnow_api', display_name: 'Arbeitnow Tech Board', schedule: '4h', items_accepted: 20, status: 'ready' },
                      { source_name: 'codeforces_api', display_name: 'Codeforces Contests', schedule: '1h', items_accepted: 20, status: 'ready' },
                      { source_name: 'devfolio_api', display_name: 'Devfolio Hackathons', schedule: '6h', items_accepted: 10, status: 'ready' },
                      { source_name: 'opportunitydesk_rss', display_name: 'OpportunityDesk RSS', schedule: '12h', items_accepted: 10, status: 'ready' },
                    ]).map((source) => {
                      const isOk = source.status === 'ready' || source.status === 'completed' || source.status === 'active';
                      return (
                        <div
                          key={source.source_name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.6rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                            <div
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: isOk ? 'var(--success)' : 'var(--warning)',
                                boxShadow: isOk ? '0 0 6px var(--success)' : 'none',
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {source.display_name?.replace(' API', '')?.replace(' Feed', '') || source.source_name}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {source.schedule || 'Live'}
                            </span>
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.4rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'var(--primary-subtle)',
                                color: 'var(--primary)',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {source.items_accepted ?? 0} ingested
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </DigestSection>

                {/* Quick Career Actions */}
                <DigestSection title="Quick Career Actions">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <Link to="/profile?tab=resume" style={{ textDecoration: 'none' }}>
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
        .digest-intel-card {
          padding: 1rem 1.15rem;
          border-radius: var(--radius-md);
          background: var(--surface);
          border: 1px solid var(--border);
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .digest-intel-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-sm);
          transform: translateY(-2px);
        }
      `}</style>
    </PageContainer>
  );
}

function StatTile({ label, value, icon, subtext }) {
  const isPercentage = typeof value === 'string' && value.endsWith('%');
  const numericVal = typeof value === 'number' ? value : isPercentage ? parseFloat(value) : null;

  return (
    <Card variant="raised" style={{ border: '1px solid var(--border)' }}>
      <Card.Content style={{ padding: '1.1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            {numericVal !== null && !isNaN(numericVal) ? (
              <CountUp end={numericVal} suffix={isPercentage ? '%' : ''} />
            ) : (
              value
            )}
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
