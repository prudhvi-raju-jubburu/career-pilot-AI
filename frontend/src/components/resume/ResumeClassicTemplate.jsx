import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin, Github } from 'lucide-react';

export default function ResumeClassicTemplate({ resumeData }) {
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
        fontFamily: "'Inter', Georgia, serif",
        color: '#111827',
        padding: '3rem 3.25rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.4rem',
      }}
    >
      {/* Centered Classic Header */}
      <header style={{ textAlign: 'center', borderBottom: '2px solid #0E1116', paddingBottom: '1.15rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#0E1116' }}>
          {personal.fullName || 'Your Name'}
        </h1>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#4B5563', marginTop: '0.25rem' }}>
          {personal.targetTitle || 'Full Stack Engineer'}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.75rem',
            color: '#6B7280',
            marginTop: '0.5rem',
          }}
        >
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>• {personal.phone}</span>}
          {personal.location && <span>• {personal.location}</span>}
          {personal.linkedin && (
            <span>• {personal.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>
          )}
          {personal.github && (
            <span>• {personal.github.replace(/^https?:\/\/(www\.)?/, '')}</span>
          )}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0E1116', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.25rem', margin: '0 0 0.5rem 0' }}>
            Professional Summary
          </h2>
          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.6, color: '#374151' }}>
            {summary}
          </p>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0E1116', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.25rem', margin: '0 0 0.5rem 0' }}>
            Core Competencies & Technologies
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {skills.map((s, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: '#F3F4F6',
                  color: '#1F2937',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  border: '1px solid #E5E7EB',
                }}
              >
                {typeof s === 'string' ? s : s.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0E1116', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.25rem', margin: '0 0 0.75rem 0' }}>
            Work Experience
          </h2>
          <div style={{ display: 'grid', gap: '1.15rem' }}>
            {experience.map((exp, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111827' }}>
                    {exp.role || exp.title} — <span style={{ fontWeight: 600, color: '#4B5563' }}>{exp.company}</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#6B7280', fontStyle: 'italic' }}>
                    {exp.period || `${exp.startDate} - ${exp.endDate || 'Present'}`}
                  </span>
                </div>
                {exp.bullets && exp.bullets.length > 0 ? (
                  <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#374151', lineHeight: 1.55 }}>
                    {exp.bullets.map((b, bIdx) => (
                      <li key={bIdx} style={{ marginBottom: '0.25rem' }}>{b}</li>
                    ))}
                  </ul>
                ) : exp.description ? (
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem', color: '#374151', lineHeight: 1.55 }}>
                    {exp.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0E1116', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.25rem', margin: '0 0 0.75rem 0' }}>
            Key Engineering Projects
          </h2>
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {projects.map((proj, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
                    {proj.name || proj.title}
                  </span>
                  {proj.techStack && (
                    <span style={{ fontSize: '0.72rem', color: '#6B7280', fontStyle: 'italic' }}>
                      ({proj.techStack})
                    </span>
                  )}
                </div>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#374151', lineHeight: 1.5 }}>
                  {proj.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0E1116', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.25rem', margin: '0 0 0.5rem 0' }}>
            Education
          </h2>
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {education.map((edu, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>{edu.degree}</span>
                  <div style={{ fontSize: '0.75rem', color: '#4B5563' }}>{edu.institution}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#6B7280' }}>
                  <div>{edu.year || edu.period}</div>
                  {edu.gpa && <div style={{ fontWeight: 600, color: '#111827' }}>CGPA: {edu.gpa}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CareerPilot ATS Verification Footer */}
      <footer
        style={{
          marginTop: 'auto',
          paddingTop: '1.25rem',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.68rem',
          color: '#9CA3AF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <img src="/careerpilot-logo.png" alt="CareerPilot" style={{ height: '18px', width: 'auto' }} />
          <span style={{ fontWeight: 600, color: '#4B5563' }}>CareerPilot AI · Verified ATS Resume</span>
        </div>
        <span>DISCOVER • PREPARE • GROW</span>
      </footer>
    </div>
  );
}
