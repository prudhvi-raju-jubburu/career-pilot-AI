import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Sparkles,
  TrendingUp,
  FileText,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Users,
  Award,
  Zap,
  Radio,
  Clock,
  Layers
} from 'lucide-react';
import { formatOpportunityLocation, getSafeFieldValue } from '../../utils';

export default function AbekusHeroDeck({
  totalOpps = 0,
  userName = 'Candidate',
  user = null,
  profile = null,
  opportunities = [],
  targetRoleTitle = 'Full Stack Developer',
  readinessScore = null,
  pipeline = { saved: 0, applied: 0, interview: 0, offer: 0 },
  skillGap = null
}) {
  const navigate = useNavigate();
  const [activeDeck, setActiveDeck] = useState(0);

  // Auto-cycle deck every 6 seconds if user is idle
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDeck((prev) => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Compute real candidate attributes safely ensuring primitives for JSX rendering
  const candidateFullName =
    getSafeFieldValue(user?.name) ||
    getSafeFieldValue(profile?.personal?.full_name) ||
    getSafeFieldValue(profile?.personal?.fullName) ||
    getSafeFieldValue(userName) ||
    'Candidate';

  const candidateLocation =
    getSafeFieldValue(profile?.personal?.location) ||
    'India';

  const safeTargetRoleTitle =
    getSafeFieldValue(targetRoleTitle) ||
    'Full Stack Developer';

  const rawSkills = [];
  if (Array.isArray(profile?.skills)) {
    profile.skills.forEach((sk) => {
      const val = getSafeFieldValue(sk);
      if (val) rawSkills.push(val);
    });
  } else if (profile?.skills && typeof profile.skills === 'object') {
    Object.values(profile.skills).forEach((cat) => {
      const items = Array.isArray(cat) ? cat : Array.isArray(cat?.value) ? cat.value : [];
      items.forEach((sk) => {
        const val = getSafeFieldValue(sk);
        if (val) rawSkills.push(val);
      });
    });
  }

  const candidateSkills = Array.from(new Set(rawSkills))
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .slice(0, 5);


  const topOpps = (opportunities || []).slice(0, 3);

  return (
    <div
      style={{
        borderRadius: 'clamp(20px, 3.5vw, 32px)',
        background: '#ffffff',
        border: '1px solid var(--lx-line)',
        padding: 'clamp(1.25rem, 3.5vw, 2.5rem)',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 36px rgba(14, 17, 22, 0.05)',
      }}
    >
      {/* Background subtle radial ambient gradients */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255, 196, 0, 0.12)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-120px',
          left: '-80px',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'rgba(43, 87, 255, 0.08)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      <div className="lx-hero-deck-grid">
        {/* Left Hero Message & CTAs */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <img
              src="/careerpilot-logo.png"
              alt="CareerPilot AI"
              style={{ height: '46px', width: 'auto', objectFit: 'contain' }}
            />
            <span className="lx-pill lx-pill-gold">
              <Sparkles size={13} />
              <span>CAREERPILOT AI SUITE</span>
            </span>
            <span className="lx-pill lx-pill-green">
              <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>DISCOVER • PREPARE • GROW</span>
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.4rem, 4vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.04em',
              color: 'var(--lx-ink)',
              margin: '0 0 1rem 0',
            }}
          >
            Level Up <br />
            Your{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '-4px',
                  right: '-4px',
                  bottom: '6px',
                  height: '14px',
                  background: 'var(--lx-gold)',
                  borderRadius: '4px',
                  zIndex: -1,
                }}
              />
              Career.
            </span>
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: 'var(--lx-txt-2)',
              maxWidth: '520px',
              margin: '0 0 1.75rem 0',
            }}
          >
            Verified skill roadmaps, live application pipeline radar, an <strong>AI resume builder (98% ATS compliant)</strong>, and{' '}
            <strong>{Number(totalOpps).toLocaleString('en-IN')}+ live openings</strong>. Track the role, bridge the gap, get the offer.
          </p>

          {/* Hero Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/resume" style={{ textDecoration: 'none' }}>
              <button className="lx-btn-primary">
                <span>Build My Resume</span>
                <span className="arrow-circle">
                  <ArrowRight size={17} />
                </span>
              </button>
            </Link>

            <Link to="/opportunities" style={{ textDecoration: 'none' }}>
              <button className="lx-btn-outline">
                Explore Jobs ↗
              </button>
            </Link>

            <Link to="/skill-gap" style={{ textDecoration: 'none' }}>
              <button
                className="lx-btn-gold"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
              >
                <span>Skill Arena</span>
                <span className="arrow-circle" style={{ width: '28px', height: '28px' }}>
                  <TrendingUp size={14} />
                </span>
              </button>
            </Link>
          </div>

          {/* Floating Feature Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--lx-txt-2)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#137a44' }} />
              <span>Realtime feeds from 6 Indian job connectors</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--lx-txt-2)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FFC400' }} />
              <span>Verified ATS Compliance</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--lx-txt-2)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2B57FF' }} />
              <span>MongoDB Synced Pipeline</span>
            </div>
          </div>
        </div>

        {/* Right 3D Interactive Card Deck */}
        <div className="lx-hero-deck-right" style={{ position: 'relative' }}>
          {/* Deck Container with Gold Backdrop */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '28px',
              backgroundColor: 'var(--lx-gold)',
              padding: '1.5rem',
              boxShadow: '0 20px 48px rgba(255, 196, 0, 0.28)',
              overflow: 'hidden',
            }}
          >
            {/* Top Tag */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lx-ink)' }}>
                {activeDeck === 0 ? 'Live Opportunities' : activeDeck === 1 ? 'Skill Track' : activeDeck === 2 ? 'Pipeline Radar' : 'AI Resume'}
              </span>
              <span
                style={{
                  background: 'rgba(14, 17, 22, 0.1)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--lx-ink)',
                }}
              >
                Card {activeDeck + 1} of 4
              </span>
            </div>

            {/* Deck Card Display */}
            <div style={{ position: 'relative', height: '300px' }}>
              <AnimatePresence mode="wait">
                {/* Card 0: Real Top Opportunities */}
                {activeDeck === 0 && (
                  <motion.div
                    key="card-jobs"
                    initial={{ opacity: 0, y: 12, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, y: -12, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      borderRadius: '20px',
                      backgroundColor: '#ffffff',
                      boxShadow: 'var(--shadow-lx-deck)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--lx-txt-3)' }}>
                        Live Jobs Radar
                      </span>
                      <span className="lx-pill lx-pill-green" style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}>
                        <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Verified Openings
                      </span>
                    </div>

                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--lx-ink)', margin: '0.35rem 0 0.85rem 0', lineHeight: 1 }}>
                      {Number(totalOpps).toLocaleString('en-IN')}
                    </div>

                    <div style={{ display: 'grid', gap: '0.45rem', flex: 1, overflow: 'hidden' }}>
                      {topOpps.length > 0 ? (
                        topOpps.map((opp, i) => {
                          const paletteColors = ['var(--lx-blue)', 'var(--lx-ink)', 'var(--lx-gold)'];
                          const salaryStr = opp.compensationString || (opp.compensation?.min_amount ? `₹${Number(opp.compensation.min_amount).toLocaleString('en-IN')}/mo` : 'Best in Market');
                          return (
                            <div
                              key={opp.id || i}
                              onClick={() => opp.id && navigate(`/opportunities?selected=${opp.id}`)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.65rem',
                                padding: '0.5rem 0.65rem',
                                borderRadius: '10px',
                                background: 'var(--lx-surface-2)',
                                cursor: 'pointer',
                              }}
                            >
                              <div
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '6px',
                                  background: paletteColors[i % paletteColors.length],
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  flexShrink: 0,
                                }}
                              >
                                {(opp.company || 'T').charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--lx-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {opp.title}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--lx-txt-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {opp.company} · {formatOpportunityLocation(opp)}
                                </div>
                              </div>
                              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#137a44', flexShrink: 0 }}>
                                {salaryStr}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.82rem', color: 'var(--lx-txt-3)' }}>
                          Streaming real-time Indian tech roles...
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Card 1: Skill Track & Readiness */}
                {activeDeck === 1 && (
                  <motion.div
                    key="card-courses"
                    initial={{ opacity: 0, y: 12, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, y: -12, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      borderRadius: '20px',
                      backgroundColor: '#ffffff',
                      boxShadow: 'var(--shadow-lx-deck)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ background: 'linear-gradient(135deg, #2B57FF 0%, #1436C4 100%)', padding: '0.85rem 1rem', color: '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ background: '#ffffff', color: '#2B57FF', padding: '0.15rem 0.45rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem' }}>
                          TARGET
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {safeTargetRoleTitle}
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span style={{ background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontWeight: 600 }}>Profile Readiness</span>
                        <span style={{ fontWeight: 700, color: '#137a44' }}>
                          {readinessScore !== null ? `${readinessScore}% Match` : 'Active Evaluation'}
                        </span>
                      </div>

                      <div style={{ margin: '0.75rem 0', height: '6px', borderRadius: '9999px', background: '#E2E8F0', overflow: 'hidden' }}>
                        <div style={{ width: `${readinessScore || 85}%`, height: '100%', background: 'var(--lx-blue)', borderRadius: '9999px' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--lx-txt-3)' }}>
                        <span>{(profile?.skills || []).length} Verified Skills</span>
                        <span style={{ fontWeight: 700, color: 'var(--lx-ink)' }}>Based on hiring data</span>
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #EDEFF3' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--lx-txt-2)' }}>Skill Gap Insights</span>
                        <Link to="/skill-gap" style={{ textDecoration: 'none' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--lx-blue)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            Inspect Matrix →
                          </span>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Card 2: Real Application Pipeline Status */}
                {activeDeck === 2 && (
                  <motion.div
                    key="card-pipeline"
                    initial={{ opacity: 0, y: 12, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, y: -12, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      borderRadius: '20px',
                      backgroundColor: 'var(--lx-ink)',
                      color: '#ffffff',
                      boxShadow: 'var(--shadow-lx-deck-dark)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lx-gold)' }}>
                        Pipeline Telemetry
                      </span>
                      <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem' }}>
                        MongoDB Synced
                      </span>
                    </div>

                    <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.65rem' }}>
                      Candidate Application Pipeline
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.2rem' }}>
                      Real-time stage tracking and recruiter telemetry
                    </div>

                    <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', flex: 1 }}>
                      <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.5rem 0.65rem', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Applied</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>{pipeline.applied || 0}</div>
                      </div>
                      <div style={{ background: 'rgba(43, 87, 255, 0.25)', border: '1px solid rgba(43, 87, 255, 0.5)', padding: '0.5rem 0.65rem', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.68rem', color: '#93C5FD', textTransform: 'uppercase' }}>Interviewing</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>{pipeline.interview || 0}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.5rem 0.65rem', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Saved Roles</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>{pipeline.saved || 0}</div>
                      </div>
                      <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '0.5rem 0.65rem', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.68rem', color: '#A7F3D0', textTransform: 'uppercase' }}>Offers</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFC400' }}>{pipeline.offer || 0}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Card 3: Real Candidate Profile AI Resume */}
                {activeDeck === 3 && (
                  <motion.div
                    key="card-resume"
                    initial={{ opacity: 0, y: 12, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, y: -12, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      borderRadius: '20px',
                      backgroundColor: '#2B57FF',
                      color: '#ffffff',
                      boxShadow: 'var(--shadow-lx-deck)',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1rem', color: 'var(--lx-ink)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--lx-ink)' }}>{candidateFullName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--lx-txt-3)' }}>{safeTargetRoleTitle} · {candidateLocation}</div>
                        </div>
                        <span className="lx-pill lx-pill-green" style={{ padding: '0.15rem 0.5rem', fontSize: '0.68rem', fontWeight: 800 }}>
                          98% ATS
                        </span>
                      </div>

                      <div style={{ height: '1px', background: '#EDEFF3', margin: '0.65rem 0' }} />

                      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--lx-blue)', letterSpacing: '0.06em' }}>
                        Skills Verified
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', margin: '0.35rem 0 0.65rem 0' }}>
                        {candidateSkills.length > 0 ? (
                          candidateSkills.map((sk, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: '#EFF6FF',
                                color: '#2B57FF',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 600,
                              }}
                            >
                              {sk}
                            </span>
                          ))
                        ) : (
                          <>
                            <span style={{ background: '#EFF6FF', color: '#2B57FF', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600 }}>React</span>
                            <span style={{ background: '#EFF6FF', color: '#2B57FF', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600 }}>Node.js</span>
                            <span style={{ background: '#ECFDF5', color: '#137a44', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>Python</span>
                          </>
                        )}
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #EDEFF3' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--lx-txt-3)' }}>Tailored in seconds</span>
                        <Link to="/resume" style={{ textDecoration: 'none' }}>
                          <span style={{ background: 'var(--lx-blue)', color: '#ffffff', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>
                            Open Builder →
                          </span>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Deck Navigation Dots */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginTop: '0.5rem' }}>
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveDeck(idx)}
                  style={{
                    height: '6px',
                    width: activeDeck === idx ? '24px' : '6px',
                    borderRadius: '9999px',
                    backgroundColor: activeDeck === idx ? 'var(--lx-ink)' : 'rgba(14, 17, 22, 0.25)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  title={`View deck card ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
