import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer" style={{ padding: '3.5rem 1.5rem 2rem', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem', marginBottom: '3rem', textAlign: 'left' }}>
        {/* Brand Column */}
        <div style={{ maxWidth: '320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            <Compass size={24} color="var(--primary)" />
            <span>CareerPilot AI</span>
          </div>
          <p className="font-small" style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
            The intelligent career discovery and application copilot for students. Discover curated internships, verify eligibility, and track applications with ease.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
            <ShieldCheck size={16} />
            <span>Encrypted &amp; Student-First</span>
          </div>
        </div>

        {/* Column 1 */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Platform
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <li><Link to="/opportunities" className="nav-link">Discover Opportunities</Link></li>
            <li><Link to="/applications" className="nav-link">Application Tracker</Link></li>
            <li><Link to="/ai-advisor" className="nav-link">AI Career Advisor</Link></li>
            <li><Link to="/skill-gap" className="nav-link">Skill Gap Analysis</Link></li>
          </ul>
        </div>

        {/* Column 2 */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Opportunities
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <li><Link to="/opportunities" className="nav-link">Software Engineering Internships</Link></li>
            <li><Link to="/opportunities" className="nav-link">Early Career Graduate Roles</Link></li>
            <li><Link to="/opportunities" className="nav-link">Global Hackathons &amp; Contests</Link></li>
            <li><Link to="/opportunities" className="nav-link">STEM Scholarships</Link></li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Account
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <li><Link to="/login" className="nav-link">Student Sign In</Link></li>
            <li><Link to="/register" className="nav-link">Create Account</Link></li>
            <li><Link to="/dashboard" className="nav-link">Student Dashboard</Link></li>
          </ul>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        © {new Date().getFullYear()} CareerPilot AI. All rights reserved. Intelligent Career Discovery &amp; Application Management Platform.
      </div>
    </footer>
  );
}
