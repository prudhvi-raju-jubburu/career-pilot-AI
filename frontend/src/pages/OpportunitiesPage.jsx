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
  AlertCircle,
  HelpCircle,
  X,
  Share2,
  ChevronRight,
  TrendingUp,
  Globe,
  DollarSign,
  Send,
  ArrowRight,
  RotateCcw,
  Check
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SearchInput from '../components/ui/SearchInput';
import Badge, { StatusBadge, OpportunityTypeBadge } from '../components/ui/Badge';
import Drawer from '../components/ui/Drawer';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonOpportunity } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import opportunityService from '../services/opportunityService';
import OpportunityCard from '../components/opportunities/OpportunityCard';
import OpportunityFeedbackWidget from '../components/opportunities/OpportunityFeedbackWidget';
import RichJobDescription from '../components/opportunities/RichJobDescription';
import { useLiveFeed } from '../hooks/useLiveFeed';
import { useApplications } from '../hooks/useApplications';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { formatOpportunityLocation } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';

const CANONICAL_CATEGORIES = [
  { label: 'All Opportunities', value: 'All' },
  { label: 'Jobs', value: 'job' },
  { label: 'Internships', value: 'internship' },
  { label: 'Saved Bookmarks', value: 'saved' }
];

const WORK_MODES = ['All', 'Remote', 'Hybrid', 'Onsite'];

