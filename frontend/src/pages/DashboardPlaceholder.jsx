import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Briefcase,
  Layers,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Bookmark,
  ExternalLink,
  Building2,
  MapPin,
  Calendar,
  AlertTriangle,
  Award,
  Zap
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';

export default function DashboardPlaceholder() {
  const { user } = useAuth();
  const [savedOpportunities, setSavedOpportunities] = useState(new Set());

  // Determine time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const toggleSave = (id) => {
    setSavedOpportunities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Sample opportunity preview data demonstrating Modern Skeuomorphic UI
  const sampleOpportunities = [
    {
      id: 'opp-1',
      company: 'Stripe',
      title: 'Software Engineering Intern — Core Platform',
      type: 'Internship',
      mode: 'Hybrid',
      location: 'Bengaluru / Hybrid',
      matchScore: 92,
      eligible: true,
      deadline: 'in 4 days',
      skills: ['Python', 'SQL', 'REST APIs', 'System Design'],
      missingSkills: ['Distributed Systems'],
    },
    {
      id: 'opp-2',
      company: 'Microsoft',
      title: 'Graduate SDE (Full-Time)',
      type: 'Full-Time',
      mode: 'Onsite',
      location: 'Hyderabad, India',
      matchScore: 86,
      eligible: true,
      deadline: 'in 11 days',
      skills: ['Data Structures', 'C++', 'Algorithms', 'OOP'],
      missingSkills: ['Azure'],
    },
  ];

  return (
    <PageContainer>
      {/* 1. Welcome & Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-900) 0%, #1e1b4b 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem 2.25rem',
          color: 'white',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-raised)',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="dashboard-welcome-banner animate-slide-up"
      >
        {/* Subtle decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(99, 102, 241, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Badge variant="purple" size="sm" dot>
                CareerPilot AI Telemetry Active
              </Badge>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.4rem' }}>
              {getGreeting()}, {user?.name || 'Student'}! 👋
            </h1>
            <p style={{ opacity: 0.85, fontSize: '0.95rem', maxWidth: '620px', lineHeight: 1.5 }}>
              Your personalized career opportunities and skill gap telemetry are active. We identified <strong style={{ color: '#93c5fd' }}>18 matching opportunities</strong> tailored to your student profile.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/opportunities">
              <Button variant="accent" size="md" icon={<Briefcase size={16} />}>
                Explore Matches
              </Button>
            </Link>
            <Link to="/ai-advisor">
              <Button
                variant="secondary"
                size="md"
                icon={<Sparkles size={16} color="var(--color-purple-600)" />}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
              >
                Ask AI Advisor
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics & Telemetry Grid */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <Card variant="default" className="hover-lift">
          <Card.Content style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span className="text-caption">Matching Opportunities</span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-50)',
                  color: 'var(--color-primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Briefcase size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
                18
              </span>
              <Badge variant="success" size="sm">
                +4 new
              </Badge>
            </div>
            <p className="text-small" style={{ fontSize: '0.8rem' }}>89% average student match score</p>
          </Card.Content>
        </Card>

        <Card variant="default" className="hover-lift">
          <Card.Content style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span className="text-caption">Active Applications</span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-accent-50)',
                  color: 'var(--color-accent-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Layers size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
                4
              </span>
              <span className="text-small">in flight</span>
            </div>
            <p className="text-small" style={{ fontSize: '0.8rem' }}>1 Assessment • 1 Tech Interview</p>
          </Card.Content>
        </Card>

        <Card variant="default" className="hover-lift">
          <Card.Content style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span className="text-caption">Closing Soon</span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-warning-bg)',
                  color: 'var(--color-warning-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Clock size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
                2
              </span>
              <Badge variant="warning" size="sm">
                &lt; 5 Days
              </Badge>
            </div>
            <p className="text-small" style={{ fontSize: '0.8rem' }}>Stripe Intern closes in 4 days</p>
          </Card.Content>
        </Card>

        <Card variant="default" className="hover-lift">
          <Card.Content style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span className="text-caption">Profile Readiness</span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-50)',
                  color: 'var(--color-primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <TrendingUp size={18} />
              </div>
            </div>
            <div style={{ marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
                70%
              </span>
            </div>
            <ProgressBar value={70} size="sm" variant="primary" showPercentage={false} />
          </Card.Content>
        </Card>
      </div>

      {/* 3. Main Content Split: Recommended Opportunities & Application Pipeline */}
      <div className="page-2col-grid dashboard-main-grid" style={{ marginBottom: '2rem' }}>
        {/* Left Column: Recommended Opportunities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 className="text-h3">Top AI-Recommended Opportunities</h2>
              <p className="text-small">Ranked by deterministic eligibility and semantic match</p>
            </div>
            <Link to="/opportunities">
              <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>
                View All (18)
              </Button>
            </Link>
          </div>

          {sampleOpportunities.map((opp) => (
            <Card key={opp.id} variant="raised" className="hover-lift">
              <Card.Content style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        {opp.company}
                      </span>
                      <span style={{ color: 'var(--color-text-subtle)' }}>•</span>
                      <Badge variant="primary" size="sm">
                        {opp.type}
                      </Badge>
                      <Badge variant="neutral" size="sm">
                        {opp.mode}
                      </Badge>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {opp.title}
                    </h3>
                  </div>

                  {/* Match Score Badge */}
                  <div
                    style={{
                      padding: '0.5rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-success-bg)',
                      border: '1px solid var(--color-success-border)',
                      textAlign: 'center',
                      boxShadow: 'var(--shadow-sm)',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-success-dark)', lineHeight: 1 }}>
                      {opp.matchScore}%
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-success-dark)', marginTop: '2px' }}>
                      Match
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem 1.25rem', flexWrap: 'wrap', fontSize: '0.84375rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={15} />
                    {opp.location}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={15} />
                    Deadline {opp.deadline}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success-dark)', fontWeight: 600 }}>
                    <CheckCircle2 size={15} />
                    Eligible
                  </span>
                </div>

                {/* Skills tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  {opp.skills.map((skill) => (
                    <Badge key={skill} variant="neutral" size="sm">
                      ✓ {skill}
                    </Badge>
                  ))}
                  {opp.missingSkills.map((missing) => (
                    <Badge key={missing} variant="warning" size="sm">
                      Missing: {missing}
                    </Badge>
                  ))}
                </div>

                {/* Card Actions */}
                <div
                  className="dashboard-card-actions"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSave(opp.id)}
                    icon={<Bookmark size={15} fill={savedOpportunities.has(opp.id) ? 'var(--color-primary-600)' : 'none'} color="var(--color-primary-600)" />}
                  >
                    {savedOpportunities.has(opp.id) ? 'Saved' : 'Save Opportunity'}
                  </Button>

                  <div className="button-group" style={{ display: 'flex', gap: '0.65rem' }}>
                    <Link to="/opportunities">
                      <Button variant="secondary" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Button variant="primary" size="sm" iconRight={<ExternalLink size={14} />}>
                      Apply Now
                    </Button>
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>

        {/* Right Column: Application Tracker Preview & Next Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Next Immediate Action */}
          <Card variant="raised" style={{ borderLeft: '4px solid var(--color-primary-600)' }}>
            <Card.Content style={{ padding: '1.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <Zap size={16} color="var(--color-primary-600)" />
                <span className="text-caption" style={{ color: 'var(--color-primary-700)' }}>
                  Next Immediate Action
                </span>
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Google Online Assessment
              </h4>
              <p className="text-small" style={{ marginBottom: '1rem' }}>
                Assessment link received for SWE Summer 2027. Complete before Thursday 11:59 PM.
              </p>
              <Link to="/applications">
                <Button variant="primary" size="sm" style={{ width: '100%' }}>
                  Go to Application Tracker
                </Button>
              </Link>
            </Card.Content>
          </Card>

          {/* Application Pipeline Stages Preview */}
          <Card variant="default">
            <Card.Header>
              <Card.Title style={{ fontSize: '1rem' }}>Application Stages</Card.Title>
              <Badge variant="neutral" size="sm">4 Total</Badge>
            </Card.Header>
            <Card.Content style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-small" style={{ fontWeight: 600 }}>Applied</span>
                  <Badge variant="neutral" size="sm">2 Opportunities</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-small" style={{ fontWeight: 600 }}>Assessment</span>
                  <Badge variant="warning" size="sm">1 Active</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-small" style={{ fontWeight: 600 }}>Interview</span>
                  <Badge variant="purple" size="sm">1 Scheduled</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-small" style={{ fontWeight: 600 }}>Selected</span>
                  <Badge variant="success" size="sm">0</Badge>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Complete Student Profile Card */}
          <Card variant="default">
            <Card.Content style={{ padding: '1.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Award size={18} color="var(--color-accent-600)" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Profile Completion</h4>
              </div>
              <p className="text-small" style={{ marginBottom: '0.85rem' }}>
                Add your CGPA, Branch, and upload resume to unlock 100% eligibility accuracy.
              </p>
              <ProgressBar value={70} size="md" variant="accent" label="Academic & Skills Progress" style={{ marginBottom: '1rem' }} />
              <Link to="/profile">
                <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                  Complete Student Profile
                </Button>
              </Link>
            </Card.Content>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
