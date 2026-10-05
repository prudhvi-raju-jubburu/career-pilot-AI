import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  GraduationCap,
  Code,
  Briefcase,
  MapPin,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  UploadCloud,
  ShieldCheck,
  Award,
  Layers,
  Check,
  ChevronDown
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import ProgressBar from '../components/ui/ProgressBar';
import { SkeletonProfile } from '../components/ui/Skeleton';
import { getProfile, updateProfile } from '../services/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');
  const [expandedSections, setExpandedSections] = useState(
    new Set(['personal', 'education', 'skills', 'preferences', 'resume'])
  );

  const toggleSection = (key) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getProfile();
      if (res?.data) {
        setProfile(res.data);
      }
    } catch (err) {
      setErrorToast(err.message || 'Failed to fetch student profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (section, field, value) => {
    setProfile((prev) => {
      const updated = { ...prev };
      if (!updated[section]) updated[section] = {};
      updated[section][field] = {
        value: value,
        source: 'manual',
        confidence: 1.0,
      };
      return updated;
    });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setErrorToast('');
    try {
      const res = await updateProfile(profile);
      if (res?.data) {
        setProfile(res.data);
      }
      setIsEditing(false);
      setSuccessToast('Profile updated successfully.');
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      setErrorToast(err.message || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ maxWidth: '1050px', margin: '0 auto', padding: '1.5rem 0' }}>
          <SkeletonProfile />
        </div>
      </PageContainer>
    );
  }

  const personal = profile?.personal || {};
  const education = profile?.education || {};
  const skills = profile?.skills || {};
  const preferences = profile?.preferences || {};
  const completion = profile?.completion_details || { percentage: profile?.profileCompletion || 0, breakdown: {}, missing_items: [] };
  const isVerified = profile?.verification_status === 'verified';

  return (
    <PageContainer>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        {/* Profile Header Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-900) 0%, #1e1b4b 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(1.25rem, 4vw, 2.25rem)',
            color: 'white',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-raised)',
          }}
          className="animate-slide-up"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', minWidth: 0, flex: '1 1 280px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600))',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                  flexShrink: 0,
                }}
              >
                {personal.fullName?.value ? personal.fullName.value.charAt(0).toUpperCase() : 'S'}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, margin: 0, lineHeight: 1.25, whiteSpace: 'normal', wordBreak: 'keep-all' }}>
                    {personal.fullName?.value || 'Student Profile'}
                  </h1>
                  {isVerified ? (
                    <Badge variant="success" size="sm" dot style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                      ✓ Verified Profile
                    </Badge>
                  ) : (
                    <Link to="/profile/review" style={{ flexShrink: 0 }}>
                      <Badge variant="warning" size="sm" dot style={{ whiteSpace: 'nowrap' }}>
                        Needs Review
                      </Badge>
                    </Link>
                  )}
                </div>
                <div style={{ opacity: 0.9, fontSize: '0.85rem', lineHeight: 1.4, wordBreak: 'normal' }}>
                  {education.college?.value ? `${education.college.value} • ` : ''}
                  {education.branch?.value || 'Student'}
                  {education.graduationYear?.value ? ` • Class of ${education.graduationYear.value}` : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', width: 'auto' }}>
              <Link to="/resume" style={{ flex: '1 1 auto' }}>
                <Button variant="secondary" size="md" icon={<UploadCloud size={16} />} style={{ width: '100%', whiteSpace: 'nowrap' }}>
                  Update Resume
                </Button>
              </Link>
              {isEditing ? (
                <Button variant="primary" size="md" onClick={handleSaveProfile} loading={saving} icon={<Save size={16} />} style={{ flex: '1 1 auto', whiteSpace: 'nowrap' }}>
                  Save Changes
                </Button>
              ) : (
                <Button variant="secondary" size="md" onClick={() => setIsEditing(true)} icon={<Edit3 size={16} />} style={{ flex: '1 1 auto', whiteSpace: 'nowrap' }}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Toasts */}
        {successToast && (
          <div style={{ padding: '0.85rem 1.25rem', backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', color: 'var(--color-success-dark)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
            <Check size={18} />
            <span>{successToast}</span>
          </div>
        )}
        {errorToast && (
          <div style={{ padding: '0.85rem 1.25rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger-dark)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            <span>{errorToast}</span>
          </div>
        )}

        {/* Profile Completion Meter Card */}
        <Card variant="raised" style={{ marginBottom: '2rem' }}>
          <Card.Content style={{ padding: '1.5rem 1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} color="var(--color-primary-600)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Profile Readiness &amp; Eligibility Score</h3>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-600)' }}>
                {completion.percentage}% Complete
              </span>
            </div>

            <ProgressBar value={completion.percentage} size="md" variant={completion.percentage > 80 ? 'success' : 'primary'} showPercentage={false} style={{ marginBottom: '1.25rem' }} />

            {/* Completion category breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              {[
                { label: 'Identity', val: completion.breakdown?.identity ?? 70 },
                { label: 'Education', val: completion.breakdown?.education ?? 80 },
                { label: 'Skills', val: completion.breakdown?.skills ?? 90 },
                { label: 'Resume', val: completion.breakdown?.resume ?? 100 },
                { label: 'Preferences', val: completion.breakdown?.preferences ?? 60 },
              ].map((cat) => (
                <div key={cat.label} style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {cat.label}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                    {cat.val}%
                  </div>
                </div>
              ))}
            </div>

            {completion.missing_items && completion.missing_items.length > 0 && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: 'var(--color-warning-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-warning-border)', fontSize: '0.85rem', color: 'var(--color-warning-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>
                  To reach 100% eligibility score: Complete {completion.missing_items.join(', ')}
                </span>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Main Profile Grid */}
        <div className="page-2col-grid profile-main-grid" style={{ marginBottom: '2rem' }}>
          {/* Left Column: Personal, Education, Skills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Personal Details */}
            <Card variant="default">
              <Card.Header
                onClick={() => toggleSection('personal')}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                className="profile-accordion-header touch-target"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} color="var(--color-primary-600)" />
                  <Card.Title>Personal Information</Card.Title>
                </div>
                <ChevronDown
                  size={18}
                  className="mobile-only"
                  style={{
                    transform: expandedSections.has('personal') ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    color: 'var(--text-muted)'
                  }}
                />
              </Card.Header>
              <div className={expandedSections.has('personal') ? 'profile-accordion-body expanded' : 'profile-accordion-body collapsed'}>
                <Card.Content>
                  <div className="grid-2">
                    <div>
                      <div className="text-caption" style={{ marginBottom: '0.25rem' }}>Full Name</div>
                      {isEditing ? (
                        <Input
                          value={personal.fullName?.value || ''}
                          onChange={(e) => handleFieldChange('personal', 'fullName', e.target.value)}
                        />
                      ) : (
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{personal.fullName?.value || '—'}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-caption" style={{ marginBottom: '0.25rem' }}>Email Address</div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{personal.email?.value || '—'}</div>
                    </div>

                    <div>
                      <div className="text-caption" style={{ marginBottom: '0.25rem' }}>Phone Number</div>
                      {isEditing ? (
                        <Input
                          value={personal.phone?.value || ''}
                          onChange={(e) => handleFieldChange('personal', 'phone', e.target.value)}
                        />
                      ) : (
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{personal.phone?.value || '—'}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-caption" style={{ marginBottom: '0.25rem' }}>Location</div>
                      {isEditing ? (
                        <Input
                          value={personal.location?.value || ''}
                          onChange={(e) => handleFieldChange('personal', 'location', e.target.value)}
                        />
                      ) : (
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{personal.location?.value || '—'}</div>
                      )}
                    </div>
                  </div>
                </Card.Content>
              </div>
            </Card>

            {/* Education */}
            <Card variant="default">
              <Card.Header
                onClick={() => toggleSection('education')}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                className="profile-accordion-header touch-target"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GraduationCap size={18} color="var(--color-primary-600)" />
                  <Card.Title>Education &amp; Eligibility</Card.Title>
                </div>
                <ChevronDown
                  size={18}
                  className="mobile-only"
                  style={{
                    transform: expandedSections.has('education') ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    color: 'var(--text-muted)'
                  }}
                />
              </Card.Header>
              <div className={expandedSections.has('education') ? 'profile-accordion-body expanded' : 'profile-accordion-body collapsed'}>
                <Card.Content>
                  <div className="grid-2">
                    <div style={{ gridColumn: 'span 2' }}>
                      <div className="text-caption" style={{ marginBottom: '0.25rem' }}>College / University</div>
                      {isEditing ? (
                        <Input
                          value={education.college?.value || ''}
                          onChange={(e) => handleFieldChange('education', 'college', e.target.value)}
                        />
                      ) : (
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
                          {education.college?.value || '—'}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-caption" style={{ marginBottom: '0.25rem' }}>Branch / Major</div>
                      {isEditing ? (
                        <Input
                          value={education.branch?.value || ''}
                          onChange={(e) => handleFieldChange('education', 'branch', e.target.value)}
                        />
                      ) : (
                        <div style={{ fontWeight: 600 }}>{education.branch?.value || '—'}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-caption" style={{ marginBottom: '0.25rem' }}>Graduation Year</div>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={education.graduationYear?.value || ''}
                          onChange={(e) => handleFieldChange('education', 'graduationYear', parseInt(e.target.value) || null)}
                        />
                      ) : (
                        <div style={{ fontWeight: 600 }}>{education.graduationYear?.value || '—'}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-caption" style={{ marginBottom: '0.25rem' }}>CGPA</div>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={education.cgpa?.value || ''}
                          onChange={(e) => handleFieldChange('education', 'cgpa', parseFloat(e.target.value) || null)}
                        />
                      ) : (
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary-600)' }}>
                          {education.cgpa?.value ? `${education.cgpa.value} / 10` : '—'}
                        </div>
                      )}
                    </div>
                  </div>
                </Card.Content>
              </div>
            </Card>

            {/* Technical Skills */}
            <Card variant="default">
              <Card.Header
                onClick={() => toggleSection('skills')}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                className="profile-accordion-header touch-target"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Code size={18} color="var(--color-primary-600)" />
                  <Card.Title>Skills &amp; Competencies</Card.Title>
                </div>
                <ChevronDown
                  size={18}
                  className="mobile-only"
                  style={{
                    transform: expandedSections.has('skills') ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    color: 'var(--text-muted)'
                  }}
                />
              </Card.Header>
              <div className={expandedSections.has('skills') ? 'profile-accordion-body expanded' : 'profile-accordion-body collapsed'}>
                <Card.Content>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      { key: 'programmingLanguages', label: 'Languages' },
                      { key: 'frameworks', label: 'Frameworks' },
                      { key: 'databases', label: 'Databases' },
                      { key: 'tools', label: 'Developer Tools' },
                    ].map((cat) => {
                      const list = skills[cat.key]?.value || [];
                      return (
                        <div key={cat.key}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                            {cat.label}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {list.length > 0 ? (
                              list.map((s) => (
                                <Badge key={s} variant="neutral" size="sm">
                                  {s}
                                </Badge>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>None listed</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card.Content>
              </div>
            </Card>
          </div>

          {/* Right Column: Preferences, Attached Resume */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Career Preferences */}
            <Card variant="default">
              <Card.Header
                onClick={() => toggleSection('preferences')}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                className="profile-accordion-header touch-target"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase size={18} color="var(--color-primary-600)" />
                  <Card.Title>Career Preferences</Card.Title>
                </div>
                <ChevronDown
                  size={18}
                  className="mobile-only"
                  style={{
                    transform: expandedSections.has('preferences') ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    color: 'var(--text-muted)'
                  }}
                />
              </Card.Header>
              <div className={expandedSections.has('preferences') ? 'profile-accordion-body expanded' : 'profile-accordion-body collapsed'}>
                <Card.Content>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                    {(preferences.targetRoles?.value || []).map((r) => (
                      <Badge key={r} variant="primary" size="md">
                        {r}
                      </Badge>
                    ))}
                    {(!preferences.targetRoles?.value || preferences.targetRoles.value.length === 0) && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
                        No target roles configured.
                      </span>
                    )}
                  </div>

                  <div className="text-caption" style={{ marginBottom: '0.4rem' }}>Preferred Locations</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {(preferences.preferredLocations?.value || []).map((loc) => (
                      <Badge key={loc} variant="neutral" size="sm">
                        <MapPin size={12} />
                        {loc}
                      </Badge>
                    ))}
                  </div>
                </Card.Content>
              </div>
            </Card>

            {/* Attached Resume */}
            <Card variant="default">
              <Card.Header
                onClick={() => toggleSection('resume')}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                className="profile-accordion-header touch-target"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileCheck size={18} color="var(--color-success-dark)" />
                  <Card.Title>Active Resume</Card.Title>
                </div>
                <ChevronDown
                  size={18}
                  className="mobile-only"
                  style={{
                    transform: expandedSections.has('resume') ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    color: 'var(--text-muted)'
                  }}
                />
              </Card.Header>
              <div className={expandedSections.has('resume') ? 'profile-accordion-body expanded' : 'profile-accordion-body collapsed'}>
                <Card.Content>
                  {profile?.resume?.fileName ? (
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                        {profile.resume.fileName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        Extracted &amp; indexed into your student career model.
                      </div>
                      <Link to="/resume">
                        <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                          Upload Updated Resume
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <p className="text-small" style={{ marginBottom: '1rem' }}>
                        No resume uploaded yet. Upload a PDF resume to auto-populate your profile.
                      </p>
                      <Link to="/resume">
                        <Button variant="primary" size="sm" style={{ width: '100%' }}>
                          Upload Resume PDF
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card.Content>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .profile-main-grid {
            grid-template-columns: 1fr !important;
          }
          .profile-accordion-body.collapsed {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .profile-accordion-body.collapsed {
            display: block !important;
          }
        }
      `}</style>
    </PageContainer>
  );
}
