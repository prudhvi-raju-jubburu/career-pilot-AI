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
  AlertCircle,
  Send,
  Award,
  Activity
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useOpportunities } from '../hooks/useOpportunities';
import { useApplications } from '../hooks/useApplications';
import { useSkillGap } from '../hooks/useSkillGap';
import { useLiveFeed } from '../hooks/useLiveFeed';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge, { MatchBadge, PriorityBadge, OpportunityTypeBadge } from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { ProgressRing, CountUp, MatchRing, DeadlineCountdown, SkillRadar } from '../components/ui';
import { fadeUp, staggerContainer } from '../utils/motion';
import { formatOpportunityLocation, getSafeFieldValue } from '../utils';
import { getDashboardStats, getSourcesStatus, triggerSourcesSync } from '../services/api';
import AbekusHeroDeck from '../components/dashboard/AbekusHeroDeck';
import AbekusNumbersGrid from '../components/dashboard/AbekusNumbersGrid';

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

function formatSourceName(source) {
  if (!source) return null;
  const name = typeof source === 'string' ? source : (source.name || source.display_name || '');
  return name ? String(name).replace(/(_api|_rss)$/i, '').toUpperCase() : null;
}

export default function DashboardPlaceholder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, completion, loading: profileLoading } = useProfile();
  const { data: opportunities, pagination, loading: oppsLoading, error: oppsError, refetch: refetchOpps } = useOpportunities();
  const { applications, loading: appsLoading, error: appsError, refetch: refetchApps } = useApplications();
  const userTargetRole =
    getSafeFieldValue(profile?.target_role) ||
    getSafeFieldValue(profile?.preferences?.target_roles?.[0]) ||
    getSafeFieldValue(profile?.preferences?.targetRoles?.[0]) ||
    'Software Engineer';
  const { data: skillGap, loading: skillsLoading, error: skillsError, refetch: refetchSkills } = useSkillGap(
    userTargetRole
  );
  const { hasNewAlert, newCount, ingestNewItems, isConnected } = useLiveFeed();

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

  // Live auto-updating telemetry relative timer
  const [lastUpdatedTime, setLastUpdatedTime] = useState(() => new Date());
  const [relativeTimeStr, setRelativeTimeStr] = useState('just now');

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await getDashboardStats();
      if (res?.data?.success && res?.data?.data) {
        setStatsData(res.data.data);
        setLastUpdatedTime(new Date());
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
        setLastUpdatedTime(new Date());
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

  // Periodic background telemetry refresh every 30 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboardStats();
        fetchSources();
      }
    }, 30000);
    return () => clearInterval(pollInterval);
  }, [fetchDashboardStats, fetchSources]);

  // Relative time updater every 5 seconds
  useEffect(() => {
    const updateRelative = () => {
      const diffSec = Math.floor((Date.now() - lastUpdatedTime.getTime()) / 1000);
      if (diffSec < 15) setRelativeTimeStr('just now');
      else if (diffSec < 60) setRelativeTimeStr(`${diffSec}s ago`);
      else {
        const mins = Math.floor(diffSec / 60);
        setRelativeTimeStr(`${mins}m ago`);
      }
    };
    const timer = setInterval(updateRelative, 5000);
    updateRelative();
    return () => clearInterval(timer);
  }, [lastUpdatedTime]);

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
      setLastUpdatedTime(new Date());
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

  const firstName =
    getSafeFieldValue(user?.name)?.split(' ')[0] ||
    getSafeFieldValue(profile?.personal?.full_name)?.split(' ')[0] ||
    getSafeFieldValue(profile?.personal?.fullName)?.split(' ')[0] ||
    'there';
  const loading = oppsLoading || appsLoading || skillsLoading || profileLoading;

  const totalOppsCount = statsData?.total_opportunities ?? (pagination?.total ?? opportunities?.length ?? 0);
  const scannedToday = statsData?.scanned_today ?? 0;
  const sparklineData = statsData?.sparkline_data && statsData.sparkline_data.length > 0
    ? statsData.sparkline_data
    : [totalOppsCount, totalOppsCount, totalOppsCount];

  const appliedCount = statsData?.active_applications ?? (applications || []).filter((app) => isSubmittedStatus(app.status)).length;

  const completionPercentage = statsData?.profile_completion ?? (completion?.percentage ?? profile?.profileCompletion ?? 0);
  const missingItem =
    getSafeFieldValue(statsData?.missing_items?.[0]) ||
    getSafeFieldValue(completion?.missing_items?.[0]) ||
    'Complete your student profile to maximize opportunity discovery.';

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

  const verifiedSkillsCount = useMemo(() => {
    if (!profile?.skills) return 0;
    if (Array.isArray(profile.skills)) return profile.skills.length;
    let count = 0;
    Object.values(profile.skills).forEach((cat) => {
      const items = Array.isArray(cat) ? cat : Array.isArray(cat?.value) ? cat.value : [];
      count += items.length;
    });
    return count;
  }, [profile]);

  const targetRoleTitle = getSafeFieldValue(skillGap?.targetRole) || userTargetRole;
  const readinessScore = skillGap?.readinessScore ?? null;
  const pipelineTotal = (pipeline.saved + pipeline.applied + pipeline.interview + pipeline.offer) || 1;

  const marqueeItems = useMemo(() => {
    if (opportunities && opportunities.length > 0) {
      return opportunities.slice(0, 10).map((opp) => ({
        id: opp.id,
        company: opp.company || opp.organization?.name || 'Tech Role',
        title: opp.title,
        location: formatOpportunityLocation(opp),
        stipend: opp.compensationString || (opp.compensation?.min_amount ? `₹${Number(opp.compensation.min_amount).toLocaleString('en-IN')}/mo` : null),
        type: opp.type,
        source: formatSourceName(opp.source)
      }));
    }
    return [];
  }, [opportunities]);

  return (
    <PageContainer>
      <motion.div
        variants={staggerContainer(0.06, 0.04)}
        initial="hidden"
        animate="visible"
        className="dashboard-container"
      >
        {/* Top Header with Live Radar Stream Beacon */}
        <motion.div variants={fadeUp} className="dashboard-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <h1 className="font-h1" style={{ color: 'var(--text-primary)' }}>
                {getGreeting()}, {firstName} 👋
              </h1>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '999px',
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span style={{ position: 'relative', display: 'flex', height: '9px', width: '9px' }}>
                  <span
                    className="animate-ping"
                    style={{
                      position: 'absolute',
                      display: 'inline-flex',
                      height: '100%',
                      width: '100%',
                      borderRadius: '50%',
                      backgroundColor: isConnected ? '#10b981' : '#00f2fe',
                      opacity: 0.75,
                    }}
                  />
                  <span
                    style={{
                      position: 'relative',
                      display: 'inline-flex',
                      borderRadius: '50%',
                      height: '9px',
                      width: '9px',
                      backgroundColor: isConnected ? '#10b981' : '#00f2fe',
                      boxShadow: isConnected ? '0 0 8px #10b981' : '0 0 8px #00f2fe',
                    }}
                  />
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: isConnected ? '#10b981' : 'var(--accent-cyan)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {isConnected ? 'LIVE RADAR STREAM ACTIVE' : 'RADAR SYNC ACTIVE'}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>•</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Synced {relativeTimeStr}
                </span>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Real-time Indian tech career progression, developer fresher roles, internships, and live pipeline radar.
            </p>
          </div>

          <div className="dashboard-header-action" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={handleSyncAll}
              disabled={syncingSources}
              iconLeft={<RefreshCw size={14} className={syncingSources ? 'animate-spin' : ''} />}
            >
              {syncingSources ? 'Syncing Feeds...' : 'Sync Radar'}
            </Button>
            <Link to="/opportunities" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="md" iconRight={<ArrowRight size={15} />}>
                Explore Radar ({totalOppsCount})
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Abekus Signature Hero Deck Template with Real Data */}
        <motion.div variants={fadeUp}>
          <AbekusHeroDeck
            totalOpps={totalOppsCount}
            userName={firstName}
            user={user}
            profile={profile}
            opportunities={opportunities}
            targetRoleTitle={targetRoleTitle}
            readinessScore={readinessScore}
            pipeline={pipeline}
            skillGap={skillGap}
          />
        </motion.div>

        {/* Animated Live Opportunity Radar Marquee Ticker */}
        <motion.div variants={fadeUp} className="radar-ticker-container">
          <div className="radar-ticker-badge">
            <Radio size={13} className="animate-pulse" />
            <span>LIVE RADAR:</span>
          </div>
          <div className="radar-ticker-track">
            {marqueeItems.length > 0 ? (
              <div className="radar-ticker-motion">
                {marqueeItems.concat(marqueeItems).map((item, idx) => (
                  <span
                    key={idx}
                    className="radar-ticker-item"
                    onClick={() => {
                      if (item.id) navigate(`/opportunities?selected=${item.id}`);
                      else navigate('/opportunities');
                    }}
                    title="Click to inspect role on Opportunity Radar"
                  >
                    <span className="radar-ticker-dot" />
                    <strong style={{ color: 'var(--text-primary)' }}>{item.company}</strong>
                    <span>{item.title}</span>
                    <span style={{ color: 'var(--text-muted)' }}>• {item.location}</span>
                    {item.stipend && <span style={{ color: '#10b981', fontWeight: 700 }}>({item.stipend})</span>}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0 1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00f2fe' }} />
                <span>Synchronizing live Indian tech developer openings across connected job feeds...</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Live Radar Feed Ingestion Alert Pill */}
        <AnimatePresence>
          {hasNewAlert && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  const added = ingestNewItems();
                  fetchDashboardStats();
                  refetchOpps();
                }}
                className="radar-ingest-pill"
              >
                <span className="radar-ingest-pip animate-pulse" />
                <span>✦ {newCount} new Indian tech roles detected on live radar. Tap to ingest now</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div style={{ display: 'grid', gap: '0.85rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
              <SkeletonCard height="138px" />
              <SkeletonCard height="138px" />
              <SkeletonCard height="138px" />
              <SkeletonCard height="138px" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
              <SkeletonCard height="75px" />
              <SkeletonCard height="75px" />
              <SkeletonCard height="75px" />
              <SkeletonCard height="75px" />
            </div>
            <div className="dashboard-grid" style={{ marginTop: '0.5rem' }}>
              <SkeletonCard height="320px" />
              <SkeletonCard height="320px" />
            </div>
          </div>
        ) : (
          <>
            {/* Real Telemetry Numbers Bento Grid (Matching Image 2) */}
            <motion.div variants={fadeUp}>
              <AbekusNumbersGrid
                totalOpps={totalOppsCount}
                verifiedSkillsCount={verifiedSkillsCount}
                trackedApplicationsCount={applications?.length || 0}
                interviewsScheduled={pipeline.interview || 0}
                offersCount={pipeline.offer || 0}
                readinessScore={readinessScore}
                sourcesCount={sourcesData?.length || 6}
              />
            </motion.div>

            {/* Today's AI Digest Card with Staggered Reveal */}
            <motion.div
              variants={fadeUp}
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
                        variants={staggerContainer(0.08, 0.04)}
                        initial="hidden"
                        animate="visible"
                        style={{
                          padding: '1.25rem 1.4rem',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: '1rem'
                        }}
                      >
                        {/* Digest Item 1: Top Matched Role */}
                        {recentOpportunities.length > 0 ? (
                          <motion.div variants={fadeUp} whileHover={{ y: -3 }} className="digest-intel-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>Top Discovered Role</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{recentOpportunities[0].company}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              <MatchRing score={recentOpportunities[0].matchScore || 85} size={46} strokeWidth={4} showLabel={false} />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{recentOpportunities[0].title}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{recentOpportunities[0].type} • {formatOpportunityLocation(recentOpportunities[0])}</div>
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
                          <motion.div variants={fadeUp} whileHover={{ y: -3 }} className="digest-intel-card">
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
                          <motion.div variants={fadeUp} whileHover={{ y: -3 }} className="digest-intel-card">
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
                          <motion.div variants={fadeUp} whileHover={{ y: -3 }} className="digest-intel-card">
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
                        <motion.div variants={fadeUp} whileHover={{ y: -3 }} className="digest-intel-card">
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
                <motion.div variants={fadeUp}>
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
                </motion.div>

                {/* Latest Opportunities */}
                <motion.div variants={fadeUp}>
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
                            <motion.div
                              key={opp.id}
                              variants={fadeUp}
                              whileHover={{ y: -3, borderColor: 'var(--primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
                              className="digest-opp-card"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                                <MatchRing score={opp.matchScore || 88} size={44} strokeWidth={3.5} showLabel={false} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.15rem' }}>
                                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                      {opp.company}
                                    </span>
                                    {formatSourceName(opp.source) && (
                                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                                        {formatSourceName(opp.source)}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>
                                    {opp.title}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                    <OpportunityTypeBadge type={opp.type} size="sm" />
                                    <span>•</span>
                                    <span>{formatOpportunityLocation(opp)}</span>
                                    {(opp.compensationString || opp.compensation?.min_amount) && (
                                      <>
                                        <span>•</span>
                                        <span style={{ color: '#10b981', fontWeight: 700 }}>
                                          {opp.compensationString || `₹${Number(opp.compensation.min_amount).toLocaleString('en-IN')}/mo`}
                                        </span>
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
                                <motion.button
                                  type="button"
                                  whileTap={{ scale: 0.85 }}
                                  onClick={(e) => toggleSaveOpp(opp.id, e)}
                                  className="save-btn"
                                  title={isSaved ? 'Saved to bookmarks' : 'Save opportunity'}
                                  aria-label="Save opportunity"
                                >
                                  {isSaved ? <BookmarkCheck size={18} color="var(--primary)" /> : <Bookmark size={18} />}
                                </motion.button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => navigate(`/opportunities?selected=${opp.id}`)}
                                >
                                  View
                                </Button>
                              </div>
                            </motion.div>
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
                </motion.div>

                {/* Applications Pipeline with Interactive Stage Cards & Visual Funnel */}
                <motion.div variants={fadeUp}>
                  <DigestSection title="My Applications Tracker">
                    {appsError ? (
                      <RetryNote message="Could not load applications." onRetry={refetchApps} />
                    ) : (
                      <>
                        <div className="digest-pipeline">
                          <PipelineStageCard
                            label="Saved"
                            value={pipeline.saved}
                            total={pipelineTotal}
                            color="#00f2fe"
                            icon={<Bookmark size={15} />}
                            statusQuery="Saved"
                          />
                          <PipelineStageCard
                            label="Applied"
                            value={pipeline.applied}
                            total={pipelineTotal}
                            color="#6366f1"
                            icon={<Send size={15} />}
                            statusQuery="Applied"
                          />
                          <PipelineStageCard
                            label="Interview"
                            value={pipeline.interview}
                            total={pipelineTotal}
                            color="#f59e0b"
                            icon={<Calendar size={15} />}
                            statusQuery="Interviewing"
                          />
                          <PipelineStageCard
                            label="Offer"
                            value={pipeline.offer}
                            total={pipelineTotal}
                            color="#10b981"
                            icon={<Sparkles size={15} />}
                            statusQuery="Offered"
                          />
                        </div>

                        {/* Pipeline Conversion Flow Funnel Track */}
                        <div style={{ marginTop: '1.15rem', padding: '0.9rem 1.1rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.78rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Pipeline Conversion Flow</span>
                            <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                              {pipeline.applied > 0 ? `${Math.round((pipeline.interview / Math.max(pipeline.applied, 1)) * 100)}% applied → interview conversion` : 'Active pipeline'}
                            </span>
                          </div>
                          <div className="pipeline-funnel-bar">
                            <div
                              className="pipeline-funnel-segment"
                              style={{
                                width: `${pipelineTotal > 0 ? Math.max((pipeline.saved / pipelineTotal) * 100, 4) : 25}%`,
                                backgroundColor: '#00f2fe',
                              }}
                              title={`Saved: ${pipeline.saved}`}
                            />
                            <div
                              className="pipeline-funnel-segment"
                              style={{
                                width: `${pipelineTotal > 0 ? Math.max((pipeline.applied / pipelineTotal) * 100, 4) : 25}%`,
                                backgroundColor: '#6366f1',
                              }}
                              title={`Applied: ${pipeline.applied}`}
                            />
                            <div
                              className="pipeline-funnel-segment"
                              style={{
                                width: `${pipelineTotal > 0 ? Math.max((pipeline.interview / pipelineTotal) * 100, 4) : 25}%`,
                                backgroundColor: '#f59e0b',
                              }}
                              title={`Interview: ${pipeline.interview}`}
                            />
                            <div
                              className="pipeline-funnel-segment"
                              style={{
                                width: `${pipelineTotal > 0 ? Math.max((pipeline.offer / pipelineTotal) * 100, 4) : 25}%`,
                                backgroundColor: '#10b981',
                              }}
                              title={`Offer: ${pipeline.offer}`}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', fontSize: '0.72rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00f2fe' }} /> Saved ({pipeline.saved})</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1' }} /> Applied ({pipeline.applied})</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b' }} /> Interview ({pipeline.interview})</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} /> Offer ({pipeline.offer})</span>
                          </div>
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
                </motion.div>
              </div>

              {/* Right Column (Sidebar Widgets) */}
              <div className="dashboard-sidebar-col">
                {/* Upcoming Deadlines */}
                {upcomingDeadlines.length > 0 && (
                  <motion.div variants={fadeUp}>
                    <DigestSection title="Upcoming Deadlines">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {upcomingDeadlines.map((item) => (
                          <motion.div
                            key={item.id}
                            whileHover={{ x: 4 }}
                            className="digest-deadline-row"
                          >
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
                          </motion.div>
                        ))}
                      </div>
                    </DigestSection>
                  </motion.div>
                )}

                {/* Skills to Improve */}
                <motion.div variants={fadeUp}>
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
                          <motion.div key={skill.name} whileHover={{ x: 3 }} className="digest-skill-row">
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{skill.name}</span>
                            <PriorityBadge priority={skill.priority} size="sm" />
                          </motion.div>
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
                </motion.div>

                {/* Opportunity Ingestion Feeds Telemetry */}
                <motion.div variants={fadeUp}>
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
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
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
                        </motion.div>
                      )}

                      {(sourcesData.length > 0 ? sourcesData : [
                        { source_name: 'unstop_api', display_name: 'Unstop India Tech Opportunities', schedule: 'Every 3 hours', items_accepted: 28, status: 'ready' },
                        { source_name: 'devfolio_api', display_name: 'Devfolio India University Hackathons', schedule: 'Every 6 hours', items_accepted: 14, status: 'ready' },
                        { source_name: 'remotive_api', display_name: 'Remotive India & APAC Remote Tech', schedule: 'Every 4 hours', items_accepted: 20, status: 'ready' },
                        { source_name: 'codeforces_api', display_name: 'Codeforces Contests API', schedule: 'Every 1 hour', items_accepted: 15, status: 'ready' },
                        { source_name: 'opportunitydesk_rss', display_name: 'India & Global Fellowships Feed', schedule: 'Every 12 hours', items_accepted: 8, status: 'ready' },
                      ]).map((source) => {
                        const isOk = source.status === 'ready' || source.status === 'completed' || source.status === 'active';
                        return (
                          <motion.div
                            key={source.source_name}
                            whileHover={{ x: 3 }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.6rem 0.75rem',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--bg-secondary)',
                              border: '1px solid var(--border)',
                              fontSize: '0.8rem',
                              transition: 'all var(--transition-fast)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                              <span className={`radar-feed-dot ${isOk ? 'active' : ''}`} />
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
                          </motion.div>
                        );
                      })}
                    </div>
                  </DigestSection>
                </motion.div>

                {/* Quick Career Actions */}
                <motion.div variants={fadeUp}>
                  <DigestSection title="Quick Career Actions">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <Link to="/profile?tab=resume" style={{ textDecoration: 'none' }}>
                        <motion.div whileHover={{ x: 4 }} className="quick-action-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="quick-action-icon"><Sparkles size={16} /></div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Analyze Resume</div>
                              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Scan and extract ATS skills</div>
                            </div>
                          </div>
                          <ArrowRight size={14} color="var(--primary)" />
                        </motion.div>
                      </Link>
                      <Link to="/ai-advisor" style={{ textDecoration: 'none' }}>
                        <motion.div whileHover={{ x: 4 }} className="quick-action-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="quick-action-icon"><Briefcase size={16} /></div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>AI Career Advisor</div>
                              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Interview prep & mentorship</div>
                            </div>
                          </div>
                          <ArrowRight size={14} color="var(--primary)" />
                        </motion.div>
                      </Link>
                    </div>
                  </DigestSection>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </motion.div>

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
          margin-bottom: 1.5rem;
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
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
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
          transition: all var(--transition-fast);
        }
        .digest-deadline-row:hover {
          border-color: var(--border-control);
          background: var(--surface);
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
          transition: all var(--transition-fast);
        }
        .digest-skill-row:hover {
          border-color: var(--border-control);
          background: var(--surface);
        }
        .digest-pipeline {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }
        @media (max-width: 540px) {
          .digest-pipeline {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .pipeline-stage-card {
          padding: 0.85rem 0.95rem;
          border-radius: var(--radius-md);
          background: var(--surface);
          border: 1px solid var(--border);
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
        }
        .pipeline-stage-card:hover {
          border-color: var(--primary);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        }
        .pipeline-funnel-bar {
          display: flex;
          height: 8px;
          border-radius: 999px;
          overflow: hidden;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          gap: 2px;
        }
        .pipeline-funnel-segment {
          height: 100%;
          border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .radar-ticker-container {
          display: flex;
          align-items: center;
          background: var(--surface-raised);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 0.5rem 0.85rem;
          margin-bottom: 1.5rem;
          overflow: hidden;
          position: relative;
          box-shadow: var(--shadow-sm);
        }
        .radar-ticker-badge {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.25rem 0.65rem;
          background: rgba(0, 242, 254, 0.1);
          border: 1px solid rgba(0, 242, 254, 0.3);
          border-radius: var(--radius-full);
          color: var(--accent-cyan, #00f2fe);
          font-size: 0.72rem;
          font-weight: 800;
          font-family: var(--font-mono);
          white-space: nowrap;
          flex-shrink: 0;
          z-index: 2;
          margin-right: 0.85rem;
        }
        .radar-ticker-track {
          display: flex;
          overflow: hidden;
          white-space: nowrap;
          flex: 1;
          mask-image: linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%);
        }
        .radar-ticker-motion {
          display: flex;
          align-items: center;
          gap: 2.5rem;
          animation: radarTicker 120s linear infinite;
        }
        .radar-ticker-track:hover .radar-ticker-motion {
          animation-play-state: paused;
        }
        @keyframes radarTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .radar-ticker-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .radar-ticker-item:hover {
          color: var(--accent-cyan, #00f2fe);
          transform: translateY(-1px);
        }
        .radar-ticker-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-cyan, #00f2fe);
          box-shadow: 0 0 6px rgba(0, 242, 254, 0.75);
          display: inline-block;
        }
        .radar-ingest-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.55rem 1.35rem;
          background: linear-gradient(135deg, rgba(0, 242, 254, 0.15), rgba(99, 102, 241, 0.15));
          border: 1px solid rgba(0, 242, 254, 0.4);
          border-radius: var(--radius-full);
          color: #00f2fe;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 0 16px rgba(0, 242, 254, 0.25);
          transition: all var(--transition-fast);
        }
        .radar-ingest-pill:hover {
          background: linear-gradient(135deg, rgba(0, 242, 254, 0.25), rgba(99, 102, 241, 0.25));
          border-color: #00f2fe;
          box-shadow: 0 0 24px rgba(0, 242, 254, 0.4);
          transform: translateY(-2px);
        }
        .radar-ingest-pip {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00f2fe;
          box-shadow: 0 0 8px #00f2fe;
        }
        .radar-feed-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--warning, #f59e0b);
          display: inline-block;
          flex-shrink: 0;
        }
        .radar-feed-dot.active {
          background: var(--success, #10b981);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.7);
          animation: feedPulse 2.5s infinite ease-in-out;
        }
        @keyframes feedPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.8; }
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

function PipelineStageCard({ label, value, total, color, icon, statusQuery }) {
  const navigate = useNavigate();
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/applications?status=${statusQuery || label}`)}
      className="pipeline-stage-card"
      style={{
        borderTop: `3px solid ${color}`,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color }}>
          {label}
        </span>
        <span style={{ color, opacity: 0.9 }}>{icon}</span>
      </div>
      <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
        <CountUp end={value} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.45rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span>{pct}% of pipeline</span>
        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Filter &rarr;</span>
      </div>
    </motion.div>
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
