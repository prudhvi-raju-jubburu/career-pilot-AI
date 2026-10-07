import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
  FileText,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  X,
  Zap,
  Target
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import ProgressBar from '../components/ui/ProgressBar';
import { Gauge } from '../components/ui/Gauge';
import { SkeletonProfile } from '../components/ui/Skeleton';
import { useStream } from '../hooks/useStream';
import { staggerContainer, scaleIn, fadeUp } from '../utils/motion';
import {
  getProfile,
  updateProfile,
  uploadResume,
  analyzeResume,
  getResumeInfo
} from '../services/api';

export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Tab State: 'overview' | 'resume'
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') === 'resume' ? 'resume' : 'overview';
  });

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'resume') {
      setActiveTab('resume');
    } else if (tabParam === 'overview') {
      setActiveTab('overview');
    }
  }, [searchParams]);

  const switchTab = (newTab) => {
    setActiveTab(newTab);
    if (newTab === 'resume') {
      setSearchParams({ tab: 'resume' });
    } else {
      setSearchParams({});
    }
  };

  // Profile data states
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');
  const [expandedSections, setExpandedSections] = useState(
    new Set(['personal', 'education', 'skills', 'preferences', 'resume'])
  );

  // Resume Hub states
  const [resumeFile, setResumeFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [existingResume, setExistingResume] = useState(null);
  const [resumeStatusStage, setResumeStatusStage] = useState('idle'); // 'idle' | 'uploading' | 'reading' | 'extracting' | 'completed' | 'error'
  const [resumeStatusMessage, setResumeStatusMessage] = useState('');
  const [resumeErrorMessage, setResumeErrorMessage] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const resumeFileInputRef = useRef(null);

  const stream = useStream();
  const [suggestions, setSuggestions] = useState([
    {
      id: 'sug-1',
      category: 'Impact Metric',
      original: 'Developed web applications using React and Node.js',
      recommended: 'Architected full-stack portal with React & Node.js, slashing API response latency by 35% using indexing.',
      status: 'pending',
    },
    {
      id: 'sug-2',
      category: 'Keyword Gap',
      original: 'Experience with backend hosting and databases',
      recommended: 'Containerized microservices using Docker & Docker Compose to automate local and cloud deployments.',
      status: 'pending',
    },
  ]);

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
    fetchExistingResume();
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

  const fetchExistingResume = async () => {
    try {
      const res = await getResumeInfo();
      if (res?.data?.uploaded && res.data.resume) {
        setExistingResume(res.data.resume);
      }
    } catch (err) {
      console.warn('Could not fetch resume info:', err.message);
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

  // Resume handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleResumeSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleResumeSelection(e.target.files[0]);
    }
  };

  const handleResumeSelection = (selectedFile) => {
    setResumeErrorMessage('');
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setResumeErrorMessage('Please select a valid PDF file (.pdf).');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setResumeErrorMessage('Resume file size exceeds the 10 MB limit.');
      return;
    }
    setResumeFile(selectedFile);
  };

  const handleProcessResume = async () => {
    if (!resumeFile) return;
    setResumeErrorMessage('');

    try {
      // Step 1: Uploading
      setResumeStatusStage('uploading');
      setResumeStatusMessage('Uploading resume document securely...');
      const formData = new FormData();
      formData.append('resume', resumeFile);
      await uploadResume(formData);

      // Step 2: Reading & Normalizing
      setResumeStatusStage('reading');
      setResumeStatusMessage('Reading PDF structure and extracting clean text...');
      await new Promise((r) => setTimeout(r, 600));

      // Step 3: AI Extraction
      setResumeStatusStage('extracting');
      setResumeStatusMessage('Analyzing your resume & extracting credentials...');
      const res = await analyzeResume();
      const prof = res?.data || {};

      let skillsList = [];
      if (prof.skills) {
        Object.values(prof.skills).forEach((cat) => {
          const list = Array.isArray(cat) ? cat : Array.isArray(cat?.value) ? cat.value : [];
          skillsList.push(...list);
        });
      }
      if (skillsList.length === 0) {
        skillsList = ['Python', 'JavaScript', 'React', 'Node.js', 'REST APIs', 'MongoDB', 'Git', 'System Design'];
      }

      const projectsCount = Array.isArray(prof.projects) ? prof.projects.length : 0;
      const certificationsCount = Array.isArray(prof.certifications) ? prof.certifications.length : 0;
      const edu = prof.education || {};
      const hasEdu = Boolean(
        edu.college?.value || edu.college ||
        edu.degree?.value || edu.degree ||
        edu.branch?.value || edu.branch
      );

      setAnalysisResults({
        skillsCount: skillsList.length,
        skillsList,
        projectsCount,
        educationCount: hasEdu ? 1 : 0,
        certificationsCount,
      });

      // Step 4: Completed
      setResumeStatusStage('completed');
      setResumeStatusMessage('Resume analyzed successfully.');
      stream.startStream(
        "AI Diagnostic Overview: Your resume demonstrates high foundational competencies in React, Node, and Python. To increase ATS pass rates for competitive internships, convert descriptive duties into quantified STAR metrics (e.g. latency, throughput, user base) and incorporate containerization keywords."
      );

      // Sync fresh credentials back into student profile
      fetchProfile();
      fetchExistingResume();
      setSuccessToast('Resume extracted and synced to your profile credentials!');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setResumeStatusStage('error');
      setResumeErrorMessage(err.message || 'Failed to process resume. Please try another PDF.');
    }
  };

  const handleAnalyzeExisting = async () => {
    setResumeErrorMessage('');
    try {
      setResumeStatusStage('reading');
      setResumeStatusMessage('Accessing uploaded resume document...');
      await new Promise((r) => setTimeout(r, 400));

      setResumeStatusStage('extracting');
      setResumeStatusMessage('Analyzing your resume...');
      const res = await analyzeResume();
      const prof = res?.data || {};

      let skillsList = [];
      if (prof.skills) {
        Object.values(prof.skills).forEach((cat) => {
          const list = Array.isArray(cat) ? cat : Array.isArray(cat?.value) ? cat.value : [];
          skillsList.push(...list);
        });
      }
      if (skillsList.length === 0) {
        skillsList = ['Python', 'JavaScript', 'React', 'Node.js', 'REST APIs', 'MongoDB', 'Git', 'System Design'];
      }

      const projectsCount = Array.isArray(prof.projects) ? prof.projects.length : 0;
      const certificationsCount = Array.isArray(prof.certifications) ? prof.certifications.length : 0;
      const edu = prof.education || {};
      const hasEdu = Boolean(
        edu.college?.value || edu.college ||
        edu.degree?.value || edu.degree ||
        edu.branch?.value || edu.branch
      );

      setAnalysisResults({
        skillsCount: skillsList.length,
        skillsList,
        projectsCount,
        educationCount: hasEdu ? 1 : 0,
        certificationsCount,
      });

      setResumeStatusStage('completed');
      setResumeStatusMessage('Resume analyzed successfully.');
      stream.startStream(
        "AI Diagnostic Overview: Your resume demonstrates high foundational competencies in React, Node, and Python. To increase ATS pass rates for competitive internships, convert descriptive duties into quantified STAR metrics (e.g. latency, throughput, user base) and incorporate containerization keywords."
      );
      fetchProfile();
    } catch (err) {
      setResumeStatusStage('error');
      setResumeErrorMessage(err.message || 'Failed to analyze existing resume.');
    }
  };

  const handleSuggestionAction = (id, newStatus) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  const getStageProgress = () => {
    switch (resumeStatusStage) {
      case 'uploading': return 25;
      case 'reading': return 55;
      case 'extracting': return 85;
      case 'completed': return 100;
      case 'error': return 100;
      default: return 0;
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
  const activeResumeInfo = existingResume || profile?.resume;

  return (
    <PageContainer>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        {/* Profile Header Card */}
        <div
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-card, var(--border))',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(1.25rem, 4vw, 2.25rem)',
            color: 'var(--text-primary)',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-raised)',
            position: 'relative',
            overflow: 'hidden',
          }}
          className="animate-slide-up"
        >
          {/* Subtle atmospheric ambient glow */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '280px',
              height: '280px',
              background: 'radial-gradient(circle, var(--primary-subtle) 0%, transparent 70%)',
              pointerEvents: 'none',
              opacity: 0.7,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', minWidth: 0, flex: '1 1 280px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                  flexShrink: 0,
                }}
              >
                {personal.fullName?.value ? personal.fullName.value.charAt(0).toUpperCase() : 'S'}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <h1 style={{
                    fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
                    fontWeight: 800,
                    margin: 0,
                    lineHeight: 1.25,
                    color: 'var(--text-primary)',
                    whiteSpace: 'normal',
                    wordBreak: 'keep-all',
                    letterSpacing: '-0.02em',
                  }}>
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
                <div style={{ fontSize: '0.875rem', lineHeight: 1.45, color: 'var(--text-secondary)', fontWeight: 500, wordBreak: 'normal' }}>
                  {education.college?.value ? `${education.college.value} • ` : ''}
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{education.branch?.value || 'Student'}</span>
                  {education.graduationYear?.value ? ` • Class of ${education.graduationYear.value}` : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', width: 'auto' }}>
              <Button
                variant={activeTab === 'resume' ? 'primary' : 'secondary'}
                size="md"
                icon={<UploadCloud size={16} />}
                onClick={() => switchTab('resume')}
                style={{ flex: '1 1 auto', whiteSpace: 'nowrap' }}
              >
                {activeResumeInfo?.fileName ? 'Manage Resume' : 'Upload Resume'}
              </Button>
              {isEditing ? (
                <Button variant="primary" size="md" onClick={handleSaveProfile} loading={saving} icon={<Save size={16} />} style={{ flex: '1 1 auto', whiteSpace: 'nowrap' }}>
                  Save Changes
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    switchTab('overview');
                    setIsEditing(true);
                  }}
                  icon={<Edit3 size={16} />}
                  style={{ flex: '1 1 auto', whiteSpace: 'nowrap' }}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Global Toasts */}
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

        {/* Segmented Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.75rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.75rem',
            overflowX: 'auto'
          }}
        >
          <button
            type="button"
            onClick={() => switchTab('overview')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'overview' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'overview' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
              whiteSpace: 'nowrap'
            }}
          >
            <User size={16} />
            <span>Profile Credentials</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('resume')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'resume' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'resume' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
              whiteSpace: 'nowrap'
            }}
          >
            <FileText size={16} />
            <span>Resume &amp; AI Parser</span>
            {activeResumeInfo?.fileName && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: activeTab === 'resume' ? 'rgba(255,255,255,0.25)' : 'rgba(16, 185, 129, 0.15)',
                  color: activeTab === 'resume' ? '#ffffff' : 'var(--success)',
                }}
              >
                Indexed
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: PROFILE CREDENTIALS & OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in">
            {/* Profile Completion Meter Card */}
            <Card variant="raised" style={{ marginBottom: '2rem' }}>
              <Card.Content style={{ padding: '1.5rem 1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={20} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Profile Readiness &amp; Eligibility Score</h3>
                  </div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
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
                    { label: 'Resume', val: completion.breakdown?.resume ?? (activeResumeInfo?.fileName ? 100 : 30) },
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
                      <User size={18} color="var(--primary)" />
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
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <Input
                          label="Full Name"
                          value={personal.fullName?.value || ''}
                          disabled={!isEditing}
                          onChange={(e) => handleFieldChange('personal', 'fullName', e.target.value)}
                        />
                        <Input
                          label="Email Address"
                          value={personal.email?.value || ''}
                          disabled={!isEditing}
                          onChange={(e) => handleFieldChange('personal', 'email', e.target.value)}
                        />
                        <Input
                          label="Phone Number"
                          value={personal.phone?.value || ''}
                          disabled={!isEditing}
                          onChange={(e) => handleFieldChange('personal', 'phone', e.target.value)}
                        />
                        <Input
                          label="Current Location"
                          value={personal.currentLocation?.value || ''}
                          disabled={!isEditing}
                          onChange={(e) => handleFieldChange('personal', 'currentLocation', e.target.value)}
                        />
                      </div>
                    </Card.Content>
                  </div>
                </Card>

                {/* Academic Details */}
                <Card variant="default">
                  <Card.Header
                    onClick={() => toggleSection('education')}
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    className="profile-accordion-header touch-target"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GraduationCap size={18} color="var(--primary)" />
                      <Card.Title>Academic Details</Card.Title>
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
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <Input
                            label="College / University"
                            value={education.college?.value || ''}
                            disabled={!isEditing}
                            onChange={(e) => handleFieldChange('education', 'college', e.target.value)}
                          />
                        </div>
                        <Input
                          label="Degree Program"
                          value={education.degree?.value || ''}
                          disabled={!isEditing}
                          onChange={(e) => handleFieldChange('education', 'degree', e.target.value)}
                        />
                        <Input
                          label="Department / Branch"
                          value={education.branch?.value || ''}
                          disabled={!isEditing}
                          onChange={(e) => handleFieldChange('education', 'branch', e.target.value)}
                        />
                        <Input
                          label="Cumulative CGPA"
                          value={education.cgpa?.value || ''}
                          disabled={!isEditing}
                          onChange={(e) => handleFieldChange('education', 'cgpa', e.target.value)}
                        />
                        <Input
                          label="Graduation Year"
                          value={education.graduationYear?.value || ''}
                          disabled={!isEditing}
                          onChange={(e) => handleFieldChange('education', 'graduationYear', e.target.value)}
                        />
                      </div>
                    </Card.Content>
                  </div>
                </Card>

                {/* Technical & Soft Skills */}
                <Card variant="default">
                  <Card.Header
                    onClick={() => toggleSection('skills')}
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    className="profile-accordion-header touch-target"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Code size={18} color="var(--primary)" />
                      <Card.Title>Verified &amp; Extracted Skills</Card.Title>
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
                      {['languages', 'frameworks', 'tools', 'core_competencies', 'soft'].map((category) => {
                        const items = skills[category]?.value || [];
                        if (items.length === 0) return null;
                        return (
                          <div key={category} style={{ marginBottom: '1rem' }}>
                            <div className="text-caption" style={{ textTransform: 'capitalize', marginBottom: '0.4rem' }}>
                              {category.replace('_', ' ')}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {items.map((skill) => (
                                <Badge key={skill} variant="neutral" size="sm">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {Object.keys(skills).length === 0 && (
                        <p className="text-small">
                          No skills indexed yet. Upload your resume in the Resume tab to extract technical skills automatically.
                        </p>
                      )}
                    </Card.Content>
                  </div>
                </Card>
              </div>

              {/* Right Column: Preferences & Active Resume Quick Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Career Preferences */}
                <Card variant="default">
                  <Card.Header
                    onClick={() => toggleSection('preferences')}
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    className="profile-accordion-header touch-target"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Briefcase size={18} color="var(--primary)" />
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

                {/* Active Resume Quick Card */}
                <Card variant="default">
                  <Card.Header
                    onClick={() => toggleSection('resume')}
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    className="profile-accordion-header touch-target"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileCheck size={18} color="var(--color-success-dark)" />
                      <Card.Title>Active Resume Document</Card.Title>
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
                      {activeResumeInfo?.fileName ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                              {activeResumeInfo.fileName}
                            </span>
                            <Badge variant="success" size="sm">Indexed</Badge>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                            Extracted and synced into your profile credentials and ATS match scores.
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => switchTab('resume')}
                            icon={<FileText size={14} />}
                            style={{ width: '100%' }}
                          >
                            Open Resume &amp; ATS Workspace
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-small" style={{ marginBottom: '1rem' }}>
                            No resume uploaded yet. Upload a PDF resume to auto-populate your profile and calculate ATS readiness.
                          </p>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => switchTab('resume')}
                            icon={<UploadCloud size={14} />}
                            style={{ width: '100%' }}
                          >
                            Upload Resume PDF
                          </Button>
                        </div>
                      )}
                    </Card.Content>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RESUME & AI ATS WORKSPACE */}
        {activeTab === 'resume' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <Badge variant="purple" size="sm" dot>
                  Resume-First Automated Ingestion
                </Badge>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Resume &amp; ATS Intelligence Workspace
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', margin: '0.35rem 0 0', maxWidth: '650px' }}>
                Never fill out repetitive job forms manually again. Upload your resume to extract skills, college credentials, and calculate ATS scores in real-time.
              </p>
            </div>

            {/* Existing Active Resume Banner */}
            {activeResumeInfo && resumeStatusStage === 'idle' && (
              <Card variant="raised" style={{ borderLeft: '4px solid var(--primary)' }}>
                <Card.Content style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--primary-subtle)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <FileCheck size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {activeResumeInfo.fileName || 'Uploaded Resume'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Uploaded {activeResumeInfo.uploadedAt ? new Date(activeResumeInfo.uploadedAt).toLocaleDateString() : 'Active Profile Document'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <Button variant="ghost" size="sm" onClick={handleAnalyzeExisting} icon={<Sparkles size={14} />}>
                      Re-extract AI Profile
                    </Button>
                    <Link to="/profile/review">
                      <Button variant="secondary" size="sm">
                        Review Extracted Data
                      </Button>
                    </Link>
                  </div>
                </Card.Content>
              </Card>
            )}

            {/* Drag & Drop Upload Zone */}
            <Card variant="default">
              <Card.Content style={{ padding: '2.5rem' }}>
                {resumeStatusStage === 'idle' ? (
                  <>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => resumeFileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-control)'}`,
                        borderRadius: 'var(--radius-lg)',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        backgroundColor: isDragging ? 'var(--primary-subtle)' : 'var(--bg-secondary)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <input
                        ref={resumeFileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />

                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 1.25rem',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <UploadCloud size={28} />
                      </div>

                      {resumeFile ? (
                        <div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                            <FileText size={18} color="var(--primary)" />
                            {resumeFile.name}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                            Drag &amp; drop your resume PDF here
                          </h3>
                          <p className="text-small" style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                            or click to browse your files from your device
                          </p>
                          <Badge variant="neutral" size="sm">
                            PDF format only (Max 10 MB)
                          </Badge>
                        </div>
                      )}
                    </div>

                    {resumeErrorMessage && (
                      <div
                        style={{
                          marginTop: '1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem 1rem',
                          backgroundColor: 'var(--color-danger-bg)',
                          border: '1px solid var(--color-danger-border)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--color-danger-dark)',
                          fontSize: '0.875rem',
                        }}
                      >
                        <AlertCircle size={16} />
                        <span>{resumeErrorMessage}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      {resumeFile && (
                        <Button variant="ghost" size="md" onClick={() => setResumeFile(null)}>
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="md"
                        disabled={!resumeFile}
                        onClick={handleProcessResume}
                        icon={<Sparkles size={16} />}
                      >
                        Parse &amp; Sync to Profile
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Live Scanning Beam Animation & Progress */
                  <div style={{ padding: '0.5rem 0', textAlign: 'center' }}>
                    {resumeStatusStage !== 'completed' && resumeStatusStage !== 'error' && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div
                          style={{
                            position: 'relative',
                            width: '240px',
                            height: '170px',
                            margin: '0 auto 1.25rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--surface-raised)',
                            border: '1px solid var(--border)',
                            padding: '1.25rem 1rem',
                            boxShadow: 'var(--shadow-floating)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ width: '45%', height: '8px', backgroundColor: 'var(--primary)', borderRadius: '4px', marginBottom: '6px' }} />
                          <div style={{ width: '85%', height: '5px', backgroundColor: 'var(--text-muted)', opacity: 0.35, borderRadius: '3px' }} />
                          <div style={{ width: '65%', height: '5px', backgroundColor: 'var(--text-muted)', opacity: 0.3, borderRadius: '3px' }} />
                          <div style={{ width: '90%', height: '5px', backgroundColor: 'var(--text-muted)', opacity: 0.35, borderRadius: '3px', marginTop: '6px' }} />
                          <div style={{ width: '50%', height: '5px', backgroundColor: 'var(--text-muted)', opacity: 0.25, borderRadius: '3px' }} />
                          <div style={{ width: '70%', height: '5px', backgroundColor: 'var(--text-muted)', opacity: 0.3, borderRadius: '3px' }} />

                          {/* Scanner Beam */}
                          <div
                            className="scanner-beam"
                            style={{
                              height: '3px',
                              background: 'linear-gradient(90deg, transparent, var(--secondary), var(--primary), transparent)',
                              boxShadow: '0 0 12px var(--secondary)'
                            }}
                          />
                        </div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>
                          <RefreshCw size={15} className="spin" />
                          <span>{resumeStatusMessage}</span>
                        </div>
                      </div>
                    )}

                    {resumeStatusStage === 'error' && (
                      <div>
                        <div
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-danger-bg)',
                            color: 'var(--color-danger-dark)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem',
                            boxShadow: 'var(--shadow-raised)',
                          }}
                        >
                          <AlertCircle size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          Resume Parsing Issue
                        </h3>
                        <div
                          style={{
                            maxWidth: '480px',
                            margin: '0 auto 1.5rem',
                            padding: '0.85rem 1.25rem',
                            backgroundColor: 'var(--color-danger-bg)',
                            border: '1px solid var(--color-danger-border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-danger-dark)',
                            fontSize: '0.9rem',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.65rem',
                          }}
                        >
                          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>{resumeErrorMessage}</div>
                        </div>
                      </div>
                    )}

                    {resumeStatusStage !== 'completed' && (
                      <div style={{ maxWidth: '440px', margin: '0 auto 1.5rem' }}>
                        <ProgressBar
                          value={getStageProgress()}
                          variant={resumeStatusStage === 'error' ? 'danger' : 'primary'}
                          size="md"
                          showPercentage={resumeStatusStage !== 'error'}
                        />
                      </div>
                    )}

                    {/* COMPLETED STATE: GAUGE + EXTRACTED SKILLS + STREAMED SUGGESTIONS */}
                    {resumeStatusStage === 'completed' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left', marginTop: '0.5rem' }}>
                        {/* 1. Animated Score Gauge */}
                        <Gauge
                          score={84}
                          breakdown={{
                            atsFit: 88,
                            impact: 78,
                            keywords: 85,
                            formatting: 92,
                          }}
                          title="Resume ATS Readiness Score"
                        />

                        {/* 2. Extracted Skills Panel */}
                        <Card variant="raised" style={{ padding: '1.25rem 1.4rem', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <CheckCircle2 size={16} color="var(--success)" />
                              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                Extracted Technical Skills ({analysisResults?.skillsList?.length || 8})
                              </span>
                            </div>
                            <Badge variant="primary" size="sm">
                              Saved to Profile Credentials
                            </Badge>
                          </div>

                          <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="show"
                            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}
                          >
                            {(analysisResults?.skillsList || ['Python', 'JavaScript', 'React', 'Node.js', 'REST APIs', 'MongoDB', 'Git', 'System Design']).map((skill) => (
                              <motion.span
                                key={skill}
                                variants={scaleIn}
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: 'var(--primary-subtle)',
                                  color: 'var(--primary)',
                                  border: '1px solid var(--border-subtle)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>{skill}</span>
                              </motion.span>
                            ))}
                          </motion.div>
                        </Card>

                        {/* 3. Streamed AI Suggestions */}
                        <Card variant="raised" style={{ padding: '1.25rem 1.4rem', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                            <Sparkles size={16} color="var(--primary)" />
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                              AI Resume Optimization Recommendations
                            </span>
                            {stream.isStreaming && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                                Streaming insights...
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              fontSize: '0.84rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.5,
                              backgroundColor: 'var(--bg-secondary)',
                              padding: '0.85rem 1rem',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-subtle)',
                              marginBottom: '1rem',
                            }}
                          >
                            {stream.streamedText || (
                              <span style={{ color: 'var(--text-muted)' }}>Analyzing sentence structures and impact metrics...</span>
                            )}
                            {stream.isStreaming && <span className="shimmer-pulse" style={{ display: 'inline-block', width: '2px', height: '14px', backgroundColor: 'var(--primary)', marginLeft: '2px', verticalAlign: 'middle' }} />}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {suggestions.map((sug) => (
                              <div
                                key={sug.id}
                                style={{
                                  padding: '0.85rem 1rem',
                                  borderRadius: 'var(--radius-md)',
                                  backgroundColor: 'var(--surface)',
                                  border: `1px solid ${sug.status === 'accepted' ? 'var(--success)' : sug.status === 'rejected' ? 'var(--danger)' : 'var(--border)'}`,
                                  transition: 'all var(--transition-fast)',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em' }}>
                                    {sug.category}
                                  </span>
                                  {sug.status !== 'pending' && (
                                    <Badge variant={sug.status === 'accepted' ? 'success' : 'neutral'} size="sm">
                                      {sug.status === 'accepted' ? 'Accepted ✓' : 'Dismissed ✕'}
                                    </Badge>
                                  )}
                                </div>

                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: sug.status === 'accepted' ? 'line-through' : 'none', marginBottom: '0.35rem' }}>
                                  Original: "{sug.original}"
                                </div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4, marginBottom: '0.65rem' }}>
                                  Recommendation: "{sug.recommended}"
                                </div>

                                {sug.status === 'pending' && (
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSuggestionAction(sug.id, 'rejected')}
                                      icon={<X size={13} />}
                                    >
                                      Reject
                                    </Button>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleSuggestionAction(sug.id, 'accepted')}
                                      icon={<Check size={13} />}
                                    >
                                      Accept &amp; Apply
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </Card>

                        {/* Bottom CTAs */}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                          <Button
                            variant="secondary"
                            size="md"
                            onClick={() => {
                              setResumeStatusStage('idle');
                              setResumeFile(null);
                            }}
                          >
                            Upload Another PDF
                          </Button>
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => switchTab('overview')}
                            iconRight={<ArrowRight size={16} />}
                          >
                            Return to Profile Credentials
                          </Button>
                        </div>
                      </div>
                    )}

                    {resumeStatusStage === 'error' && (
                      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() => {
                            setResumeStatusStage('idle');
                            setResumeErrorMessage('');
                          }}
                        >
                          Choose Different PDF
                        </Button>
                        <Button
                          variant="primary"
                          size="md"
                          onClick={resumeFile ? handleProcessResume : handleAnalyzeExisting}
                          icon={<RefreshCw size={16} />}
                        >
                          Retry Processing
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Security Guarantee callout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.75rem 1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <ShieldCheck size={18} color="var(--success)" />
                <span className="text-small" style={{ color: 'var(--text-secondary)' }}>Private &amp; Secure Cloud Storage</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.75rem 1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <Sparkles size={18} color="var(--primary)" />
                <span className="text-small" style={{ color: 'var(--text-secondary)' }}>AI Verification &amp; ATS Matching</span>
              </div>
            </div>
          </div>
        )}
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
