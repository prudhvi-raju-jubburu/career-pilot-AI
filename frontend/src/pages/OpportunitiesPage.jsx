import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  BookmarkPlus,
  Check,
  Building,
  GraduationCap,
  Sparkles,
  Award,
  Code2,
  Layers,
  ChevronRight,
  X
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { getProfile } from '../services/api';

// Curated opportunity dataset with strict eligibility rules & skill mappings
const INITIAL_OPPORTUNITIES = [
  {
    id: 'opp-1',
    title: 'Software Engineering Intern — Summer 2025',
    company: 'Google',
    type: 'Internship',
    mode: 'Hybrid',
    location: 'Bengaluru / Hyderabad',
    stipend: '₹1,20,000 / month',
    deadline: '2025-11-15',
    daysLeft: 18,
    requiredSkills: ['Python', 'Data Structures', 'Algorithms', 'C++', 'Java'],
    preferredSkills: ['React', 'Machine Learning', 'Git'],
    eligibility: {
      minCgpa: 8.0,
      batches: [2023, 2024, 2025, 2026],
      branches: ['Computer Science and Engineering', 'Information Technology', 'ECE', 'Any Circuit Branch'],
    },
    applicationUrl: 'https://careers.google.com/jobs/results/',
    description: 'Join Google engineers in designing and building scalable systems that power search, cloud, and distributed AI models worldwide.',
  },
  {
    id: 'opp-2',
    title: 'Full Stack Developer Intern',
    company: 'Microsoft',
    type: 'Internship',
    mode: 'Remote',
    location: 'India (Remote)',
    stipend: '₹1,00,000 / month',
    deadline: '2025-10-30',
    daysLeft: 12,
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'REST APIs', 'Git'],
    preferredSkills: ['MongoDB', 'TypeScript', 'Azure'],
    eligibility: {
      minCgpa: 7.5,
      batches: [2023, 2024, 2025],
      branches: ['Computer Science and Engineering', 'IT', 'Software Engineering'],
    },
    applicationUrl: 'https://careers.microsoft.com/',
    description: 'Work on Azure and Microsoft 365 developer platforms creating intuitive frontend interfaces and robust backend microservices.',
  },
  {
    id: 'opp-3',
    title: 'Smart India Hackathon 2025 — Grand Finale',
    company: 'Ministry of Education & AICTE',
    type: 'Hackathon',
    mode: 'Hybrid',
    location: 'New Delhi / Nodal Centers',
    stipend: '₹1,00,000 Prize Pool',
    deadline: '2025-11-20',
    daysLeft: 23,
    requiredSkills: ['Python', 'React', 'Full Stack Development', 'Problem Solving'],
    preferredSkills: ['Machine Learning', 'MongoDB', 'Node.js'],
    eligibility: {
      minCgpa: 0, // open
      batches: [2023, 2024, 2025, 2026, 2027],
      branches: ['Any Branch'],
    },
    applicationUrl: 'https://sih.gov.in/',
    description: 'Nationwide initiative to provide students a platform to solve pressing challenges faced by government departments and industries.',
  },
  {
    id: 'opp-4',
    title: 'Generation Google Scholarship (APAC)',
    company: 'Google',
    type: 'Scholarship',
    mode: 'Remote',
    location: 'Asia-Pacific',
    stipend: '$2,500 USD Award',
    deadline: '2025-12-05',
    daysLeft: 38,
    requiredSkills: ['Academic Excellence', 'Computer Science', 'Leadership'],
    preferredSkills: ['Community Impact', 'Diversity in Tech'],
    eligibility: {
      minCgpa: 8.0,
      batches: [2023, 2024, 2025, 2026],
      branches: ['Computer Science and Engineering', 'IT', 'Related Technical Field'],
    },
    applicationUrl: 'https://buildyourfuture.withgoogle.com/scholarships',
    description: 'Scholarship awarded to students pursuing computer science degrees who excel in technology and demonstrate strong leadership.',
  },
  {
    id: 'opp-5',
    title: 'Associate Software Engineer (Graduate 2023–2025)',
    company: 'Goldman Sachs',
    type: 'Full-Time',
    mode: 'Onsite',
    location: 'Bengaluru, India',
    stipend: '₹22,00,000 / year',
    deadline: '2025-10-25',
    daysLeft: 7,
    requiredSkills: ['Python', 'JavaScript', 'Database Systems', 'Algorithms'],
    preferredSkills: ['React', 'MySQL', 'MongoDB', 'Microservices'],
    eligibility: {
      minCgpa: 8.0,
      batches: [2023, 2024, 2025],
      branches: ['Computer Science and Engineering', 'Circuits', 'Math/Computing'],
    },
    applicationUrl: 'https://www.goldmansachs.com/careers/',
    description: 'Build enterprise trading platforms, risk management engines, and real-time financial data analytics pipelines.',
  },
  {
    id: 'opp-6',
    title: 'Flipkart GRiD 6.0 — Software Development Track',
    company: 'Flipkart',
    type: 'Contest',
    mode: 'Remote',
    location: 'Online',
    stipend: '₹5,00,000 + PPI Offers',
    deadline: '2025-10-18',
    daysLeft: 3,
    requiredSkills: ['Algorithms', 'System Design', 'Web Architecture', 'Python'],
    preferredSkills: ['React', 'Distributed Systems'],
    eligibility: {
      minCgpa: 7.0,
      batches: [2023, 2024, 2025, 2026],
      branches: ['Any Engineering Branch'],
    },
    applicationUrl: 'https://unstop.com/hackathons/flipkart-grid-60',
    description: 'Flipkarts flagship engineering campus challenge offering PPIs for SDE-1 and Intern roles to top finalist teams.',
  },
];

