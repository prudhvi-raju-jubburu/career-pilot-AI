import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Sparkles,
  Briefcase,
  GraduationCap,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  MapPin,
  Clock,
  ExternalLink,
  Target,
  FileText,
  MessageSquare,
  TrendingUp,
  Flame,
  Check,
  Shield,
  Lock,
  Cpu,
  BarChart3,
  Bot,
  Search,
  Code,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Activity,
  HeartHandshake,
  Globe2,
  Users
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardContent, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import CountUp from '../components/ui/CountUp';
import ProgressRing from '../components/ui/ProgressRing';
import AnimatedRoadmap from '../components/AnimatedRoadmap';
import CareerConstellationHero from '../components/CareerConstellationHero';
import CinematicEntranceReveal from '../components/entrance/CinematicEntranceReveal';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { getOpportunities } from '../services/api';

const TICKER_ITEMS = [
  { company: 'Google', title: 'Software Engineer Intern', type: 'Internship', deadline: '9 days left' },
  { company: 'Stripe', title: 'Core Platform Intern', type: 'Internship', deadline: '4 days left' },
  { company: 'Microsoft', title: 'Imagine Cup Global Hackathon', type: 'Hackathon', deadline: 'Prize: $100K' },
  { company: 'TCS Research', title: 'National STEM Scholarship', type: 'Scholarship', deadline: '₹2,00,000 Grant' },
  { company: 'Goldman Sachs', title: 'Engineering Campus Hiring', type: 'Full-Time', deadline: 'Closes next week' },
  { company: 'Adobe', title: 'Women in Technology Scholarship', type: 'Scholarship', deadline: '$10,000 Award' },
];



