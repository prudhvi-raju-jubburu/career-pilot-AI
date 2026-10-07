import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Bookmark,
  Building,
  GraduationCap,
  Sparkles,
  Award,
  Layers,
  LayoutGrid,
  List,
  AlertCircle,
  X,
  Share2,
  ChevronRight,
  TrendingUp,
  Globe,
  DollarSign,
  Send,
  ArrowRight
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SearchInput from '../components/ui/SearchInput';
import Badge, { StatusBadge, OpportunityTypeBadge } from '../components/ui/Badge';
import Drawer from '../components/ui/Drawer';
import BottomSheet from '../components/ui/BottomSheet';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonOpportunity } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import opportunityService from '../services/opportunityService';
import OpportunityCard from '../components/opportunities/OpportunityCard';
import OpportunitySwipeDeck from '../components/opportunities/OpportunitySwipeDeck';
import RichJobDescription from '../components/opportunities/RichJobDescription';
import { useLiveFeed } from '../hooks/useLiveFeed';
import { useApplications } from '../hooks/useApplications';
import { motion, AnimatePresence } from 'framer-motion';

export default function OpportunitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasNewAlert, newCount, ingestNewItems } = useLiveFeed();
  const {
    applications,
    addApplication: trackApplication,
    updateStage: updateAppStage
  } = useApplications();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  const [activeType, setActiveType] = useState(() => searchParams.get('type') || 'All');
  const [activeMode, setActiveMode] = useState(() => searchParams.get('workMode') || 'All');
  const [viewMode, setViewMode] = useState(() => searchParams.get('view') || 'grid'); // 'grid' | 'list' | 'deck'
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const observerTarget = useRef(null);

  const [savedOppIds, setSavedOppIds] = useState(() => {
    try {
      const saved = localStorage.getItem('careerpilot_bookmarked_opps');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const opportunityTypes = [
    { label: 'All', value: 'All' },
    { label: 'Internships', value: 'internship' },
    { label: 'Full-Time Jobs', value: 'job' },
    { label: 'Hackathons', value: 'hackathon' },
    { label: 'Coding Contests', value: 'coding_contest' },
    { label: 'Fellowships', value: 'fellowship' },
    { label: 'Scholarships', value: 'scholarship' }
  ];

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch opportunities from real backend
  const fetchOpportunities = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true);
    }
    setError(null);

    try {
      const pageToFetch = isLoadMore ? pagination.page + 1 : 1;
      const filters = {
        page: pageToFetch,
        limit: 20,
        search: debouncedSearch.trim() || undefined,
        type: activeType !== 'All' ? activeType : undefined,
        workMode: activeMode !== 'All' ? activeMode : undefined,
      };

      const res = await opportunityService.getOpportunities(filters);
      const items = res?.items || (Array.isArray(res) ? res : []);
      const pag = res?.pagination || { page: pageToFetch, limit: 20, total: items.length, pages: 1 };

      if (isLoadMore) {
        setOpportunities((prev) => [...prev, ...items]);
      } else {
        setOpportunities(items);
      }
      setPagination(pag);

      // Handle deep-linked selected opportunity
      const selectedId = searchParams.get('selected');
      if (selectedId && !selectedOpp) {
        const found = items.find((o) => o.id === selectedId);
        if (found) {
          setSelectedOpp(found);
        } else {
          loadOpportunityDetail(selectedId);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load opportunities from server.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeType, activeMode, pagination.page, searchParams]);

  useEffect(() => {
    fetchOpportunities(false);
  }, [debouncedSearch, activeType, activeMode]);

  // Sync filters and search to URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (activeType !== 'All') params.set('type', activeType);
    if (activeMode !== 'All') params.set('workMode', activeMode);
    if (viewMode !== 'grid') params.set('view', viewMode);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, activeType, activeMode, viewMode, setSearchParams]);

  // Infinite scroll observer
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && pagination.page < pagination.pages) {
          fetchOpportunities(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, pagination.page, pagination.pages, fetchOpportunities]);

  const loadOpportunityDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const detail = await opportunityService.getOpportunityById(id);
      setSelectedOpp(detail);
    } catch (err) {
      toast.error('Could not load opportunity details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleSave = (opp) => {
    setSavedOppIds((prev) => {
      const next = new Set(prev);
      if (next.has(opp.id)) {
        next.delete(opp.id);
        toast.info(`Removed ${opp.company} from saved opportunities`);
      } else {
        next.add(opp.id);
        toast.success(`Saved ${opp.company} (${opp.title}) to your bookmarks!`);
      }
      try {
        localStorage.setItem('careerpilot_bookmarked_opps', JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  // Map applications by opportunity ID or normalized company-role
  const applicationsByOppId = useMemo(() => {
    const map = new Map();
    (applications || []).forEach((app) => {
      if (app.opportunityId) {
        map.set(app.opportunityId, app);
      }
      const key = `${(app.company || '').toLowerCase().trim()}::${(app.role || app.title || '').toLowerCase().trim()}`;
      if (!map.has(key)) {
        map.set(key, app);
      }
    });
    return map;
  }, [applications]);

  const getOppApplication = useCallback(
    (opp) => {
      if (!opp) return null;
      if (applicationsByOppId.has(opp.id)) return applicationsByOppId.get(opp.id);
      const key = `${(opp.company || '').toLowerCase().trim()}::${(opp.title || '').toLowerCase().trim()}`;
      return applicationsByOppId.get(key) || null;
    },
    [applicationsByOppId]
  );

  const handleTrackOpportunity = async (opp, status = 'Saved') => {
    try {
      const existing = getOppApplication(opp);
      if (existing) {
        await updateAppStage(existing.id, status);
        toast.success(`Updated ${opp.company} stage in Applications to "${status}"!`);
        return;
      }

      await trackApplication({
        opportunityId: opp.id,
        company: opp.company,
        role: opp.title,
        type: opp.type === 'internship' ? 'Internship' : 'Full-Time',
        status,
        appliedDate: status === 'Applied' ? new Date().toISOString().split('T')[0] : null,
        matchScore: opp.matchScore || 88,
        nextAction: status === 'Applied' ? 'Awaiting recruiter screening' : 'Review requirements & prepare resume',
        nextActionDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        notes: `Tracked from CareerPilot Opportunity Radar. Source: ${opp.source?.name || 'Verified Feed'}.`,
      });

      toast.success(
        status === 'Applied'
          ? `Tracked application to ${opp.company} as "Applied"!`
          : `Saved ${opp.company} to your Application Pipeline!`
      );
    } catch (err) {
      toast.error('Could not track application: ' + err.message);
    }
  };

  const handleApply = async (opp) => {
    const url = opp.applicationUrl || opp.application_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast.info(`Application link not provided. View opportunity details for submission instructions.`);
      return;
    }

    // Auto-record or advance application status in pipeline
    const existing = getOppApplication(opp);
    if (!existing) {
      try {
        await trackApplication({
          opportunityId: opp.id,
          company: opp.company,
          role: opp.title,
          type: opp.type === 'internship' ? 'Internship' : 'Full-Time',
          status: 'Applied',
          appliedDate: new Date().toISOString().split('T')[0],
          matchScore: opp.matchScore || 88,
          nextAction: 'Submitted application — awaiting recruiter screening',
          nextActionDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          notes: `Applied via official listing link on ${new Date().toLocaleDateString()}. Tracked automatically.`,
        });
        toast.success(`Application site opened & tracked as "Applied" in your Pipeline!`);
      } catch (err) {
        console.warn('Auto-track failed:', err);
      }
    } else if (existing.status === 'Saved') {
      try {
        await updateAppStage(existing.id, 'Applied');
        toast.success(`Moved ${opp.company} in Applications Pipeline to "Applied"!`);
      } catch (err) {}
    } else {
      toast.success(`Opening verified application page for ${opp.company}`);
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeType !== 'All') count++;
    if (activeMode !== 'All') count++;
    return count;
  }, [activeType, activeMode]);

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages) {
      fetchOpportunities(true);
    }
  };

  return (
    <PageContainer>
      {/* 1. Header & Quick Metrics */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <h1 className="font-h1" style={{ color: 'var(--text-primary)' }}>
              Discover Opportunities
            </h1>
            <Badge variant="primary" size="md">
              {pagination.total > 0 ? `${pagination.total} Live` : 'Verified Feed'}
            </Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Curated student internships, graduate full-time roles, hackathons, and scholarships with canonical requirements.
          </p>
        </div>

        {/* View Toggle & Applications Pipeline Quick Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/applications" style={{ textDecoration: 'none' }}>
            <Button
              variant="secondary"
              size="md"
              icon={<Layers size={16} />}
              style={{ whiteSpace: 'nowrap' }}
            >
              Applications Pipeline ({applications.length})
            </Button>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--surface)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            style={{
              padding: '0.4rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: viewMode === 'grid' ? 'var(--primary-subtle)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
            title="Grid View"
          >
            <LayoutGrid size={15} />
            <span className="desktop-only-text">Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{
              padding: '0.4rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: viewMode === 'list' ? 'var(--primary-subtle)' : 'transparent',
              color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
            title="List View"
          >
            <List size={15} />
            <span className="desktop-only-text">List</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('deck')}
            style={{
              padding: '0.4rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: viewMode === 'deck' ? 'var(--primary-subtle)' : 'transparent',
              color: viewMode === 'deck' ? 'var(--primary)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
            title="Swipe Deck Mode"
          >
            <Layers size={15} />
            <span className="desktop-only-text">Swipe Deck</span>
          </button>
        </div>
      </div>
    </div>

      {/* 2. Search & Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '0' }}>
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles, companies, or skills (e.g. Python, Google, Bengaluru)..."
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsMobileFilterOpen(true)}
            icon={<Filter size={15} />}
            className="mobile-only touch-target"
            style={{ flexShrink: 0, padding: '0.5rem 0.85rem' }}
          >
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        </div>

        {/* Category & Type Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.35rem',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {opportunityTypes.map((typeObj) => {
            const isSelected = activeType === typeObj.value;
            return (
              <button
                key={typeObj.value}
                type="button"
                onClick={() => setActiveType(typeObj.value)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                  color: isSelected ? 'white' : 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {typeObj.label}
              </button>
            );
          })}

          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border)', margin: '0 0.25rem', flexShrink: 0 }} />

          {/* Work Mode Filters */}
          {['All', 'Remote', 'Hybrid', 'Onsite'].map((mode) => {
            const isSelected = activeMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setActiveMode(mode)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: isSelected ? '1px solid var(--color-primary-600)' : '1px solid var(--border)',
                  backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--surface)',
                  color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {mode === 'All' ? 'All Modes' : mode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Radar Feed Alert Pill */}
      <AnimatePresence>
        {hasNewAlert && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
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
                setOpportunities((prev) => [...added, ...prev]);
                toast.success(`Ingested ${added.length} new opportunities onto your radar!`);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.55rem 1.35rem',
                background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.22), rgba(99, 102, 241, 0.22))',
                border: '1px solid var(--accent-cyan)',
                borderRadius: '999px',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                boxShadow: '0 0 18px var(--cyan-glow)',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--accent-cyan)',
                  boxShadow: '0 0 8px var(--cyan-glow)',
                }}
                className="animate-pulse"
              />
              <span>✦ {newCount} new opportunities detected on radar. Tap to ingest</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Opportunities Display (Loading / Error / Empty / Cards) */}
      {loading ? (
        <div className="grid-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonOpportunity key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<AlertCircle size={32} color="var(--danger)" />}
          title="Could not load opportunities"
          description={error}
          actionLabel="Try Again"
          onAction={() => fetchOpportunities(false)}
        />
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={36} color="var(--primary)" />}
          title="No matching opportunities found"
          description="Try broadening your search keywords or adjusting your type and work mode filters."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setActiveType('All');
            setActiveMode('All');
          }}
        />
      ) : viewMode === 'deck' ? (
        /* Swipe-Deck Mode */
        <OpportunitySwipeDeck
          opportunities={opportunities}
          onSave={(opp) => {
            toggleSave(opp);
            handleTrackOpportunity(opp, 'Saved');
          }}
          onSkip={(opp) => toast.info(`Skipped ${opp.company}`)}
          onSelectDetail={(opp) => {
            setSelectedOpp(opp);
            loadOpportunityDetail(opp.id);
          }}
        />
      ) : viewMode === 'grid' ? (
        /* Grid View with Rich OpportunityCard */
        <div className="grid-3">
          {opportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opp={opp}
              isSaved={savedOppIds.has(opp.id)}
              onToggleSave={toggleSave}
              onSelectDetail={(item) => {
                setSelectedOpp(item);
                loadOpportunityDetail(item.id);
              }}
              onApply={handleApply}
              application={getOppApplication(opp)}
              onTrack={handleTrackOpportunity}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {opportunities.map((opp) => {
            const isSaved = savedOppIds.has(opp.id);
            const sourceName = opp.source?.name || 'Verified Feed';

            return (
              <Card key={opp.id} variant="raised" className="hover-lift">
                <Card.Content style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', minWidth: '280px', flex: 1 }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: 'var(--primary)',
                        fontSize: '1.1rem',
                        flexShrink: 0,
                      }}
                    >
                      {opp.company ? opp.company.charAt(0) : 'O'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {opp.company}
                        </span>
                        <OpportunityTypeBadge type={opp.type} size="sm" />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {opp.locationString || opp.location}</span>
                      </div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {opp.title}
                      </h3>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Badge variant="neutral" size="sm">
                      {sourceName}
                    </Badge>
                    {opp.deadline && (
                      <span style={{ fontSize: '0.78125rem', color: 'var(--warning-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} />
                        {new Date(opp.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {getOppApplication(opp) ? (
                      <span
                        onClick={() => navigate(`/applications?appId=${getOppApplication(opp).id}`)}
                        style={{ cursor: 'pointer' }}
                        title="Click to view in Applications tracker"
                      >
                        <Badge
                          variant={
                            getOppApplication(opp).status === 'Offered'
                              ? 'success'
                              : getOppApplication(opp).status === 'Interviewing'
                              ? 'purple'
                              : getOppApplication(opp).status === 'Applied'
                              ? 'primary'
                              : 'neutral'
                          }
                          size="sm"
                          dot
                        >
                          {getOppApplication(opp).status}
                        </Badge>
                      </span>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => toggleSave(opp)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isSaved ? 'var(--primary)' : 'var(--text-muted)',
                        padding: '6px',
                      }}
                      title={isSaved ? 'Remove from saved' : 'Save opportunity'}
                    >
                      <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedOpp(opp);
                        loadOpportunityDetail(opp.id);
                      }}
                    >
                      View Details
                    </Button>

                    {getOppApplication(opp) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/applications?appId=${getOppApplication(opp).id}`)}
                        iconRight={<ArrowRight size={13} />}
                      >
                        Tracker
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleTrackOpportunity(opp, 'Saved')}
                        icon={<Bookmark size={13} />}
                      >
                        Track
                      </Button>
                    )}

                    <Button variant="primary" size="sm" onClick={() => handleApply(opp)} iconRight={<ExternalLink size={13} />}>
                      Apply Now
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}

      {/* 4. Load More / Infinite Scroll Target */}
      {pagination.page < pagination.pages && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Button
            variant="secondary"
            size="md"
            onClick={handleLoadMore}
            style={{ minWidth: '220px' }}
          >
            {loading ? 'Loading More...' : `Load More Opportunities (${pagination.total - opportunities.length} remaining)`}
          </Button>
          <div ref={observerTarget} style={{ height: '20px', marginTop: '1rem' }} />
        </div>
      )}

      {/* 5. Opportunity Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedOpp)}
        onClose={() => setSelectedOpp(null)}
        title={selectedOpp ? selectedOpp.title : 'Opportunity Details'}
        size="lg"
      >
        {selectedOpp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0' }}>
            {/* Header info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedOpp.company || selectedOpp.organization?.name}
                </span>
                <OpportunityTypeBadge type={selectedOpp.type} size="sm" />
                <Badge variant="neutral" size="sm">
                  {selectedOpp.workMode || selectedOpp.work_mode}
                </Badge>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <MapPin size={14} />
                <span>{selectedOpp.locationString || (typeof selectedOpp.location === 'string' ? selectedOpp.location : 'Remote')}</span>
              </div>
            </div>

            {/* Application Pipeline Sync Panel */}
            {(() => {
              const currentApp = selectedOpp ? getOppApplication(selectedOpp) : null;
              if (currentApp) {
                return (
                  <div
                    style={{
                      padding: '0.9rem 1.15rem',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                          flexShrink: 0,
                        }}
                      >
                        <Layers size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Tracked in Application Pipeline
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                          <StatusBadge status={currentApp.status} size="sm" />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {currentApp.appliedDate ? `Applied ${currentApp.appliedDate}` : 'In Pipeline'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select
                        value={currentApp.status}
                        onChange={(e) => updateAppStage(currentApp.id, e.target.value)}
                        aria-label="Change pipeline stage"
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-control)',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="Saved">Saved</option>
                        <option value="Applied">Applied</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Offered">Offered</option>
                        <option value="Rejected">Rejected</option>
                      </select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOpp(null);
                          navigate(`/applications?appId=${currentApp.id}`);
                        }}
                        iconRight={<ArrowRight size={13} />}
                      >
                        Open Tracker
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  style={{
                    padding: '0.85rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px dashed var(--border-control)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Layers size={16} color="var(--primary)" />
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      Not yet in your Application Pipeline.
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTrackOpportunity(selectedOpp, 'Saved')}
                      icon={<Bookmark size={13} />}
                    >
                      Save to Pipeline
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleTrackOpportunity(selectedOpp, 'Applied')}
                      icon={<Send size={13} />}
                    >
                      Mark as Applied
                    </Button>
                  </div>
                </div>
              );
            })()}

            {/* Source Transparency & Original Listing Link */}
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                fontSize: '0.84rem'
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Discovered from: </span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {selectedOpp.source?.name || 'Verified CareerPilot Feed'}
                </strong>
              </div>
              {(selectedOpp.source?.url || selectedOpp.applicationUrl) && (
                <a
                  href={selectedOpp.source?.url || selectedOpp.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Globe size={13} />
                  <span>View Original Listing</span>
                </a>
              )}
            </div>

            {/* Role Overview */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                About the Opportunity
              </h4>
              <RichJobDescription description={selectedOpp.description} />
            </div>

            {/* Required Technical Skills */}
            {(selectedOpp.skills || []).length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Technical Skills Required
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selectedOpp.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education & Eligibility Criteria */}
            {selectedOpp.education_requirements && (
              <div
                style={{
                  padding: '1.15rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <GraduationCap size={16} color="var(--primary)" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Education &amp; Eligibility Criteria
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {selectedOpp.education_requirements.cgpa_min && (
                    <div>
                      Minimum CGPA Cutoff: <strong style={{ color: 'var(--text-primary)' }}>{selectedOpp.education_requirements.cgpa_min}</strong>
                    </div>
                  )}
                  {(selectedOpp.education_requirements.branches || []).length > 0 && (
                    <div>
                      Eligible Branches: <strong style={{ color: 'var(--text-primary)' }}>{selectedOpp.education_requirements.branches.join(', ')}</strong>
                    </div>
                  )}
                  {(selectedOpp.education_requirements.graduation_years || []).length > 0 && (
                    <div>
                      Eligible Graduation Batches: <strong style={{ color: 'var(--text-primary)' }}>{selectedOpp.education_requirements.graduation_years.join(', ')}</strong>
                    </div>
                  )}
                  {selectedOpp.eligibility_text && (
                    <div style={{ marginTop: '0.25rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                      "{selectedOpp.eligibility_text}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Application & Deadline Box */}
            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Application Deadline
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedOpp.deadline ? 'var(--warning-dark)' : 'var(--text-primary)' }}>
                  {selectedOpp.deadline ? new Date(selectedOpp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Rolling / Open Until Filled'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {getOppApplication(selectedOpp) && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      const app = getOppApplication(selectedOpp);
                      setSelectedOpp(null);
                      navigate(`/applications?appId=${app.id}`);
                    }}
                    iconRight={<ArrowRight size={14} />}
                  >
                    View in Pipeline ({getOppApplication(selectedOpp).status})
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleApply(selectedOpp)}
                  iconRight={<ExternalLink size={16} />}
                >
                  {getOppApplication(selectedOpp) && getOppApplication(selectedOpp).status !== 'Saved'
                    ? 'Open Application Site'
                    : 'Apply on Official Site'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