export default function OpportunitiesPage() {
  const [profile, setProfile] = useState(null);
  const [studentSkills, setStudentSkills] = useState([]);
  const [studentCgpa, setStudentCgpa] = useState(8.5);
  const [studentBatch, setStudentBatch] = useState(2023);
  const [studentBranch, setStudentBranch] = useState('Computer Science and Engineering');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [savedOpportunities, setSavedOpportunities] = useState({});
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  // Load student profile to calculate real match scores & eligibility
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        if (res?.data) {
          setProfile(res.data);
          const edu = res.data.education || {};
          if (edu.cgpa?.value) setStudentCgpa(parseFloat(edu.cgpa.value));
          if (edu.graduationYear?.value) setStudentBatch(parseInt(edu.graduationYear.value));
          if (edu.branch?.value) setStudentBranch(edu.branch.value);

          // Flatten student skills
          const skillsDoc = res.data.skills || {};
          const flat = [];
          Object.values(skillsDoc).forEach((cat) => {
            const list = cat?.value;
            if (Array.isArray(list)) {
              flat.push(...list);
            }
          });
          setStudentSkills(flat);
        }
      } catch (err) {
        console.warn('Could not load profile for matching:', err);
      }
    };
    fetchProfile();

    // Load saved apps from localStorage
    const saved = localStorage.getItem('careerpilot_saved_opps');
    if (saved) {
      try {
        setSavedOpportunities(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleToggleSave = (opp) => {
    const updated = { ...savedOpportunities };
    if (updated[opp.id]) {
      delete updated[opp.id];
    } else {
      updated[opp.id] = {
        id: opp.id,
        title: opp.title,
        company: opp.company,
        type: opp.type,
        status: 'Saved',
        deadline: opp.deadline,
        savedAt: new Date().toISOString(),
      };
    }
    setSavedOpportunities(updated);
    localStorage.setItem('careerpilot_saved_opps', JSON.stringify(updated));
  };

  // Match Score calculation: (matched_skills / total_skills) * 80 + (eligible ? 20 : 0)
  const calculateMatch = (opp) => {
    const allOppSkills = [...opp.requiredSkills, ...(opp.preferredSkills || [])];
    const normalizedStudent = studentSkills.map((s) => s.toLowerCase());

    const matched = allOppSkills.filter((sk) =>
      normalizedStudent.some((st) => st.includes(sk.toLowerCase()) || sk.toLowerCase().includes(st))
    );
    const missing = allOppSkills.filter((sk) => !matched.includes(sk));

    const skillRatio = allOppSkills.length > 0 ? matched.length / allOppSkills.length : 0.8;
    const isEligible =
      studentCgpa >= (opp.eligibility.minCgpa || 0) &&
      (opp.eligibility.batches.includes(studentBatch) || opp.eligibility.batches.length === 0);

    const score = Math.round(skillRatio * 75 + (isEligible ? 25 : 5));
    const cappedScore = Math.min(Math.max(score, 45), 98);

    return {
      score: cappedScore,
      isEligible,
      matched,
      missing,
    };
  };

  // Filtering
  const filteredOpportunities = INITIAL_OPPORTUNITIES.filter((opp) => {
    // Type filter
    if (selectedType !== 'All' && opp.type !== selectedType) return false;
    // Mode filter
    if (selectedMode !== 'All' && opp.mode !== selectedMode) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = opp.title.toLowerCase().includes(q);
      const matchCompany = opp.company.toLowerCase().includes(q);
      const matchSkills = [...opp.requiredSkills, ...(opp.preferredSkills || [])].some((s) =>
        s.toLowerCase().includes(q)
      );
      if (!matchTitle && !matchCompany && !matchSkills) return false;
    }

    // Eligibility filter
    if (onlyEligible) {
      const isEligible =
        studentCgpa >= (opp.eligibility.minCgpa || 0) &&
        opp.eligibility.batches.includes(studentBatch);
      if (!isEligible) return false;
    }

    return true;
  });

  const categories = ['All', 'Internship', 'Full-Time', 'Scholarship', 'Hackathon', 'Contest'];
  const modes = ['All', 'Remote', 'Hybrid', 'Onsite'];

  return (
    <PageContainer>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Badge variant="purple" size="sm" dot>
              AI Opportunity Discovery Engine
            </Badge>
          </div>
          <h1 className="text-h1">Explore Career Opportunities</h1>
          <p className="text-small" style={{ fontSize: '0.95rem', marginTop: '0.35rem', maxWidth: '700px' }}>
            Curated internships, full-time openings, scholarships, and hackathons tailored to your verified academic background &amp; skills.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <Card variant="raised" style={{ marginBottom: '2rem' }}>
          <Card.Content style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Top row: Search + Eligible switch */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: '1', minWidth: '280px' }}>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by role, company, or skills (e.g. Python, React)..."
                  icon={<Search size={16} />}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={onlyEligible}
                    onChange={(e) => setOnlyEligible(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary-600)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    Eligible for My Profile Only
                  </span>
                </label>
              </div>
            </div>

            {/* Bottom row: Category Pills + Modes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {categories.map((cat) => {
                  const isActive = selectedType === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedType(cat)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        backgroundColor: isActive ? 'var(--color-primary-600)' : 'var(--color-bg)',
                        color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                        boxShadow: isActive ? 'var(--shadow-raised-sm)' : 'var(--shadow-sunken)',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Mode Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Work Mode:</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {modes.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSelectedMode(mode)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.775rem',
                        fontWeight: 500,
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: selectedMode === mode ? 'var(--color-surface)' : 'transparent',
                        color: selectedMode === mode ? 'var(--color-primary-600)' : 'var(--color-text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Opportunities Results Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredOpportunities.length === 0 ? (
            <Card variant="default">
              <Card.Content style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
                <Briefcase size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem' }} />
                <h3 className="text-h3" style={{ marginBottom: '0.35rem' }}>No matching opportunities found</h3>
                <p className="text-small" style={{ maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                  Try relaxing your search terms or uncheck the eligibility filter to view broader listings.
                </p>
                <Button variant="secondary" onClick={() => { setSearchQuery(''); setSelectedType('All'); setSelectedMode('All'); setOnlyEligible(false); }}>
                  Reset Filters
                </Button>
              </Card.Content>
            </Card>
          ) : (
            filteredOpportunities.map((opp) => {
              const { score, isEligible, matched, missing } = calculateMatch(opp);
              const isSaved = !!savedOpportunities[opp.id];

              return (
                <Card
                  key={opp.id}
                  variant="raised"
                  style={{
                    transition: 'all var(--transition-normal)',
                    borderLeft: isEligible ? '4px solid var(--color-success)' : '4px solid var(--color-warning)',
                  }}
                >
                  <Card.Content style={{ padding: '1.5rem 1.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        {/* Company Avatar / Logo */}
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.15rem',
                            color: 'var(--color-primary-600)',
                            boxShadow: 'var(--shadow-raised-sm)',
                            flexShrink: 0,
                          }}
                        >
                          {opp.company.slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                              {opp.title}
                            </h2>
                            <Badge variant="purple" size="sm">{opp.type}</Badge>
                            <Badge variant={opp.mode === 'Remote' ? 'success' : 'neutral'} size="sm">{opp.mode}</Badge>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{opp.company}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <MapPin size={14} />
                              {opp.location}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, color: 'var(--color-success-dark)' }}>
                              {opp.stipend}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right match score & eligibility status */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: score >= 80 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                            color: score >= 80 ? 'var(--color-success-dark)' : 'var(--color-primary-600)',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            boxShadow: 'var(--shadow-raised-sm)',
                          }}
                        >
                          <Sparkles size={14} />
                          <span>{score}% Match</span>
                        </div>

                        <span style={{ fontSize: '0.775rem', color: isEligible ? 'var(--color-success-dark)' : 'var(--color-warning-dark)', fontWeight: 600 }}>
                          {isEligible ? '✓ Profile Strictly Eligible' : '⚠️ Eligibility criteria pending'}
                        </span>
                      </div>
                    </div>

                    {/* Brief description */}
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                      {opp.description}
                    </p>

                    {/* Skills match stream */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Required Skills:</span>
                      {opp.requiredSkills.map((sk) => {
                        const isMatched = matched.some((m) => m.toLowerCase() === sk.toLowerCase());
                        return (
                          <Badge
                            key={sk}
                            variant={isMatched ? 'success' : 'neutral'}
                            size="sm"
                          >
                            {isMatched ? `✓ ${sk}` : sk}
                          </Badge>
                        );
                      })}
                    </div>

                    {/* Footer bar with deadline and CTA buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: opp.daysLeft <= 5 ? 'var(--color-danger)' : 'var(--color-text-muted)', fontWeight: opp.daysLeft <= 5 ? 700 : 500 }}>
                        <Clock size={15} />
                        <span>Deadline: {opp.deadline} ({opp.daysLeft} days left)</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <Button
                          variant={isSaved ? 'success' : 'ghost'}
                          size="sm"
                          icon={isSaved ? <Check size={14} /> : <BookmarkPlus size={14} />}
                          onClick={() => handleToggleSave(opp)}
                        >
                          {isSaved ? 'Tracked' : 'Save'}
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedOpportunity(opp)}
                        >
                          View Criteria
                        </Button>

                        <a href={opp.applicationUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                          <Button variant="primary" size="sm" icon={<ExternalLink size={14} />}>
                            Apply Link
                          </Button>
                        </a>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              );
            })
          )}
        </div>

        {/* Opportunity Detail Drawer / Modal */}
        {selectedOpportunity && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '1.5rem',
            }}
            onClick={() => setSelectedOpportunity(null)}
          >
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-raised-lg)',
                padding: '2rem',
                border: '1px solid var(--border-control)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <Badge variant="purple" size="sm" style={{ marginBottom: '0.4rem' }}>{selectedOpportunity.type}</Badge>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>{selectedOpportunity.title}</h2>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-primary-600)', marginTop: '0.2rem' }}>
                    {selectedOpportunity.company} • {selectedOpportunity.location}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOpportunity(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Strict Eligibility Breakdown */}
              <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GraduationCap size={18} color="var(--color-primary-600)" />
                  Eligibility Criteria Verification
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Min CGPA: </span>
                    <span style={{ fontWeight: 600 }}>{selectedOpportunity.eligibility.minCgpa > 0 ? selectedOpportunity.eligibility.minCgpa : 'No Cutoff'}</span>
                    {studentCgpa >= selectedOpportunity.eligibility.minCgpa && (
                      <span style={{ color: 'var(--color-success-dark)', fontWeight: 700 }}> (You: {studentCgpa} ✓)</span>
                    )}
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Eligible Batches: </span>
                    <span style={{ fontWeight: 600 }}>{selectedOpportunity.eligibility.batches.join(', ')}</span>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Permitted Branches: </span>
                    <span style={{ fontWeight: 600 }}>{selectedOpportunity.eligibility.branches.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Role Description</h4>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
                  {selectedOpportunity.description}
                </p>
              </div>

              {/* Skills */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Key Technology Stack</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedOpportunity.requiredSkills.map((sk) => (
                    <Badge key={sk} variant="primary" size="sm">{sk}</Badge>
                  ))}
                  {(selectedOpportunity.preferredSkills || []).map((sk) => (
                    <Badge key={sk} variant="neutral" size="sm">Preferred: {sk}</Badge>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button variant="ghost" onClick={() => setSelectedOpportunity(null)}>
                  Close
                </Button>
                <a href={selectedOpportunity.applicationUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" icon={<ExternalLink size={15} />}>
                    Proceed to Application
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