const INDIAN_LOCATIONS = [
  { label: 'All India', value: 'All' },
  { label: 'Bengaluru', value: 'Bengaluru' },
  { label: 'Hyderabad', value: 'Hyderabad' },
  { label: 'Pune', value: 'Pune' },
  { label: 'Delhi NCR', value: 'Delhi NCR' },
  { label: 'Mumbai', value: 'Mumbai' },
  { label: 'Chennai', value: 'Chennai' },
  { label: 'Remote (India)', value: 'Remote' }
];

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasNewAlert, newCount, ingestNewItems } = useLiveFeed();
  const {
    applications,
    addApplication: trackApplication,
    updateStage: updateAppStage
  } = useApplications();

  const getSafeString = (field, fallback = '') => {
    if (!field) return fallback;
    if (typeof field === 'string') return field;
    if (typeof field === 'number') return String(field);
    if (typeof field === 'object') {
      if (typeof field.value === 'string' && field.value.trim()) return field.value;
      if (typeof field.value === 'number') return String(field.value);
      if (typeof field.name === 'string' && field.name.trim()) return field.name;
      if (typeof field.skill === 'string' && field.skill.trim()) return field.skill;
    }
    return fallback;
  };

  const studentName = getSafeString(profile?.personal?.fullName) || getSafeString(profile?.name) || user?.name || 'Student';
  const degreeVal = getSafeString(profile?.education?.degree, 'B.Tech');
  const branchVal = getSafeString(profile?.education?.branch, 'Computer Science');
  const yearVal = getSafeString(profile?.education?.graduationYear) || getSafeString(profile?.education?.graduation_year, '2026');
  const cgpaVal = getSafeString(profile?.education?.cgpa);

  const displaySkills = useMemo(() => {
    const extractName = (item) => getSafeString(item, '');

    if (Array.isArray(profile?.skills) && profile.skills.length > 0) {
      const list = profile.skills.map(extractName).filter(Boolean);
      if (list.length > 0) return list;
    }
    if (profile?.skills && typeof profile.skills === 'object') {
      const flattened = [];
      Object.values(profile.skills).forEach((cat) => {
        if (Array.isArray(cat)) {
          cat.forEach((item) => {
            const name = extractName(item);
            if (name) flattened.push(name);
          });
        } else if (cat && typeof cat === 'object') {
          if (Array.isArray(cat.value)) {
            cat.value.forEach((item) => {
              const name = extractName(item);
              if (name) flattened.push(name);
            });
          } else if (typeof cat.value === 'string' && cat.value.trim()) {
            flattened.push(cat.value.trim());
          }
        }
      });
      if (flattened.length > 0) return flattened;
    }
    return ['React', 'Python', 'Node.js', 'Problem Solving', 'Data Structures', 'Web Development'];
  }, [profile]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  const [activeCategory, setActiveCategory] = useState(() => searchParams.get('type') || 'All');
  const [activeMode, setActiveMode] = useState(() => searchParams.get('workMode') || 'All');
  const [activeLocation, setActiveLocation] = useState(() => searchParams.get('location') || 'All');
  const [activeEligibilityFilter, setActiveEligibilityFilter] = useState('All'); // 'All' | 'eligible' | 'needs_review'
  const [sortBy, setSortBy] = useState('relevance');
  const [matchedOnly, setMatchedOnly] = useState(true);

  const [selectedOpp, setSelectedOpp] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const observerTarget = useRef(null);

  // Manual Application Confirmation Modal State
  const [confirmModalOpp, setConfirmModalOpp] = useState(null);
  const [isConfirmingTrack, setIsConfirmingTrack] = useState(false);

  // Saved Opportunities state
  const [savedOppIds, setSavedOppIds] = useState(() => {
    try {
      const saved = localStorage.getItem('careerpilot_bookmarked_opps');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    let active = true;
    const fetchSaved = async () => {
      try {
        const saved = await opportunityService.getSavedOpportunities();
        if (active && Array.isArray(saved) && saved.length > 0) {
          const ids = saved.map((s) => s.id || s._id).filter(Boolean);
          setSavedOppIds((prev) => new Set([...prev, ...ids]));
        }
      } catch (e) {}
    };
    fetchSaved();
    return () => { active = false; };
  }, []);

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
      if (activeCategory === 'saved') {
        const savedItems = await opportunityService.getSavedOpportunities();
        const list = Array.isArray(savedItems) ? savedItems : [];
        setOpportunities(list);
        setPagination({ page: 1, limit: 100, total: list.length, pages: 1 });
        setLoading(false);
        return;
      }

      const pageToFetch = isLoadMore ? pagination.page + 1 : 1;
      const filters = {
        page: pageToFetch,
        limit: 20,
        search: debouncedSearch.trim() || undefined,
        type: activeCategory !== 'All' ? activeCategory : undefined,
        workMode: activeMode !== 'All' ? activeMode : undefined,
        location: activeLocation !== 'All' ? activeLocation : undefined,
        sort: sortBy,
        matched: matchedOnly
      };

      const res = await opportunityService.getOpportunities(filters);
      let items = res?.items || (Array.isArray(res) ? res : []);
      const pag = res?.pagination || { page: pageToFetch, limit: 20, total: items.length, pages: 1 };

      if (activeEligibilityFilter !== 'All') {
        items = items.filter((item) => {
          const status = item.eligibility?.status || (item.eligibility?.is_eligible ? 'eligible' : 'not_eligible');
          return status === activeEligibilityFilter;
        });
      }

      if (isLoadMore) {
        setOpportunities((prev) => [...prev, ...items]);
      } else {
        setOpportunities(items);
      }
      setPagination(pag);

      // Deep-linked selected opportunity
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
  }, [debouncedSearch, activeCategory, activeMode, activeLocation, activeEligibilityFilter, sortBy, matchedOnly, pagination.page, searchParams]);

  useEffect(() => {
    fetchOpportunities(false);
  }, [debouncedSearch, activeCategory, activeMode, activeLocation, activeEligibilityFilter, sortBy, matchedOnly]);

  // Sync to URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (activeCategory !== 'All') params.set('type', activeCategory);
    if (activeMode !== 'All') params.set('workMode', activeMode);
    if (activeLocation !== 'All') params.set('location', activeLocation);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, activeCategory, activeMode, activeLocation, setSearchParams]);

  const loadOpportunityDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const detail = await opportunityService.getOpportunityById(id);
      setSelectedOpp(detail);
      opportunityService.recordView(id);
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
        toast.info(`Removed ${opp.company} from saved bookmarks`);
        opportunityService.unsaveOpportunity(opp.id);
      } else {
        next.add(opp.id);
        toast.success(`Saved ${opp.company} to your bookmarks!`);
        opportunityService.saveOpportunity(opp.id);
      }
      try {
        localStorage.setItem('careerpilot_bookmarked_opps', JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  // Map applications by opportunity ID
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

  /**
   * Safe External Application Flow:
   * 1. Safely opens external verified URL in a new tab.
   * 2. Shows student confirmation modal: "Did you submit your application?"
   * 3. Student manually confirms to record status in Tracker.
   * No automatic/presumed submission.
   */
  const handleApplyClick = (opp) => {
    const url = opp.applicationUrl || opp.application_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      setConfirmModalOpp(opp);
    } else {
      toast.info('Application link not provided. View opportunity details for submission instructions.');
    }
  };

  const handleConfirmApplicationSubmission = async (status = 'Applied') => {
    if (!confirmModalOpp) return;
    setIsConfirmingTrack(true);
    try {
      const opp = confirmModalOpp;
      await trackApplication({
        opportunityId: opp.id,
        company: opp.company || opp.organization?.name,
        role: opp.title,
        type: opp.type === 'internship' ? 'Internship' : 'Job',
        status: status,
        appliedDate: status === 'Applied' ? new Date().toISOString().split('T')[0] : null,
        location: opp.locationString || 'India',
        salary: opp.compensationString || 'Not specified',
        deadline: opp.deadline,
        applicationUrl: opp.applicationUrl || opp.application_url,
        notes: `Tracked via external application portal on ${new Date().toLocaleDateString()}.`,
      });

      toast.success(
        status === 'Applied'
          ? `Application to ${opp.company} recorded in My Applications tracker!`
          : `Saved ${opp.company} to your Application Pipeline!`
      );
      setConfirmModalOpp(null);
    } catch (err) {
      toast.error('Could not track application: ' + (err.message || 'Error'));
    } finally {
      setIsConfirmingTrack(false);
    }
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages) {
      fetchOpportunities(true);
    }
  };

  return (
    <PageContainer>
      {/* 1. Header & Overview */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
            <span className="lx-pill lx-pill-blue">
              <Sparkles size={13} />
              <span>🇮🇳 INDIA TECH OPPORTUNITIES ONLY</span>
            </span>
            <span className="lx-pill lx-pill-green">
              <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>{pagination.total > 0 ? `${pagination.total} Verified Jobs & Internships` : 'Live Career Feeds'}</span>
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                color: '#1d4ed8',
                borderRadius: '9999px',
                padding: '0.2rem 0.65rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                border: '1px solid rgba(147, 197, 253, 0.5)'
              }}
            >
              <span>📄 Resume-Matched</span>
            </span>
          </div>
          <h1 className="font-h1" style={{ color: 'var(--lx-ink)', fontSize: '2.15rem', fontWeight: 800, letterSpacing: '-0.035em' }}>
            Personalized Jobs & Internships in India
          </h1>
          <p style={{ color: 'var(--lx-txt-2)', fontSize: '0.95rem', margin: '0.35rem 0 0 0' }}>
            Discover tech jobs and internships across Indian tech hubs deterministically matched to your student profile, academic batch, and resume skills.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/applications" style={{ textDecoration: 'none' }}>
            <Button
              variant="secondary"
              size="md"
              icon={<Layers size={16} />}
              style={{ whiteSpace: 'nowrap', borderRadius: '9999px' }}
            >
              Application Tracker ({applications.length})
            </Button>
          </Link>
          <Link to="/resume" style={{ textDecoration: 'none' }}>
            <Button
              variant="outline"
              size="md"
              icon={<GraduationCap size={16} />}
              style={{ whiteSpace: 'nowrap', borderRadius: '9999px' }}
            >
              View Resume AI
            </Button>
          </Link>
        </div>
      </div>

      {/* Student Profile & Resume Context Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.85rem 1.25rem',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
          border: '1px solid #bbf7d0',
          borderRadius: '16px',
          marginBottom: '1.75rem',
          boxShadow: '0 2px 10px rgba(16, 185, 129, 0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#ffffff',
              border: '1px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              flexShrink: 0
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
              Tailored for: <span style={{ color: '#047857' }}>{studentName}</span> ({degreeVal} {branchVal}, {yearVal}{cgpaVal ? ` · CGPA ${cgpaVal}` : ''})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Resume Skills:</span>
              {displaySkills.slice(0, 8).map((s) => (
                <span
                  key={s}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #bbf7d0',
                    color: '#065f46',
                    borderRadius: '6px',
                    padding: '0.12rem 0.45rem',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  ✓ {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Link
          to="/profile"
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#2563eb',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          <span>Edit Profile Skills</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* 2. Floating Search & Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <div className="mavens-job-search-card">
          <div className="mavens-search-input-wrap">
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              className="mavens-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, company name, skill, or Indian city..."
              aria-label="Search opportunities"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Clear search query"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="mavens-filter-select-wrap">
            <MapPin size={16} color="#94a3b8" />
            <select
              className="mavens-filter-select"
              value={activeLocation}
              onChange={(e) => setActiveLocation(e.target.value)}
            >
              {INDIAN_LOCATIONS.map((loc) => (
                <option key={loc.value} value={loc.value}>{loc.label}</option>
              ))}
            </select>
          </div>

          <div className="mavens-filter-select-wrap">
            <Briefcase size={16} color="#94a3b8" />
            <select
              className="mavens-filter-select"
              value={activeMode}
              onChange={(e) => setActiveMode(e.target.value)}
            >
              {WORK_MODES.map((mode) => (
                <option key={mode} value={mode}>{mode === 'All' ? 'All Work Modes' : mode}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="mavens-btn-find-jobs"
            onClick={() => fetchOpportunities(false)}
          >
            <Search size={16} />
            <span>Search</span>
          </button>
        </div>

        {/* Primary Canonical Categories (Jobs & Internships in India Only) */}
        <div
          className="tab-strip-scroll"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.35rem',
            WebkitOverflowScrolling: 'touch',
            maxWidth: '100%',
            width: '100%',
            minWidth: 0,
          }}
        >
          {CANONICAL_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setActiveCategory(cat.value)}
                style={{
                  padding: '0.5rem 1.1rem',
                  borderRadius: '9999px',
                  border: isSelected ? '1px solid var(--lx-blue)' : '1px solid var(--lx-line)',
                  backgroundColor: isSelected ? 'var(--lx-blue)' : '#ffffff',
                  color: isSelected ? '#ffffff' : 'var(--lx-txt-2)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease',
                  boxShadow: isSelected ? '0 4px 14px rgba(43, 87, 255, 0.28)' : 'none'
                }}
              >
                {cat.label} {cat.value === 'saved' ? `(${savedOppIds.size})` : ''}
              </button>
            );
          })}

          <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--lx-line)', margin: '0 0.35rem', flexShrink: 0 }} />

          {/* Interactive Resume Matched Toggle */}
          <button
            type="button"
            onClick={() => setMatchedOnly(!matchedOnly)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.95rem',
              borderRadius: '9999px',
              border: matchedOnly ? '1px solid #10b981' : '1px solid var(--lx-line)',
              backgroundColor: matchedOnly ? 'rgba(16, 185, 129, 0.12)' : '#ffffff',
              color: matchedOnly ? '#065f46' : 'var(--lx-txt-2)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.18s ease',
              flexShrink: 0
            }}
            title="Filter to opportunities matching your profile & resume skills"
          >
            <Sparkles size={13} color={matchedOnly ? '#059669' : '#64748b'} />
            <span>{matchedOnly ? '⚡ Resume Matched (Active)' : 'Resume Matched (All)'}</span>
          </button>

          <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--lx-line)', margin: '0 0.35rem', flexShrink: 0 }} />

          {/* Eligibility Filter: All | Eligible Only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--lx-txt-3)', fontWeight: 700, textTransform: 'uppercase' }}>
              Eligibility:
            </span>
            {[
              { label: 'All', value: 'All' },
              { label: 'Eligible Only', value: 'eligible' },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setActiveEligibilityFilter(f.value)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  border: activeEligibilityFilter === f.value ? '1px solid #10b981' : '1px solid var(--lx-line)',
                  backgroundColor: activeEligibilityFilter === f.value ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  color: activeEligibilityFilter === f.value ? '#065F46' : 'var(--lx-txt-2)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Live Feed Alerts */}
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
                toast.success(`Ingested ${added.length} verified listings onto your radar!`);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.55rem 1.35rem',
                background: 'rgba(43, 87, 255, 0.08)',
                border: '1px solid var(--lx-blue)',
                borderRadius: '999px',
                color: 'var(--lx-blue)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Sparkles size={14} />
              <span>{newCount} new verified opportunities available. Click to refresh</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Opportunity Cards Grid */}
      {loading ? (
        <div className="grid-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonOpportunity key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<AlertCircle size={32} color="#DC2626" />}
          title="Could not load opportunities"
          description={error}
          actionLabel="Try Again"
          onAction={() => fetchOpportunities(false)}
        />
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={36} color="var(--lx-blue)" />}
          title="No matching opportunities found"
          description={
            activeCategory === 'saved'
              ? 'You have not saved any opportunities yet. Browse listings and bookmark interesting roles.'
              : 'Try broadening your search keywords or switching to another category.'
          }
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setActiveCategory('All');
            setActiveMode('All');
            setActiveLocation('All');
            setActiveEligibilityFilter('All');
          }}
        />
      ) : (
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
              onApply={handleApplyClick}
              application={getOppApplication(opp)}
              onTrack={(item, status) => {
                setConfirmModalOpp(item);
              }}
            />
          ))}
        </div>
      )}

      {/* 5. Pagination */}
      {activeCategory !== 'saved' && pagination.page < pagination.pages && (
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <Button
            variant="secondary"
            size="md"
            onClick={handleLoadMore}
            style={{ minWidth: '240px', borderRadius: '9999px' }}
          >
            {loading ? 'Loading...' : `Load More (${pagination.total - opportunities.length} remaining)`}
          </Button>
        </div>
      )}

      {/* 6. External Application Confirmation Modal */}
      <Modal
        isOpen={Boolean(confirmModalOpp)}
        onClose={() => setConfirmModalOpp(null)}
        title="Confirm Application Submission"
        maxWidth="500px"
      >
        {confirmModalOpp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ fontSize: '0.92rem', color: 'var(--lx-txt-2)', lineHeight: 1.5, margin: 0 }}>
              The official portal for <strong>{confirmModalOpp.company || confirmModalOpp.organization?.name}</strong> was opened in a new tab.
              Have you submitted your application for <strong>{confirmModalOpp.title}</strong>?
            </p>

            <div style={{ padding: '0.85rem', backgroundColor: 'var(--lx-surface-2)', borderRadius: '12px', fontSize: '0.82rem', color: 'var(--lx-txt-2)' }}>
              <div><strong>Role:</strong> {confirmModalOpp.title}</div>
              <div><strong>Company:</strong> {confirmModalOpp.company}</div>
              <div><strong>Compensation:</strong> {confirmModalOpp.compensationString || 'Not specified'}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleConfirmApplicationSubmission('Applied')}
                disabled={isConfirmingTrack}
                icon={<Check size={16} />}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Yes, mark as "Applied" in Tracker
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => handleConfirmApplicationSubmission('Saved')}
                disabled={isConfirmingTrack}
                icon={<Bookmark size={15} />}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Not yet, save to tracker as "Saved"
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmModalOpp(null)}
                style={{ width: '100%', justifyContent: 'center', border: 'none', color: 'var(--lx-txt-3)' }}
              >
                Close without tracking
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 7. Opportunity Details Drawer with Transparent Eligibility Breakdown */}
      <Drawer
        isOpen={Boolean(selectedOpp)}
        onClose={() => setSelectedOpp(null)}
        title={selectedOpp ? selectedOpp.title : 'Opportunity Details'}
        size="lg"
      >
        {selectedOpp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', padding: '0.5rem 0' }}>
            {/* Header info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                  {selectedOpp.company || selectedOpp.organization?.name}
                </span>
                <OpportunityTypeBadge type={selectedOpp.type} size="sm" />
                <Badge variant="neutral" size="sm">
                  {selectedOpp.workMode || selectedOpp.work_mode}
                </Badge>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--lx-txt-2)' }}>
                <MapPin size={14} color="var(--lx-txt-3)" />
                <span>{selectedOpp.locationString || formatOpportunityLocation(selectedOpp)}</span>
              </div>
            </div>

            {/* Compensation & Deadline Banner */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                padding: '1rem',
                borderRadius: '16px',
                backgroundColor: 'var(--lx-surface-2)',
                border: '1px solid var(--lx-line)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--lx-txt-3)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Compensation
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: selectedOpp.compensationString === 'Not specified' ? 'var(--lx-txt-3)' : '#137a44', marginTop: '2px' }}>
                  {selectedOpp.compensationString || 'Not specified'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--lx-txt-3)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Application Deadline
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--lx-ink)', marginTop: '2px' }}>
                  {selectedOpp.deadlineString || 'Deadline not specified'}
                </div>
              </div>
            </div>

            {/* Deterministic Eligibility Evaluation Breakdown */}
            <div
              style={{
                padding: '1.15rem',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                border: '1.5px solid var(--lx-line)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GraduationCap size={18} color="var(--lx-blue)" />
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                    Deterministic Eligibility Evaluation
                  </span>
                </div>

                {/* Overall status pill */}
                {(() => {
                  const status = selectedOpp.eligibility?.status || (selectedOpp.eligibility?.is_eligible ? 'eligible' : 'not_eligible');
                  if (status === 'eligible') {
                    return (
                      <span style={{ backgroundColor: '#ECFDF5', color: '#065F46', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>
                        Eligible
                      </span>
                    );
                  }
                  if (status === 'needs_review') {
                    return (
                      <span style={{ backgroundColor: '#FFFBEB', color: '#92400E', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>
                        Needs Review
                      </span>
                    );
                  }
                  return (
                    <span style={{ backgroundColor: '#FEF2F2', color: '#991B1B', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>
                      Not Eligible
                    </span>
                  );
                })()}
              </div>

              {/* Itemized checks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {Array.isArray(selectedOpp.eligibility?.checks) && selectedOpp.eligibility.checks.length > 0 ? (
                  selectedOpp.eligibility.checks.map((chk, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        backgroundColor: 'var(--lx-surface-2)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {chk.status === 'passed' && <CheckCircle2 size={15} color="#059669" />}
                        {chk.status === 'failed' && <AlertCircle size={15} color="#DC2626" />}
                        {chk.status === 'unknown' && <HelpCircle size={15} color="#D97706" />}
                        <div>
                          <strong>{chk.requirement}</strong>
                          {chk.required !== undefined && chk.required !== null && (
                            <span style={{ color: 'var(--lx-txt-3)', marginLeft: '0.35rem' }}>
                              (Req: {Array.isArray(chk.required) ? chk.required.join(', ') : String(chk.required)})
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
                        {chk.status === 'passed' && <span style={{ color: '#059669' }}>Passed</span>}
                        {chk.status === 'failed' && <span style={{ color: '#DC2626' }}>Failed</span>}
                        {chk.status === 'unknown' && <span style={{ color: '#D97706' }}>Unverified</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--lx-txt-2)' }}>
                    Standard university eligibility criteria apply. Review details below.
                  </div>
                )}
              </div>

              {/* Rationale reasons */}
              {Array.isArray(selectedOpp.eligibility?.reasons) && selectedOpp.eligibility.reasons.length > 0 && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid var(--lx-line)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {selectedOpp.eligibility.reasons.map((r, i) => (
                    <div key={i} style={{ fontSize: '0.78rem', color: 'var(--lx-txt-2)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--lx-blue)' }} />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Application Tracker Status */}
            {(() => {
              const currentApp = selectedOpp ? getOppApplication(selectedOpp) : null;
              if (currentApp) {
                return (
                  <div
                    style={{
                      padding: '0.9rem 1.15rem',
                      borderRadius: '16px',
                      backgroundColor: 'var(--lx-surface-2)',
                      border: '1px solid var(--lx-line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--lx-txt-3)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Tracked in My Applications
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '3px' }}>
                        <StatusBadge status={currentApp.status} size="sm" />
                        <span style={{ fontSize: '0.82rem', color: 'var(--lx-txt-2)' }}>
                          Status: <strong>{currentApp.status}</strong>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select
                        value={currentApp.status}
                        onChange={(e) => updateAppStage(currentApp.id, e.target.value)}
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          padding: '0.35rem 0.65rem',
                          borderRadius: '8px',
                          border: '1px solid var(--lx-line)',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="Saved">Saved</option>
                        <option value="Applied">Applied</option>
                        <option value="Assessment">Assessment</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Withdrawn">Withdrawn</option>
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
              return null;
            })()}

            {/* Discovered Source */}
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                backgroundColor: 'var(--lx-surface-2)',
                border: '1px solid var(--lx-line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                fontSize: '0.84rem'
              }}
            >
              <div>
                <span style={{ color: 'var(--lx-txt-3)' }}>Source: </span>
                <strong style={{ color: 'var(--lx-ink)' }}>
                  {selectedOpp.source?.name ? selectedOpp.source.name.replace(/_/g, ' ').toUpperCase() : 'OFFICIAL COMPANY PORTAL'}
                </strong>
              </div>
              {(selectedOpp.source?.url || selectedOpp.applicationUrl) && (
                <a
                  href={selectedOpp.source?.url || selectedOpp.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--lx-blue)', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Globe size={13} />
                  <span>Official Listing</span>
                </a>
              )}
            </div>

            {/* Explicit Student Relevance Feedback Widget */}
            <OpportunityFeedbackWidget
              opportunityId={selectedOpp.id}
            />

            {/* Description */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.65rem' }}>
                About the Opportunity
              </h4>
              <RichJobDescription description={selectedOpp.description} />
            </div>

            {/* Required Skills */}
            {(selectedOpp.skills || []).length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.5rem' }}>
                  Required Skills
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selectedOpp.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        backgroundColor: 'var(--lx-surface-2)',
                        color: 'var(--lx-ink)',
                        border: '1px solid var(--lx-line)',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons in Drawer */}
            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--lx-line)',
              }}
            >
              <Button
                variant={savedOppIds.has(selectedOpp.id) ? 'secondary' : 'outline'}
                size="md"
                onClick={() => toggleSave(selectedOpp)}
                icon={<Bookmark size={15} fill={savedOppIds.has(selectedOpp.id) ? 'currentColor' : 'none'} />}
              >
                {savedOppIds.has(selectedOpp.id) ? 'Saved' : 'Save'}
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => handleApplyClick(selectedOpp)}
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
