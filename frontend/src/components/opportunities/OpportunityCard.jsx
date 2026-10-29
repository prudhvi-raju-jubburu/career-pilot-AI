import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Layers
} from 'lucide-react';
import './OpportunityCard.css';

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
  const matchedSkills = Array.isArray(opp.matched_skills) ? opp.matched_skills : [];
  const missingSkills = Array.isArray(opp.missing_skills)
    ? opp.missing_skills
    : allSkills.filter((s) => !matchedSkills.includes(s));

  const matchScore = typeof (opp.matchScore ?? opp.match_score) === 'number'
    ? (opp.matchScore ?? opp.match_score)
    : 85;

  const isHighFit = matchScore >= 80;

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
    if (opp.compensationString && opp.compensationString !== 'Not specified') {
      return opp.compensationString;
    }
    const comp = opp.compensation;
    const isInternship = (opp.type || '').toLowerCase() === 'internship';

    if (comp && typeof comp === 'object') {
      const min = comp.min_amount || comp.min;
      const max = comp.max_amount || comp.max;
      if (min && max) {
        if (isInternship || comp.period === 'month' || comp.type === 'stipend') {
          return `₹${Number(min).toLocaleString('en-IN')} – ₹${Number(max).toLocaleString('en-IN')}/mo`;
        }
        const minLpa = (min / 100000).toFixed(1).replace('.0', '');
        const maxLpa = (max / 100000).toFixed(1).replace('.0', '');
        return `₹${minLpa} – ₹${maxLpa} LPA`;
      }
      if (min) {
        if (isInternship || comp.type === 'stipend') {
          return `₹${Number(min).toLocaleString('en-IN')}+ /mo`;
        }
        return `₹${(min / 100000).toFixed(1)} LPA`;
      }
      if (max) {
        if (isInternship || comp.type === 'stipend') {
          return `Up to ₹${Number(max).toLocaleString('en-IN')}/mo`;
        }
        return `Up to ₹${(max / 100000).toFixed(1)} LPA`;
      }
    }
    return isInternship ? '₹35,000 – ₹50,000/mo (Est.)' : '₹10.0 – ₹18.0 LPA (Est.)';
  };

  const getDeadlineDisplay = () => {
    if (opp.deadlineString) return opp.deadlineString;
    if (opp.deadline) return opp.deadline.slice(0, 10);
    if (opp.dates?.deadline) return opp.dates.deadline.slice(0, 10);
    return 'Rolling Applications';
  };

  const sourceName = opp.source?.name
    ? opp.source.name.replace(/_/g, ' ').toUpperCase()
    : 'OFFICIAL CAREER PORTAL';

  const shortExplanation = opp.personal_rationale ||
    (Array.isArray(opp.why_matched) && opp.why_matched[0]) ||
    opp.explanation ||
    (matchedSkills.length > 0
      ? `Matches your resume skills in ${matchedSkills.slice(0, 3).join(', ')}.`
      : 'Curated opening aligning with your degree and developer skill set.');

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
          {/* Animated Match Score Badge */}
          {matchScore !== null && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={isHighFit ? 'opp-match-badge-emerald' : 'opp-match-badge-blue'}
              title="Matched to your student profile & parsed resume"
            >
              {isHighFit && <span className="opp-match-beacon" />}
              <Sparkles size={12} />
              <span>{matchScore}% Match</span>
            </motion.div>
          )}

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

        {application && (
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
            <span>{application.status || 'Tracked'}</span>
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
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginTop: '1px' }}>
            {getDeadlineDisplay()}
          </div>
        </div>
      </div>

      {/* Eligibility Indicator */}
      <div style={{ marginBottom: '0.75rem' }}>
        {eligStatus === 'eligible' ? (
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
          {matchedSkills.slice(0, 4).map((skill) => (
            <span key={skill} className="opp-skill-chip-matched">
              <Check size={11} strokeWidth={3} />
              <span>{skill}</span>
            </span>
          ))}

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
