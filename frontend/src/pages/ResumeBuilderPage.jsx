import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Download, Printer, Sparkles, CheckCircle2, Plus, Trash2,
  RefreshCw, Layout, Sliders, Eye, ChevronRight, ArrowRight, ShieldCheck,
  Zap, Globe, Briefcase, GraduationCap, Award, Layers, HelpCircle,
  ExternalLink, Bookmark, History, FileDown, Check, AlertCircle, Info,
  Search, Upload, ArrowLeft, Palette, Type, AlignJustify, X, ChevronDown,
  ZoomIn, ZoomOut, Maximize2, SplitSquareVertical, Columns, Edit3, Target,
  FileCheck, Star, Sparkle, UploadCloud, RotateCcw, ArrowUp, ArrowDown,
  Wand2, Copy, FileCode, ListOrdered, CheckCheck, MoveVertical
} from 'lucide-react';

import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../context/ToastContext';
import { getOpportunities } from '../services/api';
import resumeBuilderService from '../services/resumeBuilderService';
import ResumeTemplateRenderer, { cleanVal, formatCgpa } from '../components/resume/ResumeTemplateRenderer';
import ResumeQualityBreakdown from '../components/resume/ResumeQualityBreakdown';
import ResumeComparisonModal from '../components/resume/ResumeComparisonModal';
import ResumeVersionDrawer from '../components/resume/ResumeVersionDrawer';
import ResumeImprovementItem from '../components/resume/ResumeImprovementItem';

const TARGET_ROLE_PRESETS = [
  'Full Stack Developer',
  'Software Engineer',
  'Python Developer',
  'AI / ML Engineer',
  'Backend Developer',
  'Frontend Developer',
  'Data Analyst',
  'Cloud & DevOps Intern'
];

const ACCENT_COLORS = [
  { name: 'Slate Charcoal', hex: '#0f172a' },
  { name: 'Royal Navy', hex: '#1e40af' },
  { name: 'Indigo Accent', hex: '#4338ca' },
  { name: 'Emerald Green', hex: '#065f46' },
  { name: 'Teal Pro', hex: '#0f766e' },
  { name: 'Burgundy Classic', hex: '#881337' }
];

const TEMPLATE_CATALOG = [
  {
    id: 'software_engineer',
    name: 'Software Engineer',
    tagline: 'Code-Syntax Accents & Tech Badges',
    bestFor: 'Full-Stack, Backend, Frontend, Cloud & DevOps engineers',
    atsRating: '99% ATS Match',
    description: 'Features code comment style headers (// SKILLS), inline tech stack tags, and live GitHub project demo links.',
    highlightColor: '#2563eb'
  },
  {
    id: 'ai_ml_data',
    name: 'AI, ML & Data Science',
    tagline: 'Quantitative Metrics & Research Architecture',
    bestFor: 'Data Scientists, ML Engineers, Python Analytics specialists',
    atsRating: '98% ATS Match',
    description: 'High-density technical summary up top, specialized model/framework taxonomy, and quantitative outcomes.',
    highlightColor: '#7c3aed'
  },
  {
    id: 'student_fresher',
    name: 'Student / Fresher',
    tagline: 'Academic First & Capstone Project Focus',
    bestFor: 'College students, campus placements, and new graduates',
    atsRating: '99% ATS Match',
    description: 'Prioritizes verified university credentials, degree branch, GPA, and standout academic project accomplishments.',
    highlightColor: '#059669'
  },
  {
    id: 'internship_focus',
    name: 'Internship Focus',
    tagline: 'Industry Contributions & Growth',
    bestFor: 'Students with 1+ internships or practical contributors',
    atsRating: '98% ATS Match',
    description: 'Balances verified company internship experience with key engineering workflows and technical projects.',
    highlightColor: '#ea580c'
  },
  {
    id: 'modern_professional',
    name: 'Modern Professional',
    tagline: 'Clean Visual Hierarchy & Left Accent Bars',
    bestFor: 'Consulting, Product, Operations, and modern tech roles',
    atsRating: '96% ATS Match',
    description: 'Elegant accent anchors on section headers with optimal whitespace for human recruiters and modern ATS.',
    highlightColor: '#0f766e'
  },
  {
    id: 'ats_classic',
    name: 'ATS Classic Standard',
    tagline: 'Universal Single-Column ATS Gold Standard',
    bestFor: 'Enterprise corporate portals (Workday, Taleo, Greenhouse)',
    atsRating: '100% ATS Match',
    description: '100% single-column layout guaranteed to parse flawlessly through all legacy and modern ATS systems.',
    highlightColor: '#0f172a'
  }
];

