import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  DollarSign
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SearchInput from '../components/ui/SearchInput';
import Badge, { StatusBadge, OpportunityTypeBadge } from '../components/ui/Badge';
import Drawer from '../components/ui/Drawer';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonOpportunity } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import opportunityService from '../services/opportunityService';

export default function OpportunitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  const [activeType, setActiveType] = useState('All');
  const [activeMode, setActiveMode] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const handleApply = (opp) => {
    const url = opp.applicationUrl || opp.application_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success(`Opening verified application page for ${opp.company}`);
    } else {
      toast.info(`Application link not provided. View opportunity details for submission instructions.`);
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

        {/* View Toggle (Grid / List) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--surface)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
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
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid-3">
          {opportunities.map((opp) => {
            const isSaved = savedOppIds.has(opp.id);
            const sourceName = opp.source?.name || 'Verified Feed';

            return (
              <Card
                key={opp.id}
                variant="raised"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all var(--transition-fast)',
                }}
                className="hover-lift"
              >
                <Card.Content style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
                  {/* Top Bar: Company + Type + Save Button */}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                          <OpportunityTypeBadge type={opp.type} size="sm" />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {opp.workMode}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSave(opp)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isSaved ? 'var(--primary)' : 'var(--text-muted)',
                        padding: '4px',
                      }}
                      title={isSaved ? 'Remove from saved' : 'Save opportunity'}
                      aria-label="Save opportunity"
                    >
                      <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Role Title */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {opp.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      <MapPin size={13} />
                      <span>{opp.locationString || (typeof opp.location === 'string' ? opp.location : 'Remote')}</span>
                    </div>
                  </div>

                  {/* Metadata & Source transparency */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                    <Badge variant="neutral" size="sm">
                      Source: {sourceName}
                    </Badge>
                    {opp.deadline && (
                      <span style={{ color: 'var(--warning-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', marginLeft: 'auto' }}>
                        <Clock size={12} />
                        {new Date(opp.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Required Technical Skills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    {(opp.skills || []).slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: '0.71875rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                    {(opp.skills || []).length > 4 && (
                      <span style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                        +{opp.skills.length - 4} more
                      </span>
                    )}
                  </div>
                </Card.Content>

                {/* Card Footer CTAs */}
                <Card.Footer style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedOpp(opp);
                      loadOpportunityDetail(opp.id);
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApply(opp)}
                    iconRight={<ExternalLink size={13} />}
                  >
                    Apply Now
                  </Button>
                </Card.Footer>
              </Card>
            );
          })}
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

      {/* 4. Load More / Pagination */}
      {!loading && pagination.page < pagination.pages && (
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <Button
            variant="secondary"
            size="md"
            onClick={handleLoadMore}
            style={{ minWidth: '220px' }}
          >
            Load More Opportunities ({pagination.total - opportunities.length} remaining)
          </Button>
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
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                About the Opportunity
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {selectedOpp.description || 'No detailed description provided by the source.'}
              </p>
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

              <Button
                variant="primary"
                size="md"
                onClick={() => handleApply(selectedOpp)}
                iconRight={<ExternalLink size={16} />}
              >
                Apply on Official Site
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
