import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardContent, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import CountUp from '../components/ui/CountUp';
import ProgressRing from '../components/ui/ProgressRing';
import AnimatedRoadmap from '../components/AnimatedRoadmap';
import HeroPipelineVisual from '../components/HeroPipelineVisual';
import CareerConstellationHero from '../components/CareerConstellationHero';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useTypewriter } from '../hooks/useTypewriter';
import { fadeUp, staggerContainer } from '../utils/motion';
import { getOpportunities } from '../services/api';

const TICKER_ITEMS = [
  { company: 'Google', title: 'Software Engineer Intern', match: 91, type: 'Internship', deadline: '9 days left' },
  { company: 'Stripe', title: 'Core Platform Intern', match: 94, type: 'Internship', deadline: '4 days left' },
  { company: 'Microsoft', title: 'Imagine Cup Global Hackathon', match: 88, type: 'Hackathon', deadline: 'Prize: $100K' },
  { company: 'TCS Research', title: 'National STEM Scholarship', match: 95, type: 'Scholarship', deadline: '₹2,00,000 Grant' },
  { company: 'Goldman Sachs', title: 'Engineering Campus Hiring', match: 92, type: 'Full-Time', deadline: 'Closes next week' },
  { company: 'Adobe', title: 'Women in Technology Scholarship', match: 90, type: 'Scholarship', deadline: '$10,000 Award' },
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('all');

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback scroll reveal for standard classes
  useScrollReveal('.scroll-reveal');

  useEffect(() => {
    let mounted = true;
    const fetchLiveOpps = async () => {
      try {
        const res = await getOpportunities({ limit: 8 });
        const items = res?.data?.items || [];
        if (mounted) {
          setOpportunities(items);
        }
      } catch (err) {
        console.warn('Landing page opportunities fetch:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchLiveOpps();
    return () => { mounted = false; };
  }, []);

  const filteredOpportunities = opportunities.filter((o) => {
    if (activeTab === 'all') return true;
    const typeStr = (o.type || '').toLowerCase().replace('-', '');
    const tabStr = activeTab.replace('-', '');
    return typeStr.includes(tabStr) || tabStr.includes(typeStr);
  });

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* =====================================================================
          1. 3D PARTICLE CAREER CONSTELLATION HERO
          ===================================================================== */}
      <CareerConstellationHero />

        {/* Live Continuous Marquee Ticker */}
        <div className="ticker-wrap">
          <div className="ticker-content">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
              <div key={idx} className="ticker-item">
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.company}</span>
                <span style={{ color: 'var(--text-muted)' }}>—</span>
                <span>{item.title}</span>
                <Badge variant={item.match >= 90 ? 'success' : 'primary'} size="sm">
                  {item.match}% Match
                </Badge>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({item.deadline})
                </span>
              </div>
            ))}
          </div>
        </div>

      {/* =====================================================================
          2. PLATFORM METRICS SECTION WITH ANIMATED COUNTUP
          ===================================================================== */}
      <section style={{ padding: '3.5rem 1.5rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
              <CountUp end={2400} suffix="+" />
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
              Verified Opportunities
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Directly curated with verified eligibility criteria
            </p>
          </div>

          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)', letterSpacing: '-0.02em' }}>
              <CountUp end={96} suffix="%" />
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
              AI Match Accuracy
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Deterministic eligibility &amp; semantic alignment
            </p>
          </div>

          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#06b6d4', letterSpacing: '-0.02em' }}>
              <CountUp end={18500} suffix="+" />
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
              Applications Tracked
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Managed across 5-stage drag-and-drop Kanban
            </p>
          </div>

          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--warning)', letterSpacing: '-0.02em' }}>
              <CountUp end={4.9} decimals={1} suffix="/5" />
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
              Student Rating
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Praised for zero fabricated listings or spam
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. HOW IT WORKS (5-STEP ROADMAP)
          ===================================================================== */}
      <section style={{ padding: '4.5rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Badge variant="primary" size="sm" style={{ marginBottom: '0.5rem' }}>
            5 Clear Steps
          </Badge>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0 0.5rem' }}>
            How CareerPilot Works
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto' }}>
            From uploading your resume to accepting your offer, follow your personal career roadmap.
          </p>
        </div>

        <AnimatedRoadmap />
      </section>

      {/* =====================================================================
          4. CORE PLATFORM PILLARS (SCROLL REVEAL)
          ===================================================================== */}
      <section style={{ padding: '4.5rem 1.5rem', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <Badge variant="purple" size="sm" style={{ marginBottom: '0.5rem' }}>
              Platform Pillars
            </Badge>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0 0.5rem' }}>
              Engineered for Student Career Success
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto' }}>
              Every feature is built around transparency, actionable feedback, and deterministic criteria.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Pillar 1 */}
            <Card variant="raised" style={{ padding: '1.5rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Target size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
                Deterministic Eligibility
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Never waste hours applying to a role you aren't eligible for. We verify your GPA, branch, graduation year, and stack instantly.
              </p>
            </Card>

            {/* Pillar 2 */}
            <Card variant="raised" style={{ padding: '1.5rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <TrendingUp size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
                Competency Radar &amp; Roadmaps
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Visual Recharts radar compares your verified skill footprint against benchmarks for target roles, generating a sequenced timeline.
              </p>
            </Card>

            {/* Pillar 3 */}
            <Card variant="raised" style={{ padding: '1.5rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--info-bg)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Layers size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
                Drag-and-Drop Pipeline
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Track applications across 5 fluid stages with celebratory confetti upon reaching offer stage, deadline countdowns, and notes.
              </p>
            </Card>

            {/* Pillar 4 */}
            <Card variant="raised" style={{ padding: '1.5rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <MessageSquare size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
                Streaming AI Career Advisor
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Chat with an intelligent coach that streams advice token-by-token, offers STAR resume audits, and provides technical interview prep.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. SAMPLE OPPORTUNITY EXPLORER
          ===================================================================== */}
      <section style={{ padding: '4.5rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Badge variant="primary" size="sm" style={{ marginBottom: '0.5rem' }}>
            Live Opportunities
          </Badge>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0 0.5rem' }}>
            Featured Verified Roles
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto' }}>
            Preview high-match opportunities with transparent stipend, location, and match breakdown.
          </p>

          {/* Filter Tabs */}
          <div style={{ display: 'inline-flex', gap: '0.35rem', backgroundColor: 'var(--surface-raised)', padding: '4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', marginTop: '1.5rem' }}>
            {['all', 'internship', 'fulltime', 'hackathon', 'scholarship'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: activeTab === tab ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'fulltime' ? 'Full-Time' : tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {filteredOpportunities.slice(0, 4).map((opp) => {
            const role = opp.role || opp.title || 'Career Opportunity';
            const locationStr = opp.locationString || opp.location?.city || (typeof opp.location === 'string' ? opp.location : 'Remote');
            const skillsList = opp.skills || opp.tags || [];
            const displayDeadline = opp.deadline ? `Closes ${new Date(opp.deadline).toLocaleDateString()}` : 'Rolling Admission';

            return (
              <Card key={opp.id} variant="raised" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <ProgressRing score={opp.matchScore || 92} size={48} strokeWidth={4} />
                    <Badge variant={opp.type === 'internship' ? 'purple' : opp.type === 'scholarship' ? 'success' : 'primary'} size="sm">
                      {opp.type ? opp.type.toUpperCase() : 'OPPORTUNITY'}
                    </Badge>
                  </div>

                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{opp.company || 'Global Tech'}</div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0 0.5rem' }}>
                    {role}
                  </h4>

                  <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={12} /> {locationStr}
                    </span>
                    <span>•</span>
                    <span>{opp.workMode || 'Remote / Hybrid'}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {skillsList.slice(0, 4).map((t, idx) => (
                      <span key={idx} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600 }}>
                    {displayDeadline}
                  </span>
                  <Link to="/opportunities" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" size="sm" iconRight={<ArrowRight size={13} />}>
                      View
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          6. BOTTOM CALL TO ACTION
          ===================================================================== */}
      <section style={{ padding: '5rem 1.5rem', textAlign: 'center', background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg-primary) 100%)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <Badge variant="primary" size="sm" style={{ marginBottom: '1rem' }}>
            Get Started Today
          </Badge>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1rem', letterSpacing: '-0.025em' }}>
            Ready to find your dream tech role?
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2.25rem' }}>
            Join thousands of engineering students discovering verified internships, mastering skill gaps, and landing top offers.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg" iconRight={<ArrowRight size={18} />}>
                Create Free Student Account
              </Button>
            </Link>
            <Link to="/opportunities" style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="lg">
                Explore Opportunities
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
