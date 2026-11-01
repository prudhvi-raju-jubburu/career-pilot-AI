import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  ArrowRight,
  Code,
  Briefcase,
  Check,
  TrendingUp,
  Flame,
  Layers,
  Compass
} from 'lucide-react';
import './OpportunityCard.css';
import { formatCompensation, formatDateDisplay, stripHtml } from '../../utils';

const AVATAR_BG_PALETTE = [
  { bg: '#EFF6FF', color: '#1D4ED8' },
  { bg: '#ECFDF5', color: '#047857' },
  { bg: '#F5F3FF', color: '#6D28D9' },
  { bg: '#FFF7ED', color: '#C2410C' },
  { bg: '#FDF2F8', color: '#BE185D' },
  { bg: '#F0FDFA', color: '#0F766E' },
];

function getCompanyAvatarTheme(company = '') {
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_BG_PALETTE.length;
  return AVATAR_BG_PALETTE[idx];
}

export default function OpportunityCard({
  opp,
  isSaved,
  onToggleSave,
  onSelectDetail,
  onApply,
  application,
  onTrack
}) {
  const navigate = useNavigate();
  const [showRationale, setShowRationale] = useState(false);

  const companyName = opp.company || opp.organization?.name || 'Tech Company';
  const avatarTheme = getCompanyAvatarTheme(companyName);
  const companyInitial = companyName.charAt(0).toUpperCase();

  const allSkills = Array.isArray(opp.skills) ? opp.skills : [];
  const demonstratedSkills = Array.isArray(opp.demonstrated_skills) ? opp.demonstrated_skills : [];
  const listedSkills = Array.isArray(opp.listed_skills) ? opp.listed_skills : [];
  const matchedSkills = Array.isArray(opp.matched_skills)
    ? opp.matched_skills
    : [...demonstratedSkills, ...listedSkills];
  const missingSkills = Array.isArray(opp.missing_skills)
    ? opp.missing_skills
    : (Array.isArray(opp.potential_gaps) ? opp.potential_gaps : allSkills.filter((s) => !matchedSkills.includes(s)));

  const isApplied = Boolean(application || opp.already_applied);
  const appStatus = application?.status || opp.application_status || 'Applied';

  const isGeneralDiscovery = Boolean(opp.is_general_discovery || opp.discovery_type === 'general_discovery');
  const rawScore = opp.matchScore ?? opp.match_score;
  const matchScore = (!isGeneralDiscovery && typeof rawScore === 'number')
    ? rawScore
    : null;

  const isHighFit = matchScore !== null && matchScore >= 80;

  // Extract deterministic eligibility status
  const eligibility = opp.eligibility || {};
  const eligStatus = eligibility.status || (eligibility.is_eligible ? 'eligible' : 'not_eligible');

  const formatLocationDisplay = () => {
    if (opp.locationString) return opp.locationString;
    if (typeof opp.location === 'string') return opp.location;
    if (opp.location && typeof opp.location === 'object') {
      const parts = [];
      if (opp.location.city) parts.push(opp.location.city);
      if (opp.location.state && opp.location.state !== opp.location.city) parts.push(opp.location.state);
      if (parts.length > 0) return parts.join(', ');
      if (opp.location.is_remote) return 'Remote (India)';
    }
    return opp.workMode === 'Remote' ? 'Remote (India)' : (opp.workMode || 'India');
  };

  const getCompensationDisplay = () => {
    return formatCompensation(opp);
  };

  const getDeadlineDisplay = () => {
    const raw = opp.deadlineString || opp.deadline || opp.dates?.deadline;
    return formatDateDisplay(raw);
  };

  const sourceName = opp.source?.name
    ? opp.source.name.replace(/_/g, ' ').toUpperCase()
    : 'OFFICIAL CAREER PORTAL';

  const rawExplanation = opp.personal_rationale ||
    (Array.isArray(opp.why_matched) && opp.why_matched[0]) ||
    opp.explanation ||
    (matchedSkills.length > 0
      ? `Matches your resume skills in ${matchedSkills.slice(0, 3).join(', ')}.`
      : 'Curated opening aligning with your degree and developer skill set.');
  const shortExplanation = stripHtml(rawExplanation);

  const isInternship = (opp.type || '').toLowerCase() === 'internship';

  return (
    <motion.div
      className="opp-card-container"
      onClick={() => onSelectDetail(opp)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Top Accent Line for high fit */}
      {isHighFit && <div className="opp-card-top-accent" />}

      {/* Top Header: Company Avatar + Title + Badges + Save Button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: avatarTheme.bg,
              color: avatarTheme.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 800,
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            {companyInitial}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a' }}>
                {companyName}
              </span>
              <CheckCircle2 size={13} color="#2563eb" />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>
              {sourceName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {/* Match Score or General Discovery Badge */}
          {isGeneralDiscovery ? (
            <div
              className="opp-match-badge-blue"
              style={{ backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}
              title="General Discovery Opportunity (Complete profile to personalize)"
            >
              <Compass size={12} />
              <span>General Discovery</span>
            </div>
          ) : matchScore !== null ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={isHighFit ? 'opp-match-badge-emerald' : 'opp-match-badge-blue'}
              title="Matched to your student profile & parsed resume"
            >
              {isHighFit && <span className="opp-match-beacon" />}
              <Sparkles size={12} />
              <span>{matchScore}% Match</span>
            </motion.div>
          ) : null}

          {/* Bookmark Button with Micro-Animation */}
          <motion.button
            type="button"
            className={`opp-btn-bookmark ${isSaved ? 'saved' : ''}`}
            whileTap={{ scale: 0.82 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(opp);
            }}
            title={isSaved ? 'Saved to bookmarks' : 'Bookmark this opportunity'}
          >
            <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
          </motion.button>
        </div>
      </div>

      {/* Tags Row: Type Badge + India Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
        <span className={isInternship ? 'opp-type-pill-internship' : 'opp-type-pill-job'}>
          <Briefcase size={12} />
          <span>{isInternship ? 'Internship' : 'Full-Time Job'}</span>
        </span>

        <span className="opp-india-pill">
          <span>🇮🇳</span>
          <span>{formatLocationDisplay()} · {opp.workMode || 'Hybrid'}</span>
        </span>

        {isApplied && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              borderRadius: '9999px',
              padding: '0.2rem 0.6rem',
              fontSize: '0.72rem',
              fontWeight: 700
            }}
          >
            <Layers size={11} />
            <span>{appStatus}</span>
          </span>
        )}
      </div>

      {/* Role Title */}
      <h3
        style={{
          fontSize: '1.18rem',
          fontWeight: 800,
          color: '#0f172a',
          lineHeight: 1.35,
          letterSpacing: '-0.025em',
          margin: '0 0 0.65rem 0',
        }}
      >
        {opp.title}
      </h3>

      {/* Compensation & Deadline Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          padding: '0.65rem 0.85rem',
          background: '#f8fafc',
          borderRadius: '12px',
          marginBottom: '0.85rem',
          border: '1px solid #f1f5f9'
        }}
      >
        <div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            {isInternship ? 'Stipend' : 'Annual CTC / Salary'}
          </div>
          <div
            style={{
              fontSize: '1.12rem',
              fontWeight: 800,
              color: '#047857',
              letterSpacing: '-0.02em',
              marginTop: '1px'
            }}
          >
            {getCompensationDisplay()}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            Deadline
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.3rem',
              fontSize: '0.84rem',
              fontWeight: 700,
              color: '#334155',
              marginTop: '1px'
            }}
          >
            <Clock size={12} color="#64748b" />
            <span>{getDeadlineDisplay()}</span>
          </div>
        </div>
      </div>

      {/* Eligibility Indicator */}
      <div style={{ marginBottom: '0.75rem' }}>
        {isGeneralDiscovery ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#f8fafc',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '9999px',
              padding: '0.2rem 0.65rem',
              fontSize: '0.73rem',
              fontWeight: 700,
            }}
          >
            <HelpCircle size={13} color="#64748b" />
            <span>General Discovery · Complete Profile to Confirm Eligibility</span>
          </div>
        ) : eligStatus === 'eligible' ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              borderRadius: '9999px',
              padding: '0.2rem 0.65rem',
              fontSize: '0.73rem',
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={13} color="#059669" />
            <span>Eligible for your profile & batch</span>
          </div>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#fffbeb',
              color: '#92400e',
              border: '1px solid #fde68a',
              borderRadius: '9999px',
              padding: '0.2rem 0.65rem',
              fontSize: '0.73rem',
              fontWeight: 700,
            }}
          >
            <HelpCircle size={13} color="#d97706" />
            <span>Open for Review · Apply Now</span>
          </div>
        )}
      </div>

      {/* Cold-Start Profile Completion Callout */}
      {isGeneralDiscovery && opp.guidance && (
        <div style={{
          fontSize: '0.74rem',
          backgroundColor: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '8px',
          padding: '0.45rem 0.65rem',
          color: '#475569',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          <span>Upload resume & complete profile to calculate match score</span>
          <Link to="/profile" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>Update &rarr;</Link>
        </div>
      )}

      {/* Interactive Resume Skills Breakdown */}
      <div style={{ marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Skills Compatibility:
          </span>
          {matchedSkills.length > 0 && (
            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800 }}>
              ✓ {matchedSkills.length} Matched from Resume
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {matchedSkills.slice(0, 4).map((skill) => {
            const isDemonstrated = demonstratedSkills.some(
              (d) => d.toLowerCase() === skill.toLowerCase()
            );
            return (
              <span
                key={skill}
                className={isDemonstrated ? 'opp-skill-chip-matched' : 'opp-skill-chip-other'}
                style={isDemonstrated ? { backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' } : undefined}
                title={isDemonstrated ? `${skill} (Demonstrated in verified project or experience)` : `${skill} (Listed in profile/resume)`}
              >
                <Check size={11} strokeWidth={3} />
                <span>{skill}{isDemonstrated ? ' ★' : ''}</span>
              </span>
            );
          })}

          {missingSkills.slice(0, Math.max(0, 4 - matchedSkills.length)).map((skill) => (
            <span key={skill} className="opp-skill-chip-other">
              {skill}
            </span>
          ))}

          {allSkills.length > 4 && (
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', alignSelf: 'center', paddingLeft: '4px' }}>
              +{allSkills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Grounded Resume Rationale Accordion */}
      {shortExplanation && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowRationale(!showRationale);
          }}
          style={{
            fontSize: '0.78rem',
            color: '#334155',
            backgroundColor: '#eff6ff',
            padding: '0.55rem 0.8rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            lineHeight: 1.45,
            border: '1px solid #dbeafe',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#1d4ed8' }}>
              <Sparkles size={13} color="#2563eb" />
              <span>Why Matched With Your Resume</span>
            </div>
            {showRationale ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
          </div>
          <div style={{ marginTop: '0.35rem', color: '#475569' }}>
            {shortExplanation}
          </div>
        </div>
      )}

      {/* Animated Action Buttons */}
      <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', marginTop: 'auto' }}>
        <motion.button
          type="button"
          className="opp-btn-apply"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => {
            e.stopPropagation();
            onApply(opp);
          }}
        >
          <span>Apply Now</span>
          <ArrowRight size={14} />
        </motion.button>

        <motion.button
          type="button"
          className="opp-btn-details"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectDetail(opp);
          }}
        >
          <span>Match Details</span>
          <ExternalLink size={13} />
        </motion.button>
      </div>
    </motion.div>
  );
}
