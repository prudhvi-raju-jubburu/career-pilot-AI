import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, Award, CheckCircle } from 'lucide-react';

export default function ResumeSidebarTemplate({ resumeData }) {
  const {
    personal = {},
    summary = '',
    experience = [],
    education = [],
    skills = [],
    projects = [],
    certifications = []
  } = resumeData;

  const initials = personal.fullName
    ? personal.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CP';

  return (
    <div
      className="resume-paper"
      style={{
        width: '100%',
        maxWidth: '800px',
        minHeight: '1050px',
        backgroundColor: '#ffffff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#0E1116',
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        boxSizing: 'border-box',
      }}
    >
      {/* Left Sidebar */}
      <aside
        style={{
          backgroundColor: '#0E1116',
          color: '#ffffff',
          padding: '2rem 1.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
        }}
      >
        {/* Avatar / Initials */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: '#2B57FF',
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.85rem auto',
              border: '3px solid #FFC400',
              boxShadow: '0 8px 20px rgba(43, 87, 255, 0.4)',
            }}
          >
            {initials}
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
            {personal.fullName || 'Your Name'}
          </h2>
          <div style={{ fontSize: '0.8rem', color: '#FFC400', fontWeight: 600, marginTop: '0.25rem' }}>
            {personal.targetTitle || 'Full Stack Developer'}
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#8A94A6',
              borderBottom: '1px solid rgba(255,255,255,0.15)',
              paddingBottom: '0.35rem',
              marginBottom: '0.75rem',
            }}
          >
            Contact
          </div>
          <div style={{ display: 'grid', gap: '0.55rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
            {personal.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', wordBreak: 'break-all' }}>
                <Mail size={13} color="#2B57FF" style={{ flexShrink: 0 }} />
                <span>{personal.email}</span>
              </div>
            )}
            {personal.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={13} color="#2B57FF" style={{ flexShrink: 0 }} />
                <span>{personal.phone}</span>
              </div>
            )}
            {personal.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={13} color="#2B57FF" style={{ flexShrink: 0 }} />
                <span>{personal.location}</span>
              </div>
            )}
            {personal.linkedin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', wordBreak: 'break-all' }}>
                <Linkedin size={13} color="#2B57FF" style={{ flexShrink: 0 }} />
                <span>{personal.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>
              </div>
            )}
            {personal.github && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', wordBreak: 'break-all' }}>
                <Github size={13} color="#2B57FF" style={{ flexShrink: 0 }} />
                <span>{personal.github.replace(/^https?:\/\/(www\.)?/, '')}</span>
              </div>
            )}
            {personal.portfolio && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', wordBreak: 'break-all' }}>
                <Globe size={13} color="#2B57FF" style={{ flexShrink: 0 }} />
                <span>{personal.portfolio.replace(/^https?:\/\/(www\.)?/, '')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Verified Skills */}
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#8A94A6',
              borderBottom: '1px solid rgba(255,255,255,0.15)',
              paddingBottom: '0.35rem',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Key Skills</span>
            <span style={{ color: '#137a44', fontSize: '0.65rem' }}>Verified ✓</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {skills.map((skill, idx) => (
              <span
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {typeof skill === 'string' ? skill : skill.name}
              </span>
            ))}
          </div>
        </div>

        {/* Education */}
        {education.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#8A94A6',
                borderBottom: '1px solid rgba(255,255,255,0.15)',
                paddingBottom: '0.35rem',
                marginBottom: '0.75rem',
              }}
            >
              Education
            </div>
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {education.map((edu, idx) => (
                <div key={idx}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                    {edu.degree || edu.institution}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#8A94A6' }}>{edu.institution || edu.degree}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#FFC400', marginTop: '0.15rem' }}>
                    <span>{edu.year || edu.period}</span>
                    {edu.gpa && <span>GPA: {edu.gpa}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#8A94A6',
                borderBottom: '1px solid rgba(255,255,255,0.15)',
                paddingBottom: '0.35rem',
                marginBottom: '0.75rem',
              }}
            >
              Certifications
            </div>
            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.73rem' }}>
              {certifications.map((cert, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.9)' }}>
                  <Award size={12} color="#FFC400" style={{ flexShrink: 0 }} />
                  <span>{typeof cert === 'string' ? cert : cert.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CareerPilot Verification Badge */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ background: '#ffffff', borderRadius: '6px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center' }}>
            <img src="/careerpilot-logo.png" alt="CareerPilot" style={{ height: '20px', width: 'auto' }} />
          </div>
          <span style={{ fontSize: '0.65rem', color: '#8A94A6', fontWeight: 600 }}>Verified 98% ATS</span>
        </div>
      </aside>

      {/* Right Main Body */}
      <main style={{ padding: '2.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Professional Summary */}
        {summary && (
          <div>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#2B57FF',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <span>Executive Summary</span>
              <div style={{ flex: 1, height: '1.5px', backgroundColor: '#EDEFF3' }} />
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.6, color: '#4E5768' }}>
              {summary}
            </p>
          </div>
        )}

        {/* Experience Timeline */}
        {experience.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#2B57FF',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.85rem',
              }}
            >
              <span>Work Experience</span>
              <div style={{ flex: 1, height: '1.5px', backgroundColor: '#EDEFF3' }} />
            </div>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {experience.map((exp, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0E1116' }}>
                      {exp.role || exp.title}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7E899C' }}>
                      {exp.period || `${exp.startDate} - ${exp.endDate || 'Present'}`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#2B57FF', fontWeight: 600, marginBottom: '0.4rem' }}>
                    {exp.company} {exp.location && `· ${exp.location}`}
                  </div>
                  {exp.bullets && exp.bullets.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: '#4E5768', lineHeight: 1.55 }}>
                      {exp.bullets.map((b, bIdx) => (
                        <li key={bIdx} style={{ marginBottom: '0.25rem' }}>{b}</li>
                      ))}
                    </ul>
                  ) : exp.description ? (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#4E5768', lineHeight: 1.55 }}>{exp.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Projects */}
        {projects.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#2B57FF',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.85rem',
              }}
            >
              <span>Featured Technical Projects</span>
              <div style={{ flex: 1, height: '1.5px', backgroundColor: '#EDEFF3' }} />
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {projects.map((proj, idx) => (
                <div key={idx} style={{ background: '#F7F8FA', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #EDEFF3' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0E1116' }}>
                      {proj.name || proj.title}
                    </span>
                    {proj.techStack && (
                      <span style={{ fontSize: '0.72rem', color: '#2B57FF', fontWeight: 600 }}>
                        {proj.techStack}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.78rem', color: '#4E5768', lineHeight: 1.5 }}>
                    {proj.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
