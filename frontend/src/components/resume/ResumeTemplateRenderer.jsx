import React from 'react';
import {
  Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink,
  Award, BookOpen, Code, Briefcase, GraduationCap, CheckCircle2
} from 'lucide-react';

/**
 * Defensive unwrap & sanitization utility.
 * Guarantees zero raw dictionary literals, stringified JSON, or double suffixes.
 */
export function cleanVal(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (val.value !== undefined && val.value !== null) return cleanVal(val.value);
    if (val.name !== undefined && val.name !== null) return cleanVal(val.name);
    if (val.title !== undefined && val.title !== null) return cleanVal(val.title);
    return '';
  }
  let s = String(val).trim();
  // Unwrap any embedded {'value': '...'} or {"value": "..."} fragments
  s = s.replace(/\{['"]value['"]:\s*['"]?([^,'"}]+)['"]?[^}]*\}/g, '$1');
  // Strip duplicate CGPA suffixes like "8.9 CGPA CGPA" -> "8.9 CGPA"
  s = s.replace(/\bCGPA\s+CGPA\b/gi, 'CGPA');
  return s.trim();
}

export function formatCgpa(cgpaVal) {
  const cleaned = cleanVal(cgpaVal);
  if (!cleaned) return '';
  if (/cgpa/i.test(cleaned) || /gpa/i.test(cleaned)) return cleaned;
  return `${cleaned} CGPA`;
}

export default function ResumeTemplateRenderer({
  templateId = 'ats_classic',
  resumeData = {},
  formatting = {}
}) {
  const {
    personal = {},
    summary = '',
    experience = [],
    education = [],
    skills = [],
    skills_categorized = null,
    projects = [],
    certifications = [],
    achievements = []
  } = resumeData;

  const fontSizeMode = formatting?.font_size || formatting?.fontSize || 'standard';
  const spacingMode = formatting?.spacing || 'standard';
  const accentColor = formatting?.accent_color || formatting?.accentColor || '#0f172a';
  const visible = formatting?.visible_sections || formatting?.visibleSections || {
    summary: true, education: true, skills: true, projects: true, experience: true, certifications: true, achievements: true
  };

  // Sizing scales
  const sizeScales = {
    compact: { base: '0.8rem', name: '1.65rem', h2: '0.85rem', sub: '0.88rem', line: 1.35, gap: '0.85rem' },
    standard: { base: '0.86rem', name: '1.85rem', h2: '0.92rem', sub: '0.95rem', line: 1.48, gap: '1.15rem' },
    relaxed: { base: '0.92rem', name: '2.05rem', h2: '1.02rem', sub: '1.02rem', line: 1.6, gap: '1.5rem' },
  };

  const scale = sizeScales[fontSizeMode] || sizeScales.standard;

  // Flatten skills if needed
  const flattenedSkills = Array.isArray(skills)
    ? skills.map(s => cleanVal(typeof s === 'string' ? s : s?.name || '')).filter(Boolean)
    : [];

  const cleanName = cleanVal(personal.fullName || personal.full_name) || 'Candidate Name';
  const cleanTitle = cleanVal(personal.targetTitle || personal.title);
  const cleanEmail = cleanVal(personal.email);
  const cleanPhone = cleanVal(personal.phone);
  const cleanLoc = cleanVal(personal.location);
  const cleanLi = cleanVal(personal.linkedin);
  const cleanGh = cleanVal(personal.github);
  const cleanPf = cleanVal(personal.portfolio);

  // Helper for contact line
  const renderContactLine = (center = false) => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: center ? 'center' : 'flex-start',
        alignItems: 'center',
        gap: '0.65rem',
        fontSize: '0.78rem',
        color: '#475569',
        marginTop: '0.4rem',
      }}
    >
      {cleanEmail && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Mail size={12} color="#64748b" /> {cleanEmail}
        </span>
      )}
      {cleanPhone && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          • <Phone size={12} color="#64748b" /> {cleanPhone}
        </span>
      )}
      {cleanLoc && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          • <MapPin size={12} color="#64748b" /> {cleanLoc}
        </span>
      )}
      {cleanLi && (
        <a
          href={cleanLi.startsWith('http') ? cleanLi : `https://${cleanLi}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: accentColor, textDecoration: 'none' }}
        >
          • <Linkedin size={12} /> {cleanLi.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, 'in/')}
        </a>
      )}
      {cleanGh && (
        <a
          href={cleanGh.startsWith('http') ? cleanGh : `https://${cleanGh}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: accentColor, textDecoration: 'none' }}
        >
          • <Github size={12} /> {cleanGh.replace(/^https?:\/\/(www\.)?github\.com\//, 'gh/')}
        </a>
      )}
      {cleanPf && (
        <a
          href={cleanPf.startsWith('http') ? cleanPf : `https://${cleanPf}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: accentColor, textDecoration: 'none' }}
        >
          • <Globe size={12} /> portfolio
        </a>
      )}
    </div>
  );

  // Section Header Generator
  const renderSectionHeading = (title) => {
    if (templateId === 'modern_professional') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', borderBottom: `2px solid ${accentColor}25`, paddingBottom: '0.25rem' }}>
          <div style={{ width: '4px', height: '14px', backgroundColor: accentColor, borderRadius: '2px' }} />
          <h2 style={{ fontSize: scale.h2, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: accentColor, margin: 0 }}>
            {title}
          </h2>
        </div>
      );
    }

    if (templateId === 'software_engineer' || templateId === 'ai_ml_data') {
      return (
        <div style={{ marginBottom: '0.45rem', borderBottom: `1px solid ${accentColor}40`, paddingBottom: '0.2rem' }}>
          <h2 style={{ fontSize: scale.h2, fontWeight: 800, letterSpacing: '0.04em', color: accentColor, margin: 0, textTransform: 'uppercase' }}>
            // {title}
          </h2>
        </div>
      );
    }

    // Default ATS Classic / Student / Internship
    return (
      <div style={{ marginBottom: '0.4rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.2rem' }}>
        <h2 style={{ fontSize: scale.h2, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0f172a', margin: 0 }}>
          {title}
        </h2>
      </div>
    );
  };

  // Section: Summary
  const cleanSummary = cleanVal(summary);
  const SummarySection = visible.summary && cleanSummary ? (
    <section key="sec-summary">
      {renderSectionHeading('Professional Summary')}
      <p style={{ margin: 0, fontSize: scale.base, lineHeight: scale.line, color: '#334155' }}>
        {cleanSummary}
      </p>
    </section>
  ) : null;

  // Section: Education (Crisp 2-column layout with perfect alignment)
  const EducationSection = visible.education && education.length > 0 ? (
    <section key="sec-education">
      {renderSectionHeading('Education')}
      <div style={{ display: 'grid', gap: '0.55rem' }}>
        {education.map((edu, idx) => {
          const deg = cleanVal(edu.degree);
          const branch = cleanVal(edu.branch);
          const inst = cleanVal(edu.institution || edu.college);
          const yr = cleanVal(edu.year || edu.graduationYear);
          const gpa = formatCgpa(edu.gpa || edu.cgpa);

          let degreeText = deg || 'Degree';
          if (branch && !degreeText.toLowerCase().includes(branch.toLowerCase())) {
            degreeText = `${degreeText} in ${branch}`;
          }

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
              }}
            >
              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <div style={{ fontSize: scale.sub, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                  {degreeText}
                </div>
                {inst && (
                  <div style={{ fontSize: scale.base, color: '#475569', marginTop: '0.15rem' }}>
                    {inst}
                  </div>
                )}
              </div>
              {(yr || gpa) && (
                <div style={{ flex: '0 0 auto', textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                  {yr && <div style={{ fontWeight: 500 }}>{yr}</div>}
                  {gpa && (
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.1rem' }}>
                      {gpa}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  ) : null;

  // Section: Skills
  const SkillsSection = visible.skills && (flattenedSkills.length > 0 || skills_categorized) ? (
    <section key="sec-skills">
      {renderSectionHeading('Technical Skills')}
      {skills_categorized && Object.keys(skills_categorized).length > 0 ? (
        <div style={{ display: 'grid', gap: '0.35rem', fontSize: scale.base }}>
          {Object.entries(skills_categorized).map(([cat, list], idx) => {
            const cleanList = Array.isArray(list) ? list.map(cleanVal).filter(Boolean) : [];
            if (cleanList.length === 0) return null;
            return (
              <div key={idx} style={{ lineHeight: scale.line }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{cat}: </span>
                <span style={{ color: '#334155' }}>{cleanList.join(', ')}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {flattenedSkills.map((s, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '0.76rem',
                fontWeight: 600,
                backgroundColor: templateId === 'software_engineer' ? '#f1f5f9' : '#f8fafc',
                color: '#1e293b',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </section>
  ) : null;

  // Section: Projects
  const ProjectsSection = visible.projects && projects.length > 0 ? (
    <section key="sec-projects">
      {renderSectionHeading('Technical Projects')}
      <div style={{ display: 'grid', gap: '0.85rem' }}>
        {projects.map((p, idx) => {
          const pName = cleanVal(p.name);
          const rawTechs = Array.isArray(p.technologies) ? p.technologies : (typeof p.technologies === 'string' ? p.technologies.split(',') : []);
          const techs = rawTechs.map(cleanVal).filter(Boolean);
          const rawBullets = Array.isArray(p.bullets) && p.bullets.length > 0 ? p.bullets : (p.description ? [p.description] : []);
          const bullets = rawBullets.map(cleanVal).filter(Boolean);
          const link = cleanVal(p.link || p.github || p.url);

          return (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                <div style={{ fontSize: scale.sub, fontWeight: 700, color: '#0f172a' }}>
                  {pName}
                  {techs.length > 0 && (
                    <span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#64748b', marginLeft: '0.5rem' }}>
                      ({techs.join(', ')})
                    </span>
                  )}
                </div>
                {link && (
                  <a
                    href={link.startsWith('http') ? link : `https://${link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: accentColor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
                  >
                    View Project <ExternalLink size={10} />
                  </a>
                )}
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.15rem', display: 'grid', gap: '0.2rem' }}>
                {bullets.map((b, bIdx) => (
                  <li key={bIdx} style={{ fontSize: scale.base, lineHeight: scale.line, color: '#334155' }}>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  ) : null;

  // Section: Experience
  const ExperienceSection = visible.experience && experience.length > 0 ? (
    <section key="sec-experience">
      {renderSectionHeading('Experience & Internships')}
      <div style={{ display: 'grid', gap: '0.85rem' }}>
        {experience.map((exp, idx) => {
          const rawBullets = Array.isArray(exp.bullets) && exp.bullets.length > 0
            ? exp.bullets
            : (Array.isArray(exp.responsibilities) ? exp.responsibilities : []);
          const bullets = rawBullets.map(cleanVal).filter(Boolean);
          const role = cleanVal(exp.role) || 'Contributor';
          const org = cleanVal(exp.organization || exp.company);
          const dur = cleanVal(exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : ''));

          return (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                <div style={{ fontSize: scale.sub, fontWeight: 700, color: '#0f172a' }}>
                  {role} {org ? <span style={{ fontWeight: 500, color: '#475569' }}>— {org}</span> : ''}
                </div>
                {dur && (
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {dur}
                  </span>
                )}
              </div>
              {bullets.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1.15rem', display: 'grid', gap: '0.2rem' }}>
                  {bullets.map((b, bIdx) => (
                    <li key={bIdx} style={{ fontSize: scale.base, lineHeight: scale.line, color: '#334155' }}>
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  ) : null;

  // Section: Certifications
  const CertificationsSection = visible.certifications && certifications.length > 0 ? (
    <section key="sec-certifications">
      {renderSectionHeading('Certifications')}
      <div style={{ display: 'grid', gap: '0.25rem' }}>
        {certifications.map((c, idx) => {
          const name = cleanVal(typeof c === 'string' ? c : c.name);
          const org = cleanVal(c.organization || c.issuer);
          const date = cleanVal(c.date || c.year);
          return (
            <div key={idx} style={{ fontSize: scale.base, color: '#334155' }}>
              • <strong style={{ color: '#0f172a' }}>{name}</strong>{org ? ` — ${org}` : ''}{date ? ` (${date})` : ''}
            </div>
          );
        })}
      </div>
    </section>
  ) : null;

  // Section: Achievements
  const AchievementsSection = visible.achievements && achievements.length > 0 ? (
    <section key="sec-achievements">
      {renderSectionHeading('Honors & Achievements')}
      <div style={{ display: 'grid', gap: '0.25rem' }}>
        {achievements.map((a, idx) => {
          const title = cleanVal(typeof a === 'string' ? a : a.title);
          const ctx = cleanVal(a.context || a.description);
          return (
            <div key={idx} style={{ fontSize: scale.base, color: '#334155' }}>
              • <strong style={{ color: '#0f172a' }}>{title}</strong>{ctx ? `: ${ctx}` : ''}
            </div>
          );
        })}
      </div>
    </section>
  ) : null;

  // Arrange sections according to user customization or Template default
  const getSectionElements = () => {
    const sectionMap = {
      summary: SummarySection,
      skills: SkillsSection,
      projects: ProjectsSection,
      experience: ExperienceSection,
      education: EducationSection,
      certifications: CertificationsSection,
      achievements: AchievementsSection
    };

    if (Array.isArray(formatting?.section_order) && formatting.section_order.length > 0) {
      return formatting.section_order.map(key => sectionMap[key]).filter(Boolean);
    }

    switch (templateId) {
      case 'software_engineer':
        return [SkillsSection, ProjectsSection, ExperienceSection, EducationSection, CertificationsSection, AchievementsSection];
      case 'ai_ml_data':
        return [SummarySection, SkillsSection, ProjectsSection, EducationSection, ExperienceSection, CertificationsSection];
      case 'student_fresher':
        return [EducationSection, SkillsSection, ProjectsSection, CertificationsSection, AchievementsSection, ExperienceSection];
      case 'internship_focus':
        return [SummarySection, EducationSection, SkillsSection, ProjectsSection, ExperienceSection, AchievementsSection];
      case 'modern_professional':
        return [SummarySection, SkillsSection, ExperienceSection, ProjectsSection, EducationSection, CertificationsSection];
      case 'ats_classic':
      default:
        return [SummarySection, EducationSection, SkillsSection, ExperienceSection, ProjectsSection, CertificationsSection, AchievementsSection];
    }
  };

  return (
    <div
      className="resume-preview-sheet"
      style={{
        width: '100%',
        maxWidth: '820px',
        minHeight: '1050px',
        backgroundColor: '#ffffff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#0f172a',
        padding: '2.5rem 2.8rem',
        boxSizing: 'border-box',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: scale.gap,
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: templateId === 'modern_professional'
            ? `3px solid ${accentColor}`
            : (templateId === 'ats_classic' ? '2px solid #0f172a' : `1.5px solid ${accentColor}`),
          paddingBottom: '0.85rem',
          textAlign: templateId === 'ats_classic' ? 'center' : 'left',
        }}
      >
        <h1
          style={{
            fontSize: scale.name,
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.02em',
            color: accentColor,
          }}
        >
          {cleanName}
        </h1>
        {cleanTitle && (
          <div style={{ fontSize: scale.sub, fontWeight: 600, color: '#475569', marginTop: '0.2rem' }}>
            {cleanTitle}
          </div>
        )}
        {renderContactLine(templateId === 'ats_classic')}
      </header>

      {/* Render sections according to layout */}
      {getSectionElements().filter(Boolean)}
    </div>
  );
}
