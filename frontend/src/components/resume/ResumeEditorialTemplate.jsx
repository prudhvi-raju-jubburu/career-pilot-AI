import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, Zap, Award } from 'lucide-react';

export default function ResumeEditorialTemplate({ resumeData }) {
  const {
    personal = {},
    summary = '',
    experience = [],
    education = [],
    skills = [],
    projects = [],
    certifications = []
  } = resumeData;

  return (
    <div
      className="resume-paper"
      style={{
        width: '100%',
        maxWidth: '800px',
        minHeight: '1050px',
        backgroundColor: '#ffffff',
        fontFamily: "'Inter', sans-serif",
        color: '#0E1116',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Editorial Header Banner */}
      <header
        style={{
          background: 'linear-gradient(135deg, #0E1116 0%, #1A2333 100%)',
          color: '#ffffff',
          padding: '2.5rem 2.5rem 2rem 2.5rem',
          borderBottom: '4px solid #FFC400',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(255, 196, 0, 0.2)',
                color: '#FFC400',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}
            >
              Verified Candidate
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em', color: '#ffffff' }}>
              {personal.fullName || 'Your Name'}
            </h1>
            <div style={{ fontSize: '1rem', color: '#93C5FD', fontWeight: 600, marginTop: '0.25rem' }}>
              {personal.targetTitle || 'Full Stack Software Engineer'}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.35rem', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.85)', textAlign: 'right' }}>
            {personal.email && <div>{personal.email}</div>}
            {personal.phone && <div>{personal.phone}</div>}
            {personal.location && <div>{personal.location}</div>}
            {personal.linkedin && <div>{personal.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</div>}
            {personal.github && <div>{personal.github.replace(/^https?:\/\/(www\.)?/, '')}</div>}
          </div>
        </div>
      </header>

      {/* Main Two-Column Editorial Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '2rem', padding: '2rem 2.5rem', flex: 1 }}>
        {/* Left Primary Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {summary && (
            <section>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2B57FF', margin: '0 0 0.4rem 0' }}>
                Profile Overview
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.6, color: '#4E5768' }}>
                {summary}
              </p>
            </section>
          )}

          {experience.length > 0 && (
            <section>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2B57FF', margin: '0 0 0.75rem 0' }}>
                Professional Experience
              </h3>
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                {experience.map((exp, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0E1116' }}>
                        {exp.role || exp.title}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#7E899C', fontWeight: 600 }}>
                        {exp.period || `${exp.startDate} - ${exp.endDate || 'Present'}`}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#2B57FF', fontWeight: 600, marginBottom: '0.35rem' }}>
                      {exp.company}
                    </div>
                    {exp.bullets && exp.bullets.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.8rem', color: '#4E5768', lineHeight: 1.55 }}>
                        {exp.bullets.map((b, bIdx) => (
                          <li key={bIdx} style={{ marginBottom: '0.25rem' }}>{b}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#4E5768', lineHeight: 1.55 }}>{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {projects.length > 0 && (
            <section>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2B57FF', margin: '0 0 0.75rem 0' }}>
                Highlighted Projects
              </h3>
              <div style={{ display: 'grid', gap: '0.9rem' }}>
                {projects.map((proj, idx) => (
                  <div key={idx} style={{ borderLeft: '3px solid #2B57FF', paddingLeft: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0E1116' }}>
                        {proj.name || proj.title}
                      </span>
                      {proj.techStack && (
                        <span style={{ fontSize: '0.7rem', color: '#2B57FF', fontWeight: 600 }}>
                          {proj.techStack}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: '#4E5768', lineHeight: 1.5 }}>
                      {proj.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Secondary Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '1px solid #EDEFF3', paddingLeft: '1.5rem' }}>
          {/* Skills */}
          <div>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0E1116', margin: '0 0 0.5rem 0' }}>
              Technical Stack
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {skills.map((s, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    background: '#F0F4FF',
                    color: '#2B57FF',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                  }}
                >
                  {typeof s === 'string' ? s : s.name}
                </span>
              ))}
            </div>
          </div>

          {/* Education */}
          {education.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0E1116', margin: '0 0 0.5rem 0' }}>
                Education
              </h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {education.map((edu, idx) => (
                  <div key={idx}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0E1116' }}>{edu.degree}</div>
                    <div style={{ fontSize: '0.75rem', color: '#7E899C' }}>{edu.institution}</div>
                    <div style={{ fontSize: '0.72rem', color: '#137a44', fontWeight: 600, marginTop: '0.15rem' }}>
                      {edu.year || edu.period} {edu.gpa && `· CGPA ${edu.gpa}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0E1116', margin: '0 0 0.5rem 0' }}>
                Verified Badges
              </h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {certifications.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#0E1116', fontWeight: 600 }}>
                    <Award size={13} color="#FFC400" />
                    <span>{typeof c === 'string' ? c : c.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CareerPilot ATS Verification Badge */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '1.5rem',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <img src="/careerpilot-logo.png" alt="CareerPilot" style={{ height: '22px', width: 'auto' }} />
            <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600, letterSpacing: '0.04em' }}>
              CareerPilot Verified ATS Profile
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
