import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  User,
  GraduationCap,
  Code,
  Briefcase,
  MapPin,
  Plus,
  X,
  ArrowRight,
  ShieldCheck,
  Save,
  Check
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import ProgressBar from '../components/ui/ProgressBar';
import { getProfile, updateProfile, verifyProfile } from '../services/api';

export default function ProfileReviewPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [selectedSkillCategory, setSelectedSkillCategory] = useState('programmingLanguages');
  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  const navigate = useNavigate();

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
      setErrorToast(err.message || 'Failed to load profile.');
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

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    setProfile((prev) => {
      const updated = { ...prev };
      if (!updated.skills) updated.skills = {};
      if (!updated.skills[selectedSkillCategory]) {
        updated.skills[selectedSkillCategory] = { value: [], source: 'manual' };
      }
      const existing = updated.skills[selectedSkillCategory].value || [];
      if (!existing.includes(newSkill.trim())) {
        updated.skills[selectedSkillCategory] = {
          value: [...existing, newSkill.trim()],
          source: 'manual',
          confidence: 1.0,
        };
      }
      return updated;
    });
    setNewSkill('');
  };

  const handleRemoveSkill = (cat, skillToRemove) => {
    setProfile((prev) => {
      const updated = { ...prev };
      if (updated.skills && updated.skills[cat]) {
        const cur = updated.skills[cat].value || [];
        updated.skills[cat] = {
          value: cur.filter((s) => s !== skillToRemove),
          source: 'manual',
          confidence: 1.0,
        };
      }
      return updated;
    });
  };

  const handleAddRole = (e) => {
    e.preventDefault();
    if (!newRole.trim()) return;
    setProfile((prev) => {
      const updated = { ...prev };
      if (!updated.preferences) updated.preferences = {};
      const existing = updated.preferences.targetRoles?.value || [];
      if (!existing.includes(newRole.trim())) {
        updated.preferences.targetRoles = {
          value: [...existing, newRole.trim()],
          source: 'manual',
        };
      }
      return updated;
    });
    setNewRole('');
  };

  const handleRemoveRole = (role) => {
    setProfile((prev) => {
      const updated = { ...prev };
      const existing = updated.preferences?.targetRoles?.value || [];
      updated.preferences.targetRoles = {
        value: existing.filter((r) => r !== role),
        source: 'manual',
      };
      return updated;
    });
  };

  const handleAddLocation = (e) => {
    e.preventDefault();
    if (!newLocation.trim()) return;
    setProfile((prev) => {
      const updated = { ...prev };
      if (!updated.preferences) updated.preferences = {};
      const existing = updated.preferences.preferredLocations?.value || [];
      if (!existing.includes(newLocation.trim())) {
        updated.preferences.preferredLocations = {
          value: [...existing, newLocation.trim()],
          source: 'manual',
        };
      }
      return updated;
    });
    setNewLocation('');
  };

  const handleRemoveLocation = (loc) => {
    setProfile((prev) => {
      const updated = { ...prev };
      const existing = updated.preferences?.preferredLocations?.value || [];
      updated.preferences.preferredLocations = {
        value: existing.filter((l) => l !== loc),
        source: 'manual',
      };
      return updated;
    });
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setErrorToast('');
    try {
      await updateProfile(profile);
      setSuccessToast('Draft profile changes saved successfully.');
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      setErrorToast(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyProfile = async () => {
    setVerifying(true);
    setErrorToast('');
    try {
      // Save current state first
      await updateProfile(profile);
      // Verify
      await verifyProfile();
      setSuccessToast('Profile verified! Redirecting to student profile...');
      setTimeout(() => {
        navigate('/profile');
      }, 1000);
    } catch (err) {
      setErrorToast(err.message || 'Failed to verify profile.');
      setVerifying(false);
    }
  };

  // Helper to render provenance tag
  const renderProvenance = (fieldObj) => {
    if (!fieldObj) return null;
    const source = fieldObj.source;
    const conf = fieldObj.confidence ?? 1.0;

    if (source === 'resume') {
      if (conf < 0.75) {
        return (
          <Badge variant="warning" size="sm" dot>
            ⚠ Please verify
          </Badge>
        );
      }
      return (
        <Badge variant="primary" size="sm" dot>
          ✦ Extracted from resume
        </Badge>
      );
    }
    if (source === 'manual') {
      return (
        <Badge variant="neutral" size="sm">
          ● Added by you
        </Badge>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="status-dot connected spin" style={{ width: '16px', height: '16px', margin: '0 auto 1rem' }} />
          <p className="text-small">Loading extracted profile data...</p>
        </div>
      </PageContainer>
    );
  }

  const personal = profile?.personal || {};
  const education = profile?.education || {};
  const skills = profile?.skills || {};
  const preferences = profile?.preferences || {};

  return (
    <PageContainer>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        {/* Review Top Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-900) 0%, #1e1b4b 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem 2.25rem',
            color: 'white',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-raised)',
          }}
          className="animate-slide-up"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <Badge variant="purple" size="sm" dot>
                  AI Extraction Review
                </Badge>
                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Status: Needs Student Review</span>
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                Review &amp; Verify Your Profile
              </h1>
              <p style={{ opacity: 0.85, fontSize: '0.95rem', maxWidth: '650px' }}>
                We extracted the following career information from your resume. Review and refine any field below before final verification.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button variant="secondary" size="md" onClick={handleSaveDraft} loading={saving} icon={<Save size={15} />}>
                Save Draft
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleVerifyProfile}
                loading={verifying}
                icon={<CheckCircle2 size={16} />}
              >
                Verify My Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Success / Error Toasts */}
        {successToast && (
          <div style={{ padding: '0.85rem 1.25rem', backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', color: 'var(--color-success-dark)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
            <Check size={18} />
            <span>{successToast}</span>
          </div>
        )}
        {errorToast && (
          <div style={{ padding: '0.85rem 1.25rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger-dark)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
            <AlertTriangle size={18} />
            <span>{errorToast}</span>
          </div>
        )}

        {/* Section 1: Personal Information */}
        <Card variant="raised" style={{ marginBottom: '1.75rem' }}>
          <Card.Header>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <User size={18} color="var(--color-primary-600)" />
              <Card.Title>Personal &amp; Contact Details</Card.Title>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="grid-2">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="text-small" style={{ fontWeight: 600 }}>Full Name</label>
                  {renderProvenance(personal.fullName)}
                </div>
                <Input
                  value={personal.fullName?.value || ''}
                  onChange={(e) => handleFieldChange('personal', 'fullName', e.target.value)}
                  placeholder="Full Name"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="text-small" style={{ fontWeight: 600 }}>Email Address</label>
                  {renderProvenance(personal.email)}
                </div>
                <Input
                  value={personal.email?.value || ''}
                  onChange={(e) => handleFieldChange('personal', 'email', e.target.value)}
                  placeholder="Email"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="text-small" style={{ fontWeight: 600 }}>Phone Number</label>
                  {renderProvenance(personal.phone)}
                </div>
                <Input
                  value={personal.phone?.value || ''}
                  onChange={(e) => handleFieldChange('personal', 'phone', e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="text-small" style={{ fontWeight: 600 }}>Current Location</label>
                  {renderProvenance(personal.location)}
                </div>
                <Input
                  value={personal.location?.value || ''}
                  onChange={(e) => handleFieldChange('personal', 'location', e.target.value)}
                  placeholder="e.g. Hyderabad, India"
                />
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Section 2: Education */}
        <Card variant="raised" style={{ marginBottom: '1.75rem' }}>
          <Card.Header>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <GraduationCap size={18} color="var(--color-primary-600)" />
              <Card.Title>Academic Identity</Card.Title>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="grid-2">
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="text-small" style={{ fontWeight: 600 }}>College / University</label>
                  {renderProvenance(education.college)}
                </div>
                <Input
                  value={education.college?.value || ''}
                  onChange={(e) => handleFieldChange('education', 'college', e.target.value)}
                  placeholder="e.g. National Institute of Technology"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="text-small" style={{ fontWeight: 600 }}>Academic Branch / Major</label>
                  {renderProvenance(education.branch)}
                </div>
                <Input
                  value={education.branch?.value || ''}
                  onChange={(e) => handleFieldChange('education', 'branch', e.target.value)}
                  placeholder="e.g. Computer Science and Engineering"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="text-small" style={{ fontWeight: 600 }}>Degree Program</label>
                  {renderProvenance(education.degree)}
                </div>
                <Input
                  value={education.degree?.value || ''}
                  onChange={(e) => handleFieldChange('education', 'degree', e.target.value)}
                  placeholder="e.g. B.Tech / B.E."
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="text-small" style={{ fontWeight: 600 }}>Graduation Year</label>
                  {renderProvenance(education.graduationYear)}
                </div>
                <Input
                  type="number"
                  value={education.graduationYear?.value || ''}
                  onChange={(e) => handleFieldChange('education', 'graduationYear', parseInt(e.target.value) || null)}
                  placeholder="2026"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="text-small" style={{ fontWeight: 600 }}>CGPA (out of 10 or 4)</label>
                  {renderProvenance(education.cgpa)}
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={education.cgpa?.value || ''}
                  onChange={(e) => handleFieldChange('education', 'cgpa', parseFloat(e.target.value) || null)}
                  placeholder="8.50"
                />
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Section 3: Technical Skills */}
        <Card variant="raised" style={{ marginBottom: '1.75rem' }}>
          <Card.Header>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Code size={18} color="var(--color-primary-600)" />
              <Card.Title>Categorized Technical Skills</Card.Title>
            </div>
          </Card.Header>
          <Card.Content>
            {/* Add Skill Bar */}
            <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <select
                value={selectedSkillCategory}
                onChange={(e) => setSelectedSkillCategory(e.target.value)}
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-control)',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  boxShadow: 'var(--shadow-sunken)',
                }}
              >
                <option value="programmingLanguages">Programming Languages</option>
                <option value="frameworks">Frameworks &amp; Libraries</option>
                <option value="databases">Databases</option>
                <option value="technical">Core CS &amp; Architecture</option>
                <option value="tools">Developer Tools</option>
                <option value="cloud">Cloud &amp; DevOps</option>
              </select>

              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add skill (e.g. Docker, TypeScript)..."
                style={{
                  flex: 1,
                  minWidth: '220px',
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-control)',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--color-surface)',
                  boxShadow: 'var(--shadow-sunken)',
                }}
              />

              <Button type="submit" variant="secondary" size="sm" icon={<Plus size={15} />}>
                Add Skill
              </Button>
            </form>

            {/* Render Categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { key: 'programmingLanguages', label: 'Programming Languages' },
                { key: 'frameworks', label: 'Frameworks & Libraries' },
                { key: 'databases', label: 'Databases' },
                { key: 'technical', label: 'Core Technical Concepts' },
                { key: 'tools', label: 'Tools & DevOps' },
              ].map((cat) => {
                const skillList = skills[cat.key]?.value || [];
                return (
                  <div key={cat.key}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {cat.label} ({skillList.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {skillList.length > 0 ? (
                        skillList.map((skill) => (
                          <span
                            key={skill}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '0.3rem 0.65rem',
                              backgroundColor: 'var(--color-bg)',
                              border: '1px solid var(--border-control)',
                              borderRadius: 'var(--radius-md)',
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              color: 'var(--color-text)',
                            }}
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(cat.key, skill)}
                              style={{ display: 'inline-flex', color: 'var(--color-text-subtle)', padding: '2px' }}
                              title="Remove"
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                          No skills extracted in this category.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card.Content>
        </Card>

        {/* Section 4: Missing Information & Career Preferences */}
        <Card variant="raised" style={{ marginBottom: '2.5rem', borderLeft: '4px solid var(--color-accent-600)' }}>
          <Card.Header>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <Briefcase size={18} color="var(--color-accent-600)" />
                <Card.Title>Career Preferences (Required for Opportunity Matching)</Card.Title>
              </div>
              <p className="text-small">
                These preferences could not be inferred from your resume. Specify them to unlock personalized recommendation accuracy.
              </p>
            </div>
          </Card.Header>
          <Card.Content>
            {/* Preferred Roles */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="text-small" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Target Job Roles
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {(preferences.targetRoles?.value || []).map((role) => (
                  <Badge key={role} variant="primary" size="md">
                    <span>{role}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(role)}
                      style={{ marginLeft: '4px', display: 'inline-flex', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
              <form onSubmit={handleAddRole} style={{ display: 'flex', gap: '0.5rem', maxWidth: '440px' }}>
                <Input
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Software Engineer, Backend Developer"
                />
                <Button type="submit" variant="secondary" size="md">
                  Add
                </Button>
              </form>
            </div>

            {/* Preferred Locations */}
            <div>
              <label className="text-small" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Preferred Work Locations
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {(preferences.preferredLocations?.value || []).map((loc) => (
                  <Badge key={loc} variant="neutral" size="md">
                    <MapPin size={12} />
                    <span>{loc}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(loc)}
                      style={{ marginLeft: '4px', display: 'inline-flex', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
              <form onSubmit={handleAddLocation} style={{ display: 'flex', gap: '0.5rem', maxWidth: '440px' }}>
                <Input
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, Hyderabad, Remote"
                />
                <Button type="submit" variant="secondary" size="md">
                  Add
                </Button>
              </form>
            </div>
          </Card.Content>
        </Card>

        {/* Bottom Final Action Bar */}
        <div
          style={{
            position: 'sticky',
            bottom: '1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            padding: '1.15rem 1.75rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-control)',
            boxShadow: 'var(--shadow-floating)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>Ready to verify your profile?</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Verifying your profile makes you eligible for automated matching and discovery.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="secondary" size="md" onClick={handleSaveDraft} loading={saving}>
              Save Draft
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleVerifyProfile}
              loading={verifying}
              icon={<CheckCircle2 size={16} />}
            >
              Verify My Profile
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
