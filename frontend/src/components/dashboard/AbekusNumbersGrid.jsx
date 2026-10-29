import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const cardFadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export default function AbekusNumbersGrid({
  totalOpps = 0,
  verifiedSkillsCount = 0,
  trackedApplicationsCount = 0,
  interviewsScheduled = 0,
  offersCount = 0,
  readinessScore = null,
  sourcesCount = 6,
  showHeader = false,
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ marginBottom: '1.75rem' }}
    >
      {showHeader && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lx-blue)', marginBottom: '0.2rem' }}>
              Live Telemetry & Verified Signals
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--lx-ink)', margin: 0, letterSpacing: '-0.02em' }}>
              Real-time Metrics in Your Career Engine
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--lx-txt-2)', maxWidth: '380px' }}>
            Real pipeline metrics synced with your profile, live job feeds, and MongoDB applications.
          </p>
        </div>
      )}

      {/* Top 4 Bento Blocks - Matching Image 2 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
          gap: '0.85rem',
          marginBottom: '0.85rem',
        }}
      >
        {/* Block 1: Gold Live Openings */}
        <motion.div
          variants={cardFadeUp}
          whileHover={{
            y: -4,
            boxShadow: '0 14px 32px rgba(255, 196, 0, 0.35)',
            transition: { duration: 0.22, ease: 'easeOut' },
          }}
          whileTap={{ scale: 0.985 }}
          style={{
            backgroundColor: 'var(--lx-gold, #FFC400)',
            borderRadius: '18px',
            padding: '1.15rem 1.25rem',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '138px',
            boxShadow: '0 4px 16px rgba(255, 196, 0, 0.2)',
            cursor: 'default',
          }}
        >
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A5A00' }}>
              LIVE OPENINGS ON RADAR
            </div>
            <div style={{ fontSize: '2.15rem', fontWeight: 800, color: '#0E1116', margin: '0.25rem 0', lineHeight: 1 }}>
              {Number(totalOpps).toLocaleString('en-IN')}
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#453200', lineHeight: 1.35 }}>
              Active tech jobs and internships aggregated in database.
            </p>
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7A5A00', marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#137a44' }} className="animate-pulse" />
            <span>Synced across {sourcesCount} live job sources</span>
          </div>
        </motion.div>

        {/* Block 2: Ink Black Verified Skills */}
        <motion.div
          variants={cardFadeUp}
          whileHover={{
            y: -4,
            boxShadow: '0 14px 32px rgba(14, 17, 22, 0.32)',
            transition: { duration: 0.22, ease: 'easeOut' },
          }}
          whileTap={{ scale: 0.985 }}
          style={{
            backgroundColor: 'var(--lx-ink, #0E1116)',
            color: '#ffffff',
            borderRadius: '18px',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '138px',
            boxShadow: '0 4px 16px rgba(14, 17, 22, 0.15)',
            cursor: 'default',
          }}
        >
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lx-gold, #FFC400)' }}>
              VERIFIED PROFILE SKILLS
            </div>
            <div style={{ fontSize: '2.15rem', fontWeight: 800, color: '#ffffff', margin: '0.25rem 0', lineHeight: 1 }}>
              {verifiedSkillsCount}
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.35 }}>
              Technical competencies verified on your candidate profile.
            </p>
          </div>
          <Link
            to="/profile"
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--lx-gold, #FFC400)',
              marginTop: '0.65rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>Manage verified skills</span>
            <ArrowUpRight size={13} />
          </Link>
        </motion.div>

        {/* Block 3: White Tracked Applications */}
        <motion.div
          variants={cardFadeUp}
          whileHover={{
            y: -4,
            boxShadow: '0 14px 32px rgba(43, 87, 255, 0.12)',
            borderColor: 'var(--lx-blue, #2B57FF)',
            transition: { duration: 0.22, ease: 'easeOut' },
          }}
          whileTap={{ scale: 0.985 }}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '18px',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '138px',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'default',
            transition: 'border-color 0.22s ease',
          }}
        >
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lx-blue, #2B57FF)' }}>
              TRACKED APPLICATIONS
            </div>
            <div style={{ fontSize: '2.15rem', fontWeight: 800, color: 'var(--lx-ink, #0E1116)', margin: '0.25rem 0', lineHeight: 1 }}>
              {trackedApplicationsCount}
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--lx-txt-2, #64748B)', lineHeight: 1.35 }}>
              Active roles tracked in your real-time recruitment pipeline.
            </p>
          </div>
          <Link
            to="/applications"
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--lx-blue, #2B57FF)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginTop: '0.65rem',
            }}
          >
            <span>View pipeline tracker</span>
            <ArrowUpRight size={13} />
          </Link>
        </motion.div>

        {/* Block 4: Cobalt Readiness / ATS Match */}
        <motion.div
          variants={cardFadeUp}
          whileHover={{
            y: -4,
            boxShadow: '0 14px 32px rgba(43, 87, 255, 0.38)',
            transition: { duration: 0.22, ease: 'easeOut' },
          }}
          whileTap={{ scale: 0.985 }}
          style={{
            backgroundColor: 'var(--lx-blue, #2B57FF)',
            color: '#ffffff',
            borderRadius: '18px',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '138px',
            boxShadow: '0 6px 20px rgba(43, 87, 255, 0.25)',
            cursor: 'default',
          }}
        >
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.85)' }}>
              ROLE READINESS SCORE
            </div>
            <div style={{ fontSize: '2.15rem', fontWeight: 800, color: '#ffffff', margin: '0.25rem 0', lineHeight: 1 }}>
              {readinessScore !== null ? `${readinessScore}%` : '5%'}
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.35 }}>
              Calculated against live Indian tech hiring benchmarks.
            </p>
          </div>
          <Link
            to="/skill-gap"
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--lx-gold, #FFC400)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginTop: '0.65rem',
            }}
          >
            <span>Analyze skill gaps</span>
            <ArrowUpRight size={13} />
          </Link>
        </motion.div>
      </div>

      {/* Sub 4 Stat Counters - Real Telemetry Matching Image 2 Row 2 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
          gap: '0.85rem',
        }}
      >
        <motion.div
          variants={cardFadeUp}
          whileHover={{
            y: -3,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
            borderColor: 'var(--lx-line-strong, #CBD5E1)',
            transition: { duration: 0.2 },
          }}
          style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '0.85rem 1.15rem',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'default',
            transition: 'border-color 0.2s ease',
          }}
        >
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--lx-ink, #0E1116)', lineHeight: 1.1 }}>
            {sourcesCount} Feeds
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--lx-txt-2, #64748B)', marginTop: '0.2rem' }}>
            Live job connectors streaming
          </div>
        </motion.div>

        <motion.div
          variants={cardFadeUp}
          whileHover={{
            y: -3,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
            borderColor: 'var(--lx-line-strong, #CBD5E1)',
            transition: { duration: 0.2 },
          }}
          style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '0.85rem 1.15rem',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'default',
            transition: 'border-color 0.2s ease',
          }}
        >
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--lx-ink, #0E1116)', lineHeight: 1.1 }}>
            {interviewsScheduled}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--lx-txt-2, #64748B)', marginTop: '0.2rem' }}>
            Interviews & assessments active
          </div>
        </motion.div>

        <motion.div
          variants={cardFadeUp}
          whileHover={{
            y: -3,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
            borderColor: 'var(--lx-line-strong, #CBD5E1)',
            transition: { duration: 0.2 },
          }}
          style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '0.85rem 1.15rem',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'default',
            transition: 'border-color 0.2s ease',
          }}
        >
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--lx-ink, #0E1116)', lineHeight: 1.1 }}>
            {offersCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--lx-txt-2, #64748B)', marginTop: '0.2rem' }}>
            Job & internship offers secured
          </div>
        </motion.div>

        <motion.div
          variants={cardFadeUp}
          whileHover={{
            y: -3,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
            borderColor: 'var(--lx-line-strong, #CBD5E1)',
            transition: { duration: 0.2 },
          }}
          style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '0.85rem 1.15rem',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'default',
            transition: 'border-color 0.2s ease',
          }}
        >
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--lx-ink, #0E1116)', lineHeight: 1.1 }}>
            98% ATS
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--lx-txt-2, #64748B)', marginTop: '0.2rem' }}>
            Resume engine compliance rate
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
