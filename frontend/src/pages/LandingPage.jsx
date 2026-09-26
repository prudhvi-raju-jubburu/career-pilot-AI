import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  MessageSquare
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import AnimatedRoadmap from '../components/AnimatedRoadmap';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('all');

  // Dynamically reveal content on scroll
  useScrollReveal('.scroll-reveal');

  const sampleOpportunities = [
    {
      id: 1,
      company: 'Stripe',
      role: 'Software Engineering Intern — Core Platform',
      type: 'Internship',
      mode: 'Hybrid',
      location: 'Bengaluru / Hybrid',
      stipend: '₹1,25,000 / mo',
      matchScore: 94,
      deadline: 'Closing in 4 days',
      tags: ['Python', 'SQL', 'REST APIs', 'System Design'],
    },
    {
      id: 2,
      company: 'Google',
      role: 'Software Engineer (Early Career / Graduate 2026)',
      type: 'Full-Time',
      mode: 'Onsite',
      location: 'Hyderabad, India',
      stipend: 'Competitive Package',
      matchScore: 91,
      deadline: 'Closing in 9 days',
      tags: ['C++', 'Data Structures', 'Algorithms', 'OOP'],
    },
    {
      id: 3,
      company: 'Microsoft',
      role: 'Imagine Cup Global AI Hackathon',
      type: 'Hackathon',
      mode: 'Remote',
      location: 'Global / Virtual',
      stipend: '$100,000 Prize Pool',
      matchScore: 88,
      deadline: 'Registrations Open',
      tags: ['AI/ML', 'Azure', 'Python', 'FastAPI'],
    },
    {
      id: 4,
      company: 'TCS Research',
      role: 'National STEM Innovation Scholarship',
      type: 'Scholarship',
      mode: 'Online Merit',
      location: 'Pan India',
      stipend: '₹2,00,000 Grant',
      matchScore: 95,
      deadline: 'Closes next week',
      tags: ['CGPA > 8.0', 'Research', 'Tech Innovation'],
    },
  ];

  const filteredOpportunities =
    activeTab === 'all'
      ? sampleOpportunities
      : sampleOpportunities.filter(
          (o) => o.type.toLowerCase().replace('-', '') === activeTab.replace('-', '')
        );

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* =====================================================================
          1. HERO SECTION
          ===================================================================== */}
      <section className="hero-section" style={{ paddingTop: '4.5rem', paddingBottom: '4.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem' }}>
          {/* Top Pill */}
          <div
            className="scroll-reveal"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--border-control)',
              boxShadow: 'var(--shadow-raised-sm)',
              marginBottom: '1.75rem',
              fontSize: '0.85rem',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
              Next-Gen AI Opportunity Copilot
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>•</span>
            <span style={{ color: 'var(--color-primary-600)', fontWeight: 700 }}>
              Over 2,400+ Active Roles Verified Today
            </span>
          </div>

          <h1
            className="scroll-reveal stagger-1"
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: 'var(--color-text)',
              maxWidth: '860px',
              margin: '0 auto 1.5rem',
            }}
          >
            Discover High-Match Career Opportunities{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Before Deadlines Pass
            </span>
          </h1>

          <p
            className="scroll-reveal stagger-2"
            style={{
              fontSize: '1.15rem',
              lineHeight: 1.6,
              color: 'var(--color-text-muted)',
              maxWidth: '720px',
              margin: '0 auto 2.5rem',
            }}
          >
            CareerPilot AI is the personal career co-pilot for college students. We discover verified internships, full-time roles, scholarships, and hackathons, automatically verify your eligibility, and calculate precision match scores.
          </p>

          <div
            className="scroll-reveal stagger-3"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              marginBottom: '4rem',
            }}
          >
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg" iconRight={<ArrowRight size={18} />}>
                Get Started Free
              </Button>
            </Link>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="lg" icon={<Sparkles size={18} color="var(--color-primary-600)" />}>
                Explore Live Dashboard
              </Button>
            </Link>
          </div>

          {/* Real Animated CareerPilot Dashboard Preview */}
          <div
            className="scroll-reveal scroll-reveal-scale stagger-4"
            style={{
              maxWidth: '980px',
              margin: '0 auto',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-raised-lg), 0 24px 48px -12px rgba(15, 23, 42, 0.12)',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--border-control)',
              overflow: 'hidden',
              textAlign: 'left',
            }}
          >
            {/* Top Preview Bar */}
            <div
              style={{
                padding: '0.85rem 1.5rem',
                backgroundColor: '#0f172a',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.65rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.85, marginLeft: '0.5rem' }}>
                  CareerPilot AI — Student Dashboard Telemetry
                </span>
              </div>
              <Badge variant="success" size="sm" dot>
                Live Matching Stream
              </Badge>
            </div>

            {/* Dashboard Mockup Content */}
            <div style={{ padding: '1.75rem', backgroundColor: 'var(--color-bg)' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <Card variant="default">
                  <Card.Content style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Profile Match Score
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary-600)', marginTop: '0.2rem' }}>
                      94% Match
                    </div>
                    <ProgressBar value={94} size="sm" variant="primary" showPercentage={false} style={{ marginTop: '0.5rem' }} />
                  </Card.Content>
                </Card>

                <Card variant="default">
                  <Card.Content style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Verified Eligibility
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-success-dark)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={24} color="var(--color-success)" />
                      100% Eligible
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                      CGPA: 8.9 • Branch: CSE • Batch: 2023-2025
                    </div>
                  </Card.Content>
                </Card>

                <Card variant="default">
                  <Card.Content style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Upcoming Deadline
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-warning-dark)', marginTop: '0.2rem' }}>
                      4 Days Left
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                      Stripe Summer SDE Application
                    </div>
                  </Card.Content>
                </Card>
              </div>

              {/* Sample Opportunity Row in Preview */}
              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  padding: '1.25rem 1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-control)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-raised-sm)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>Stripe</span>
                    <Badge variant="purple" size="sm">Internship</Badge>
                    <Badge variant="neutral" size="sm">₹1,25,000 / mo</Badge>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    Software Engineering Intern — Core Platform
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Badge variant="success" size="md" dot>
                    94% Semantic Match
                  </Badge>
                  <Link to="/opportunities" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" size="sm">
                      Quick Apply
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. PLATFORM METRICS SECTION
          ===================================================================== */}
      <section style={{ padding: '3.5rem 1.5rem', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--color-surface)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          <div className="scroll-reveal stagger-1">
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary-600)', letterSpacing: '-0.02em' }}>
              10,000+
            </div>
            <div style={{ fontWeight: 700, color: 'var(--color-text)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
              Opportunities Curated
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Verified from official company career portals
            </p>
          </div>

          <div className="scroll-reveal stagger-2">
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-success)', letterSpacing: '-0.02em' }}>
              94%
            </div>
            <div style={{ fontWeight: 700, color: 'var(--color-text)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
              AI Match Accuracy
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Deterministic eligibility &amp; semantic alignment
            </p>
          </div>

          <div className="scroll-reveal stagger-3">
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-accent-600)', letterSpacing: '-0.02em' }}>
              45+
            </div>
            <div style={{ fontWeight: 700, color: 'var(--color-text)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
              Universities Supported
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Engineering &amp; Science colleges nationwide
            </p>
          </div>

          <div className="scroll-reveal stagger-4">
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-warning)', letterSpacing: '-0.02em' }}>
              0
            </div>
            <div style={{ fontWeight: 700, color: 'var(--color-text)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
              Missed Deadlines
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Automated notifications &amp; deadline alerts
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. HOW CAREERPILOT WORKS (5-STEP ROADMAP)
          ===================================================================== */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <Badge variant="purple" size="sm" style={{ marginBottom: '0.5rem' }}>
            Streamlined Process
          </Badge>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-text)', margin: '0.25rem 0 0.75rem' }}>
            How CareerPilot AI Accelerates Your Journey
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', maxWidth: '650px', margin: '0 auto' }}>
            From profile onboarding to offer letter: a unified, automated intelligent pipeline.
          </p>
        </div>

        <div className="scroll-reveal scroll-reveal-scale">
          <AnimatedRoadmap />
        </div>
      </section>

      {/* =====================================================================
          4. AI MATCHING SHOWCASE SECTION
          ===================================================================== */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <Badge variant="purple" size="sm" style={{ marginBottom: '0.5rem' }}>
              Precision Matching Engine
            </Badge>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-text)', margin: '0.25rem 0 0.75rem' }}>
              Deterministic Eligibility + Semantic AI Matching
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', maxWidth: '650px', margin: '0 auto' }}>
              No guesswork. You see exactly why you match, where you qualify, and what is missing.
            </p>
          </div>

          <div
            className="scroll-reveal scroll-reveal-scale"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '1.5rem',
              alignItems: 'stretch',
            }}
          >
            {/* Student Profile Card */}
            <Card variant="raised">
              <Card.Header>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    JR
                  </div>
                  <div>
                    <Card.Title style={{ fontSize: '1rem' }}>Student Profile</Card.Title>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Computer Science • CGPA: 8.9</div>
                  </div>
                </div>
                <Badge variant="success" size="sm">Verified</Badge>
              </Card.Header>
              <Card.Content>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Extracted Skills &amp; Stack
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {['Python', 'React', 'JavaScript', 'Node.js', 'MongoDB', 'MySQL', 'Git', 'REST APIs'].map((s) => (
                      <Badge key={s} variant="neutral" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Target Preferences
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>
                    Preferred Role: <strong>Software Engineer Intern</strong> • Location: <strong>Bengaluru / Remote</strong>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* AI Match Telemetry Center */}
            <Card variant="raised" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600))',
                  color: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: 'var(--shadow-raised-md)',
                }}
              >
                <span style={{ fontSize: '1.9rem', fontWeight: 900, lineHeight: 1 }}>94%</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Match
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--color-text)' }}>
                High Semantic Compatibility
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '300px', margin: 0, lineHeight: 1.5 }}>
                Academic criteria (CGPA 8.9 &gt; 8.0) and technical skills strictly align with employer requirements.
              </p>
            </Card>

            {/* Target Job Requirement Card */}
            <Card variant="raised">
              <Card.Header>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Stripe Core Platform</div>
                  <Card.Title style={{ fontSize: '1rem' }}>Internship Requirements</Card.Title>
                </div>
                <Badge variant="primary" size="sm">₹1.25L / mo</Badge>
              </Card.Header>
              <Card.Content>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success-dark)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Matching Skills (7/8)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {['Python', 'React', 'JavaScript', 'Node.js', 'MongoDB', 'REST APIs', 'Git'].map((s) => (
                      <Badge key={s} variant="success" size="sm">
                        ✓ {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-warning-dark)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Skill Gap (1 Missing)
                  </div>
                  <Badge variant="warning" size="sm">
                    + Docker Containers
                  </Badge>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. LIVE OPPORTUNITIES EXPLORATION SECTION
          ===================================================================== */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <Badge variant="purple" size="sm" style={{ marginBottom: '0.5rem' }}>
              Opportunity Stream
            </Badge>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', margin: '0.25rem 0 0' }}>
              Discover Verified Roles Right Now
            </h2>
          </div>

          {/* Filter Tags */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'internship', label: 'Internships' },
              { id: 'fulltime', label: 'Full-Time' },
              { id: 'hackathon', label: 'Hackathons' },
              { id: 'scholarship', label: 'Scholarships' },
            ].map((f) => (
              <Button
                key={f.id}
                variant={activeTab === f.id ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredOpportunities.map((opp) => (
            <Card key={opp.id} variant="raised">
              <Card.Content style={{ padding: '1.35rem 1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        {opp.company}
                      </span>
                      <span>•</span>
                      <Badge variant="primary" size="sm">{opp.type}</Badge>
                      <Badge variant="neutral" size="sm">{opp.mode}</Badge>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.4rem' }}>
                      {opp.role}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} />
                        {opp.location}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--color-success-dark)' }}>
                        <Zap size={14} />
                        {opp.stipend}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning-dark)' }}>
                        <Clock size={14} />
                        {opp.deadline}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-success-bg)',
                        border: '1px solid var(--color-success-border)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-success-dark)' }}>
                        {opp.matchScore}%
                      </div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-success-dark)' }}>
                        Match
                      </div>
                    </div>

                    <Link to="/opportunities" style={{ textDecoration: 'none' }}>
                      <Button variant="primary" size="sm" iconRight={<ArrowRight size={14} />}>
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      </section>

      {/* =====================================================================
          6. FLOATING AI ADVISOR CALLOUT SECTION
          ===================================================================== */}
      <section style={{ padding: '4rem 1.5rem', backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <div
            className="scroll-reveal scroll-reveal-scale"
            style={{
              padding: '2.5rem',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(124,58,237,0.06) 100%)',
              border: '1px solid rgba(37,99,235,0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '2rem',
              boxShadow: 'var(--shadow-raised-sm)',
            }}
          >
            <div style={{ flex: '1', minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Badge variant="purple" size="sm" dot>
                  24/7 Context-Aware Mentor
                </Badge>
              </div>
              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 0.5rem' }}>
                AI Career Advisor is Always Ready in the Bottom Corner
              </h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                Click the glowing <strong>AI Career Advisor</strong> button in the bottom-right corner anytime to get instant interview coaching, resume bullet point enhancements, and personalized gap analysis.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link to="/ai-advisor" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="md" iconRight={<ArrowRight size={16} />}>
                  Open Full AI Workspace
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. FINAL CALL TO ACTION
          ===================================================================== */}
      <section style={{ padding: '5.5rem 1.5rem', textAlign: 'center' }}>
        <div className="scroll-reveal" style={{ maxWidth: '780px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '1rem', color: 'var(--color-text)' }}>
            Never Miss Another Career Opportunity
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Join ambitious students using CareerPilot AI to discover roles early, beat application deadlines, and get hired faster.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg" iconRight={<ArrowRight size={18} />}>
                Create Your Student Account
              </Button>
            </Link>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="lg">
                Sign In to Existing Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