// Reference Website (Mavens-i Image 1): Benefits We Offer
const BENEFITS_LIST = [
  {
    title: 'Tier-1 Verified Roles',
    desc: 'Direct integration with top enterprise talent systems eliminating ghost listings and expired applications.',
    icon: <Briefcase size={22} />,
  },
  {
    title: 'AI Skill Gap Telemetry',
    desc: 'Automated breakdown of missing skills comparing your resume to actual job requirements with week-by-week roadmaps.',
    icon: <Target size={22} />,
  },
  {
    title: 'STAR-Format Resume Audit',
    desc: 'Continuous scoring and actionable bullet point suggestions tailored for enterprise ATS parsers.',
    icon: <FileText size={22} />,
  },
  {
    title: 'Live Pipeline Orchestration',
    desc: '5-stage sync with deadline countdown timers, real-time interview prep, and celebrate-on-offer confetti.',
    icon: <Zap size={22} />,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if intro animation should play on public entrance
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('intro') === 'true' || params.get('story') === 'true') {
        sessionStorage.removeItem('careerpilot_intro_played');
        return true;
      }
      const alreadyPlayed = sessionStorage.getItem('careerpilot_intro_played');
      return !alreadyPlayed;
    }
    return false;
  });

  // Search Bar Filter States (Image 2)
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedWorkType, setSelectedWorkType] = useState('All');

  useScrollReveal('.scroll-reveal');

  useEffect(() => {
    let mounted = true;
    const fetchLiveOpps = async () => {
      try {
        const res = await getOpportunities({ limit: 12 });
        const items = res?.data?.items || res?.items || (Array.isArray(res) ? res : []);
        if (mounted) {
          setOpportunities(items);
        }
      } catch (err) {
        if (mounted) {
          setOpportunities([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchLiveOpps();
    return () => { mounted = false; };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set('search', searchKeyword.trim());
    if (selectedDepartment !== 'All') params.set('department', selectedDepartment);
    if (selectedWorkType !== 'All') params.set('type', selectedWorkType.toLowerCase());
    navigate(`/opportunities?${params.toString()}`);
  };

  const filteredOpportunities = opportunities.filter((o) => {
    if (activeTab === 'all') return true;
    const typeStr = (o.type || '').toLowerCase().replace('-', '');
    const tabStr = activeTab.replace('-', '');
    return typeStr.includes(tabStr) || tabStr.includes(typeStr);
  });

  // Dynamic Real-Time Ticker Items derived from live MongoDB opportunities
  const liveTickerItems = (opportunities && opportunities.length > 0)
    ? opportunities.slice(0, 10).map((opp) => {
        const typeRaw = opp.type || 'Internship';
        const typeFormatted = typeRaw
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');

        let deadlineInfo = 'Verified Active';
        if (opp.deadlineString && opp.deadlineString !== 'Deadline not specified') {
          deadlineInfo = opp.deadlineString;
        } else if (opp.compensationString) {
          deadlineInfo = opp.compensationString;
        } else if (opp.locationString) {
          deadlineInfo = opp.locationString;
        }

        return {
          id: opp.id || opp._id,
          company: opp.company || opp.organization?.name || 'Verified Tech',
          title: opp.title,
          type: typeFormatted,
          deadline: deadlineInfo,
        };
      })
    : TICKER_ITEMS;

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#0f172a', minHeight: '100vh', overflowX: 'hidden' }}>
      {showIntro && (
        <CinematicEntranceReveal
          onComplete={() => {
            setShowIntro(false);
            try {
              sessionStorage.setItem('careerpilot_intro_played', 'true');
              const url = new URL(window.location.href);
              if (url.searchParams.has('intro') || url.searchParams.has('story')) {
                url.searchParams.delete('intro');
                url.searchParams.delete('story');
                window.history.replaceState({}, '', url.pathname + (url.search ? '?' + url.searchParams.toString() : ''));
              }
            } catch (e) {}
          }}
        />
      )}

      {/* =====================================================================
          1. MAVENS-I SIGNATURE ORBITAL HERO + TRUST LOGO MARQUEE (IMAGE 3)
          ===================================================================== */}
      <CareerConstellationHero onReplayIntro={() => setShowIntro(true)} />

      {/* Live Continuous Marquee Ticker (Real-Time Scraped Opportunities) */}
      <div className="ticker-wrap" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div className="ticker-content">
          {[...liveTickerItems, ...liveTickerItems].map((item, idx) => (
            <div key={idx} className="ticker-item" style={{ borderRight: '1px solid #e2e8f0' }}>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>{item.company}</span>
              <span style={{ color: '#94a3b8' }}>—</span>
              <span style={{ color: '#475569' }}>{item.title}</span>
              <Badge variant="primary" size="sm">
                {item.type}
              </Badge>
              <span style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 600 }}>
                ({item.deadline})
              </span>
            </div>
          ))}
        </div>
      </div>



      {/* =====================================================================
          4. BENEFITS WE OFFER SECTION (REFERENCE WEBSITE IMAGE 1)
          Pure White Background, Orange Eyebrow, Slate Heading, 4 Crisp Pearl Cards
          ===================================================================== */}
      <section style={{ padding: '6rem 1.5rem', backgroundColor: '#ffffff', position: 'relative' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'left', marginBottom: '3.5rem' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#f97316',
                display: 'inline-block',
                marginBottom: '0.5rem',
              }}
            >
              BENEFITS WE OFFER
            </span>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.8vw, 2.75rem)',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.025em',
                margin: '0 0 0.85rem',
              }}
            >
              What Benefits Are Waiting For You?
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#475569', maxWidth: '640px', margin: 0 }}>
              Comprehensive capabilities and engineering advantages engineered to accelerate your tech placement,
              close critical skill gaps, and secure tier-1 offers.
            </p>
          </div>

          {/* 4 Benefits Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {BENEFITS_LIST.map((benefit, i) => (
              <div key={i} className="mavens-benefit-card">
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#255eff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    marginBottom: '1.25rem',
                    boxShadow: '0 4px 14px rgba(37, 94, 255, 0.25)',
                  }}
                >
                  {benefit.icon}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.6rem' }}>
                  {benefit.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. PRECISE TALENT MATCHING & FAST HIRING / LIVE CAREERS (IMAGE 2)
          Floating Search Card + Multi-Filter + Exact Mavens-i Job Cards
          ===================================================================== */}
      <section
        id="opportunities"
        style={{
          padding: '6rem 1.5rem',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          {/* Section Heading */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#255eff',
                display: 'inline-block',
                marginBottom: '0.5rem',
              }}
            >
              PRECISE TALENT MATCHING &amp; FAST &amp; RELIABLE HIRING
            </span>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.8vw, 2.75rem)',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.025em',
                margin: '0 0 0.85rem',
              }}
            >
              Precise Talent Matching &amp; Fast &amp; Reliable Hiring
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#64748b', maxWidth: '640px', margin: '0 auto' }}>
              Browse our open positions and pick the challenge that excites you the most.
            </p>
          </div>

          {/* Floating Search & Multi-Filter Bar (Mavens-i Image 2) */}
          <form
            onSubmit={handleSearchSubmit}
            className="mavens-job-search-card"
            style={{ marginBottom: '3rem' }}
          >
            {/* Search Input */}
            <div className="mavens-search-input-wrap">
              <Search size={18} color="#94a3b8" />
              <input
                type="text"
                className="mavens-search-input"
                placeholder="Job title, keywords..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>

            {/* Department Dropdown */}
            <div className="mavens-filter-select-wrap">
              <MapPin size={16} color="#94a3b8" />
              <select
                className="mavens-filter-select"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="AI & Data">AI &amp; Data</option>
                <option value="Cloud">Cloud &amp; Infrastructure</option>
                <option value="Security">Security &amp; DevOps</option>
              </select>
            </div>

            {/* Types Dropdown */}
            <div className="mavens-filter-select-wrap">
              <Briefcase size={16} color="#94a3b8" />
              <select
                className="mavens-filter-select"
                value={selectedWorkType}
                onChange={(e) => setSelectedWorkType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Full Time">Full Time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
                <option value="Hackathon">Hackathon</option>
              </select>
            </div>

            {/* Find Jobs Button */}
            <button type="submit" className="mavens-btn-find-jobs">
              <span>Find Jobs</span>
            </button>
          </form>

          {/* Quick Filter Pill Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginRight: '0.5rem' }}>
              Filter by track:
            </span>
            {['all', 'internship', 'fulltime', 'hackathon', 'scholarship'].map((tab) => {
              const isSelected = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.35rem 0.95rem',
                    borderRadius: '9999px',
                    border: '1px solid',
                    borderColor: isSelected ? '#255eff' : '#cbd5e1',
                    background: isSelected ? '#255eff' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab === 'fulltime' ? 'Full-Time' : tab}
                </button>
              );
            })}
          </div>

          {/* Exact Mavens-i Job Cards Grid (Image 2: 2 columns on desktop) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
              gap: '1.75rem',
            }}
          >
            {loading && [1, 2, 3, 4].map((n) => (
              <div key={n} style={{ height: '220px', background: '#f1f5f9', borderRadius: '16px' }} />
            ))}
            {!loading && filteredOpportunities.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem 1rem' }}>
                <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1rem' }}>
                  No live opportunities currently match this track filter.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className="mavens-btn-apply"
                  style={{ margin: '0 auto' }}
                >
                  View All Open Tracks
                </button>
              </div>
            )}
            {!loading && filteredOpportunities.slice(0, 6).map((opp, i) => {
              const title = opp.role || opp.title || 'Software Engineer';
              const location = opp.locationString || opp.location?.city || (typeof opp.location === 'string' ? opp.location : 'Chennai');
              const exp = typeof opp.experience === 'string'
                ? opp.experience
                : opp.experience?.min_years != null
                  ? `${opp.experience.min_years}${opp.experience.max_years ? `–${opp.experience.max_years}` : '+'} Years`
                  : '0–2 Years';
              const dept = opp.department || (opp.category ? opp.category.toUpperCase() : 'Engineering');
              const posted = opp.posted || (opp.postedAt ? `Posted ${new Date(opp.postedAt).toLocaleDateString()}` : 'Posted recently');
              const companyName = opp.company || opp.organization?.name || 'Enterprise Partner';
              const description = opp.desc || opp.description || 'Design, engineer, and deploy scalable cloud-native architectures with modern telemetry and enterprise security standards.';

              return (
                <div key={opp.id || opp._id || i} className="mavens-job-card">
                  {/* Top Block: Icon Pod + Title + Featured + OPEN Badge */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="mavens-job-icon-pod">
                          {title.toLowerCase().includes('data') ? (
                            <BarChart3 size={24} />
                          ) : title.toLowerCase().includes('intern') ? (
                            <Sparkles size={24} />
                          ) : (
                            <Code size={24} />
                          )}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                              {title}
                            </h3>
                            <span className="mavens-badge-featured">Featured</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#255eff', marginTop: '2px' }}>
                            {companyName}
                          </div>
                        </div>
                      </div>

                      <span className="mavens-badge-open">OPEN</span>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.55, margin: '0 0 1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {description}
                    </p>

                    {/* Metadata Row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        fontSize: '0.8rem',
                        color: '#64748b',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Briefcase size={14} color="#94a3b8" />
                        {dept}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPin size={14} color="#94a3b8" />
                        {location}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} color="#94a3b8" />
                        {exp}
                      </span>
                    </div>
                  </div>

                  {/* Footer Row: Tags + Posted + Apply Now */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #f1f5f9',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <span className="mavens-tag-pill blue">{opp.type || 'Full Time'}</span>
                      <span className="mavens-tag-pill orange">{opp.priority || 'Priority'}</span>
                      <span className="mavens-tag-pill gray">{opp.workMode || 'Onsite'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
                        {posted}
                      </span>
                      <Link to="/opportunities" style={{ textDecoration: 'none' }}>
                        <button type="button" className="mavens-btn-apply">
                          <span>Apply Now</span>
                          <ExternalLink size={14} />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <Link to="/opportunities" style={{ textDecoration: 'none' }}>
              <button type="button" className="mavens-btn-primary" style={{ padding: '0.85rem 2.25rem', fontSize: '1rem' }}>
                <span>View All Verified Opportunities</span>
                <ArrowRight size={17} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. HOW IT WORKS (ROADMAP EXECUTION)
          ===================================================================== */}
      <section id="how-it-works" style={{ padding: '6rem 1.5rem', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#f97316',
                display: 'inline-block',
                marginBottom: '0.5rem',
              }}
            >
              5 PROVEN STEPS
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 800, color: '#0f172a', margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
              How CareerPilot Works
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#475569', maxWidth: '580px', margin: '0 auto' }}>
              From uploading your verified credentials to signing your dream tech offer, follow your customized execution trajectory.
            </p>
          </div>

          <AnimatedRoadmap />
        </div>
      </section>

      {/* =====================================================================
          7. INTERACTIVE AI COPILOT PREVIEW
          ===================================================================== */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            background: 'linear-gradient(145deg, #ffffff 0%, #f4f7ff 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.05)',
            padding: '3rem 2.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div className="mavens-specular-line" />
          <div className="mavens-corner-bracket" />

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sparkles size={18} color="#f97316" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#255eff' }}>
                Instant Intelligence
              </span>
            </div>

            <h3 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem' }}>
              Simulate Technical Interviews with Real-Time Feedback
            </h3>

            <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
              Our streaming LLM engine benchmarks your resume against exact FAANG job specs, provides line-by-line STAR framework audits,
              and coaches you through system design challenges.
            </p>

            <Link to="/ai-advisor" style={{ textDecoration: 'none' }}>
              <button type="button" className="mavens-btn-primary">
                <span>Launch Interactive Advisor</span>
                <ArrowRight size={15} />
              </button>
            </Link>
          </div>

          {/* Interactive Chat Mockup Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>AI Career Copilot v2.4</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#255eff', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                Active Telemetry
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div style={{ alignSelf: 'flex-start', maxWidth: '85%', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', padding: '0.65rem 0.9rem', borderRadius: '8px', color: '#0f172a', fontWeight: 500 }}>
                "How does my profile match with Stripe's Infrastructure Developer posting?"
              </div>

              <div style={{ alignSelf: 'flex-end', maxWidth: '90%', backgroundColor: '#f8fafc', border: '1px solid rgba(37, 94, 255, 0.25)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#1e293b', lineHeight: 1.5 }}>
                <span style={{ color: '#059669', fontWeight: 800 }}>94% Match Probability:</span> Your Distributed Systems course and Go project meet their core backend requirements. Consider adding an example of Redis caching to your 2nd bullet point for top-decile screening.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          8. BOTTOM ENTERPRISE CALL TO ACTION (MAVENS-I GRADIENT MESH)
          ===================================================================== */}
      <section
        style={{
          padding: '6rem 1.5rem',
          textAlign: 'center',
          position: 'relative',
          background: 'linear-gradient(135deg, #071a45 0%, #0b2f74 50%, #f97316 100%)',
          color: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <div className="mavens-specular-line" />

        <div style={{ maxWidth: '780px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#fed7aa',
              display: 'inline-block',
              marginBottom: '0.75rem',
            }}
          >
            Start Your Next Trajectory
          </span>

          <h2
            style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.25rem)',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 1.25rem',
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
            }}
          >
            Harness Precision AI To Launch Your Tech Career
          </h2>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.6,
              marginBottom: '2.5rem',
            }}
          >
            Join ambitious engineering students and early-career candidates discovering 100% verified roles,
            mastering targeted skill gaps with week-by-week roadmaps, and landing top offers with zero guesswork.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <button
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.9rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#071a45',
                  backgroundColor: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                }}
              >
                <span>Create Student Account Free</span>
                <ArrowRight size={17} />
              </button>
            </Link>

            <Link to="/opportunities" style={{ textDecoration: 'none' }}>
              <button
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.9rem 1.75rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: 'rgba(2, 6, 23, 0.5)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>Explore Opportunities</span>
              </button>
            </Link>
          </div>

          {/* Real-Time Platform Telemetry Micro-Pill Row */}
          <div
            style={{
              marginTop: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.25rem',
              flexWrap: 'wrap',
              fontSize: '0.825rem',
              color: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80', boxShadow: '0 0 10px #4ade80' }} />
              <span>180+ Active Verified Opportunities</span>
            </div>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
              <span>10 Real-Time Ingestion Channels</span>
            </div>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316' }} />
              <span>96% ATS Match Precision</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
