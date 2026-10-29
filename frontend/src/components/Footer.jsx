import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Sparkles, Shield, Heart } from 'lucide-react';

const columnVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' }
  })
};

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="footer"
      style={{
        padding: '4.5rem 1.5rem 2rem',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        position: 'relative',
        color: '#0f172a',
      }}
    >
      <div className="mavens-specular-line" />

      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '3rem',
          marginBottom: '3.5rem',
          textAlign: 'left',
        }}
      >
        {/* Brand Column */}
        <motion.div
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={columnVariants}
          style={{ maxWidth: '340px' }}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', width: 'fit-content' }}
          >
            <img
              src="/careerpilot-logo.png"
              alt="CareerPilot AI"
              style={{
                height: '42px',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '0.15rem 0.45rem',
                borderRadius: '9999px',
                background: 'var(--lx-blue)',
                color: '#ffffff',
                letterSpacing: '0.08em',
              }}
            >
              AI
            </span>
          </motion.div>

          <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Transformation architected for intelligent career scale. Deploy enterprise-grade AI algorithms to discover verified tier-1 roles, audit resumes, and master skill gaps.
          </p>
        </motion.div>

        {/* Column 1: AI Solutions */}
        <motion.div
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={columnVariants}
        >
          <div style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem', color: '#0f172a' }}>
            AI Solutions
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#475569', padding: 0, margin: 0 }}>
            {[
              { to: '/ai-advisor', label: 'AI Career Copilot' },
              { to: '/opportunities', label: 'Deterministic Match Engine' },
              { to: '/skill-gap', label: 'Skill Gap Telemetry Radar' },
              { to: '/applications', label: '5-Stage Kanban Synchronization' },
            ].map((link, idx) => (
              <motion.li key={idx} whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <Link
                  to={link.to}
                  style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s ease', display: 'inline-block' }}
                  onMouseEnter={(e) => (e.target.style.color = '#255eff')}
                  onMouseLeave={(e) => (e.target.style.color = '#475569')}
                >
                  {link.label}
                </Link>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Column 2: Opportunities */}
        <motion.div
          custom={2}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={columnVariants}
        >
          <div style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem', color: '#0f172a' }}>
            Target Pipelines
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#475569', padding: 0, margin: 0 }}>
            {[
              { to: '/opportunities', label: 'Software Engineering Internships' },
              { to: '/opportunities', label: 'AI Research & Machine Learning' },
              { to: '/opportunities', label: 'Global Hackathons & Contests' },
              { to: '/opportunities', label: 'National STEM Fellowships' },
            ].map((link, idx) => (
              <motion.li key={idx} whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <Link
                  to={link.to}
                  style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s ease', display: 'inline-block' }}
                  onMouseEnter={(e) => (e.target.style.color = '#255eff')}
                  onMouseLeave={(e) => (e.target.style.color = '#475569')}
                >
                  {link.label}
                </Link>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Column 3: Account */}
        <motion.div
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={columnVariants}
        >
          <div style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem', color: '#0f172a' }}>
            Student Portal
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#475569', padding: 0, margin: 0 }}>
            {[
              { to: '/login', label: 'Sign In' },
              { to: '/register', label: 'Create Free Account' },
              { to: '/dashboard', label: 'Student Mission Control' },
              { to: '/settings', label: 'Security & Privacy Settings' },
            ].map((link, idx) => (
              <motion.li key={idx} whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <Link
                  to={link.to}
                  style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s ease', display: 'inline-block' }}
                  onMouseEnter={(e) => (e.target.style.color = '#255eff')}
                  onMouseLeave={(e) => (e.target.style.color = '#475569')}
                >
                  {link.label}
                </Link>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Bottom Bar without fake uptime text */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.35, duration: 0.5 }}
        style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: '1.75rem',
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.8125rem',
          color: '#64748b',
        }}
      >
        <div>
          © {new Date().getFullYear()} CareerPilot AI. Transformation Architected for Intelligent Scale. All rights reserved.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8125rem' }}>
          <Link
            to="/settings"
            style={{ color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.target.style.color = '#255eff')}
            onMouseLeave={(e) => (e.target.style.color = '#64748b')}
          >
            Privacy Policy
          </Link>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <Link
            to="/settings"
            style={{ color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.target.style.color = '#255eff')}
            onMouseLeave={(e) => (e.target.style.color = '#64748b')}
          >
            Terms of Service
          </Link>
        </div>
      </motion.div>
    </motion.footer>
  );
}

