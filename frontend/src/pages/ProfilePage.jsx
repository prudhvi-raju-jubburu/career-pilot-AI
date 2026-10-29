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
  AlertTriangle,
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
  Target,
  Plus,
  Trash2,
  ExternalLink,
  HelpCircle,
  ArrowUpRight,
  Eye,
  SlidersHorizontal,
  FolderGit2
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import ProgressBar from '../components/ui/ProgressBar';
import { Gauge } from '../components/ui/Gauge';
import { SkeletonProfile } from '../components/ui/Skeleton';
import { normalizeSkill, CANONICAL_ROLES } from '../services/skillCatalog';
import {
  getProfile,
  updateProfile,
  verifyProfile,
  getProfileCompletion,
  uploadResume,
  analyzeResume,
  confirmResumeExtraction,
  getResumeInfo,
  getRecommendations
} from '../services/api';

// Safe String Extractor for React Children
const getFieldValue = (field) => {
  if (field === null || field === undefined) return '';
  if (typeof field === 'object') {
    if ('value' in field) {
      return field.value === null || field.value === undefined ? '' : String(field.value);
    }
    return '';
  }
  return String(field);
};

// Safe Array Extractor
const getArrayValue = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) {
    return field.map((item) => (typeof item === 'object' && item && 'value' in item ? String(item.value) : String(item)));
  }
  if (typeof field === 'object' && Array.isArray(field.value)) {
    return field.value.map((item) => String(item));
  }
  return [];
};

const SKILL_CATEGORIES = [
  { id: 'programming_languages', label: 'Programming Languages' },
  { id: 'frameworks', label: 'Frameworks & Libraries' },
  { id: 'databases', label: 'Databases' },
  { id: 'cloud', label: 'Cloud Infrastructure' },
  { id: 'devops', label: 'DevOps & CI/CD' },
  { id: 'tools', label: 'Tools & Utilities' },
  { id: 'ai_ml', label: 'AI & Data Science' },
  { id: 'other', label: 'Other Technical Skills' }
];

const PREFERRED_LOCATION_OPTIONS = [
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Mumbai',
  'Delhi NCR',
  'Chennai',
  'Remote (India)',
  'Remote (Worldwide)'
];

const WORK_MODE_OPTIONS = ['Remote', 'Hybrid', 'On-site'];
const OPPORTUNITY_TYPE_OPTIONS = ['Full-Time', 'Internship', 'Contract', 'Research Fellowship'];

