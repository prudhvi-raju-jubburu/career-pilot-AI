import React, { useState, useEffect, useMemo } from 'react';
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
  TrendingUp
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SearchInput from '../components/ui/SearchInput';
import Badge, { StatusBadge, MatchBadge, EligibilityBadge, OpportunityTypeBadge } from '../components/ui/Badge';
import Drawer from '../components/ui/Drawer';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonOpportunity } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import { mockOpportunities } from '../services/mockData';

export default function OpportunitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [activeType, setActiveType] = useState('All');
  const [activeMode, setActiveMode] = useState('All');
  const [minMatchScore, setMinMatchScore] = useState(0);
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [savedOppIds, setSavedOppIds] = useState(new Set(['opp-stripe-sde']));

  const opportunityTypes = [
    'All',
    'Internship',
    'Full-Time',
    'Hackathons',
    'Coding Contests',
    'Scholarships',
    'Conferences',
  ];

  // Initial loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      const selectedId = searchParams.get('selected');
      if (selectedId) {
        const found = mockOpportunities.find((o) => o.id === selectedId);
        if (found) setSelectedOpp(found);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchParams]);

  const toggleSave = (opp) => {
    setSavedOppIds((prev) => {
      const next = new Set(prev);
      if (next.has(opp.id)) {
        next.delete(opp.id);
        toast.info(`Removed ${opp.company} from saved opportunities`);
      } else {
        next.add(opp.id);
        toast.success(`Saved ${opp.company} (${opp.title}) to your tracker!`);
      }
      return next;
    });
  };

  const handleApply = (opp) => {
    toast.success(`Opening verified application portal for ${opp.company}`);
    // Auto-save to applied tracker if desired
    navigate('/applications');
  };

  const filteredOpportunities = useMemo(() => {
    return mockOpportunities.filter((opp) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          opp.title.toLowerCase().includes(q) ||
          opp.company.toLowerCase().includes(q) ||
          opp.skills.some((s) => s.toLowerCase().includes(q)) ||
          opp.location.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Type filter
      if (activeType !== 'All' && opp.type !== activeType) {
        return false;
      }

      // Mode filter
      if (activeMode !== 'All' && opp.workMode !== activeMode) {
        return false;
      }

      // Match score filter
      if (minMatchScore > 0 && opp.matchScore < minMatchScore) {
        return false;
      }

      // Eligible filter
      if (eligibleOnly && !opp.eligibility.isEligible) {
        return false;
      }

      return true;
    });
  }, [searchQuery, activeType, activeMode, minMatchScore, eligibleOnly]);

  const relatedOpportunities = useMemo(() => {
    if (!selectedOpp) return [];
    return mockOpportunities
      .filter((o) => o.id !== selectedOpp.id && (o.type === selectedOpp.type || o.company === selectedOpp.company))
      .slice(0, 2);
  }, [selectedOpp]);

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
              {mockOpportunities.length} Verified
            </Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Curated student internships, graduate full-time roles, hackathons, and scholarships with deterministic eligibility.
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

      {/* 2. Search & Primary Category Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, company name, skill (e.g. Python, React), or location..."
            />
          </div>
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.35rem',
          }}
          className="no-scrollbar"
        >
          {opportunityTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: activeType === type ? 'var(--primary)' : 'var(--surface)',
                color: activeType === type ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${activeType === type ? 'var(--primary)' : 'var(--border)'}`,
                boxShadow: activeType === type ? 'var(--shadow-btn-primary)' : 'var(--shadow-sm)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Secondary Filter Chips: Mode & Match score */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Filters:
            </span>

            {/* Work Mode Toggle */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {['All', 'Remote', 'Hybrid', 'Onsite'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setActiveMode(mode)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: activeMode === mode ? 'var(--primary-subtle)' : 'transparent',
                    color: activeMode === mode ? 'var(--primary)' : 'var(--text-secondary)',
                    border: `1px solid ${activeMode === mode ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Match Score Threshold */}
            <button
              type="button"
              onClick={() => setMinMatchScore((prev) => (prev === 85 ? 0 : 85))}
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: minMatchScore === 85 ? 'var(--success-bg)' : 'transparent',
                color: minMatchScore === 85 ? 'var(--success)' : 'var(--text-secondary)',
                border: `1px solid ${minMatchScore === 85 ? 'var(--success)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
              }}
            >
              85%+ Match Only
            </button>

            {/* Eligible only filter */}
            <button
              type="button"
              onClick={() => setEligibleOnly((prev) => !prev)}
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: eligibleOnly ? 'var(--primary-subtle)' : 'transparent',
                color: eligibleOnly ? 'var(--primary)' : 'var(--text-secondary)',
                border: `1px solid ${eligibleOnly ? 'var(--primary)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
              }}
            >
              Eligible Only
            </button>
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredOpportunities.length}</strong> matching roles
          </div>
        </div>
      </div>

      {/* 3. Opportunities Display (Loading / Empty / Cards) */}
      {loading ? (
        <div className="grid-3">
          <SkeletonOpportunity />
          <SkeletonOpportunity />
          <SkeletonOpportunity />
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <EmptyState
          icon={<Search size={28} />}
          title="No opportunities found"
          description="Try adjusting your search query, clearing filters, or switching categories."
          actionLabel="Reset All Filters"
          onAction={() => {
            setSearchQuery('');
            setActiveType('All');
            setActiveMode('All');
            setMinMatchScore(0);
            setEligibleOnly(false);
          }}
        />
      ) : viewMode === 'grid' ? (
        /* Grid View (Desktop 3-col, Tablet 2-col, Mobile 1-col) */
        <div className="grid-3">
          {filteredOpportunities.map((opp) => {
            const isSaved = savedOppIds.has(opp.id);

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
                <Card.Content style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
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
                        {opp.company.charAt(0)}
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
                      <span>{opp.location}</span>
                    </div>
                  </div>

                  {/* Badges: Match Score + Eligibility */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <MatchBadge score={opp.matchScore} size="sm" />
                    <EligibilityBadge eligible={opp.eligibility.isEligible} size="sm" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', marginLeft: 'auto' }}>
                      <Clock size={12} />
                      {opp.daysLeft}d left
                    </span>
                  </div>

                  {/* Skills Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 'auto' }}>
                    {opp.skills.slice(0, 3).map((skill) => (
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
                    {opp.skills.length > 3 && (
                      <span style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                        +{opp.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </Card.Content>

                {/* Card Footer CTAs */}
                <Card.Footer style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOpp(opp)}
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
          {filteredOpportunities.map((opp) => {
            const isSaved = savedOppIds.has(opp.id);

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
                      {opp.company.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {opp.company}
                        </span>
                        <OpportunityTypeBadge type={opp.type} size="sm" />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {opp.location}</span>
                      </div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {opp.title}
                      </h3>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <MatchBadge score={opp.matchScore} size="sm" />
                    <EligibilityBadge eligible={opp.eligibility.isEligible} size="sm" />
                    <span style={{ fontSize: '0.78125rem', color: 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      {opp.daysLeft}d left
                    </span>
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
                    <Button variant="secondary" size="sm" onClick={() => setSelectedOpp(opp)}>
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

      {/* 4. Premium Opportunity Details Sliding Drawer */}
      {selectedOpp && (
        <Drawer
          isOpen={Boolean(selectedOpp)}
          onClose={() => setSelectedOpp(null)}
          title={selectedOpp.title}
          subtitle={`${selectedOpp.company} • ${selectedOpp.location}`}
          width="580px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '0.75rem' }}>
              <Button
                variant="secondary"
                onClick={() => toggleSave(selectedOpp)}
                icon={<Bookmark size={16} fill={savedOppIds.has(selectedOpp.id) ? 'currentColor' : 'none'} />}
              >
                {savedOppIds.has(selectedOpp.id) ? 'Saved' : 'Save Opportunity'}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleApply(selectedOpp)}
                iconRight={<ExternalLink size={15} />}
              >
                Apply Directly
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Top Quick Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <OpportunityTypeBadge type={selectedOpp.type} size="md" />
              <Badge variant="neutral" size="md">{selectedOpp.workMode}</Badge>
              <Badge variant="accent" size="md">{selectedOpp.stipend}</Badge>
              <span style={{ fontSize: '0.8125rem', color: 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                <Clock size={14} />
                Closes {selectedOpp.deadline} ({selectedOpp.daysLeft} days left)
              </span>
            </div>

            {/* Why This Matches You AI Insight */}
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--primary-subtle)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <Sparkles size={17} className="text-primary" />
                <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  Why This Matches You ({selectedOpp.matchScore}% Match Score)
                </span>
              </div>
              <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selectedOpp.whyMatches}
              </p>

              {/* Matching vs Missing Skills */}
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Acquired Matching Skills:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {selectedOpp.matchingSkills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--success-bg)',
                          color: 'var(--success)',
                          border: '1px solid var(--success-border)',
                        }}
                      >
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedOpp.missingSkills.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Skill Gap Recommended to Bridge:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {selectedOpp.missingSkills.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--warning-bg)',
                            color: 'var(--warning)',
                            border: '1px solid var(--warning-border)',
                          }}
                        >
                          + {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Deterministic Eligibility Check */}
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Deterministic Eligibility Evaluation
                </span>
                <EligibilityBadge eligible={selectedOpp.eligibility.isEligible} size="sm" />
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selectedOpp.eligibility.reason}
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Cutoff: <strong>{selectedOpp.eligibility.cgpaCutoff} CGPA</strong></span>
                <span>Your CGPA: <strong>{selectedOpp.eligibility.studentCgpa}</strong></span>
                <span>Batches: <strong>{selectedOpp.eligibility.graduationYears.join(', ')}</strong></span>
              </div>
            </div>

            {/* Role Overview & Description */}
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                About the Role
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {selectedOpp.description}
              </p>
            </div>

            {/* Key Responsibilities */}
            {selectedOpp.responsibilities && (
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  What you will work on
                </h4>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {selectedOpp.responsibilities.map((r, i) => (
                    <li key={i} style={{ marginBottom: '0.35rem' }}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {selectedOpp.requirements && (
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Candidate Requirements
                </h4>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {selectedOpp.requirements.map((req, i) => (
                    <li key={i} style={{ marginBottom: '0.35rem' }}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Opportunities */}
            {relatedOpportunities.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  Similar Opportunities You Might Like
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {relatedOpportunities.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => setSelectedOpp(rel)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                      className="hover-lift"
                    >
                      <div>
                        <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {rel.company} — {rel.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {rel.location} • {rel.type}
                        </div>
                      </div>
                      <ChevronRight size={16} color="var(--text-muted)" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}
    </PageContainer>
  );
}