export default function ResumeBuilderPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Layout View Mode: 'split' | 'editor' | 'preview'
  const [viewMode, setViewMode] = useState('split');

  // Preview Zoom level
  const [zoomLevel, setZoomLevel] = useState(100);

  // Active accordion section in editor
  const [activeSection, setActiveSection] = useState('personal');

  // Template & Formatting State
  const [templateId, setTemplateId] = useState('ats_classic');
  const [formatting, setFormatting] = useState({
    font_size: 'standard',
    spacing: 'standard',
    accent_color: '#0f172a',
    section_order: ['summary', 'education', 'skills', 'projects', 'experience', 'certifications', 'achievements'],
    visible_sections: {
      summary: true,
      education: true,
      skills: true,
      projects: true,
      experience: true,
      certifications: true,
      achievements: true
    }
  });

  // Custom document title & interactive dropdowns
  const [documentTitle, setDocumentTitle] = useState('');
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [activeEnhanceDropdown, setActiveEnhanceDropdown] = useState(null); // { section, itemIdx, bulletIdx }

  // Resume Document Model with Defensive Sanitization
  const [resumeData, setResumeData] = useState({
    personal: {
      fullName: '',
      targetTitle: 'Software Engineer',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: ''
    },
    summary: '',
    education: [],
    skills: [],
    projects: [],
    experience: [],
    certifications: [],
    achievements: [],
    field_provenance: {},
    conflicts: []
  });

  // Original snapshot for before/after comparison
  const [originalSnapshot, setOriginalSnapshot] = useState(null);

  // Target Role & Job Description State
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState('');
  const [opportunitiesList, setOpportunitiesList] = useState([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);

  // Quality Assessment State
  const [assessment, setAssessment] = useState(null);
  const [originalAssessment, setOriginalAssessment] = useState(null);
  const [isScoring, setIsScoring] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);

  // AI Suggestions & Summaries State
  const [suggestions, setSuggestions] = useState([]);
  const [summaryOptions, setSummaryOptions] = useState([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isGeneratingSummaries, setIsGeneratingSummaries] = useState(false);

  // Version Management State
  const [savedVersions, setSavedVersions] = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [isVersionDrawerOpen, setIsVersionDrawerOpen] = useState(false);

  // Modals & UI Controls
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isUploadSyncModalOpen, setIsUploadSyncModalOpen] = useState(false);
  const [uploadSyncTab, setUploadSyncTab] = useState('profile'); // 'profile' | 'upload'
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Sanitize any raw dicts or stringified structures
  const sanitizeResumeDoc = useCallback((doc) => {
    if (!doc) return doc;
    return {
      ...doc,
      personal: {
        fullName: cleanVal(doc.personal?.fullName || doc.personal?.full_name),
        targetTitle: cleanVal(doc.personal?.targetTitle || doc.personal?.title) || 'Software Engineer',
        email: cleanVal(doc.personal?.email),
        phone: cleanVal(doc.personal?.phone),
        location: cleanVal(doc.personal?.location),
        linkedin: cleanVal(doc.personal?.linkedin),
        github: cleanVal(doc.personal?.github),
        portfolio: cleanVal(doc.personal?.portfolio)
      },
      summary: cleanVal(doc.summary),
      education: (Array.isArray(doc.education) ? doc.education : []).map(edu => ({
        institution: cleanVal(edu.institution || edu.college),
        college: cleanVal(edu.college || edu.institution),
        degree: cleanVal(edu.degree),
        branch: cleanVal(edu.branch),
        year: cleanVal(edu.year || edu.graduationYear),
        graduationYear: cleanVal(edu.graduationYear || edu.year),
        cgpa: formatCgpa(edu.cgpa || edu.gpa),
        gpa: formatCgpa(edu.gpa || edu.cgpa),
        source: edu.source || 'profile'
      })),
      skills: (Array.isArray(doc.skills) ? doc.skills : []).map(cleanVal).filter(Boolean),
      projects: (Array.isArray(doc.projects) ? doc.projects : []).map(p => ({
        name: cleanVal(p.name),
        role: cleanVal(p.role) || 'Developer',
        technologies: Array.isArray(p.technologies) ? p.technologies.map(cleanVal).filter(Boolean) : (typeof p.technologies === 'string' ? p.technologies.split(',').map(cleanVal).filter(Boolean) : []),
        description: cleanVal(p.description),
        bullets: (Array.isArray(p.bullets) && p.bullets.length > 0 ? p.bullets : (p.description ? [p.description] : [])).map(cleanVal).filter(Boolean),
        link: cleanVal(p.link || p.github || p.url),
        source: p.source || 'profile'
      })),
      experience: (Array.isArray(doc.experience) ? doc.experience : []).map(e => ({
        role: cleanVal(e.role) || 'Intern / Contributor',
        organization: cleanVal(e.organization || e.company),
        company: cleanVal(e.company || e.organization),
        duration: cleanVal(e.duration || (e.startDate && e.endDate ? `${e.startDate} - ${e.endDate}` : '')),
        startDate: cleanVal(e.startDate),
        endDate: cleanVal(e.endDate),
        bullets: (Array.isArray(e.bullets) && e.bullets.length > 0 ? e.bullets : (Array.isArray(e.responsibilities) ? e.responsibilities : [])).map(cleanVal).filter(Boolean),
        source: e.source || 'profile'
      })),
      certifications: (Array.isArray(doc.certifications) ? doc.certifications : []).map(c => ({
        name: cleanVal(typeof c === 'string' ? c : c.name),
        organization: cleanVal(c.organization || c.issuer),
        date: cleanVal(c.date || c.year)
      })),
      achievements: (Array.isArray(doc.achievements) ? doc.achievements : []).map(a => ({
        title: cleanVal(typeof a === 'string' ? a : a.title),
        context: cleanVal(a.context || a.description)
      })),
      field_provenance: doc.field_provenance || {},
      conflicts: doc.conflicts || []
    };
  }, []);

  // 1. Initial Load: Merge source data & calculate initial score
  useEffect(() => {
    async function initData() {
      try {
        const vers = await resumeBuilderService.listVersions();
        if (Array.isArray(vers)) {
          setSavedVersions(vers);
        }

        const mergedRes = await resumeBuilderService.mergeSources();
        if (mergedRes && typeof mergedRes === 'object') {
          const rawDoc = {
            personal: {
              fullName: mergedRes.personal?.fullName || user?.name || '',
              targetTitle: user?.target_role || mergedRes.personal?.targetTitle || 'Software Engineer',
              email: mergedRes.personal?.email || user?.email || '',
              phone: mergedRes.personal?.phone || '',
              location: mergedRes.personal?.location || '',
              linkedin: mergedRes.personal?.linkedin || '',
              github: mergedRes.personal?.github || '',
              portfolio: mergedRes.personal?.portfolio || ''
            },
            summary: mergedRes.summary || '',
            education: mergedRes.education || [],
            skills: mergedRes.skills || [],
            projects: mergedRes.projects || [],
            experience: mergedRes.experience || [],
            certifications: mergedRes.certifications || [],
            achievements: mergedRes.achievements || [],
            field_provenance: mergedRes.field_provenance || {},
            conflicts: mergedRes.conflicts || []
          };

          const cleanDoc = sanitizeResumeDoc(rawDoc);
          setResumeData(cleanDoc);
          setOriginalSnapshot(JSON.parse(JSON.stringify(cleanDoc)));

          runAssessment(cleanDoc, targetRole, '');
        }
      } catch (err) {
        console.warn('Initial data load notice:', err);
      }
    }
    initData();
  }, [user, sanitizeResumeDoc]);

  // Load opportunities for job targeting
  useEffect(() => {
    async function loadOpps() {
      setLoadingOpportunities(true);
      try {
        const res = await getOpportunities({ limit: 12 });
        const list = res?.data?.opportunities || res?.opportunities || [];
        setOpportunitiesList(list);
      } catch (err) {
        console.warn('Could not load opportunities for targeting:', err);
      } finally {
        setLoadingOpportunities(false);
      }
    }
    loadOpps();
  }, []);

  // Intelligent Template Recommendation Engine
  const recommendedTemplateInfo = useMemo(() => {
    const role = (targetRole || resumeData?.personal?.targetTitle || '').toLowerCase();
    const skills = (resumeData?.skills || []).map(s => String(s).toLowerCase());
    const expCount = (resumeData?.experience || []).length;
    const projCount = (resumeData?.projects || []).length;
    const eduCount = (resumeData?.education || []).length;

    // 1. AI & Data Science
    if (
      role.includes('ai') || role.includes('data') || role.includes('machine learning') ||
      role.includes('ml') || role.includes('analyst') || role.includes('deep learning') ||
      skills.some(s => ['python', 'pytorch', 'tensorflow', 'pandas', 'numpy', 'sql'].includes(s))
    ) {
      return {
        id: 'ai_ml_data',
        name: 'AI, ML & Data Science',
        matchPercent: '98%',
        reason: 'Highlights quantitative summaries, specialized ML/Data taxonomy, and model implementations.',
      };
    }

    // 2. Software Engineer / Developer
    if (
      role.includes('software') || role.includes('developer') || role.includes('frontend') ||
      role.includes('backend') || role.includes('full stack') || role.includes('web') ||
      skills.some(s => ['react', 'node.js', 'javascript', 'typescript', 'java', 'c++'].includes(s))
    ) {
      return {
        id: 'software_engineer',
        name: 'Software Engineer',
        matchPercent: '99%',
        reason: 'Optimal for developer roles — features code syntax headers, tech tags, and prominent GitHub demo links.',
      };
    }

    // 3. Internship Focus
    if (role.includes('intern') || role.includes('internship') || expCount >= 1) {
      return {
        id: 'internship_focus',
        name: 'Internship Focus',
        matchPercent: '98%',
        reason: 'Balances verified company internship experience with key engineering workflows.',
      };
    }

    // 4. Student / Fresher
    if (eduCount > 0 && (expCount === 0 || role.includes('student') || role.includes('fresher'))) {
      return {
        id: 'student_fresher',
        name: 'Student / Fresher',
        matchPercent: '99%',
        reason: 'Puts verified college coursework, degree credentials, and standout capstone projects upfront.',
      };
    }

    // 5. Default Universal ATS Classic
    return {
      id: 'ats_classic',
      name: 'ATS Classic Standard',
      matchPercent: '100%',
      reason: '100% single-column layout guaranteed to pass all legacy and enterprise ATS parsers without styling deductions.',
    };
  }, [targetRole, resumeData]);

  // Recalculate Assessment Engine
  const runAssessment = useCallback(async (data, role, jd) => {
    setIsScoring(true);
    try {
      const res = await resumeBuilderService.calculateScore({
        resumeData: data,
        targetRole: role,
        targetJobDescription: jd
      });
      setAssessment(res);
      if (!originalAssessment) {
        setOriginalAssessment(res);
      }
    } catch (err) {
      console.warn('ATS scoring calculation error:', err);
    } finally {
      setIsScoring(false);
    }
  }, [originalAssessment]);

  // Sync Latest Profile Data
  const handleSyncProfile = async () => {
    setIsSyncingProfile(true);
    try {
      const mergedRes = await resumeBuilderService.mergeSources();
      if (mergedRes) {
        const cleanDoc = sanitizeResumeDoc(mergedRes);
        setResumeData(cleanDoc);
        runAssessment(cleanDoc, targetRole, jobDescription);
        toast.showToast('Successfully synced verified profile data!', 'success');
        setIsUploadSyncModalOpen(false);
      }
    } catch (err) {
      toast.showToast('Failed to sync profile data', 'error');
    } finally {
      setIsSyncingProfile(false);
    }
  };

  // Upload & Extract Resume (PDF / DOCX)
  const handleUploadResumeFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(pdf|docx)$/i)) {
      toast.showToast('Please upload a PDF (.pdf) or DOCX (.docx) resume file', 'error');
      return;
    }

    setIsUploadingResume(true);
    try {
      const mergedRes = await resumeBuilderService.uploadAndExtractResume(file);
      if (mergedRes) {
        const cleanDoc = sanitizeResumeDoc(mergedRes);
        setResumeData(cleanDoc);
        runAssessment(cleanDoc, targetRole, jobDescription);
        toast.showToast(`Extracted & merged "${file.name}" with CareerPilot profile!`, 'success');
        setIsUploadSyncModalOpen(false);
      }
    } catch (err) {
      toast.showToast(err.response?.data?.message || 'Failed to extract resume file', 'error');
    } finally {
      setIsUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Opportunity Selection
  const handleSelectOpportunity = async (oppId) => {
    setSelectedOpportunityId(oppId);
    if (!oppId) return;

    try {
      const analyzed = await resumeBuilderService.analyzeJob({
        opportunityId: oppId,
        targetRole: targetRole
      });
      if (analyzed) {
        if (analyzed.target_role) setTargetRole(analyzed.target_role);
        if (analyzed.job_description) setJobDescription(analyzed.job_description);
        toast.showToast(`Targeting: ${analyzed.target_role}`, 'success');
        runAssessment(resumeData, analyzed.target_role, analyzed.job_description);
      }
    } catch (err) {
      toast.showToast('Failed to analyze opportunity', 'error');
    }
  };

  // Run AI Bullet & Description Improvements
  const handleFetchAiImprovements = async () => {
    setIsLoadingAI(true);
    try {
      const res = await resumeBuilderService.getImprovements({
        resumeData,
        targetRole,
        targetJobDescription: jobDescription
      });
      const suggs = res?.suggestions || [];
      setSuggestions(suggs);
      if (suggs.length > 0) {
        toast.showToast(`Generated ${suggs.length} grounded ATS improvements!`, 'success');
        setActiveSection('ats_optimizer');
      } else {
        toast.showToast('All bullets already follow strong action verb standards.', 'info');
      }
    } catch (err) {
      toast.showToast('Could not generate AI improvements', 'error');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Generate Professional Summaries
  const handleGenerateSummaries = async () => {
    setIsGeneratingSummaries(true);
    try {
      const res = await resumeBuilderService.getSummaries({
        resumeData,
        targetRole
      });
      if (Array.isArray(res) && res.length > 0) {
        setSummaryOptions(res);
        toast.showToast('Generated 3 tailored summary alternatives', 'success');
      }
    } catch (err) {
      toast.showToast('Failed to generate summary options', 'error');
    } finally {
      setIsGeneratingSummaries(false);
    }
  };

  // Accept a Suggested Rewrite
  const handleAcceptSuggestion = (sugg) => {
    setResumeData(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (sugg.section === 'summary') {
        copy.summary = sugg.suggested_text;
      } else if (sugg.section === 'projects' && sugg.item_index !== null) {
        const p = copy.projects[sugg.item_index];
        if (p) {
          if (p.bullets && p.bullets[sugg.bullet_index] !== undefined) {
            p.bullets[sugg.bullet_index] = sugg.suggested_text;
          } else {
            p.description = sugg.suggested_text;
          }
        }
      } else if (sugg.section === 'experience' && sugg.item_index !== null) {
        const e = copy.experience[sugg.item_index];
        if (e && e.bullets && e.bullets[sugg.bullet_index] !== undefined) {
          e.bullets[sugg.bullet_index] = sugg.suggested_text;
        }
      }
      return copy;
    });

    setSuggestions(prev => prev.filter(s => s.id !== sugg.id));
    toast.showToast('Applied bullet improvement!', 'success');
  };

  const handleRejectSuggestion = (sugg) => {
    setSuggestions(prev => prev.filter(s => s.id !== sugg.id));
  };

  const handleEditApplySuggestion = (sugg, customText) => {
    handleAcceptSuggestion({ ...sugg, suggested_text: customText });
  };

  // Add / Remove Skills
  const handleAddSkill = (skillName) => {
    const val = cleanVal(skillName || newSkillInput).trim();
    if (val && !resumeData.skills.includes(val)) {
      setResumeData(prev => ({ ...prev, skills: [...prev.skills, val] }));
      setNewSkillInput('');
      toast.showToast(`Added skill: ${val}`, 'success');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  // Education Helpers
  const handleAddEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          institution: 'College / University Name',
          degree: 'B.Tech',
          branch: 'Computer Science',
          year: '2024',
          cgpa: '8.5 CGPA'
        }
      ]
    }));
    setActiveSection('education');
  };

  const handleRemoveEducation = (index) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateEducation = (index, field, value) => {
    setResumeData(prev => {
      const copy = [...prev.education];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, education: copy };
    });
  };

  // Project Helpers
  const handleAddProject = () => {
    setResumeData(prev => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          name: 'New Technical Project',
          role: 'Developer',
          technologies: ['React', 'Python'],
          bullets: ['Developed core functionality and engineered scalable architecture.'],
          link: ''
        }
      ]
    }));
    setActiveSection('projects');
  };

  const handleRemoveProject = (index) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateProject = (index, field, value) => {
    setResumeData(prev => {
      const copy = [...prev.projects];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, projects: copy };
    });
  };

  const handleAddProjectBullet = (projIndex) => {
    setResumeData(prev => {
      const copy = [...prev.projects];
      const p = copy[projIndex];
      if (p) {
        p.bullets = [...(p.bullets || []), 'Engineered full-stack features with clean test coverage.'];
      }
      return { ...prev, projects: copy };
    });
  };

  const handleRemoveProjectBullet = (projIndex, bulletIndex) => {
    setResumeData(prev => {
      const copy = [...prev.projects];
      const p = copy[projIndex];
      if (p && p.bullets) {
        p.bullets = p.bullets.filter((_, i) => i !== bulletIndex);
      }
      return { ...prev, projects: copy };
    });
  };

  // Experience Helpers
  const handleAddExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          role: 'Software Engineering Intern',
          organization: 'Company Name',
          duration: 'Summer 2024',
          bullets: ['Contributed to production codebases and participated in agile sprints.']
        }
      ]
    }));
    setActiveSection('experience');
  };

  const handleRemoveExperience = (index) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateExperience = (index, field, value) => {
    setResumeData(prev => {
      const copy = [...prev.experience];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, experience: copy };
    });
  };

  const handleAddExperienceBullet = (expIndex) => {
    setResumeData(prev => {
      const copy = [...prev.experience];
      const e = copy[expIndex];
      if (e) {
        e.bullets = [...(e.bullets || []), 'Engineered scalable system features and collaborated in agile code reviews.'];
      }
      return { ...prev, experience: copy };
    });
  };

  const handleRemoveExperienceBullet = (expIndex, bulletIndex) => {
    setResumeData(prev => {
      const copy = [...prev.experience];
      const e = copy[expIndex];
      if (e && e.bullets) {
        e.bullets = e.bullets.filter((_, i) => i !== bulletIndex);
      }
      return { ...prev, experience: copy };
    });
  };

  // Certification Helpers
  const handleAddCertification = () => {
    setResumeData(prev => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        {
          name: 'AWS Certified Cloud Practitioner',
          organization: 'Amazon Web Services',
          date: '2024'
        }
      ]
    }));
    setActiveSection('certifications');
  };

  const handleRemoveCertification = (index) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateCertification = (index, field, value) => {
    setResumeData(prev => {
      const copy = [...prev.certifications];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, certifications: copy };
    });
  };

  // Achievement Helpers
  const handleAddAchievement = () => {
    setResumeData(prev => ({
      ...prev,
      achievements: [
        ...prev.achievements,
        {
          title: 'Smart India Hackathon Finalist',
          context: 'Ranked Top 5 out of 450+ engineering teams nationwide for automated workflow solution'
        }
      ]
    }));
    setActiveSection('achievements');
  };

  const handleRemoveAchievement = (index) => {
    setResumeData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateAchievement = (index, field, value) => {
    setResumeData(prev => {
      const copy = [...prev.achievements];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, achievements: copy };
    });
  };

  // Section Ordering & Presets
  const ALL_SECTIONS = [
    { id: 'summary', label: 'Professional Summary', icon: Sparkles },
    { id: 'education', label: 'Education & Academics', icon: GraduationCap },
    { id: 'skills', label: 'Technical Skills', icon: Zap },
    { id: 'projects', label: 'Technical Projects', icon: Layout },
    { id: 'experience', label: 'Work Experience & Internships', icon: Briefcase },
    { id: 'certifications', label: 'Certifications & Credentials', icon: Award },
    { id: 'achievements', label: 'Honors & Achievements', icon: Star },
  ];

  const handleMoveSection = (sectionId, direction) => {
    setFormatting(prev => {
      const currentOrder = prev.section_order || [
        'summary', 'education', 'skills', 'projects', 'experience', 'certifications', 'achievements'
      ];
      const idx = currentOrder.indexOf(sectionId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= currentOrder.length) return prev;

      const newOrder = [...currentOrder];
      const temp = newOrder[idx];
      newOrder[idx] = newOrder[targetIdx];
      newOrder[targetIdx] = temp;
      return { ...prev, section_order: newOrder };
    });
    toast.showToast('Section order updated!', 'info');
  };

  const handleToggleSection = (sectionId) => {
    setFormatting(prev => ({
      ...prev,
      visible_sections: {
        ...prev.visible_sections,
        [sectionId]: prev.visible_sections?.[sectionId] === false ? true : false
      }
    }));
  };

  const applySectionPreset = (presetName) => {
    let order = [];
    if (presetName === 'fresher') {
      order = ['education', 'skills', 'projects', 'certifications', 'achievements', 'experience', 'summary'];
    } else if (presetName === 'experienced') {
      order = ['summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'achievements'];
    } else {
      order = ['summary', 'education', 'skills', 'experience', 'projects', 'certifications', 'achievements'];
    }
    setFormatting(prev => ({ ...prev, section_order: order }));
    toast.showToast(`Applied ${presetName} section hierarchy!`, 'success');
  };

  // Instant AI Bullet Point Enhancer
  const handleEnhanceBullet = (section, itemIdx, bulletIdx, type) => {
    setResumeData(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const targetList = copy[section];
      if (!targetList || !targetList[itemIdx]) return prev;
      const originalText = targetList[itemIdx].bullets?.[bulletIdx] || '';

      const verbs = [
        'Architected', 'Engineered', 'Spearheaded', 'Optimized',
        'Implemented', 'Orchestrated', 'Refactored', 'Deployed',
        'Streamlined', 'Automated', 'Built', 'Accelerated'
      ];
      const metrics = [
        ', boosting overall application responsiveness by 35% and cutting API latency by 120ms',
        ', reducing operational processing time by 40% while sustaining 99.9% uptime',
        ', serving 15,000+ active user sessions with deterministic data synchronization',
        ', optimizing database query execution time by 28% through indexing and caching'
      ];

      let enhanced = originalText;
      if (type === 'action_verb') {
        let cleaned = originalText.replace(/^(i\s+|we\s+|worked\s+on\s+|helped\s+to\s+|responsible\s+for\s+|developed\s+|made\s+|built\s+)/i, '');
        cleaned = cleaned.trim();
        const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
        enhanced = `${randomVerb} ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1)}`;
      } else if (type === 'metric') {
        const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
        const stripped = originalText.replace(/\.+$/, '').trim();
        enhanced = `${stripped}${randomMetric}.`;
      } else if (type === 'polish') {
        let cleaned = originalText.replace(/^(i\s+|we\s+|worked\s+on\s+|helped\s+to\s+|responsible\s+for\s+|developed\s+|made\s+|built\s+)/i, '');
        cleaned = cleaned.trim();
        const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
        const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
        const stripped = cleaned.replace(/\.+$/, '').trim();
        enhanced = `${randomVerb} ${stripped.charAt(0).toLowerCase() + stripped.slice(1)}${randomMetric}.`;
      }

      if (!targetList[itemIdx].bullets) {
        targetList[itemIdx].bullets = [];
      }
      targetList[itemIdx].bullets[bulletIdx] = enhanced;
      return copy;
    });

    setActiveEnhanceDropdown(null);
    toast.showToast('✨ Bullet point enhanced with ATS impact formulation!', 'success');
  };

  const handleOptimize1Page = () => {
    setFormatting(prev => ({
      ...prev,
      font_size: 'compact',
      spacing: 'compact'
    }));
    toast.showToast('Applied Compact 1-Page Fit spacing!', 'success');
  };

  // Export PDF or DOCX
  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      await resumeBuilderService.exportDocument({
        resumeData,
        templateId,
        formatting,
        format
      });
      toast.showToast(`Downloaded resume as authentic ${format.toUpperCase()}!`, 'success');
    } catch (err) {
      toast.showToast(`Failed to export ${format.toUpperCase()}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Save Version
  const handleSaveVersion = async () => {
    try {
      const title = `${targetRole} Resume (${new Date().toLocaleDateString()})`;
      const created = await resumeBuilderService.createVersion({
        title,
        target_role: targetRole,
        target_opportunity_id: selectedOpportunityId || null,
        template_id: templateId,
        formatting,
        resume_data: resumeData,
        target_job_description: jobDescription,
        quality_assessment: assessment
      });
      setActiveVersionId(created.id);
      setSavedVersions(prev => [created, ...prev]);
      toast.showToast(`Saved version: "${created.title}"`, 'success');
    } catch (err) {
      toast.showToast('Failed to save resume version', 'error');
    }
  };

  // Load a Version
  const handleSelectVersion = (versionDoc) => {
    setActiveVersionId(versionDoc.id);
    if (versionDoc.resume_data) {
      setResumeData(sanitizeResumeDoc(versionDoc.resume_data));
    }
    if (versionDoc.template_id) {
      setTemplateId(versionDoc.template_id);
    }
    if (versionDoc.formatting) {
      setFormatting(versionDoc.formatting);
    }
    if (versionDoc.target_role) {
      setTargetRole(versionDoc.target_role);
    }
    if (versionDoc.target_job_description) {
      setJobDescription(versionDoc.target_job_description);
    }
    if (versionDoc.quality_assessment) {
      setAssessment(versionDoc.quality_assessment);
    }
    toast.showToast(`Loaded version: "${versionDoc.title}"`, 'info');
  };

  const scoreNum = assessment?.overall_score || 0;
  const scoreColor = scoreNum >= 80 ? '#10b981' : (scoreNum >= 60 ? '#f59e0b' : '#ef4444');

  return (
    <PageContainer
      title="AI Resume Builder & Real-Time Studio"
      subtitle="Craft, preview, and export high-conversion ATS-compliant resumes with real-time sync and grounded AI optimization"
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Real-time ATS Score Badge */}
          <button
            type="button"
            onClick={() => setShowScoreModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '999px',
              border: `1.5px solid ${scoreColor}40`,
              backgroundColor: `${scoreColor}12`,
              color: scoreColor,
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Click to view full ATS score analysis"
          >
            <ShieldCheck size={16} color={scoreColor} />
            <span>{scoreNum}/100 ATS Score</span>
          </button>

          {/* Import / Sync Data Modal Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadSyncModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <UploadCloud size={15} color="var(--primary)" /> Import / Sync Data
          </Button>

          {/* Versions Drawer Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVersionDrawerOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <History size={15} /> Versions ({savedVersions.length})
          </Button>

          {/* Compare Changes Modal */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsComparisonModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Sparkles size={15} color="var(--primary)" /> Compare
          </Button>

          {/* Save Version */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveVersion}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Bookmark size={15} /> Save Version
          </Button>

          {/* Quick PDF Export */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Download size={15} /> Export PDF
          </Button>

          {/* Quick DOCX Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('docx')}
            disabled={isExporting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <FileDown size={15} /> DOCX
          </Button>
        </div>
      }
    >
      {/* Sticky Floating Action Bar for Quick Export & Live ATS Tracking */}
      <div
        className="resume-sticky-topbar"
        style={{
          position: 'sticky',
          top: '0.75rem',
          zIndex: 45,
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid var(--border)',
          borderRadius: '14px',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.05)',
          padding: '0.65rem 1.15rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Document Name & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
              flexShrink: 0
            }}
          >
            <FileText size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <input
                type="text"
                value={documentTitle || `${resumeData.personal.fullName || user?.name || 'Resume'} - ${targetRole}`}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Resume Document Title"
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  color: '#0f172a',
                  padding: '1px 4px',
                  borderRadius: '4px',
                  outline: 'none',
                  cursor: 'text',
                  maxWidth: '280px'
                }}
                title="Click to rename document"
              />
              <Edit3 size={12} color="#94a3b8" />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>Target: <strong>{targetRole}</strong></span>
              <span>•</span>
              <span style={{ color: '#059669', fontWeight: 600 }}>● Auto-saved to Studio</span>
            </div>
          </div>
        </div>

        {/* Center: ATS Score Gauge Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => setShowScoreModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '999px',
              border: `1.5px solid ${scoreColor}40`,
              backgroundColor: `${scoreColor}12`,
              color: scoreColor,
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              transition: 'all 0.2s ease',
            }}
            title="Click to view full ATS score breakdown"
          >
            <ShieldCheck size={16} color={scoreColor} />
            <span>{scoreNum}/100 ATS Score</span>
            <span style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: 600 }}>
              ({scoreNum >= 80 ? 'ATS Ready' : scoreNum >= 60 ? 'Needs Polish' : 'Incomplete'})
            </span>
          </button>
        </div>

        {/* Right: Primary Export CTA + Split Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1.1rem',
                borderRadius: '8px 0 0 8px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: isExporting ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <Download size={14} />
              <span>{isExporting ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsExportDropdownOpen(prev => !prev)}
              style={{
                padding: '0.5rem 0.55rem',
                borderRadius: '0 8px 8px 0',
                border: 'none',
                borderLeft: '1px solid rgba(255,255,255,0.25)',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
              }}
              title="More export formats"
            >
              <ChevronDown size={14} />
            </button>

            {/* Export Format Menu */}
            {isExportDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '6px',
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.18)',
                  border: '1px solid #e2e8f0',
                  width: '230px',
                  zIndex: 60,
                  padding: '0.45rem',
                  display: 'grid',
                  gap: '3px'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsExportDropdownOpen(false);
                    handleExport('pdf');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Download size={15} color="#2563eb" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>Download ATS PDF</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Standard 100% ATS-parseable format</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsExportDropdownOpen(false);
                    handleExport('docx');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <FileDown size={15} color="#059669" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>Download Word (.docx)</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Editable Microsoft Word document</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsExportDropdownOpen(false);
                    window.print();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Printer size={15} color="#475569" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>Print / Save as PDF</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Use browser native print dialog</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Smart Template Recommendation Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(124,58,237,0.06) 100%)',
          border: '1.5px solid rgba(37,99,235,0.2)',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Star size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>AI Template Recommendation:</span>
              <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                {recommendedTemplateInfo.name}
              </span>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#ecfdf5', color: '#059669', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                {recommendedTemplateInfo.matchPercent} Match
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
              {recommendedTemplateInfo.reason}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {templateId !== recommendedTemplateInfo.id && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setTemplateId(recommendedTemplateInfo.id);
                toast.showToast(`Applied ${recommendedTemplateInfo.name} template!`, 'success');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Check size={14} /> Apply Recommendation
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTemplatesModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Layout size={14} /> Browse All Templates
          </Button>
        </div>
      </div>

      {/* Studio Top Control Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
          background: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        }}
      >
        {/* Template Selector Fast Switcher */}
        <div className="tab-strip-scroll" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', maxWidth: '100%' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Active Template:
          </span>
          {TEMPLATE_CATALOG.map(t => {
            const isSelected = templateId === t.id;
            const isRec = recommendedTemplateInfo.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                style={{
                  position: 'relative',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  border: isSelected ? '1.5px solid var(--primary)' : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? 'var(--primary)' : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {t.name}
                {isRec && !isSelected && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} title="Recommended" />
                )}
              </button>
            );
          })}
        </div>

        {/* Styling Toolbar: Accent Color & Font Size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Accent Color Palette */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Color:</span>
            {ACCENT_COLORS.map(c => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setFormatting(prev => ({ ...prev, accent_color: c.hex }))}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: c.hex,
                  border: formatting.accent_color === c.hex ? '2px solid #ffffff' : 'none',
                  outline: formatting.accent_color === c.hex ? `2px solid ${c.hex}` : 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
                title={c.name}
              />
            ))}
          </div>

          {/* Density / Font scale */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Font:</span>
            {['compact', 'standard', 'relaxed'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setFormatting(prev => ({ ...prev, font_size: s }))}
                style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  border: formatting.font_size === s ? '1px solid var(--primary)' : '1px solid #e2e8f0',
                  background: formatting.font_size === s ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                  color: formatting.font_size === s ? 'var(--primary)' : '#64748b',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* View mode switcher */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'split' ? '#ffffff' : 'transparent',
                color: viewMode === 'split' ? 'var(--primary)' : '#64748b',
                boxShadow: viewMode === 'split' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}
            >
              <Columns size={13} /> Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'editor' ? '#ffffff' : 'transparent',
                color: viewMode === 'editor' ? 'var(--primary)' : '#64748b',
                boxShadow: viewMode === 'editor' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}
            >
              <Edit3 size={13} /> Editor
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'preview' ? '#ffffff' : 'transparent',
                color: viewMode === 'preview' ? 'var(--primary)' : '#64748b',
                boxShadow: viewMode === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}
            >
              <Eye size={13} /> Preview
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div
        className="resume-studio-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'split' ? '1fr 1fr' : '1fr',
          gap: '1.5rem',
          alignItems: 'start',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
        }}
      >
        {/* Left Pane: Interactive Live Editor */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Quick Section Nav Bar */}
            <div
              className="tab-strip-scroll"
              style={{
                display: 'flex',
                gap: '0.35rem',
                overflowX: 'auto',
                paddingBottom: '0.4rem',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {[
                { id: 'personal', label: 'Profile', icon: FileText },
                { id: 'summary', label: 'Summary', icon: Sparkles },
                { id: 'education', label: 'Education', icon: GraduationCap },
                { id: 'skills', label: 'Skills', icon: Zap },
                { id: 'projects', label: 'Projects', icon: Layout },
                { id: 'experience', label: 'Experience', icon: Briefcase },
                { id: 'certifications', label: 'Certifications', icon: Award },
                { id: 'achievements', label: 'Honors & Awards', icon: Star },
                { id: 'reorder', label: 'Section Order', icon: ListOrdered },
                { id: 'ats_optimizer', label: 'ATS & Role', icon: Target },
              ].map(s => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSection(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '8px',
                      border: isActive ? '1.5px solid var(--primary)' : '1px solid #e2e8f0',
                      background: isActive ? '#ffffff' : '#f8fafc',
                      color: isActive ? 'var(--primary)' : '#64748b',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: isActive ? '0 2px 6px rgba(37,99,235,0.08)' : 'none',
                    }}
                  >
                    <Icon size={14} /> {s.label}
                  </button>
                );
              })}
            </div>

            {/* SECTION 1: Personal Information */}
            {activeSection === 'personal' && (
              <Card
                title="Contact & Header Information"
                actions={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      🛡️ Profile Verified
                    </span>
                  </div>
                }
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <Input
                    label="Full Name"
                    value={resumeData.personal.fullName}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      personal: { ...prev.personal, fullName: e.target.value }
                    }))}
                    placeholder="e.g. Alex Johnson"
                  />
                  <Input
                    label="Target Professional Title"
                    value={resumeData.personal.targetTitle}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      personal: { ...prev.personal, targetTitle: e.target.value }
                    }))}
                    placeholder="e.g. Full Stack Developer"
                  />
                  <Input
                    label="Email Address"
                    value={resumeData.personal.email}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      personal: { ...prev.personal, email: e.target.value }
                    }))}
                    placeholder="alex@example.com"
                  />
                  <Input
                    label="Phone Number"
                    value={resumeData.personal.phone}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      personal: { ...prev.personal, phone: e.target.value }
                    }))}
                    placeholder="+1 (555) 000-0000"
                  />
                  <Input
                    label="Location (City, Country)"
                    value={resumeData.personal.location}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      personal: { ...prev.personal, location: e.target.value }
                    }))}
                    placeholder="San Francisco, CA"
                  />
                  <Input
                    label="LinkedIn URL / Handle"
                    value={resumeData.personal.linkedin}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      personal: { ...prev.personal, linkedin: e.target.value }
                    }))}
                    placeholder="linkedin.com/in/username"
                  />
                  <Input
                    label="GitHub Profile URL"
                    value={resumeData.personal.github}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      personal: { ...prev.personal, github: e.target.value }
                    }))}
                    placeholder="github.com/username"
                  />
                  <Input
                    label="Portfolio / Website URL"
                    value={resumeData.personal.portfolio}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      personal: { ...prev.personal, portfolio: e.target.value }
                    }))}
                    placeholder="https://portfolio.dev"
                  />
                </div>
              </Card>
            )}

            {/* SECTION 2: Professional Summary */}
            {activeSection === 'summary' && (
              <Card
                title="Professional Summary"
                actions={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSummaries}
                    disabled={isGeneratingSummaries}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Sparkles size={14} color="var(--primary)" />
                    {isGeneratingSummaries ? 'Synthesizing...' : 'AI Summary Options'}
                  </Button>
                }
              >
                <Textarea
                  value={resumeData.summary}
                  onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="Concise 2-3 sentence overview of your technical foundations, key project achievements, and target focus..."
                  rows={4}
                />

                {/* AI Summary Suggestions */}
                {summaryOptions.length > 0 && (
                  <div style={{ marginTop: '1rem', display: 'grid', gap: '0.6rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Sparkles size={14} /> Grounded Summary Alternatives:
                    </div>
                    {summaryOptions.map((opt, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45 }}>
                          <strong style={{ color: 'var(--primary)' }}>[{opt.type}]</strong> {opt.text}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setResumeData(prev => ({ ...prev, summary: opt.text }));
                            toast.showToast('Applied summary!', 'success');
                          }}
                        >
                          Use
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* SECTION 3: Education */}
            {activeSection === 'education' && (
              <Card
                title="Education & Academic Credentials"
                actions={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddEducation}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Plus size={14} /> Add Education
                  </Button>
                }
              >
                {resumeData.education.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem 1.5rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1.5px dashed #cbd5e1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(5,150,105,0.08)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GraduationCap size={22} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>No Education Entries Added Yet</div>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem', maxWidth: '380px' }}>
                      Include your college or university degree, branch of study, graduation year, and GPA.
                    </p>
                    <Button variant="primary" size="sm" onClick={handleAddEducation} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem' }}>
                      <Plus size={15} /> Add Education
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {resumeData.education.map((edu, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.9rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          display: 'grid',
                          gap: '0.65rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                              Education Item #{idx + 1}
                            </span>
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px' }}>
                              {edu.source === 'manual' ? 'Manual' : (edu.source === 'resume' ? 'Uploaded Resume' : 'Profile')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveEducation(idx)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              fontSize: '0.75rem'
                            }}
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.65rem' }}>
                          <Input
                            label="College / Institution"
                            value={edu.institution || edu.college}
                            onChange={(e) => handleUpdateEducation(idx, 'institution', e.target.value)}
                            placeholder="e.g. Stanford University"
                          />
                          <Input
                            label="Degree"
                            value={edu.degree}
                            onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                            placeholder="e.g. B.Tech / B.S."
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr', gap: '0.65rem' }}>
                          <Input
                            label="Branch / Major"
                            value={edu.branch}
                            onChange={(e) => handleUpdateEducation(idx, 'branch', e.target.value)}
                            placeholder="e.g. Computer Science and Engineering"
                          />
                          <Input
                            label="Graduation Year"
                            value={edu.year || edu.graduationYear}
                            onChange={(e) => handleUpdateEducation(idx, 'year', e.target.value)}
                            placeholder="e.g. 2024"
                          />
                          <Input
                            label="CGPA / GPA"
                            value={edu.cgpa || edu.gpa}
                            onChange={(e) => handleUpdateEducation(idx, 'cgpa', e.target.value)}
                            placeholder="e.g. 8.9 CGPA"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* SECTION 4: Technical Skills */}
            {activeSection === 'skills' && (
              <Card title="Technical Skills & Competencies">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddSkill(newSkillInput);
                  }}
                  style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}
                >
                  <Input
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="Type skill (e.g. TypeScript, Docker, PyTorch) and press Add..."
                  />
                  <Button type="submit" variant="primary" size="sm">
                    Add
                  </Button>
                </form>

                {/* Current Skills Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1.25rem' }}>
                  {resumeData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        color: '#1e293b',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: '1px solid #cbd5e1'
                      }}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94a3b8' }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Missing ATS Recommended Keywords */}
                {assessment?.keywords?.missing && assessment.keywords.missing.length > 0 && (
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b91c1c', marginBottom: '0.45rem' }}>
                      Recommended Job Keywords to Add (1-Click):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {assessment.keywords.missing.slice(0, 10).map((kw, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddSkill(kw)}
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px dashed #ef4444',
                            backgroundColor: '#ffffff',
                            color: '#b91c1c',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          + {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* SECTION 5: Technical Projects */}
            {activeSection === 'projects' && (
              <Card
                title="Technical Projects"
                actions={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddProject}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Plus size={14} /> Add Project
                  </Button>
                }
              >
                {resumeData.projects.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem 1.5rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1.5px dashed #cbd5e1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(37,99,235,0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Layout size={22} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>No Technical Projects Added Yet</div>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem', maxWidth: '380px' }}>
                      Showcase your web apps, APIs, algorithms, or capstone projects with technologies and live demo links.
                    </p>
                    <Button variant="primary" size="sm" onClick={handleAddProject} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem' }}>
                      <Plus size={15} /> Add Project
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {resumeData.projects.map((proj, pIdx) => (
                      <div
                        key={pIdx}
                        style={{
                          padding: '1rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          display: 'grid',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                            Project #{pIdx + 1}: {proj.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProject(pIdx)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              fontSize: '0.75rem'
                            }}
                          >
                            <Trash2 size={13} /> Remove Project
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.65rem' }}>
                          <Input
                            label="Project Name"
                            value={proj.name}
                            onChange={(e) => handleUpdateProject(pIdx, 'name', e.target.value)}
                            placeholder="e.g. CareerPilot AI Platform"
                          />
                          <Input
                            label="Role / Title"
                            value={proj.role}
                            onChange={(e) => handleUpdateProject(pIdx, 'role', e.target.value)}
                            placeholder="e.g. Lead Full-Stack Developer"
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.65rem' }}>
                          <Input
                            label="Tech Stack (comma separated)"
                            value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}
                            onChange={(e) => handleUpdateProject(pIdx, 'technologies', e.target.value.split(',').map(s => s.trim()))}
                            placeholder="e.g. React, Node.js, MongoDB"
                          />
                          <Input
                            label="Project Link / Repo"
                            value={proj.link}
                            onChange={(e) => handleUpdateProject(pIdx, 'link', e.target.value)}
                            placeholder="github.com/org/repo"
                          />
                        </div>

                        {/* Bullet Points */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                              Accomplishment Bullets (Action Verb + Tech + Outcome):
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddProjectBullet(pIdx)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              + Add Bullet
                            </button>
                          </div>
                          <div style={{ display: 'grid', gap: '0.45rem' }}>
                            {(proj.bullets || []).map((bullet, bIdx) => (
                              <div key={bIdx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', position: 'relative' }}>
                                <Input
                                  value={bullet}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setResumeData(prev => {
                                      const copy = [...prev.projects];
                                      copy[pIdx].bullets[bIdx] = val;
                                      return { ...prev, projects: copy };
                                    });
                                  }}
                                  placeholder="Engineered high-performance REST APIs..."
                                />
                                <div style={{ position: 'relative' }}>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setActiveEnhanceDropdown(
                                      activeEnhanceDropdown?.section === 'projects' &&
                                      activeEnhanceDropdown?.itemIdx === pIdx &&
                                      activeEnhanceDropdown?.bulletIdx === bIdx
                                        ? null
                                        : { section: 'projects', itemIdx: pIdx, bulletIdx: bIdx }
                                    )}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '0.35rem 0.55rem',
                                      fontSize: '0.72rem',
                                      borderColor: 'rgba(37,99,235,0.3)',
                                      color: 'var(--primary)',
                                      whiteSpace: 'nowrap'
                                    }}
                                    title="AI Bullet Enhancer"
                                  >
                                    <Sparkles size={13} />
                                    <span>AI Polish</span>
                                  </Button>

                                  {activeEnhanceDropdown?.section === 'projects' &&
                                    activeEnhanceDropdown?.itemIdx === pIdx &&
                                    activeEnhanceDropdown?.bulletIdx === bIdx && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: '100%',
                                        marginTop: '4px',
                                        zIndex: 50,
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                                        border: '1px solid #e2e8f0',
                                        width: '220px',
                                        padding: '0.4rem',
                                        display: 'grid',
                                        gap: '2px'
                                      }}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleEnhanceBullet('projects', pIdx, bIdx, 'polish')}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '0.4rem 0.6rem',
                                          fontSize: '0.74rem',
                                          borderRadius: '4px',
                                          border: 'none',
                                          backgroundColor: 'transparent',
                                          cursor: 'pointer',
                                          textAlign: 'left',
                                          color: '#1e293b',
                                          fontWeight: 600
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                      >
                                        <Sparkle size={13} color="var(--primary)" /> ⚡ Full Polish (Verb + Metric)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleEnhanceBullet('projects', pIdx, bIdx, 'action_verb')}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '0.4rem 0.6rem',
                                          fontSize: '0.74rem',
                                          borderRadius: '4px',
                                          border: 'none',
                                          backgroundColor: 'transparent',
                                          cursor: 'pointer',
                                          textAlign: 'left',
                                          color: '#1e293b',
                                          fontWeight: 600
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                      >
                                        <Zap size={13} color="#ea580c" /> 🚀 Strong ATS Action Verb
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleEnhanceBullet('projects', pIdx, bIdx, 'metric')}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '0.4rem 0.6rem',
                                          fontSize: '0.74rem',
                                          borderRadius: '4px',
                                          border: 'none',
                                          backgroundColor: 'transparent',
                                          cursor: 'pointer',
                                          textAlign: 'left',
                                          color: '#1e293b',
                                          fontWeight: 600
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                      >
                                        <Target size={13} color="#059669" /> 📊 Add Measurable Metric
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProjectBullet(pIdx, bIdx)}
                                  style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                                  title="Delete bullet"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* SECTION 6: Experience & Internships */}
            {activeSection === 'experience' && (
              <Card
                title="Work Experience & Internships"
                actions={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddExperience}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Plus size={14} /> Add Experience
                  </Button>
                }
              >
                {resumeData.experience.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem 1.5rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1.5px dashed #cbd5e1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(234,88,12,0.08)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Briefcase size={22} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>No Work Experience or Internships Added</div>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem', maxWidth: '380px' }}>
                      Include company internships, freelance contracts, or research positions with measured accomplishments.
                    </p>
                    <Button variant="primary" size="sm" onClick={handleAddExperience} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem' }}>
                      <Plus size={15} /> Add Experience
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {resumeData.experience.map((exp, eIdx) => (
                      <div
                        key={eIdx}
                        style={{
                          padding: '1rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          display: 'grid',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                            Role #{eIdx + 1}: {exp.role} @ {exp.organization || exp.company}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExperience(eIdx)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              fontSize: '0.75rem'
                            }}
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.65rem' }}>
                          <Input
                            label="Position / Role"
                            value={exp.role}
                            onChange={(e) => handleUpdateExperience(eIdx, 'role', e.target.value)}
                            placeholder="e.g. Software Engineer Intern"
                          />
                          <Input
                            label="Organization / Company"
                            value={exp.organization || exp.company}
                            onChange={(e) => handleUpdateExperience(eIdx, 'organization', e.target.value)}
                            placeholder="e.g. Acme Corp"
                          />
                        </div>

                        <Input
                          label="Duration / Dates"
                          value={exp.duration}
                          onChange={(e) => handleUpdateExperience(eIdx, 'duration', e.target.value)}
                          placeholder="e.g. May 2024 - Aug 2024"
                        />

                        {/* Experience Bullets */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                              Impact & Key Accomplishment Bullets:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddExperienceBullet(eIdx)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              + Add Bullet
                            </button>
                          </div>
                          <div style={{ display: 'grid', gap: '0.45rem' }}>
                            {(exp.bullets || []).map((bullet, bIdx) => (
                              <div key={bIdx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', position: 'relative' }}>
                                <Input
                                  value={bullet}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setResumeData(prev => {
                                      const copy = [...prev.experience];
                                      copy[eIdx].bullets[bIdx] = val;
                                      return { ...prev, experience: copy };
                                    });
                                  }}
                                  placeholder="Engineered scalable backend microservices and collaborated in agile code reviews..."
                                />
                                <div style={{ position: 'relative' }}>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setActiveEnhanceDropdown(
                                      activeEnhanceDropdown?.section === 'experience' &&
                                      activeEnhanceDropdown?.itemIdx === eIdx &&
                                      activeEnhanceDropdown?.bulletIdx === bIdx
                                        ? null
                                        : { section: 'experience', itemIdx: eIdx, bulletIdx: bIdx }
                                    )}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '0.35rem 0.55rem',
                                      fontSize: '0.72rem',
                                      borderColor: 'rgba(37,99,235,0.3)',
                                      color: 'var(--primary)',
                                      whiteSpace: 'nowrap'
                                    }}
                                    title="AI Bullet Enhancer"
                                  >
                                    <Sparkles size={13} />
                                    <span>AI Polish</span>
                                  </Button>

                                  {activeEnhanceDropdown?.section === 'experience' &&
                                    activeEnhanceDropdown?.itemIdx === eIdx &&
                                    activeEnhanceDropdown?.bulletIdx === bIdx && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: '100%',
                                        marginTop: '4px',
                                        zIndex: 50,
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                                        border: '1px solid #e2e8f0',
                                        width: '220px',
                                        padding: '0.4rem',
                                        display: 'grid',
                                        gap: '2px'
                                      }}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleEnhanceBullet('experience', eIdx, bIdx, 'polish')}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '0.4rem 0.6rem',
                                          fontSize: '0.74rem',
                                          borderRadius: '4px',
                                          border: 'none',
                                          backgroundColor: 'transparent',
                                          cursor: 'pointer',
                                          textAlign: 'left',
                                          color: '#1e293b',
                                          fontWeight: 600
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                      >
                                        <Sparkle size={13} color="var(--primary)" /> ⚡ Full Polish (Verb + Metric)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleEnhanceBullet('experience', eIdx, bIdx, 'action_verb')}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '0.4rem 0.6rem',
                                          fontSize: '0.74rem',
                                          borderRadius: '4px',
                                          border: 'none',
                                          backgroundColor: 'transparent',
                                          cursor: 'pointer',
                                          textAlign: 'left',
                                          color: '#1e293b',
                                          fontWeight: 600
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                      >
                                        <Zap size={13} color="#ea580c" /> 🚀 Strong ATS Action Verb
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleEnhanceBullet('experience', eIdx, bIdx, 'metric')}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '0.4rem 0.6rem',
                                          fontSize: '0.74rem',
                                          borderRadius: '4px',
                                          border: 'none',
                                          backgroundColor: 'transparent',
                                          cursor: 'pointer',
                                          textAlign: 'left',
                                          color: '#1e293b',
                                          fontWeight: 600
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                      >
                                        <Target size={13} color="#059669" /> 📊 Add Measurable Metric
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExperienceBullet(eIdx, bIdx)}
                                  style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                                  title="Delete bullet"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* SECTION: Certifications */}
            {activeSection === 'certifications' && (
              <Card
                title="Certifications & Professional Credentials"
                actions={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddCertification}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Plus size={14} /> Add Certification
                  </Button>
                }
              >
                {resumeData.certifications.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem 1.5rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1.5px dashed #cbd5e1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(99,102,241,0.08)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Award size={22} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>No Certifications Added Yet</div>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem', maxWidth: '380px' }}>
                      Showcase your verified industry credentials from AWS, Google, Meta, Microsoft, or HackerRank.
                    </p>
                    <Button variant="primary" size="sm" onClick={handleAddCertification} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem' }}>
                      <Plus size={15} /> Add Certification
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.85rem' }}>
                    {resumeData.certifications.map((cert, cIdx) => (
                      <div
                        key={cIdx}
                        style={{
                          padding: '0.9rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          display: 'grid',
                          gap: '0.65rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                            Certification #{cIdx + 1}: {cert.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCertification(cIdx)}
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem' }}
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.8fr', gap: '0.65rem' }}>
                          <Input
                            label="Certification Name"
                            value={cert.name}
                            onChange={(e) => handleUpdateCertification(cIdx, 'name', e.target.value)}
                            placeholder="e.g. AWS Certified Cloud Practitioner"
                          />
                          <Input
                            label="Issuing Organization"
                            value={cert.organization}
                            onChange={(e) => handleUpdateCertification(cIdx, 'organization', e.target.value)}
                            placeholder="e.g. Amazon Web Services"
                          />
                          <Input
                            label="Date / Year"
                            value={cert.date}
                            onChange={(e) => handleUpdateCertification(cIdx, 'date', e.target.value)}
                            placeholder="e.g. 2024"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* SECTION: Achievements */}
            {activeSection === 'achievements' && (
              <Card
                title="Honors, Awards & Key Achievements"
                actions={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddAchievement}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Plus size={14} /> Add Achievement
                  </Button>
                }
              >
                {resumeData.achievements.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem 1.5rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1.5px dashed #cbd5e1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(234,179,8,0.08)', color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Star size={22} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>No Honors or Achievements Added</div>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem', maxWidth: '380px' }}>
                      Highlight hackathon awards, academic honors, competitive programming ranks, or scholarships.
                    </p>
                    <Button variant="primary" size="sm" onClick={handleAddAchievement} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem' }}>
                      <Plus size={15} /> Add Achievement
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.85rem' }}>
                    {resumeData.achievements.map((ach, aIdx) => (
                      <div
                        key={aIdx}
                        style={{
                          padding: '0.9rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          display: 'grid',
                          gap: '0.65rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                            Achievement #{aIdx + 1}: {ach.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAchievement(aIdx)}
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem' }}
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '0.65rem' }}>
                          <Input
                            label="Achievement / Award Title"
                            value={ach.title}
                            onChange={(e) => handleUpdateAchievement(aIdx, 'title', e.target.value)}
                            placeholder="e.g. Smart India Hackathon Finalist"
                          />
                          <Input
                            label="Context / Impact Details"
                            value={ach.context}
                            onChange={(e) => handleUpdateAchievement(aIdx, 'context', e.target.value)}
                            placeholder="e.g. Ranked Top 5 out of 450+ engineering teams nationwide"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* SECTION: Rearrange & Manage Section Order */}
            {activeSection === 'reorder' && (
              <Card
                title="Resume Structure & Section Ordering"
                subtitle="Move sections to tailor your resume hierarchy. Freshers should emphasize Education & Projects; experienced applicants should lead with Experience."
              >
                {/* 1-Click Order Presets */}
                <div style={{ marginBottom: '1.25rem', padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                    🚀 1-Click Career Archetype Presets:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => applySectionPreset('fresher')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🎓 College Fresher (Education & Projects First)
                    </button>
                    <button
                      type="button"
                      onClick={() => applySectionPreset('experienced')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      💼 Experienced Contributor (Experience First)
                    </button>
                    <button
                      type="button"
                      onClick={() => applySectionPreset('classic')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🛡️ Standard Universal ATS Layout
                    </button>
                  </div>
                </div>

                {/* Section Order List */}
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {(formatting.section_order || [
                    'summary', 'education', 'skills', 'projects', 'experience', 'certifications', 'achievements'
                  ]).map((secKey, idx, arr) => {
                    const secMeta = ALL_SECTIONS.find(s => s.id === secKey) || { id: secKey, label: secKey, icon: Layers };
                    const Icon = secMeta.icon;
                    const isVisible = formatting.visible_sections?.[secKey] !== false;

                    return (
                      <div
                        key={secKey}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.95rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: isVisible ? '#ffffff' : '#f8fafc',
                          opacity: isVisible ? 1 : 0.65,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', width: '18px' }}>
                            #{idx + 1}
                          </span>
                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: isVisible ? 'rgba(37,99,235,0.08)' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isVisible ? 'var(--primary)' : '#64748b' }}>
                            <Icon size={15} />
                          </div>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isVisible ? '#0f172a' : '#64748b' }}>
                            {secMeta.label}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleSection(secKey)}
                            style={{
                              padding: '0.25rem 0.6rem',
                              borderRadius: '4px',
                              border: isVisible ? '1px solid #10b981' : '1px solid #cbd5e1',
                              backgroundColor: isVisible ? '#ecfdf5' : '#f1f5f9',
                              color: isVisible ? '#059669' : '#64748b',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {isVisible ? 'Visible' : 'Hidden'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSection(secKey, 'up')}
                            disabled={idx === 0}
                            style={{
                              padding: '0.3rem',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              background: idx === 0 ? '#f8fafc' : '#ffffff',
                              color: idx === 0 ? '#cbd5e1' : '#334155',
                              cursor: idx === 0 ? 'not-allowed' : 'pointer'
                            }}
                            title="Move section up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSection(secKey, 'down')}
                            disabled={idx === arr.length - 1}
                            style={{
                              padding: '0.3rem',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              background: idx === arr.length - 1 ? '#f8fafc' : '#ffffff',
                              color: idx === arr.length - 1 ? '#cbd5e1' : '#334155',
                              cursor: idx === arr.length - 1 ? 'not-allowed' : 'pointer'
                            }}
                            title="Move section down"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* SECTION 7: ATS Optimizer & Target Role */}
            {activeSection === 'ats_optimizer' && (
              <Card
                title="Target Role & ATS Optimization Engine"
                actions={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleFetchAiImprovements}
                    disabled={isLoadingAI}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Sparkles size={14} />
                    {isLoadingAI ? 'Analyzing...' : 'Generate AI Bullet Enhancements'}
                  </Button>
                }
              >
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {/* Target Role Pills */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                      Select Target Role:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {TARGET_ROLE_PRESETS.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setTargetRole(r);
                            runAssessment(resumeData, r, jobDescription);
                          }}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px',
                            border: targetRole === r ? '1.5px solid var(--primary)' : '1px solid #e2e8f0',
                            backgroundColor: targetRole === r ? 'rgba(37, 99, 235, 0.08)' : '#f8fafc',
                            color: targetRole === r ? 'var(--primary)' : '#475569',
                            fontSize: '0.78rem',
                            fontWeight: targetRole === r ? 700 : 500,
                            cursor: 'pointer'
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Opportunity Selector */}
                  {opportunitiesList.length > 0 && (
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                        Match Against Saved Platform Opportunity:
                      </label>
                      <select
                        value={selectedOpportunityId}
                        onChange={(e) => handleSelectOpportunity(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.55rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.82rem',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        <option value="">-- Choose an Opportunity --</option>
                        {opportunitiesList.map(opp => (
                          <option key={opp.id} value={opp.id}>
                            {opp.title} ({opp.company})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Job Description Paste Area */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                      Or Paste Specific Job Description:
                    </label>
                    <Textarea
                      value={jobDescription}
                      onChange={(e) => {
                        setJobDescription(e.target.value);
                        runAssessment(resumeData, targetRole, e.target.value);
                      }}
                      placeholder="Paste target job description to match keywords and get instant ATS readiness scoring..."
                      rows={4}
                    />
                  </div>

                  {/* AI Grounded Suggestions List */}
                  {suggestions.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.75rem' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                        ✨ {suggestions.length} Grounded AI Bullet Point Upgrades Available:
                      </div>
                      {suggestions.map((sugg) => (
                        <ResumeImprovementItem
                          key={sugg.id}
                          suggestion={sugg}
                          onAccept={handleAcceptSuggestion}
                          onReject={handleRejectSuggestion}
                          onEditApply={handleEditApplySuggestion}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Right Pane: Sticky Real-Time Live Preview */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div
            style={{
              position: viewMode === 'split' ? 'sticky' : 'relative',
              top: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Live Preview Floating Toolbar */}
            <div
              style={{
                width: '100%',
                maxWidth: '820px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                padding: '0.55rem 1rem',
                borderRadius: '10px 10px 0 0',
                border: '1px solid #cbd5e1',
                borderBottom: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                  <Eye size={15} color="var(--primary)" /> Live A4 Sheet Preview
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                  ● Synchronous
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                  A4 Standard
                </span>
              </div>

              {/* Quick Actions & Zoom */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <button
                  type="button"
                  onClick={handleOptimize1Page}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '0.3rem 0.55rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Automatically adjust font size and spacing to fit exactly on 1 page"
                >
                  <Sliders size={12} /> Fit to 1 Page
                </button>

                {/* Zoom Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.max(75, prev - 5))}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px' }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={13} color="#64748b" />
                  </button>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', minWidth: '36px', textAlign: 'center' }}>
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.min(125, prev + 5))}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px' }}
                    title="Zoom In"
                  >
                    <ZoomIn size={13} color="#64748b" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, marginLeft: '2px' }}
                  >
                    Reset
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.32rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: isExporting ? 'wait' : 'pointer',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
                  }}
                  title="Direct Download PDF"
                >
                  <Download size={13} /> {isExporting ? '...' : 'PDF'}
                </button>
              </div>
            </div>

            {/* A4 Sheet Container with Zoom Transformation */}
            <div
              style={{
                width: '100%',
                maxWidth: '820px',
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease',
              }}
            >
              <ResumeTemplateRenderer
                templateId={templateId}
                resumeData={resumeData}
                formatting={formatting}
              />
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Import / Sync Data Modal */}
      {isUploadSyncModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '650px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UploadCloud size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Import & Fetch Resume Data
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadSyncModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
              <button
                type="button"
                onClick={() => setUploadSyncTab('profile')}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  border: 'none',
                  borderBottom: uploadSyncTab === 'profile' ? '2px solid var(--primary)' : '2px solid transparent',
                  backgroundColor: uploadSyncTab === 'profile' ? 'rgba(37,99,235,0.04)' : 'transparent',
                  color: uploadSyncTab === 'profile' ? 'var(--primary)' : '#64748b',
                  fontWeight: uploadSyncTab === 'profile' ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <FileCheck size={16} /> Sync from CareerPilot Profile
              </button>
              <button
                type="button"
                onClick={() => setUploadSyncTab('upload')}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  border: 'none',
                  borderBottom: uploadSyncTab === 'upload' ? '2px solid var(--primary)' : '2px solid transparent',
                  backgroundColor: uploadSyncTab === 'upload' ? 'rgba(37,99,235,0.04)' : 'transparent',
                  color: uploadSyncTab === 'upload' ? 'var(--primary)' : '#64748b',
                  fontWeight: uploadSyncTab === 'upload' ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <Upload size={16} /> Upload & Extract Resume (PDF/DOCX)
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem' }}>
              {uploadSyncTab === 'profile' ? (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                        Sync with Verified Student Profile
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                        Pulls your verified college education, degree, GPA, technical skills, and projects directly from your CareerPilot student database record into the live resume editor without erasing your manual bullet improvements.
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#334155' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Profile Summary:</div>
                    <div>• <strong>Student:</strong> {user?.name || resumeData.personal.fullName || 'Candidate'}</div>
                    <div>• <strong>Education:</strong> {resumeData.education?.[0]?.institution || 'College Verified'}</div>
                    <div>• <strong>Total Skills:</strong> {resumeData.skills?.length || 0} indexed competencies</div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleSyncProfile}
                    disabled={isSyncingProfile}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <RotateCcw size={15} />
                    {isSyncingProfile ? 'Syncing Profile Data...' : 'Sync Profile to Live Resume'}
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <UploadCloud size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                        Upload Existing Resume File
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                        Upload your existing PDF or Word document. CareerPilot AI will parse all sections, extract skills, projects, and work history, and merge them with your profile.
                      </p>
                    </div>
                  </div>

                  {/* Dropzone */}
                  <label
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: '12px',
                      padding: '2rem 1.5rem',
                      textAlign: 'center',
                      cursor: isUploadingResume ? 'wait' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.6rem',
                      backgroundColor: '#f8fafc',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleUploadResumeFile}
                      disabled={isUploadingResume}
                      style={{ display: 'none' }}
                    />
                    <Upload size={32} color={isUploadingResume ? '#94a3b8' : 'var(--primary)'} />
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      {isUploadingResume ? 'Extracting & Merging Resume...' : 'Click or Drag & Drop Resume File'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Supports authentic PDF (.pdf) and Microsoft Word (.docx) up to 10 MB
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Browse All Recommended Templates Modal */}
      {isTemplatesModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '920px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                backgroundColor: '#ffffff',
                zIndex: 10,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  ATS-Compliant Resume Templates
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Engineered to maximize ATS parseability and highlight your specific career background
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplatesModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Template Cards Grid */}
            <div
              style={{
                padding: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {TEMPLATE_CATALOG.map(t => {
                const isSelected = templateId === t.id;
                const isRec = recommendedTemplateInfo.id === t.id;

                return (
                  <div
                    key={t.id}
                    style={{
                      borderRadius: '12px',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                      padding: '1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? 'rgba(37,99,235,0.03)' : '#ffffff',
                      boxShadow: isSelected ? '0 4px 15px rgba(37,99,235,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    <div>
                      {/* Badge bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', backgroundColor: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
                          {t.atsRating}
                        </span>
                        {isRec && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ffffff', backgroundColor: 'var(--primary)', padding: '2px 8px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Star size={10} /> Recommended
                          </span>
                        )}
                      </div>

                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        {t.name}
                      </h4>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: t.highlightColor, marginBottom: '0.5rem' }}>
                        {t.tagline}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 0.85rem 0', lineHeight: 1.45 }}>
                        {t.description}
                      </p>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', backgroundColor: '#f8fafc', padding: '0.45rem', borderRadius: '6px' }}>
                        <strong>Best for:</strong> {t.bestFor}
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      <Button
                        variant={isSelected ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setTemplateId(t.id);
                          toast.showToast(`Applied ${t.name} template!`, 'success');
                          setIsTemplatesModalOpen(false);
                        }}
                        style={{ width: '100%' }}
                      >
                        {isSelected ? '✓ Currently Active' : 'Select This Template'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ATS Score Details Modal */}
      {showScoreModal && assessment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldCheck size={24} color={scoreColor} />
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                  ATS Readiness Audit ({scoreNum}/100)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowScoreModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <ResumeQualityBreakdown assessment={assessment} />

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <Button variant="primary" onClick={() => setShowScoreModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Drawer */}
      <ResumeVersionDrawer
        isOpen={isVersionDrawerOpen}
        onClose={() => setIsVersionDrawerOpen(false)}
        versions={savedVersions}
        activeVersionId={activeVersionId}
        onSelectVersion={handleSelectVersion}
        onDeleteVersion={async (id) => {
          await resumeBuilderService.deleteVersion(id);
          setSavedVersions(prev => prev.filter(v => v.id !== id));
        }}
        onDuplicateVersion={async (id) => {
          const dup = await resumeBuilderService.duplicateVersion(id);
          setSavedVersions(prev => [dup, ...prev]);
        }}
        onRenameVersion={async (id, title) => {
          const up = await resumeBuilderService.updateVersion(id, { title });
          setSavedVersions(prev => prev.map(v => v.id === id ? up : v));
        }}
        onCreateNewVersion={handleSaveVersion}
      />

      {/* Compare Changes Modal */}
      <ResumeComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        originalResume={originalSnapshot || resumeData}
        currentResume={resumeData}
        originalAssessment={originalAssessment}
        currentAssessment={assessment}
      />
    </PageContainer>
  );
}
