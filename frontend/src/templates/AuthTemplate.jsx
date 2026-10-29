import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Compass, Sparkles, Shield, ArrowLeft } from 'lucide-react';
import { AvatarStack } from '../components/ui';
import { fadeUp } from '../motion/variants';

export default function AuthTemplate({
  title,
  subtitle,
  children,
  badgeText = 'Mission Control Access',
}) {
  const cohortUsers = [
    { id: 1, name: 'Siddharth' },
    { id: 2, name: 'Priya' },
    { id: 3, name: 'Rohan' },
    { id: 4, name: 'Ananya' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left Form Panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2.5rem 1.5rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Logo brand & Back link */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              <img
                src="/careerpilot-logo.png"
                alt="CareerPilot AI"
                style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              />
            </Link>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </Link>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: '2rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-cyan)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.5rem',
              }}
            >
              <Sparkles size={14} />
              <span>{badgeText}</span>
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                margin: '0 0 0.5rem',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Body */}
          {children}
        </div>
      </div>

      {/* Right Animated Artwork Panel (Desktop only >= 1024px) */}
      <div
        className="auth-art-panel"
        style={{
          flex: 1.15,
          position: 'relative',
          background: 'linear-gradient(135deg, #020617 0%, #071a45 50%, #0b2f74 100%)',
          borderLeft: '1px solid rgba(148, 163, 184, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '4rem',
          overflow: 'hidden',
        }}
      >
        {/* Orbital rings decoration */}
        <div
          style={{
            position: 'absolute',
            width: '460px',
            height: '460px',
            borderRadius: '50%',
            border: '1px dashed rgba(0, 242, 254, 0.18)',
            animation: 'orbitSpin 35s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            animation: 'orbitSpin 25s linear infinite reverse',
          }}
        />

        {/* Ambient Glow */}
        <div
          style={{
            position: 'absolute',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 242, 254, 0.25) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 75%)',
            filter: 'blur(32px)',
          }}
        />

        {/* Floating Telemetry Glass Card */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          style={{
            position: 'relative',
            zIndex: 5,
            maxWidth: '420px',
            background: 'var(--surface-glass, rgba(15, 23, 42, 0.85))',
            border: '1px solid var(--border-control)',
            backdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-2xl)',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <img
              src="/careerpilot-logo.png"
              alt="CareerPilot AI"
              style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-display)', color: '#ffffff' }}>CareerPilot AI</div>
              <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                DISCOVER • PREPARE • GROW
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--text-primary)', margin: '0 0 1.5rem' }}>
            "CareerPilot’s deterministic eligibility check saved me 40+ hours by eliminating roles I was cut off from, and surfaced my Stripe interview in week 2."
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-hairline, var(--border))' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>2,400+ Verified Students</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Class of 2025 & 2026</div>
            </div>
            <AvatarStack users={cohortUsers} size={32} />
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 1023px) {
          .auth-art-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