export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active Tab: 'identity' | 'resume' | 'matching'
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'resume') return 'resume';
    if (tabParam === 'matching') return 'matching';
    return 'identity';
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'resume') setActiveTab('resume');
    else if (tabParam === 'matching') setActiveTab('matching');
    else if (tabParam === 'identity') setActiveTab('identity');
  }, [searchParams]);

  const switchTab = (newTab) => {
    setActiveTab(newTab);
    if (newTab === 'identity') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: newTab });
    }
  };

  // State: Profile & Loading
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState({ percentage: 0, breakdown: {}, missing_fields: [], missing_items: [] });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  // Editable Form Draft
  const [draft, setDraft] = useState(null);

  // Resume Workspace State
  const [existingResume, setExistingResume] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extractionStage, setExtractionStage] = useState('idle'); // 'idle' | 'selected' | 'uploading' | 'extracted_text' | 'analyzing' | 'review' | 'confirmed' | 'error'
  const [stageMessage, setStageMessage] = useState('');
  const [stageProgress, setStageProgress] = useState(0);
  const [extractionError, setExtractionError] = useState('');
  const [extractedReviewData, setExtractedReviewData] = useState(null);
  const [extractedCleanPreview, setExtractedCleanPreview] = useState('');
  const [selectedReviewFields, setSelectedReviewFields] = useState(new Set());
  const [reviewFieldChoices, setReviewFieldChoices] = useState({}); // fieldPath -> 'resume' | 'existing'
  const [confirmingExtraction, setConfirmingExtraction] = useState(false);

  // Skill Editor State
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('programming_languages');
  const [activeSkillCategoryFilter, setActiveSkillCategoryFilter] = useState('all');

  // Project Editor State
  const [newProject, setNewProject] = useState({ name: '', description: '', technologies: '', role: '', url: '' });
  const [showAddProject, setShowAddProject] = useState(false);

  // Experience Editor State
  const [newExp, setNewExp] = useState({ organization: '', role: '', duration: '', responsibilities: '' });
  const [showAddExp, setShowAddExp] = useState(false);

  // Recommendations State
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  // Accordion Expand State
  const [expandedSections, setExpandedSections] = useState(
    new Set(['personal', 'education', 'skills', 'projects', 'experience', 'preferences'])
  );

  const fileInputRef = useRef(null);

  const toggleSection = (sec) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sec)) next.delete(sec);
      else next.add(sec);
      return next;
    });
  };

  const scrollToSection = (sec) => {
    switchTab('identity');
    setIsEditing(true);
    setExpandedSections((prev) => new Set([...prev, sec]));
    setTimeout(() => {
      const el = document.getElementById(`section-${sec}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.focus?.();
      }
    }, 150);
  };

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfileData(),
        fetchCompletionData(),
        fetchResumeInfoData()
      ]);
    } catch (err) {
      setErrorToast(err.message || 'Failed to initialize profile workspace.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      const res = await getProfile();
      if (res?.data) {
        setProfile(res.data);
        initDraftFromProfile(res.data);
      }
    } catch (err) {
      console.warn('Error fetching profile:', err.message);
    }
  };

  const fetchCompletionData = async () => {
    try {
      const res = await getProfileCompletion();
      if (res?.data) {
        setCompletion(res.data);
      }
    } catch (err) {
      console.warn('Error fetching completion:', err.message);
    }
  };

  const fetchResumeInfoData = async () => {
    try {
      const res = await getResumeInfo();
      if (res?.data?.uploaded && res.data.resume) {
        setExistingResume(res.data.resume);
      }
    } catch (err) {
      console.warn('Error fetching resume info:', err.message);
    }
  };

  const fetchRecommendationsData = async () => {
    setRecommendationsLoading(true);
    try {
      const res = await getRecommendations({ limit: 4 });
      if (res?.data?.opportunities) {
        setRecommendations(res.data.opportunities);
      } else if (Array.isArray(res?.data)) {
        setRecommendations(res.data.slice(0, 4));
      }
    } catch (err) {
      console.warn('Could not fetch recommendations:', err.message);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'matching') {
      fetchRecommendationsData();
    }
  }, [activeTab]);

  // Sync Draft when profile loads
  const initDraftFromProfile = (prof) => {
    if (!prof) return;
    const personal = prof.personal || {};
    const education = prof.education || {};
    const skills = prof.skills || {};
    const preferences = prof.preferences || {};

    const extractVal = (obj, field) => {
      if (!obj) return '';
      const v = obj[field];
      return getFieldValue(v);
    };

    const extractArr = (obj, field) => {
      if (!obj) return [];
      const v = obj[field];
      return getArrayValue(v);
    };

    setDraft({
      personal: {
        full_name: extractVal(personal, 'fullName') || extractVal(personal, 'full_name') || '',
        email: extractVal(personal, 'email') || '',
        phone: extractVal(personal, 'phone') || '',
        location: extractVal(personal, 'location') || extractVal(personal, 'currentLocation') || ''
      },
      education: {
        college: extractVal(education, 'college') || '',
        degree: extractVal(education, 'degree') || '',
        branch: extractVal(education, 'branch') || '',
        graduation_year: extractVal(education, 'graduationYear') || extractVal(education, 'graduation_year') || '',
        cgpa: extractVal(education, 'cgpa') !== '' ? extractVal(education, 'cgpa') : ''
      },
      skills: {
        programming_languages: extractArr(skills, 'programmingLanguages').length > 0 ? extractArr(skills, 'programmingLanguages') : extractArr(skills, 'programming_languages'),
        frameworks: extractArr(skills, 'frameworks'),
        databases: extractArr(skills, 'databases'),
        cloud: extractArr(skills, 'cloud'),
        devops: extractArr(skills, 'devops'),
        tools: extractArr(skills, 'tools'),
        ai_ml: extractArr(skills, 'ai_ml').length > 0 ? extractArr(skills, 'ai_ml') : extractArr(skills, 'aiMl'),
        other: extractArr(skills, 'other').length > 0 ? extractArr(skills, 'other') : extractArr(skills, 'technical')
      },
      projects: Array.isArray(prof.projects) ? [...prof.projects] : [],
      experience: Array.isArray(prof.experience) ? [...prof.experience] : [],
      certifications: Array.isArray(prof.certifications) ? [...prof.certifications] : [],
      achievements: Array.isArray(prof.achievements) ? [...prof.achievements] : [],
      preferences: {
        target_roles: extractArr(preferences, 'targetRoles').length > 0 ? extractArr(preferences, 'targetRoles') : extractArr(preferences, 'target_roles'),
        preferred_locations: extractArr(preferences, 'preferredLocations').length > 0 ? extractArr(preferences, 'preferredLocations') : extractArr(preferences, 'preferred_locations'),
        opportunity_types: extractArr(preferences, 'opportunityTypes').length > 0 ? extractArr(preferences, 'opportunityTypes') : extractArr(preferences, 'opportunity_types'),
        work_modes: extractArr(preferences, 'workModes').length > 0 ? extractArr(preferences, 'workModes') : ['Remote', 'Hybrid']
      }
    });
  };

  // Draft Mutators
  const updateDraftField = (section, field, value) => {
    setDraft((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Skills Manager
  const handleAddSkillToDraft = (e) => {
    e?.preventDefault();
    if (!newSkillName.trim() || !draft) return;
    const normalized = normalizeSkill(newSkillName.trim());
    const targetCat = newSkillCategory;

    const currentList = draft.skills[targetCat] || [];
    if (currentList.some((s) => s.toLowerCase() === normalized.toLowerCase())) {
      setErrorToast(`Skill "${normalized}" is already listed in this category.`);
      setTimeout(() => setErrorToast(''), 3000);
      return;
    }

    setDraft((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [targetCat]: [...(prev.skills[targetCat] || []), normalized]
      }
    }));
    setNewSkillName('');
    setSuccessToast(`Added skill: ${normalized}`);
    setTimeout(() => setSuccessToast(''), 2500);
  };

  const handleRemoveSkillFromDraft = (category, skillToRemove) => {
    if (!draft) return;
    setDraft((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: (prev.skills[category] || []).filter((s) => s !== skillToRemove)
      }
    }));
  };

  // Projects Manager
  const handleAddProjectToDraft = (e) => {
    e?.preventDefault();
    if (!newProject.name.trim() || !draft) return;
    const techArray = newProject.technologies
      ? newProject.technologies.split(',').map((t) => normalizeSkill(t.trim())).filter(Boolean)
      : [];

    const projectObj = {
      name: newProject.name.trim(),
      description: newProject.description.trim(),
      technologies: techArray,
      role: newProject.role.trim() || null,
      url: newProject.url.trim() || null
    };

    setDraft((prev) => ({
      ...prev,
      projects: [...prev.projects, projectObj]
    }));
    setNewProject({ name: '', description: '', technologies: '', role: '', url: '' });
    setShowAddProject(false);
  };

  const handleRemoveProjectFromDraft = (index) => {
    if (!draft) return;
    setDraft((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, idx) => idx !== index)
    }));
  };

  // Experience Manager
  const handleAddExpToDraft = (e) => {
    e?.preventDefault();
    if (!newExp.organization.trim() || !newExp.role.trim() || !draft) return;
    const expObj = {
      organization: newExp.organization.trim(),
      role: newExp.role.trim(),
      duration: newExp.duration.trim() || null,
      responsibilities: newExp.responsibilities
        ? newExp.responsibilities.split('\n').map((r) => r.trim()).filter(Boolean)
        : []
    };

    setDraft((prev) => ({
      ...prev,
      experience: [...prev.experience, expObj]
    }));
    setNewExp({ organization: '', role: '', duration: '', responsibilities: '' });
    setShowAddExp(false);
  };

  const handleRemoveExpFromDraft = (index) => {
    if (!draft) return;
    setDraft((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, idx) => idx !== index)
    }));
  };

  // Preferences Manager
  const togglePreferenceItem = (prefKey, item) => {
    if (!draft) return;
    const current = draft.preferences[prefKey] || [];
    const exists = current.includes(item);
    const updated = exists ? current.filter((x) => x !== item) : [...current, item];
    setDraft((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [prefKey]: updated
      }
    }));
  };

  // Save Full Profile Draft
  const handleSaveProfile = async () => {
    if (!draft) return;
    setSaving(true);
    setErrorToast('');

    // Validations
    if (draft.education.cgpa !== '' && draft.education.cgpa !== null) {
      const cgpaNum = parseFloat(draft.education.cgpa);
      if (isNaN(cgpaNum) || cgpaNum < 0.0 || cgpaNum > 10.0) {
        setErrorToast('CGPA must be a valid numeric value between 0.0 and 10.0.');
        setSaving(false);
        return;
      }
    }

    if (draft.education.graduation_year !== '' && draft.education.graduation_year !== null) {
      const yearNum = parseInt(draft.education.graduation_year, 10);
      if (isNaN(yearNum) || yearNum < 1970 || yearNum > 2040) {
        setErrorToast('Graduation year must be a valid 4-digit year between 1970 and 2040.');
        setSaving(false);
        return;
      }
    }

    try {
      const payload = {
        personal: {
          full_name: draft.personal.full_name || null,
          email: draft.personal.email || null,
          phone: draft.personal.phone || null,
          location: draft.personal.location || null
        },
        education: {
          college: draft.education.college || null,
          degree: draft.education.degree || null,
          branch: draft.education.branch || null,
          graduation_year: draft.education.graduation_year ? parseInt(draft.education.graduation_year, 10) : null,
          cgpa: draft.education.cgpa !== '' && draft.education.cgpa !== null ? parseFloat(draft.education.cgpa) : null
        },
        skills: draft.skills,
        projects: draft.projects,
        experience: draft.experience,
        certifications: draft.certifications,
        achievements: draft.achievements,
        preferences: draft.preferences
      };

      const res = await updateProfile(payload);
      if (res?.data) {
        setProfile(res.data);
        initDraftFromProfile(res.data);
      }
      await fetchCompletionData();
      setIsEditing(false);
      setSuccessToast('Profile changes saved successfully! Verified status reset to Needs Review.');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setErrorToast(err.message || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  // Verify Profile
  const handleVerifyProfile = async () => {
    setVerifying(true);
    setErrorToast('');
    try {
      const res = await verifyProfile();
      if (res?.data) {
        setProfile(res.data);
        initDraftFromProfile(res.data);
      }
      setSuccessToast('Profile verified! You are now eligible for automated opportunity matching.');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setErrorToast(err.message || 'Verification failed. Please ensure full name, email, and education are present.');
    } finally {
      setVerifying(false);
    }
  };

  // Resume File Selection & Drag-and-Drop
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
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const validateAndSelectFile = (file) => {
    setExtractionError('');
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      setExtractionError('Supported file formats are PDF (.pdf) and Microsoft Word (.docx).');
      return;
    }
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setExtractionError(`File exceeds maximum size limit of 10 MB (Selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }
    setSelectedFile(file);
    setExtractionStage('selected');
    setStageProgress(15);
  };

  const handleCancelSelectedFile = () => {
    setSelectedFile(null);
    setExtractionStage('idle');
    setExtractionError('');
    setStageProgress(0);
  };

  // Upload & Analyze Transparent Flow
  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;
    setExtractionError('');

    try {
      // Stage 2: Uploading
      setExtractionStage('uploading');
      setStageMessage('Uploading resume document securely to isolated sandbox...');
      setStageProgress(35);

      const formData = new FormData();
      formData.append('resume', selectedFile);
      const uploadRes = await uploadResume(formData);
      if (!uploadRes?.success) {
        throw new Error(uploadRes?.message || 'Resume upload failed');
      }

      // Stage 3: Text Extraction & Normalization
      setExtractionStage('extracted_text');
      setStageMessage('Extracting clean text and parsing document layout...');
      setStageProgress(60);

      // Stage 4: AI Analysis in Review Mode (save=false)
      setExtractionStage('analyzing');
      setStageMessage('Performing Gemini AI structured extraction & conflict detection...');
      setStageProgress(80);

      const analyzeRes = await analyzeResume({ save: false });
      if (!analyzeRes?.success || !analyzeRes?.data?.extracted_data) {
        throw new Error(analyzeRes?.message || 'Resume analysis failed to produce structured data.');
      }

      const extracted = analyzeRes.data.extracted_data;
      const preview = analyzeRes.data.clean_text_preview || '';

      // Stage 5: Ready for Review
      setExtractedReviewData(extracted);
      setExtractedCleanPreview(preview);
      setExtractionStage('review');
      setStageProgress(100);
      setStageMessage('Resume extraction completed! Review and choose which fields to merge.');

      // Initialize Selected Review Fields & Conflict Choices
      initReviewSelection(extracted);
    } catch (err) {
      setExtractionStage('error');
      setExtractionError(err.message || 'Resume extraction failed. Please try again with a valid PDF or DOCX.');
    }
  };

  // Analyze Existing Uploaded Resume in Review Mode
  const handleAnalyzeExistingResume = async () => {
    setExtractionError('');
    try {
      setExtractionStage('analyzing');
      setStageMessage('Extracting information from previously uploaded resume (Review Mode)...');
      setStageProgress(70);

      const analyzeRes = await analyzeResume({ save: false });
      if (!analyzeRes?.success || !analyzeRes?.data?.extracted_data) {
        throw new Error(analyzeRes?.message || 'Failed to extract structured data from resume.');
      }

      const extracted = analyzeRes.data.extracted_data;
      const preview = analyzeRes.data.clean_text_preview || '';

      setExtractedReviewData(extracted);
      setExtractedCleanPreview(preview);
      setExtractionStage('review');
      setStageProgress(100);
      setStageMessage('Extracted information ready for review.');
      initReviewSelection(extracted);
    } catch (err) {
      setExtractionStage('error');
      setExtractionError(err.message || 'Failed to analyze existing resume.');
    }
  };

  // Helper to compare existing vs extracted and set defaults
  const initReviewSelection = (extracted) => {
    const selected = new Set();
    const choices = {};

    // Check Personal
    if (extracted.personal) {
      const p = extracted.personal;
      if (p.fullName) {
        selected.add('personal.full_name');
        choices['personal.full_name'] = profile?.field_sources?.['personal.full_name'] === 'manual' ? 'existing' : 'resume';
      }
      if (p.email) {
        selected.add('personal.email');
        choices['personal.email'] = profile?.field_sources?.['personal.email'] === 'manual' ? 'existing' : 'resume';
      }
      if (p.phone) {
        selected.add('personal.phone');
        choices['personal.phone'] = 'resume';
      }
      if (p.location) {
        selected.add('personal.location');
        choices['personal.location'] = 'resume';
      }
    }

    // Check Education
    if (extracted.education) {
      const e = extracted.education;
      if (e.college) {
        selected.add('education.college');
        choices['education.college'] = profile?.field_sources?.['education.college'] === 'manual' ? 'existing' : 'resume';
      }
      if (e.degree) {
        selected.add('education.degree');
        choices['education.degree'] = 'resume';
      }
      if (e.branch) {
        selected.add('education.branch');
        choices['education.branch'] = 'resume';
      }
      if (e.graduationYear) {
        selected.add('education.graduation_year');
        choices['education.graduation_year'] = 'resume';
      }
      if (e.cgpa) {
        selected.add('education.cgpa');
        choices['education.cgpa'] = profile?.field_sources?.['education.cgpa'] === 'manual' ? 'existing' : 'resume';
      }
    }

    // Skills
    if (extracted.skills) {
      selected.add('skills');
    }

    // Projects
    if (Array.isArray(extracted.projects) && extracted.projects.length > 0) {
      selected.add('projects');
    }

    // Experience
    if (Array.isArray(extracted.experience) && extracted.experience.length > 0) {
      selected.add('experience');
    }

    // Certifications
    if (Array.isArray(extracted.certifications) && extracted.certifications.length > 0) {
      selected.add('certifications');
    }

    setSelectedReviewFields(selected);
    setReviewFieldChoices(choices);
  };

  const toggleReviewField = (fieldPath) => {
    setSelectedReviewFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldPath)) next.delete(fieldPath);
      else next.add(fieldPath);
      return next;
    });
  };

  const setFieldChoice = (fieldPath, choice) => {
    setReviewFieldChoices((prev) => ({
      ...prev,
      [fieldPath]: choice
    }));
  };

  const updateExtractedFieldVal = (section, field, newVal) => {
    setExtractedReviewData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: newVal
      }
    }));
  };

  const removeExtractedSkillTag = (categoryKey, skillTag) => {
    setExtractedReviewData((prev) => {
      if (!prev?.skills?.[categoryKey]) return prev;
      return {
        ...prev,
        skills: {
          ...prev.skills,
          [categoryKey]: prev.skills[categoryKey].filter((s) => s !== skillTag)
        }
      };
    });
  };

  // Confirm Extraction & Save to Profile
  const handleConfirmExtraction = async () => {
    if (!extractedReviewData) return;
    setConfirmingExtraction(true);
    setExtractionError('');

    try {
      const payload = {
        confirmed_data: extractedReviewData,
        selected_fields: Array.from(selectedReviewFields),
        field_choices: reviewFieldChoices
      };

      const res = await confirmResumeExtraction(payload);
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to apply confirmed extraction.');
      }

      // Refresh full profile, completion, resume info, and recommendations
      await Promise.all([
        fetchProfileData(),
        fetchCompletionData(),
        fetchResumeInfoData()
      ]);

      setExtractionStage('confirmed');
      setSuccessToast('Resume details confirmed and merged with protected profile fields!');
      setTimeout(() => setSuccessToast(''), 5000);
    } catch (err) {
      setExtractionError(err.message || 'Failed to apply confirmed extraction changes.');
    } finally {
      setConfirmingExtraction(false);
    }
  };

  // Helper values
  const personal = profile?.personal || {};
  const education = profile?.education || {};
  const isVerified = profile?.verification_status === 'verified';
  const activeResume = existingResume || profile?.resume;

  const currentFullName = getFieldValue(personal.fullName) || getFieldValue(personal.full_name) || '';
  const currentCollege = getFieldValue(education.college) || '';
  const currentDegree = getFieldValue(education.degree) || '';
  const currentBranch = getFieldValue(education.branch) || '';
  const currentGradYear = getFieldValue(education.graduationYear) || getFieldValue(education.graduation_year) || '';
  const currentCGPA = getFieldValue(education.cgpa) || '';

  const targetRolesList = draft?.preferences?.target_roles || [];

  if (loading) {
    return (
      <PageContainer>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 0' }}>
          <SkeletonProfile />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div style={{ maxWidth: '1120px', margin: '0 auto', paddingBottom: '3rem' }}>
        
        {/* ========================================================= */}
        {/* SECTION A: PROFILE OVERVIEW (EXECUTIVE CAREER IDENTITY) */}
        {/* ========================================================= */}
        <div
          className="career-identity-header-card"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0c4a6e 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(1.5rem, 4vw, 2.5rem)',
            color: '#f8fafc',
            marginBottom: '1.75rem',
            boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.7), 0 0 20px rgba(6, 182, 212, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '320px',
              height: '320px',
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
            {/* Identity Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', flex: '1 1 320px' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 900,
                  boxShadow: '0 8px 20px rgba(37, 99, 235, 0.45)',
                  flexShrink: 0
                }}
              >
                {currentFullName ? currentFullName.charAt(0).toUpperCase() : 'S'}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <h1
                    style={{
                      fontSize: 'clamp(1.35rem, 4vw, 1.85rem)',
                      fontWeight: 800,
                      margin: 0,
                      color: '#ffffff',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2
                    }}
                  >
                    {currentFullName || 'Student Career Profile'}
                  </h1>

                  {isVerified ? (
                    <Badge variant="success" size="sm" dot style={{ whiteSpace: 'nowrap' }}>
                      <ShieldCheck size={13} style={{ marginRight: '3px' }} /> Verified Profile
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm" dot style={{ whiteSpace: 'nowrap' }}>
                      Needs Review
                    </Badge>
                  )}
                </div>

                <div style={{ fontSize: '0.925rem', color: '#cbd5e1', fontWeight: 500, lineHeight: 1.45, marginBottom: '0.5rem' }}>
                  {currentCollege ? `${currentCollege} • ` : ''}
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{currentBranch || currentDegree || 'Engineering Scholar'}</span>
                  {currentGradYear ? ` • Class of ${currentGradYear}` : ''}
                  {currentCGPA ? ` • CGPA: ${currentCGPA}` : ''}
                </div>

                {/* Target Role & Preference Badges */}
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {(targetRolesList.length > 0 ? targetRolesList : ['Aspiring Engineer']).slice(0, 2).map((role) => (
                    <span
                      key={typeof role === 'string' ? role : JSON.stringify(role)}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#7dd3fc',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Target size={11} /> {typeof role === 'string' ? role : getFieldValue(role)}
                    </span>
                  ))}
                  {activeResume?.fileName && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#6ee7b7',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <FileCheck size={11} /> Resume Attached
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & Completion Gauge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  textAlign: 'right',
                  padding: '0.75rem 1.25rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.07)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
              >
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>
                  Completeness
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: completion.percentage >= 80 ? '#34d399' : '#38bdf8' }}>
                  {completion.percentage}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                  {completion.percentage >= 80 ? 'High Opportunity Match' : 'Build profile to 80%+'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {isEditing ? (
                  <Button
                    variant="primary"
                    size="md"
                    loading={saving}
                    onClick={handleSaveProfile}
                    icon={<Save size={16} />}
                    style={{ backgroundColor: '#0284c7', borderColor: '#38bdf8', color: '#ffffff' }}
                  >
                    Save Changes
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      switchTab('identity');
                      setIsEditing(true);
                    }}
                    icon={<Edit3 size={16} />}
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.25)' }}
                  >
                    Edit Profile
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => switchTab('resume')}
                  icon={<UploadCloud size={14} />}
                  style={{ color: '#7dd3fc' }}
                >
                  {activeResume?.fileName ? 'Manage Resume' : 'Upload Resume'}
                </Button>
              </div>
            </div>
          </div>

          {/* Prominent Next-Action Suggestion */}
          {completion.missing_items && completion.missing_items.length > 0 && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '0.85rem 1.15rem',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Sparkles size={17} color="#fbbf24" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: '#fef3c7', fontWeight: 600 }}>
                  Next Best Step: Add your <strong>{String(completion.missing_items[0])}</strong> to improve opportunity recommendation precision.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const item = String(completion.missing_items[0]).toLowerCase();
                  if (item.includes('college') || item.includes('degree') || item.includes('cgpa')) scrollToSection('education');
                  else if (item.includes('skill')) scrollToSection('skills');
                  else if (item.includes('project')) scrollToSection('projects');
                  else if (item.includes('role') || item.includes('location')) scrollToSection('preferences');
                  else switchTab('resume');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fbbf24',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Complete Now <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Global Toasts */}
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: '#ecfdf5',
              border: '1px solid #6ee7b7',
              color: '#065f46',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
            }}
          >
            <CheckCircle2 size={18} color="#059669" />
            <span>{successToast}</span>
          </motion.div>
        )}

        {errorToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
            }}
          >
            <AlertCircle size={18} color="#dc2626" />
            <span>{errorToast}</span>
          </motion.div>
        )}

        {/* Segmented Workspace Tabs */}
        <div
          role="tablist"
          aria-label="Profile Workspace Navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.75rem',
            borderBottom: '2px solid var(--border)',
            paddingBottom: '0.5rem',
            overflowX: 'auto'
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'identity'}
            onClick={() => switchTab('identity')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'identity' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'identity' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <User size={16} />
            <span>Profile Builder &amp; Credentials</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'resume'}
            onClick={() => switchTab('resume')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'resume' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'resume' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <FileText size={16} />
            <span>Resume &amp; Transparent Parser</span>
            {activeResume?.fileName && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: activeTab === 'resume' ? 'rgba(255,255,255,0.25)' : 'rgba(16, 185, 129, 0.15)',
                  color: activeTab === 'resume' ? '#ffffff' : 'var(--success)'
                }}
              >
                Attached
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'matching'}
            onClick={() => switchTab('matching')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'matching' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'matching' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Sparkles size={16} />
            <span>Matching &amp; Recommendations</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: PROFILE BUILDER & CREDENTIALS */}
        {/* ========================================================= */}
        {activeTab === 'identity' && (
          <div className="animate-fade-in">
            {/* Profile Completion Guidance Panel */}
            <Card variant="raised" style={{ marginBottom: '2rem' }}>
              <Card.Content style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Award size={22} color="var(--primary)" />
                    <div>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Deterministic Profile Completion
                      </h2>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Calculated by backend rules without arbitrary estimates. Unlocks higher confidence in opportunity matching.
                      </p>
                    </div>
                  </div>

                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: completion.percentage >= 80 ? 'var(--success)' : 'var(--primary)' }}>
                    {completion.percentage}% Complete
                  </span>
                </div>

                <ProgressBar
                  value={completion.percentage}
                  size="md"
                  variant={completion.percentage >= 80 ? 'success' : 'primary'}
                  showPercentage={false}
                  style={{ marginBottom: '1.25rem' }}
                />

                {/* Section-by-Section Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  {[
                    { label: 'Personal (20%)', val: completion.breakdown?.personal ?? 0, sec: 'personal' },
                    { label: 'Education (25%)', val: completion.breakdown?.education ?? 0, sec: 'education' },
                    { label: 'Skills (20%)', val: completion.breakdown?.skills ?? 0, sec: 'skills' },
                    { label: 'Projects/Exp (15%)', val: completion.breakdown?.projects ?? 0, sec: 'projects' },
                    { label: 'Preferences (10%)', val: completion.breakdown?.preferences ?? 0, sec: 'preferences' },
                    { label: 'Resume (10%)', val: completion.breakdown?.resume ?? 0, tab: 'resume' }
                  ].map((cat) => (
                    <div
                      key={cat.label}
                      onClick={() => cat.sec ? scrollToSection(cat.sec) : switchTab(cat.tab)}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease',
                      }}
                      className="hover-card"
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {cat.label}
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: cat.val === 100 ? 'var(--success)' : 'var(--text-primary)', marginTop: '2px' }}>
                        {cat.val}%
                      </div>
                    </div>
                  ))}
                </div>

                {completion.missing_items && completion.missing_items.length > 0 && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--warning-bg)',
                      border: '1px solid var(--warning-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      color: 'var(--warning)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 600 }}>Missing to reach 100%:</span>
                    {completion.missing_items.map((m) => (
                      <Badge key={String(m)} variant="neutral" size="sm">
                        {String(m)}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Profile Sections Builder Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Section 1: Personal Information */}
              <Card variant="default" id="section-personal">
                <Card.Header
                  onClick={() => toggleSection('personal')}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  className="touch-target"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <User size={18} color="var(--primary)" />
                    <Card.Title>Personal &amp; Contact Details</Card.Title>
                    {profile?.field_sources?.['personal.full_name'] && (
                      <Badge variant="neutral" size="sm">
                        source: {typeof profile.field_sources['personal.full_name'] === 'string' ? profile.field_sources['personal.full_name'] : 'manual'}
                      </Badge>
                    )}
                  </div>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: expandedSections.has('personal') ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: 'var(--text-muted)'
                    }}
                  />
                </Card.Header>

                <AnimatePresence>
                  {expandedSections.has('personal') && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <Card.Content>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                          <Input
                            label="Full Name"
                            value={draft?.personal.full_name || ''}
                            disabled={!isEditing}
                            onChange={(e) => updateDraftField('personal', 'full_name', e.target.value)}
                            placeholder="e.g. Rohan Sharma"
                          />
                          <Input
                            label="Email Address"
                            type="email"
                            value={draft?.personal.email || ''}
                            disabled={!isEditing}
                            onChange={(e) => updateDraftField('personal', 'email', e.target.value)}
                            placeholder="e.g. rohan.sharma@university.edu"
                          />
                          <Input
                            label="Phone Number"
                            value={draft?.personal.phone || ''}
                            disabled={!isEditing}
                            onChange={(e) => updateDraftField('personal', 'phone', e.target.value)}
                            placeholder="e.g. +91 9876543210"
                          />
                          <Input
                            label="Current Location"
                            value={draft?.personal.location || ''}
                            disabled={!isEditing}
                            onChange={(e) => updateDraftField('personal', 'location', e.target.value)}
                            placeholder="e.g. Hyderabad, Telangana"
                          />
                        </div>
                      </Card.Content>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Section 2: Academic & Education */}
              <Card variant="default" id="section-education">
                <Card.Header
                  onClick={() => toggleSection('education')}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  className="touch-target"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <GraduationCap size={18} color="var(--primary)" />
                    <Card.Title>Education &amp; Academic Credentials</Card.Title>
                    {profile?.field_sources?.['education.college'] && (
                      <Badge variant="neutral" size="sm">
                        source: {typeof profile.field_sources['education.college'] === 'string' ? profile.field_sources['education.college'] : 'manual'}
                      </Badge>
                    )}
                  </div>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: expandedSections.has('education') ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: 'var(--text-muted)'
                    }}
                  />
                </Card.Header>

                <AnimatePresence>
                  {expandedSections.has('education') && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <Card.Content>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <Input
                              label="College / University"
                              value={draft?.education.college || ''}
                              disabled={!isEditing}
                              onChange={(e) => updateDraftField('education', 'college', e.target.value)}
                              placeholder="e.g. National Institute of Technology, Warangal"
                            />
                          </div>
                          <Input
                            label="Degree Program"
                            value={draft?.education.degree || ''}
                            disabled={!isEditing}
                            onChange={(e) => updateDraftField('education', 'degree', e.target.value)}
                            placeholder="e.g. B.Tech"
                          />
                          <Input
                            label="Department / Branch"
                            value={draft?.education.branch || ''}
                            disabled={!isEditing}
                            onChange={(e) => updateDraftField('education', 'branch', e.target.value)}
                            placeholder="e.g. Computer Science and Engineering"
                          />
                          <Input
                            label="Graduation Year (1970 - 2040)"
                            type="number"
                            min="1970"
                            max="2040"
                            value={draft?.education.graduation_year || ''}
                            disabled={!isEditing}
                            onChange={(e) => updateDraftField('education', 'graduation_year', e.target.value)}
                            placeholder="e.g. 2026"
                          />
                          <Input
                            label="Cumulative CGPA (0.0 - 10.0)"
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={draft?.education.cgpa !== null && draft?.education.cgpa !== undefined ? String(draft.education.cgpa) : ''}
                            disabled={!isEditing}
                            onChange={(e) => updateDraftField('education', 'cgpa', e.target.value)}
                            placeholder="e.g. 8.75"
                          />
                        </div>
                      </Card.Content>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Section 3: Skills & Technologies */}
              <Card variant="default" id="section-skills">
                <Card.Header
                  onClick={() => toggleSection('skills')}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  className="touch-target"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Code size={18} color="var(--primary)" />
                    <Card.Title>Technical Skills &amp; Competencies</Card.Title>
                    <Badge variant="primary" size="sm">
                      {Object.values(draft?.skills || {}).flat().length} Skills
                    </Badge>
                  </div>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: expandedSections.has('skills') ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: 'var(--text-muted)'
                    }}
                  />
                </Card.Header>

                <AnimatePresence>
                  {expandedSections.has('skills') && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <Card.Content>
                        {/* Add Skill Bar (when editing) */}
                        {isEditing && (
                          <form
                            onSubmit={handleAddSkillToDraft}
                            style={{
                              display: 'flex',
                              gap: '0.75rem',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              padding: '1rem',
                              backgroundColor: 'var(--bg-secondary)',
                              borderRadius: 'var(--radius-md)',
                              marginBottom: '1.25rem',
                              border: '1px solid var(--border)'
                            }}
                          >
                            <div style={{ flex: '1 1 200px' }}>
                              <Input
                                value={newSkillName}
                                onChange={(e) => setNewSkillName(e.target.value)}
                                placeholder="Type skill alias (e.g. js, docker, k8s, react)..."
                              />
                            </div>
                            <div style={{ minWidth: '180px' }}>
                              <select
                                value={newSkillCategory}
                                onChange={(e) => setNewSkillCategory(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '0.65rem 0.85rem',
                                  borderRadius: 'var(--radius-md)',
                                  border: '1px solid var(--border-control)',
                                  backgroundColor: 'var(--surface)',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {SKILL_CATEGORIES.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <Button type="submit" variant="primary" size="md" icon={<Plus size={15} />}>
                              Add Skill
                            </Button>
                          </form>
                        )}

                        {/* Skill Category Filter Tabs */}
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                          <button
                            type="button"
                            onClick={() => setActiveSkillCategoryFilter('all')}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: activeSkillCategoryFilter === 'all' ? 'var(--primary)' : 'var(--bg-secondary)',
                              color: activeSkillCategoryFilter === 'all' ? '#ffffff' : 'var(--text-secondary)'
                            }}
                          >
                            All Categories
                          </button>
                          {SKILL_CATEGORIES.map((cat) => {
                            const count = (draft?.skills?.[cat.id] || []).length;
                            if (count === 0 && !isEditing) return null;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setActiveSkillCategoryFilter(cat.id)}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  border: 'none',
                                  cursor: 'pointer',
                                  backgroundColor: activeSkillCategoryFilter === cat.id ? 'var(--primary)' : 'var(--bg-secondary)',
                                  color: activeSkillCategoryFilter === cat.id ? '#ffffff' : 'var(--text-secondary)'
                                }}
                              >
                                {cat.label} ({count})
                              </button>
                            );
                          })}
                        </div>

                        {/* Render Skills by Category */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {SKILL_CATEGORIES.filter((c) => activeSkillCategoryFilter === 'all' || activeSkillCategoryFilter === c.id).map((cat) => {
                            const skillList = draft?.skills?.[cat.id] || [];
                            if (skillList.length === 0 && activeSkillCategoryFilter === 'all') return null;

                            return (
                              <div key={cat.id} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                                  {cat.label} ({skillList.length})
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                                  {skillList.length > 0 ? (
                                    skillList.map((skill) => (
                                      <span
                                        key={typeof skill === 'string' ? skill : JSON.stringify(skill)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '0.3rem 0.75rem',
                                          backgroundColor: 'var(--bg-secondary)',
                                          border: '1px solid var(--border)',
                                          borderRadius: 'var(--radius-sm)',
                                          fontSize: '0.825rem',
                                          fontWeight: 600,
                                          color: 'var(--text-primary)'
                                        }}
                                      >
                                        <span>{typeof skill === 'string' ? skill : getFieldValue(skill)}</span>
                                        {isEditing && (
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveSkillFromDraft(cat.id, skill)}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              color: 'var(--text-muted)',
                                              cursor: 'pointer',
                                              padding: '1px',
                                              display: 'inline-flex'
                                            }}
                                            title="Remove Skill"
                                          >
                                            <X size={13} />
                                          </button>
                                        )}
                                      </span>
                                    ))
                                  ) : (
                                    <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                      No skills in this category yet.
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card.Content>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Section 4: Projects */}
              <Card variant="default" id="section-projects">
                <Card.Header
                  onClick={() => toggleSection('projects')}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  className="touch-target"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <FolderGit2 size={18} color="var(--primary)" />
                    <Card.Title>Projects &amp; Contributions</Card.Title>
                    <Badge variant="neutral" size="sm">
                      {draft?.projects?.length || 0} Projects
                    </Badge>
                  </div>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: expandedSections.has('projects') ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: 'var(--text-muted)'
                    }}
                  />
                </Card.Header>

                <AnimatePresence>
                  {expandedSections.has('projects') && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <Card.Content>
                        {/* Projects List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                          {(draft?.projects || []).map((proj, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '1.25rem',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div>
                                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                    {getFieldValue(proj.name)}
                                  </h3>
                                  {proj.role && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                      Role: {getFieldValue(proj.role)}
                                    </div>
                                  )}
                                </div>
                                {isEditing && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProjectFromDraft(idx)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--danger)',
                                      cursor: 'pointer',
                                      display: 'inline-flex'
                                    }}
                                    title="Delete Project"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>

                              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.4rem 0 0.75rem', lineHeight: 1.5 }}>
                                {getFieldValue(proj.description)}
                              </p>

                              {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                  {proj.technologies.map((t) => (
                                    <Badge key={typeof t === 'string' ? t : JSON.stringify(t)} variant="primary" size="sm">
                                      {typeof t === 'string' ? t : getFieldValue(t)}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}

                          {(draft?.projects?.length === 0 || !draft?.projects) && (
                            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                              No projects added yet. Add projects to demonstrate practical software engineering competencies.
                            </div>
                          )}
                        </div>

                        {/* Add Project Form (in editing mode) */}
                        {isEditing && (
                          <div>
                            {!showAddProject ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowAddProject(true)}
                                icon={<Plus size={15} />}
                              >
                                Add Project
                              </Button>
                            ) : (
                              <form
                                onSubmit={handleAddProjectToDraft}
                                style={{
                                  padding: '1.25rem',
                                  borderRadius: 'var(--radius-md)',
                                  backgroundColor: 'var(--surface-raised)',
                                  border: '1px solid var(--border)'
                                }}
                              >
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                  <Input
                                    label="Project Title *"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Distributed Task Scheduler"
                                    required
                                  />
                                  <Input
                                    label="Role / Contribution"
                                    value={newProject.role}
                                    onChange={(e) => setNewProject((p) => ({ ...p, role: e.target.value }))}
                                    placeholder="e.g. Lead Backend Architect"
                                  />
                                  <div style={{ gridColumn: '1 / -1' }}>
                                    <Input
                                      label="Technologies (comma-separated)"
                                      value={newProject.technologies}
                                      onChange={(e) => setNewProject((p) => ({ ...p, technologies: e.target.value }))}
                                      placeholder="e.g. Python, FastAPI, Redis, Docker"
                                    />
                                  </div>
                                  <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                                      Description
                                    </label>
                                    <textarea
                                      value={newProject.description}
                                      onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
                                      rows={3}
                                      style={{
                                        width: '100%',
                                        padding: '0.65rem 0.85rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-control)',
                                        backgroundColor: 'var(--surface)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.875rem'
                                      }}
                                      placeholder="Quantify impact, architecture decisions, and technologies..."
                                    />
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                                  <Button variant="ghost" size="sm" onClick={() => setShowAddProject(false)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" variant="primary" size="sm">
                                    Save Project
                                  </Button>
                                </div>
                              </form>
                            )}
                          </div>
                        )}
                      </Card.Content>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Section 5: Work Experience & Internships */}
              <Card variant="default" id="section-experience">
                <Card.Header
                  onClick={() => toggleSection('experience')}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  className="touch-target"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Briefcase size={18} color="var(--primary)" />
                    <Card.Title>Work Experience &amp; Internships</Card.Title>
                    <Badge variant="neutral" size="sm">
                      {draft?.experience?.length || 0} Records
                    </Badge>
                  </div>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: expandedSections.has('experience') ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: 'var(--text-muted)'
                    }}
                  />
                </Card.Header>

                <AnimatePresence>
                  {expandedSections.has('experience') && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <Card.Content>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                          {(draft?.experience || []).map((exp, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '1.25rem',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                    {getFieldValue(exp.role)} @ {getFieldValue(exp.organization)}
                                  </h3>
                                  {exp.duration && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      {getFieldValue(exp.duration)}
                                    </div>
                                  )}
                                </div>
                                {isEditing && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExpFromDraft(idx)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--danger)',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>

                              {Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0 && (
                                <ul style={{ margin: '0.65rem 0 0', paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  {exp.responsibilities.map((r, rIdx) => (
                                    <li key={rIdx} style={{ marginBottom: '4px' }}>{getFieldValue(r)}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}

                          {(draft?.experience?.length === 0 || !draft?.experience) && (
                            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                              No work experience listed. Internships or research fellowships can be added here.
                            </div>
                          )}
                        </div>

                        {/* Add Experience Form */}
                        {isEditing && (
                          <div>
                            {!showAddExp ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowAddExp(true)}
                                icon={<Plus size={15} />}
                              >
                                Add Experience
                              </Button>
                            ) : (
                              <form
                                onSubmit={handleAddExpToDraft}
                                style={{
                                  padding: '1.25rem',
                                  borderRadius: 'var(--radius-md)',
                                  backgroundColor: 'var(--surface-raised)',
                                  border: '1px solid var(--border)'
                                }}
                              >
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                  <Input
                                    label="Company / Organization *"
                                    value={newExp.organization}
                                    onChange={(e) => setNewExp((p) => ({ ...p, organization: e.target.value }))}
                                    placeholder="e.g. Acme Cloud Corp"
                                    required
                                  />
                                  <Input
                                    label="Role / Title *"
                                    value={newExp.role}
                                    onChange={(e) => setNewExp((p) => ({ ...p, role: e.target.value }))}
                                    placeholder="e.g. Backend Engineering Intern"
                                    required
                                  />
                                  <div style={{ gridColumn: '1 / -1' }}>
                                    <Input
                                      label="Duration"
                                      value={newExp.duration}
                                      onChange={(e) => setNewExp((p) => ({ ...p, duration: e.target.value }))}
                                      placeholder="e.g. May 2025 - August 2025"
                                    />
                                  </div>
                                  <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                                      Key Responsibilities (one per line)
                                    </label>
                                    <textarea
                                      value={newExp.responsibilities}
                                      onChange={(e) => setNewExp((p) => ({ ...p, responsibilities: e.target.value }))}
                                      rows={3}
                                      style={{
                                        width: '100%',
                                        padding: '0.65rem 0.85rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-control)',
                                        backgroundColor: 'var(--surface)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.875rem'
                                      }}
                                      placeholder="Designed REST endpoints...&#10;Reduced p99 query latency by 35%..."
                                    />
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                                  <Button variant="ghost" size="sm" onClick={() => setShowAddExp(false)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" variant="primary" size="sm">
                                    Save Experience
                                  </Button>
                                </div>
                              </form>
                            )}
                          </div>
                        )}
                      </Card.Content>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Section 6: Career Preferences & Work Mode */}
              <Card variant="default" id="section-preferences">
                <Card.Header
                  onClick={() => toggleSection('preferences')}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  className="touch-target"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Target size={18} color="var(--primary)" />
                    <Card.Title>Career Preferences &amp; Role Interests</Card.Title>
                  </div>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: expandedSections.has('preferences') ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: 'var(--text-muted)'
                    }}
                  />
                </Card.Header>

                <AnimatePresence>
                  {expandedSections.has('preferences') && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <Card.Content>
                        {/* Target Roles */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            Target Job Roles
                          </label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.75rem' }}>
                            {CANONICAL_ROLES.map((role) => {
                              const isSelected = (draft?.preferences?.target_roles || []).includes(role);
                              return (
                                <button
                                  key={role}
                                  type="button"
                                  disabled={!isEditing}
                                  onClick={() => togglePreferenceItem('target_roles', role)}
                                  style={{
                                    padding: '0.35rem 0.85rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                    backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-secondary)',
                                    color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                                    cursor: isEditing ? 'pointer' : 'default',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {isSelected && <Check size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                                  {role}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Preferred Locations */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            Preferred Locations
                          </label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                            {PREFERRED_LOCATION_OPTIONS.map((loc) => {
                              const isSelected = (draft?.preferences?.preferred_locations || []).includes(loc);
                              return (
                                <button
                                  key={loc}
                                  type="button"
                                  disabled={!isEditing}
                                  onClick={() => togglePreferenceItem('preferred_locations', loc)}
                                  style={{
                                    padding: '0.35rem 0.85rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    border: `1px solid ${isSelected ? 'var(--secondary)' : 'var(--border)'}`,
                                    backgroundColor: isSelected ? 'var(--secondary-subtle)' : 'var(--bg-secondary)',
                                    color: isSelected ? 'var(--secondary)' : 'var(--text-secondary)',
                                    cursor: isEditing ? 'pointer' : 'default',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <MapPin size={12} />
                                  {loc}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Work Modes & Opportunity Types */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                              Preferred Work Modes
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                              {WORK_MODE_OPTIONS.map((mode) => {
                                const isSelected = (draft?.preferences?.work_modes || []).includes(mode);
                                return (
                                  <button
                                    key={mode}
                                    type="button"
                                    disabled={!isEditing}
                                    onClick={() => togglePreferenceItem('work_modes', mode)}
                                    style={{
                                      padding: '0.35rem 0.75rem',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                      backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-secondary)',
                                      color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                                      cursor: isEditing ? 'pointer' : 'default'
                                    }}
                                  >
                                    {mode}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                              Opportunity Types
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                              {OPPORTUNITY_TYPE_OPTIONS.map((type) => {
                                const isSelected = (draft?.preferences?.opportunity_types || []).includes(type);
                                return (
                                  <button
                                    key={type}
                                    type="button"
                                    disabled={!isEditing}
                                    onClick={() => togglePreferenceItem('opportunity_types', type)}
                                    style={{
                                      padding: '0.35rem 0.75rem',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      border: `1px solid ${isSelected ? 'var(--secondary)' : 'var(--border)'}`,
                                      backgroundColor: isSelected ? 'var(--secondary-subtle)' : 'var(--bg-secondary)',
                                      color: isSelected ? 'var(--secondary)' : 'var(--text-secondary)',
                                      cursor: isEditing ? 'pointer' : 'default'
                                    }}
                                  >
                                    {type}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </Card.Content>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

            </div>

            {/* Bottom Floating Save Bar (when editing) */}
            {isEditing && (
              <div
                style={{
                  position: 'sticky',
                  bottom: '1.5rem',
                  marginTop: '2rem',
                  padding: '1rem 1.5rem',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  zIndex: 40
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                    Unsaved Profile Edits
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Saving updates your manual credentials and recalculates opportunity match scores.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      initDraftFromProfile(profile);
                      setIsEditing(false);
                    }}
                    style={{ color: '#cbd5e1' }}
                  >
                    Discard Changes
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    loading={saving}
                    onClick={handleSaveProfile}
                    icon={<Save size={16} />}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            {/* Verification Callout if not verified */}
            {!isVerified && !isEditing && (
              <Card variant="raised" style={{ marginTop: '2rem', borderLeft: '4px solid #10b981' }}>
                <Card.Content style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>
                      Ready to Verify Your Profile?
                    </h3>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Profile verification confirms your identity and signals trust to recruiters and automated application queues.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    loading={verifying}
                    onClick={handleVerifyProfile}
                    icon={<ShieldCheck size={16} />}
                  >
                    Verify Profile Now
                  </Button>
                </Card.Content>
              </Card>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: RESUME WORKSPACE & TRANSPARENT AI PARSER */}
        {/* ========================================================= */}
        {activeTab === 'resume' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Badge variant="primary" size="sm" dot>
                  Transparent Resume Ingestion
                </Badge>
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Resume &amp; Transparent Extraction Workspace
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', margin: '0.35rem 0 0', maxWidth: '720px' }}>
                Upload your resume in PDF or DOCX format. We extract credentials step-by-step and let you review, edit, and confirm every detected field before anything touches your permanent profile.
              </p>
            </div>

            {/* Active Resume Card (if exists and idle) */}
            {activeResume?.fileName && extractionStage === 'idle' && (
              <Card variant="raised" style={{ borderLeft: '4px solid var(--primary)' }}>
                <Card.Content style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--primary-subtle)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <FileCheck size={24} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {getFieldValue(activeResume.fileName)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Attached {activeResume.uploadedAt ? new Date(activeResume.uploadedAt).toLocaleDateString() : 'Active Document'}
                        {activeResume.fileSize ? ` • ${(activeResume.fileSize / (1024 * 1024)).toFixed(2)} MB` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAnalyzeExistingResume}
                      icon={<Sparkles size={14} />}
                    >
                      Re-Extract (Review Mode)
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      icon={<UploadCloud size={14} />}
                    >
                      Replace Resume
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            )}

            {/* Drag & Drop Upload Card (Stages: idle, selected) */}
            {(extractionStage === 'idle' || extractionStage === 'selected') && (
              <Card variant="default">
                <Card.Content style={{ padding: '2.5rem' }}>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    tabIndex={0}
                    role="button"
                    aria-label="Upload resume file dropzone. Supported formats: PDF and DOCX up to 10 MB."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        fileInputRef.current?.click();
                      }
                    }}
                    style={{
                      border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-control)'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '3rem 2rem',
                      textAlign: 'center',
                      backgroundColor: isDragging ? 'var(--primary-subtle)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    className="focus-ring"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileInputChange}
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
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <UploadCloud size={28} />
                    </div>

                    {selectedFile ? (
                      <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '0.35rem' }}>
                          <FileText size={20} color="var(--primary)" />
                          {selectedFile.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                          Drag &amp; drop your resume here
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                          or click to browse your files from your device
                        </p>
                        <Badge variant="neutral" size="sm">
                          Supported Formats: PDF (.pdf) &amp; Word (.docx) • Max 10 MB
                        </Badge>
                      </div>
                    )}
                  </div>

                  {extractionError && (
                    <div
                      style={{
                        marginTop: '1.25rem',
                        padding: '0.85rem 1.15rem',
                        backgroundColor: 'var(--danger-bg)',
                        border: '1px solid var(--danger-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--danger)',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem'
                      }}
                    >
                      <AlertCircle size={18} style={{ flexShrink: 0 }} />
                      <span>{extractionError}</span>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {selectedFile && (
                      <Button variant="ghost" size="md" onClick={handleCancelSelectedFile}>
                        Remove Selection
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="md"
                      disabled={!selectedFile}
                      onClick={handleUploadAndAnalyze}
                      icon={<Sparkles size={16} />}
                    >
                      Upload &amp; Extract (Review Mode)
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            )}

            {/* Stages: Uploading, Text Extraction, AI Analysis */}
            {['uploading', 'extracted_text', 'analyzing'].includes(extractionStage) && (
              <Card variant="raised" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-subtle)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.5rem',
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)'
                    }}
                  >
                    <RefreshCw size={28} className="spin" />
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {stageMessage}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Please wait while our parsing engine reads your resume without modifying your profile.
                  </p>

                  <ProgressBar value={stageProgress} size="md" variant="primary" showPercentage />
                </div>
              </Card>
            )}

            {/* Stage: Error */}
            {extractionStage === 'error' && (
              <Card variant="raised" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--danger-bg)',
                      color: 'var(--danger)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem'
                    }}
                  >
                    <AlertCircle size={30} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    Resume Extraction Issue
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--danger)', marginBottom: '1.5rem' }}>
                    {extractionError || 'An unexpected error occurred while parsing the resume.'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <Button variant="secondary" size="md" onClick={() => setExtractionStage('idle')}>
                      Choose Different Document
                    </Button>
                    <Button variant="primary" size="md" onClick={selectedFile ? handleUploadAndAnalyze : handleAnalyzeExistingResume}>
                      Retry Processing
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* ========================================================= */}
            {/* STAGE 5: EXTRACTION REVIEW WORKSPACE */}
            {/* ========================================================= */}
            {extractionStage === 'review' && extractedReviewData && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {/* Review Header Banner */}
                <div
                  style={{
                    padding: '1.25rem 1.75rem',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <Sparkles size={24} color="#2563eb" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '1.05rem' }}>
                        Review Extracted Resume Information
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#1d4ed8' }}>
                        We detected the fields below. Correct any inaccuracies, inspect conflicts with your existing profile, and check the fields you want to save.
                      </div>
                    </div>
                  </div>

                  <Badge variant="primary" size="md">
                    Needs Your Confirmation
                  </Badge>
                </div>

                {/* Section 1: Contact & Personal Info Diff */}
                <Card variant="default">
                  <Card.Header>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <User size={18} color="var(--primary)" />
                      <Card.Title>1. Contact &amp; Personal Credentials</Card.Title>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {[
                        { key: 'fullName', label: 'Full Name', current: currentFullName, fieldPath: 'personal.full_name' },
                        { key: 'email', label: 'Email Address', current: getFieldValue(personal.email), fieldPath: 'personal.email' },
                        { key: 'phone', label: 'Phone Number', current: getFieldValue(personal.phone), fieldPath: 'personal.phone' },
                        { key: 'location', label: 'Location', current: getFieldValue(personal.location), fieldPath: 'personal.location' }
                      ].map((item) => {
                        const detectedVal = getFieldValue(extractedReviewData.personal?.[item.key]);
                        const hasConflict = Boolean(item.current && detectedVal && item.current.toLowerCase() !== detectedVal.toLowerCase());
                        const isManual = profile?.field_sources?.[item.fieldPath] === 'manual';
                        const isSelected = selectedReviewFields.has(item.fieldPath);
                        const choice = reviewFieldChoices[item.fieldPath] || 'resume';

                        return (
                          <div
                            key={item.key}
                            style={{
                              padding: '1rem 1.25rem',
                              backgroundColor: hasConflict ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-secondary)',
                              border: `1px solid ${hasConflict ? 'var(--warning-border)' : 'var(--border)'}`,
                              borderRadius: 'var(--radius-md)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleReviewField(item.fieldPath)}
                                />
                                <span>{item.label}</span>
                              </label>

                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                {hasConflict && (
                                  <Badge variant="warning" size="sm">
                                    Conflict Detected
                                  </Badge>
                                )}
                                {isManual && (
                                  <Badge variant="neutral" size="sm">
                                    Manually Confirmed by You
                                  </Badge>
                                )}
                                <Badge variant="primary" size="sm">
                                  Extracted from resume
                                </Badge>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.65rem' }}>
                              {/* Current Value */}
                              <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                                  Current Profile Value:
                                </div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: item.current ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '2px' }}>
                                  {item.current || '— (Empty)'}
                                </div>
                              </div>

                              {/* Detected / Editable Value */}
                              <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                                  Detected Value (Editable):
                                </div>
                                <input
                                  type="text"
                                  value={detectedVal}
                                  onChange={(e) => updateExtractedFieldVal('personal', item.key, e.target.value)}
                                  style={{
                                    width: '100%',
                                    marginTop: '4px',
                                    padding: '0.45rem 0.65rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-control)',
                                    backgroundColor: 'var(--surface)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem'
                                  }}
                                  placeholder="Leave blank if not found"
                                />
                              </div>
                            </div>

                            {/* Conflict Resolution Choice */}
                            {hasConflict && isSelected && (
                              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)' }}>
                                  Choose which value to keep:
                                </span>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                  <input
                                    type="radio"
                                    name={`choice-${item.fieldPath}`}
                                    value="existing"
                                    checked={choice === 'existing'}
                                    onChange={() => setFieldChoice(item.fieldPath, 'existing')}
                                  />
                                  <span>Keep Current Profile Value</span>
                                </label>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                  <input
                                    type="radio"
                                    name={`choice-${item.fieldPath}`}
                                    value="resume"
                                    checked={choice === 'resume'}
                                    onChange={() => setFieldChoice(item.fieldPath, 'resume')}
                                  />
                                  <span>Update with Detected Resume Value</span>
                                </label>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card.Content>
                </Card>

                {/* Section 2: Education Diff */}
                <Card variant="default">
                  <Card.Header>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <GraduationCap size={18} color="var(--primary)" />
                      <Card.Title>2. Education Credentials</Card.Title>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {[
                        { key: 'college', label: 'College / University', current: currentCollege, fieldPath: 'education.college' },
                        { key: 'degree', label: 'Degree', current: currentDegree, fieldPath: 'education.degree' },
                        { key: 'branch', label: 'Department / Branch', current: currentBranch, fieldPath: 'education.branch' },
                        { key: 'graduationYear', label: 'Graduation Year', current: currentGradYear, fieldPath: 'education.graduation_year' },
                        { key: 'cgpa', label: 'Cumulative CGPA', current: currentCGPA, fieldPath: 'education.cgpa' }
                      ].map((item) => {
                        const detectedVal = getFieldValue(extractedReviewData.education?.[item.key]);
                        const hasConflict = Boolean(item.current && detectedVal && String(item.current).toLowerCase() !== detectedVal.toLowerCase());
                        const isManual = profile?.field_sources?.[item.fieldPath] === 'manual';
                        const isSelected = selectedReviewFields.has(item.fieldPath);
                        const choice = reviewFieldChoices[item.fieldPath] || 'resume';

                        return (
                          <div
                            key={item.key}
                            style={{
                              padding: '1rem 1.25rem',
                              backgroundColor: hasConflict ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-secondary)',
                              border: `1px solid ${hasConflict ? 'var(--warning-border)' : 'var(--border)'}`,
                              borderRadius: 'var(--radius-md)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleReviewField(item.fieldPath)}
                                />
                                <span>{item.label}</span>
                              </label>

                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                {hasConflict && (
                                  <Badge variant="warning" size="sm">
                                    Conflict Detected
                                  </Badge>
                                )}
                                {isManual && (
                                  <Badge variant="neutral" size="sm">
                                    Manually Entered
                                  </Badge>
                                )}
                                <Badge variant="primary" size="sm">
                                  Extracted from resume
                                </Badge>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.65rem' }}>
                              <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                                  Current Profile Value:
                                </div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: item.current ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '2px' }}>
                                  {item.current || '— (Empty)'}
                                </div>
                              </div>

                              <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                                  Detected Value (Editable):
                                </div>
                                <input
                                  type="text"
                                  value={detectedVal}
                                  onChange={(e) => updateExtractedFieldVal('education', item.key, e.target.value)}
                                  style={{
                                    width: '100%',
                                    marginTop: '4px',
                                    padding: '0.45rem 0.65rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-control)',
                                    backgroundColor: 'var(--surface)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem'
                                  }}
                                  placeholder="Leave blank if not found"
                                />
                              </div>
                            </div>

                            {hasConflict && isSelected && (
                              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)' }}>
                                  Choose which value to keep:
                                </span>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                  <input
                                    type="radio"
                                    name={`choice-${item.fieldPath}`}
                                    value="existing"
                                    checked={choice === 'existing'}
                                    onChange={() => setFieldChoice(item.fieldPath, 'existing')}
                                  />
                                  <span>Keep Current Profile Value</span>
                                </label>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                  <input
                                    type="radio"
                                    name={`choice-${item.fieldPath}`}
                                    value="resume"
                                    checked={choice === 'resume'}
                                    onChange={() => setFieldChoice(item.fieldPath, 'resume')}
                                  />
                                  <span>Update with Detected Resume Value</span>
                                </label>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card.Content>
                </Card>

                {/* Section 3: Technical Skills Diff */}
                <Card variant="default">
                  <Card.Header>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <Code size={18} color="var(--primary)" />
                        <Card.Title>3. Detected Technical Skills</Card.Title>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedReviewFields.has('skills')}
                          onChange={() => toggleReviewField('skills')}
                        />
                        <span>Merge Detected Skills to Profile</span>
                      </label>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      We normalize skill synonyms (e.g. "py" → "Python", "k8s" → "Kubernetes") and deduplicate against your existing skill list. Click any tag's <strong>✕</strong> to discard inaccurate detections.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {Object.entries(extractedReviewData.skills || {}).map(([catKey, skillArray]) => {
                        if (!Array.isArray(skillArray) || skillArray.length === 0) return null;
                        return (
                          <div key={catKey}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                              {catKey.replace(/_/g, ' ')} ({skillArray.length})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                              {skillArray.map((skill) => (
                                <span
                                  key={typeof skill === 'string' ? skill : JSON.stringify(skill)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '0.3rem 0.75rem',
                                    backgroundColor: 'var(--primary-subtle)',
                                    color: 'var(--primary)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.825rem',
                                    fontWeight: 600
                                  }}
                                >
                                  <span>{typeof skill === 'string' ? skill : getFieldValue(skill)}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeExtractedSkillTag(catKey, skill)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer',
                                      display: 'inline-flex'
                                    }}
                                    title="Discard Skill"
                                  >
                                    <X size={13} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card.Content>
                </Card>

                {/* Section 4: Detected Projects */}
                {Array.isArray(extractedReviewData.projects) && extractedReviewData.projects.length > 0 && (
                  <Card variant="default">
                    <Card.Header>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <FolderGit2 size={18} color="var(--primary)" />
                          <Card.Title>4. Detected Projects ({extractedReviewData.projects.length})</Card.Title>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedReviewFields.has('projects')}
                            onChange={() => toggleReviewField('projects')}
                          />
                          <span>Merge Projects to Profile</span>
                        </label>
                      </div>
                    </Card.Header>
                    <Card.Content>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {extractedReviewData.projects.map((proj, pIdx) => (
                          <div
                            key={pIdx}
                            style={{
                              padding: '1rem 1.25rem',
                              backgroundColor: 'var(--bg-secondary)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <h4 style={{ fontSize: '0.975rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                {getFieldValue(proj.name)}
                              </h4>
                              <button
                                type="button"
                                onClick={() => {
                                  setExtractedReviewData((prev) => ({
                                    ...prev,
                                    projects: prev.projects.filter((_, idx) => idx !== pIdx)
                                  }));
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--danger)',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0.5rem' }}>
                              {getFieldValue(proj.description)}
                            </p>
                            {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {proj.technologies.map((t) => (
                                  <Badge key={typeof t === 'string' ? t : JSON.stringify(t)} variant="primary" size="sm">
                                    {typeof t === 'string' ? t : getFieldValue(t)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card.Content>
                  </Card>
                )}

                {/* Section 5: Detected Experience */}
                {Array.isArray(extractedReviewData.experience) && extractedReviewData.experience.length > 0 && (
                  <Card variant="default">
                    <Card.Header>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <Briefcase size={18} color="var(--primary)" />
                          <Card.Title>5. Detected Experience ({extractedReviewData.experience.length})</Card.Title>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedReviewFields.has('experience')}
                            onChange={() => toggleReviewField('experience')}
                          />
                          <span>Merge Experience to Profile</span>
                        </label>
                      </div>
                    </Card.Header>
                    <Card.Content>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {extractedReviewData.experience.map((exp, eIdx) => (
                          <div
                            key={eIdx}
                            style={{
                              padding: '1rem 1.25rem',
                              backgroundColor: 'var(--bg-secondary)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <h4 style={{ fontSize: '0.975rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                {getFieldValue(exp.role)} @ {getFieldValue(exp.organization)}
                              </h4>
                              <button
                                type="button"
                                onClick={() => {
                                  setExtractedReviewData((prev) => ({
                                    ...prev,
                                    experience: prev.experience.filter((_, idx) => idx !== eIdx)
                                  }));
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--danger)',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            {exp.duration && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {getFieldValue(exp.duration)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card.Content>
                  </Card>
                )}

                {/* Clean Text Preview (Accordion) */}
                {extractedCleanPreview && (
                  <Card variant="default">
                    <Card.Header
                      onClick={() => toggleSection('rawText')}
                      style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} color="var(--text-muted)" />
                        <Card.Title style={{ fontSize: '0.95rem' }}>Extracted Document Clean Text Preview</Card.Title>
                      </div>
                      <ChevronDown
                        size={16}
                        style={{
                          transform: expandedSections.has('rawText') ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          color: 'var(--text-muted)'
                        }}
                      />
                    </Card.Header>
                    {expandedSections.has('rawText') && (
                      <Card.Content>
                        <pre
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-secondary)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-sm)',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '220px',
                            overflowY: 'auto',
                            fontFamily: 'monospace'
                          }}
                        >
                          {extractedCleanPreview}
                        </pre>
                      </Card.Content>
                    )}
                  </Card>
                )}

                {/* Sticky Review Action Bar */}
                <div
                  style={{
                    position: 'sticky',
                    bottom: '1.5rem',
                    padding: '1.25rem 1.75rem',
                    borderRadius: 'var(--radius-xl)',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    zIndex: 40
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1rem' }}>
                      Ready to apply confirmed resume details?
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
                      Applying {selectedReviewFields.size} reviewed sections. Unchecked items and protected manual fields remain unchanged.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        setExtractionStage('idle');
                        setExtractedReviewData(null);
                      }}
                      style={{ color: '#cbd5e1' }}
                    >
                      Discard Extraction
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      loading={confirmingExtraction}
                      onClick={handleConfirmExtraction}
                      icon={<CheckCircle2 size={16} />}
                      style={{ backgroundColor: '#0284c7', borderColor: '#38bdf8' }}
                    >
                      Confirm &amp; Update Profile
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Stage: Confirmed Result Card */}
            {extractionStage === 'confirmed' && (
              <Card variant="raised" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem'
                    }}
                  >
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    Profile Successfully Updated
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Your confirmed resume details have been safely merged with existing profile fields. Profile completion has been recalculated.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <Button variant="secondary" size="md" onClick={() => switchTab('identity')}>
                      View Profile Credentials
                    </Button>
                    <Button variant="primary" size="md" onClick={() => switchTab('matching')} icon={<ArrowRight size={16} />}>
                      Check Recommended Opportunities
                    </Button>
                  </div>
                </div>
              </Card>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: OPPORTUNITY MATCHING & READINESS */}
        {/* ========================================================= */}
        {activeTab === 'matching' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Badge variant="purple" size="sm" dot>
                  Live Opportunity Matching
                </Badge>
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Profile Quality &amp; Opportunity Matching
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', margin: '0.35rem 0 0', maxWidth: '720px' }}>
                How your confirmed skills, graduation year, and career preferences directly power our recommendation engine.
              </p>
            </div>

            {/* Gauge & Metrics Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <Gauge
                score={completion.percentage}
                breakdown={completion.breakdown || {}}
                title="Matching Readiness Score"
              />

              <Card variant="raised">
                <Card.Header>
                  <Card.Title>How Matching Works</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                      <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span><strong>Skills Vector Match:</strong> We match your verified skills against employer job requirements.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                      <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span><strong>Academic Eligibility:</strong> Grad year &amp; CGPA filter out ineligible listings before you apply.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                      <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span><strong>Location &amp; Work Mode:</strong> Opportunities tailored to your remote or city preferences.</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    <Link to="/opportunities">
                      <Button variant="primary" size="md" style={{ width: '100%' }} icon={<ExternalLink size={15} />}>
                        Explore All Live Opportunities
                      </Button>
                    </Link>
                  </div>
                </Card.Content>
              </Card>
            </div>

            {/* Recommended Opportunities Feed */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Personalized Recommendations for You
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={recommendationsLoading}
                  onClick={fetchRecommendationsData}
                  icon={<RefreshCw size={14} />}
                >
                  Refresh Matches
                </Button>
              </div>

              {recommendationsLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem' }} />
                  <div>Loading live recommendations...</div>
                </div>
              ) : recommendations.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  {recommendations.map((opp) => (
                    <Card key={opp._id || opp.id} variant="default" className="hover-card">
                      <Card.Content style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                              {opp.title}
                            </h4>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                              {opp.company}
                            </div>
                          </div>
                          {opp.match_score && (
                            <Badge variant={opp.match_score > 80 ? 'success' : 'primary'} size="sm">
                              {Math.round(opp.match_score)}% Match
                            </Badge>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={12} /> {opp.location || 'Remote'}
                          </span>
                          <span>•</span>
                          <span>{opp.type || 'Internship'}</span>
                        </div>

                        {Array.isArray(opp.required_skills) && opp.required_skills.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                            {opp.required_skills.slice(0, 3).map((sk) => (
                              <Badge key={typeof sk === 'string' ? sk : JSON.stringify(sk)} variant="neutral" size="sm">
                                {typeof sk === 'string' ? sk : getFieldValue(sk)}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Link to={`/opportunities/${opp._id || opp.id}`}>
                          <Button variant="secondary" size="sm" style={{ width: '100%' }} iconRight={<ArrowUpRight size={13} />}>
                            View Role &amp; Apply
                          </Button>
                        </Link>
                      </Card.Content>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card variant="raised" style={{ padding: '2rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                    Complete your preferred roles and at least 3 skills in the Profile Builder to view personalized opportunities.
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}

      </div>
    </PageContainer>
  );
}
