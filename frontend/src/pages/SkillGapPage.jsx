import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Award,
  Layers,
  Code,
  Clock,
  Briefcase,
  Search,
  Plus,
  Compass,
  Check,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  RefreshCw,
  FolderGit2,
  Flame,
  BarChart3,
  CheckCheck,
  FileText,
  UploadCloud,
  HelpCircle,
  Filter,
  X
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card, { CardHeader, CardContent, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { PriorityBadge } from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useToast } from '../context/ToastContext';
import {
  getProfile,
  updateProfile,
  getSkillGap,
  analyzeSkillGap,
  getLearningProgress,
  updateLearningProgress,
  getOpportunities,
  getSupportedRoles
} from '../services/api';

import SkillCategoryCoverageChart from '../components/skillgap/SkillCategoryCoverageChart';
import SkillRequirementComparisonChart from '../components/skillgap/SkillRequirementComparisonChart';
import SkillGapDistributionChart from '../components/skillgap/SkillGapDistributionChart';
import ResumeUploadModal from '../components/skillgap/ResumeUploadModal';
import PersonalizedRoadmapSection from '../components/skillgap/PersonalizedRoadmapSection';
import LearningResourcesDrawer from '../components/skillgap/LearningResourcesDrawer';

import './SkillGapPage.css';

const POPULAR_ROLES = [
  { label: 'Software Engineer', icon: '💻' },
  { label: 'Full Stack Developer', icon: '🌐' },
  { label: 'Backend Developer', icon: '⚙️' },
  { label: 'Frontend Developer', icon: '🎨' },
  { label: 'Cloud & DevOps Engineer', icon: '☁️' },
  { label: 'Data Scientist', icon: '📊' },
];

// High-performance animated number counter
function AnimatedNumber({ value, suffix = '', duration = 0.7 }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) {
      setCurrent(0);
      return;
    }
    const startTime = performance.now();
    let frameId;

    const tick = (now) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * ease));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <>{current}{suffix}</>;
}

export default function SkillGapPage() {
  const toast = useToast();

  // Core State
  const [profile, setProfile] = useState(null);
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [supportedRoles, setSupportedRoles] = useState([]);
  const [targetOpportunityId, setTargetOpportunityId] = useState('');
  const [opportunitiesList, setOpportunitiesList] = useState([]);

  // Data Loading & Analysis States
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);

  // Learning Progress State (keyed by skill name)
  const [learningProgress, setLearningProgress] = useState({});

  // Modals & Drawers
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [resourcesDrawerOpen, setResourcesDrawerOpen] = useState(false);
  const [resourceSkill, setResourceSkill] = useState('');
  const [activeResourcesList, setActiveResourcesList] = useState([]);

  const [addSkillModalOpen, setAddSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('programming_languages');
  const [addingSkill, setAddingSkill] = useState(false);

  // View All Gaps Modal
  const [allGapsModalOpen, setAllGapsModalOpen] = useState(false);
  const [modalGapSearch, setModalGapSearch] = useState('');
  const [modalGapFilter, setModalGapFilter] = useState('all');

  // Filters for Skills Inventory
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('all');

  // Priority Gaps Main View Filter (all | high | medium)
  const [gapFilter, setGapFilter] = useState('all');

  // Visual Analytics Active Tab
  const [analyticsTab, setAnalyticsTab] = useState('categories'); // 'categories' | 'requirements' | 'distribution'

  // Load Initial Profile, Supported Roles, Opportunities, and Initial Analysis
  useEffect(() => {
    async function initDashboard() {
      try {
        setLoading(true);

        // Fetch profile
        let studentProfile = null;
        try {
          const profRes = await getProfile();
          studentProfile = profRes?.data || profRes;
          setProfile(studentProfile);
        } catch (e) {
          console.warn('Could not load profile:', e);
        }

        // Determine default target role from student preferences
        let initialRole = 'Software Engineer';
        if (studentProfile?.preferences) {
          const prefRoles = studentProfile.preferences.targetRoles || studentProfile.preferences.target_roles;
          if (Array.isArray(prefRoles) && prefRoles.length > 0) {
            initialRole = typeof prefRoles[0] === 'string' ? prefRoles[0] : (prefRoles[0].value || 'Software Engineer');
          } else if (prefRoles?.value && Array.isArray(prefRoles.value) && prefRoles.value.length > 0) {
            initialRole = prefRoles.value[0];
          }
        }
        setTargetRole(initialRole);

        // Fetch supported roles
        try {
          const rolesRes = await getSupportedRoles();
          const rList = rolesRes?.data || rolesRes;
          if (Array.isArray(rList)) {
            setSupportedRoles(rList);
          }
        } catch (e) {}

        // Fetch live opportunities for comparison dropdown
        try {
          const oppsRes = await getOpportunities({ limit: 12, status: 'active' });
          const oList = oppsRes?.data?.opportunities || oppsRes?.data || oppsRes?.opportunities || [];
          if (Array.isArray(oList)) {
            setOpportunitiesList(oList);
          }
        } catch (e) {}

        // Fetch initial skill gap analysis
        await fetchAnalysis(initialRole, null, studentProfile);
      } catch (err) {
        console.error('Error initializing SkillGapPage:', err);
        toast.error('Failed to initialize skill intelligence dashboard.');
      } finally {
        setLoading(false);
      }
    }

    initDashboard();
  }, []);

  // Fetch or Refresh Skill Gap Analysis
  const fetchAnalysis = async (roleToAnalyze, oppIdToAnalyze, currentProfile = profile) => {
    try {
      setAnalyzing(true);
      const res = await getSkillGap(roleToAnalyze, oppIdToAnalyze);
      const data = res?.data || res;
      if (data && (res?.success || data.skillCoverage !== undefined || data.targetRole)) {
        setAnalysisData(data);

        // Hydrate learning progress map from returned userProgress
        if (Array.isArray(data.userProgress)) {
          const progMap = {};
          data.userProgress.forEach(item => {
            if (item && item.skill) {
              progMap[item.skill] = item;
            }
          });
          setLearningProgress(progMap);
        }
      }
    } catch (err) {
      console.error('Error fetching skill gap:', err);
      toast.error('Failed to calculate skill gap analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Switch Target Role
  const handleRoleSelect = (roleName) => {
    setTargetRole(roleName);
    fetchAnalysis(roleName, targetOpportunityId);
  };

  // Switch Target Opportunity
  const handleOpportunityChange = (oppId) => {
    setTargetOpportunityId(oppId);
    fetchAnalysis(targetRole, oppId || null);
  };

  // Trigger Full Manual Analysis Refresh
  const handleRunAnalysis = () => {
    fetchAnalysis(targetRole, targetOpportunityId);
    toast.success('Skill intelligence refreshed against latest profile evidence.');
  };

  // Handle Extraction Confirmed from ResumeUploadModal
  const handleExtractionConfirmed = async () => {
    try {
      const profRes = await getProfile();
      const updatedProf = profRes?.data?.data || profRes?.data;
      setProfile(updatedProf);
      await fetchAnalysis(targetRole, targetOpportunityId, updatedProf);
    } catch (e) {
      fetchAnalysis(targetRole, targetOpportunityId);
    }
  };

  // Handle Milestone / Skill Learning Progress Update
  const handleUpdateProgress = async (skillName, progressPayload) => {
    // Optimistic local update
    setLearningProgress(prev => ({
      ...prev,
      [skillName]: {
        ...(prev[skillName] || {}),
        ...progressPayload,
        skill: skillName,
      }
    }));

    try {
      await updateLearningProgress(skillName, progressPayload);
    } catch (err) {
      console.error('Failed to persist progress to backend:', err);
      toast.error(`Could not save progress for ${skillName}`);
    }
  };

  // Open Resource Drawer for a specific skill
  const handleOpenResources = (skillName) => {
    setResourceSkill(skillName);

    // Look for verified resources in missingSkills or matchedSkills
    let resources = [];
    if (analysisData) {
      const allSkills = [
        ...(analysisData.missingSkills || []),
        ...(analysisData.partialSkills || []),
        ...(analysisData.matchedSkills || []),
      ];
      const match = allSkills.find(s => s.name?.toLowerCase() === skillName.toLowerCase());
      if (match?.resources && match.resources.length > 0) {
        resources = match.resources;
      }
    }

    setActiveResourcesList(resources);
    setResourcesDrawerOpen(true);
  };

  // Add Skill to Roadmap from Card
  const handleAddToRoadmap = (skillName) => {
    handleUpdateProgress(skillName, {
      status: 'in_progress',
      progress: 10,
      target_role: targetRole,
    });
    toast.success(`Added ${skillName} to your personalized roadmap!`);
  };

  // Add Missing Skill Manually to Profile
  const handleAddCustomSkillToProfile = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    try {
      setAddingSkill(true);
      const skillToSave = newSkillName.trim();

      // Retrieve existing skills
      const currentSkillsObj = profile?.skills || {};
      const categoryList = Array.isArray(currentSkillsObj[newSkillCategory])
        ? currentSkillsObj[newSkillCategory]
        : (currentSkillsObj[newSkillCategory]?.value || []);

      if (categoryList.includes(skillToSave)) {
        toast.error(`${skillToSave} is already listed in your profile.`);
        setAddingSkill(false);
        return;
      }

      const updatedCategory = [...categoryList, skillToSave];
      const updatedSkills = {
        ...currentSkillsObj,
        [newSkillCategory]: updatedCategory
      };

      await updateProfile({ skills: updatedSkills });
      toast.success(`Added ${skillToSave} to your verified profile.`);

      setNewSkillName('');
      setAddSkillModalOpen(false);

      // Refresh profile & analysis
      const profRes = await getProfile();
      const updatedProf = profRes?.data?.data || profRes?.data;
      setProfile(updatedProf);
      fetchAnalysis(targetRole, targetOpportunityId, updatedProf);
    } catch (err) {
      console.error('Failed to add custom skill:', err);
      toast.error('Failed to add skill to profile.');
    } finally {
      setAddingSkill(false);
    }
  };

  // Filtered Skills Inventory
  const filteredInventory = useMemo(() => {
    if (!analysisData?.skillsInventory) return [];
    return analysisData.skillsInventory.filter(item => {
      if (inventorySearch) {
        const q = inventorySearch.toLowerCase();
        const matchesName = item.name?.toLowerCase().includes(q);
        const matchesContext = item.context?.toLowerCase().includes(q);
        const matchesCategory = item.category?.toLowerCase().includes(q);
        if (!matchesName && !matchesContext && !matchesCategory) return false;
      }
      if (inventoryCategoryFilter !== 'all' && item.category !== inventoryCategoryFilter) {
        return false;
      }
      if (inventoryStatusFilter !== 'all') {
        if (inventoryStatusFilter === 'demonstrated' && item.evidenceType !== 'demonstrated') return false;
        if (inventoryStatusFilter === 'listed' && item.evidenceType !== 'listed') return false;
        if (inventoryStatusFilter === 'unverified' && item.evidenceType !== 'needs_verification') return false;
      }
      return true;
    });
  }, [analysisData?.skillsInventory, inventorySearch, inventoryCategoryFilter, inventoryStatusFilter]);

  // Filtered Priority Gaps for main view
  const filteredGaps = useMemo(() => {
    if (!analysisData?.priorityGaps) return [];
    if (gapFilter === 'all') return analysisData.priorityGaps;
    if (gapFilter === 'high') {
      return analysisData.priorityGaps.filter(g => g.priority === 'Critical' || g.priority === 'High');
    }
    if (gapFilter === 'medium') {
      return analysisData.priorityGaps.filter(g => g.priority === 'Medium' || g.priority === 'Low');
    }
    return analysisData.priorityGaps;
  }, [analysisData?.priorityGaps, gapFilter]);

  // Modal filtered gaps
  const modalFilteredGaps = useMemo(() => {
    if (!analysisData?.priorityGaps) return [];
    return analysisData.priorityGaps.filter(g => {
      if (modalGapSearch) {
        const q = modalGapSearch.toLowerCase();
        const mName = g.name?.toLowerCase().includes(q);
        const mCat = g.category?.toLowerCase().includes(q);
        const mWhy = (g.whyMatters || g.whyLearn || '').toLowerCase().includes(q);
        if (!mName && !mCat && !mWhy) return false;
      }
      if (modalGapFilter !== 'all') {
        if (modalGapFilter.toLowerCase() !== g.priority?.toLowerCase()) return false;
      }
      return true;
    });
  }, [analysisData?.priorityGaps, modalGapSearch, modalGapFilter]);

  // KPI Calculations
  const stats = analysisData?.stats || {};
  const coveragePercent = analysisData?.skillCoverage || 0;
  const verifiedCount = stats.totalIdentifiedSkills || (analysisData?.skillsInventory?.length) || 0;
  const priorityGapsCount = stats.priorityGapCount || (analysisData?.missingSkills?.length) || 0;

  const totalRoadmapMilestones = useMemo(() => {
    if (!analysisData?.structuredRoadmap) return 0;
    return analysisData.structuredRoadmap.reduce((acc, p) => acc + (p.milestones?.length || 0), 0);
  }, [analysisData?.structuredRoadmap]);

  const completedMilestonesCount = useMemo(() => {
    if (!analysisData?.structuredRoadmap) return 0;
    let count = 0;
    analysisData.structuredRoadmap.forEach(phase => {
      (phase.milestones || []).forEach(m => {
        const p = learningProgress[m.skill];
        if (p?.status === 'completed' || m.status === 'completed') {
          count += 1;
        }
      });
    });
    return count;
  }, [analysisData?.structuredRoadmap, learningProgress]);

  const activePathsCount = useMemo(() => {
    return Object.values(learningProgress).filter(p => p.status === 'in_progress' || p.status === 'learning').length;
  }, [learningProgress]);

  // Last Analysis Timestamp String
  const lastAnalysisDateStr = useMemo(() => {
    const meta = analysisData?.resumeMeta;
    if (meta?.uploadedAt) {
      try {
        return new Date(meta.uploadedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch (e) {}
    }
    if (profile?.updated_at) {
      try {
        return new Date(profile.updated_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch (e) {}
    }
    return 'Recent';
  }, [analysisData?.resumeMeta, profile?.updated_at]);

  if (loading) {
    return (
      <PageContainer>
        <div style={{ padding: '5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <RefreshCw className="w-10 h-10 animate-spin" style={{ color: 'var(--primary, #255eff)' }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Analyzing student profile evidence & opportunity requirements...
          </p>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Loading skill intelligence dashboard</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="skillgap-dashboard">
        {/* =========================================================================
            1. DASHBOARD HEADER & ROLE CONTROLS
        ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="skillgap-header-card"
        >
          <div className="skillgap-header-top">
            <div className="skillgap-header-title-group">
              <div className="skillgap-header-icon-badge">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h1 className="skillgap-header-title">Skill Gap Intelligence</h1>
                <p className="skillgap-header-subtitle">
                  Understand verified proficiencies, benchmark role demands, and accelerate career readiness.
                </p>
              </div>
            </div>

            <div className="skillgap-header-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResumeModalOpen(true)}
                iconLeft={<UploadCloud className="w-4 h-4" style={{ color: 'var(--primary, #255eff)' }} />}
                style={{ fontSize: '0.775rem', height: '36px' }}
              >
                Update Resume
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunAnalysis}
                disabled={analyzing}
                iconLeft={<RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />}
                style={{ fontSize: '0.775rem', height: '36px' }}
              >
                {analyzing ? 'Analyzing...' : 'Refresh Intelligence'}
              </Button>
            </div>
          </div>

          {/* Meta Status Badges */}
          <div className="skillgap-meta-row">
            <div className="skillgap-meta-item">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
              <span>Evidence: <strong style={{ color: 'var(--text-primary)' }}>{analysisData?.resumeMeta?.hasResume ? 'Resume Verified' : 'Profile Direct'}</strong></span>
            </div>
            <span>•</span>
            <div className="skillgap-meta-item">
              <Clock className="w-3.5 h-3.5" />
              <span>Last analyzed: <strong style={{ color: 'var(--text-primary)' }}>{lastAnalysisDateStr}</strong></span>
            </div>
            {analysisData?.targetOpportunity && (
              <>
                <span>•</span>
                <Badge variant="primary" className="text-[11px] py-0.5">
                  Target Opportunity: {analysisData.targetOpportunity}
                </Badge>
              </>
            )}
          </div>

          {/* Controls Bar: Popular Roles & Opportunity Comparator */}
          <div className="skillgap-controls-bar">
            <div>
              <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>
                Target Career Benchmark:
              </span>
              <div className="skillgap-role-chips">
                {POPULAR_ROLES.map((r) => {
                  const isSelected = targetRole === r.label;
                  return (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => handleRoleSelect(r.label)}
                      className={`skillgap-role-chip ${isSelected ? 'active' : ''}`}
                    >
                      <span>{r.icon}</span>
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="skillgap-compare-wrapper">
              <span className="skillgap-live-indicator" title="Live Role Comparator Active" />
              <span className="skillgap-live-badge">LIVE</span>
              <span className="skillgap-compare-label">
                <Briefcase className="w-3.5 h-3.5" style={{ color: 'var(--primary, #255eff)' }} />
                <span>Compare with Live Job:</span>
              </span>
              <select
                value={targetOpportunityId}
                onChange={(e) => handleOpportunityChange(e.target.value)}
                className="skillgap-compare-select"
                title="Select a live job to compare benchmarks"
              >
                <option value="">General Industry Standard (Default)</option>
                {opportunitiesList.map(opp => (
                  <option key={opp.id} value={opp.id}>
                    {opp.title} — {opp.organization?.name || opp.company || 'Job'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* =========================================================================
            2. ANIMATED KPI HERO SCORECARD (5 CARDS WITH COUNTUP — IMAGE 2)
        ========================================================================= */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08 }
            }
          }}
          className="skillgap-kpi-grid"
        >
          {/* KPI 1: Verified Skills (Emerald) */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="skillgap-kpi-card emerald"
          >
            <div className="skillgap-kpi-icon-wrap emerald">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="skillgap-kpi-content">
              <span className="skillgap-kpi-label">Verified Skills</span>
              <div className="skillgap-kpi-value">
                <AnimatedNumber value={verifiedCount} />
              </div>
              <span className="skillgap-kpi-sub">Profile & project verified</span>
            </div>
          </motion.div>

          {/* KPI 2: Target-Role Skill Coverage (Blue) */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="skillgap-kpi-card blue"
          >
            <div className="skillgap-kpi-icon-wrap blue">
              <Target className="w-5 h-5" />
            </div>
            <div className="skillgap-kpi-content">
              <span className="skillgap-kpi-label">Target Coverage</span>
              <div className="skillgap-kpi-value" style={{ color: 'var(--primary, #255eff)' }}>
                <AnimatedNumber value={coveragePercent} suffix="%" />
              </div>
              <div className="skillgap-kpi-progress">
                <div
                  className="skillgap-kpi-progress-bar blue"
                  style={{ width: `${Math.min(coveragePercent, 100)}%` }}
                />
              </div>
              <span className="skillgap-kpi-sub" style={{ marginTop: '3px' }}>
                {stats.matchedCount || 0} of {stats.totalRequired || 0} distinct skills matched
              </span>
            </div>
          </motion.div>

          {/* KPI 3: Priority Skill Gaps (Amber) */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="skillgap-kpi-card amber"
          >
            <div className="skillgap-kpi-icon-wrap amber">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="skillgap-kpi-content">
              <span className="skillgap-kpi-label">Priority Gaps</span>
              <div className="skillgap-kpi-value" style={{ color: '#f59e0b' }}>
                <AnimatedNumber value={priorityGapsCount} />
              </div>
              <span className="skillgap-kpi-sub">Critical unmet prerequisites</span>
            </div>
          </motion.div>

          {/* KPI 4: Milestones Completed (Cyan) */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="skillgap-kpi-card cyan"
          >
            <div className="skillgap-kpi-icon-wrap cyan">
              <CheckCheck className="w-5 h-5" />
            </div>
            <div className="skillgap-kpi-content">
              <span className="skillgap-kpi-label">Milestones Done</span>
              <div className="skillgap-kpi-value">
                <AnimatedNumber value={completedMilestonesCount} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '4px' }}>
                  / {totalRoadmapMilestones}
                </span>
              </div>
              <span className="skillgap-kpi-sub">Curriculum goals achieved</span>
            </div>
          </motion.div>

          {/* KPI 5: Active Learning Paths (Violet) */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="skillgap-kpi-card violet"
          >
            <div className="skillgap-kpi-icon-wrap violet">
              <Flame className="w-5 h-5" />
            </div>
            <div className="skillgap-kpi-content">
              <span className="skillgap-kpi-label">Active Learning</span>
              <div className="skillgap-kpi-value" style={{ color: '#8b5cf6' }}>
                <AnimatedNumber value={activePathsCount} />
              </div>
              <span className="skillgap-kpi-sub">Skills currently in progress</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Explainable Policy Banner */}
        <div className="skillgap-policy-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle className="w-4 h-4" style={{ color: 'var(--primary, #255eff)', flexShrink: 0 }} />
            <span>
              <strong>Target-Role Skill Coverage:</strong> Matched required proficiencies divided by total distinct required skills for this benchmark. Coverage measures curriculum alignment and does not represent an automated hiring decision.
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
            Transparent Analytics
          </Badge>
        </div>

        {/* =========================================================================
            3. VISUAL SKILL ANALYTICS HUB
        ========================================================================= */}
        <div className="skillgap-analytics-card">
          <div className="skillgap-analytics-header">
            <div>
              <h2 className="skillgap-analytics-title">
                <BarChart3 className="w-5 h-5" style={{ color: 'var(--primary, #255eff)' }} />
                Visual Skill Analytics
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Comparative benchmarks across domain categories and qualification depths
              </p>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="skillgap-analytics-tabs">
              <button
                type="button"
                id="skillgap-tab-categories"
                onClick={() => setAnalyticsTab('categories')}
                className={`skillgap-tab-btn ${analyticsTab === 'categories' ? 'active' : ''}`}
              >
                Category Coverage
              </button>
              <button
                type="button"
                id="skillgap-tab-requirements"
                onClick={() => setAnalyticsTab('requirements')}
                className={`skillgap-tab-btn ${analyticsTab === 'requirements' ? 'active' : ''}`}
              >
                Evidence vs Target
              </button>
              <button
                type="button"
                id="skillgap-tab-distribution"
                onClick={() => setAnalyticsTab('distribution')}
                className={`skillgap-tab-btn ${analyticsTab === 'distribution' ? 'active' : ''}`}
              >
                Gap Distribution
              </button>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="skillgap-chart-viewport">
            {analyticsTab === 'categories' && (
              <SkillCategoryCoverageChart
                categoryBreakdown={analysisData?.categoryBreakdown}
                targetRole={targetRole}
              />
            )}
            {analyticsTab === 'requirements' && (
              <SkillRequirementComparisonChart
                skillComparison={analysisData?.skillComparison}
              />
            )}
            {analyticsTab === 'distribution' && (
              <SkillGapDistributionChart
                missingSkills={analysisData?.missingSkills}
                partialSkills={analysisData?.partialSkills}
                futureSkills={analysisData?.futureSkills}
                onOpenAllGaps={() => setShowGapsModal(true)}
              />
            )}
          </div>
        </div>

        {/* =========================================================================
            4. COMPACT PRIORITY SKILL GAPS (TOP 4 + VIEW ALL GAPS DRAWER)
        ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="skillgap-section-head">
            <div>
              <h2 className="skillgap-section-title">
                <Sparkles className="w-5 h-5" style={{ color: '#f59e0b' }} />
                Priority Skill Gaps
              </h2>
              <p className="skillgap-section-sub">
                Top actionable proficiencies prioritized by employer demand and satisfied prerequisites
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {/* Priority Filter */}
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '2px' }}>
                {['all', 'high', 'medium'].map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setGapFilter(f)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      border: 'none',
                      cursor: 'pointer',
                      background: gapFilter === f ? 'var(--primary, #255eff)' : 'transparent',
                      color: gapFilter === f ? '#ffffff' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* View All Gaps Toggle */}
              {analysisData?.priorityGaps && analysisData.priorityGaps.length > 4 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllGapsModalOpen(true)}
                  iconRight={<ChevronRight className="w-3.5 h-3.5" />}
                  style={{ fontSize: '0.75rem', height: '32px' }}
                >
                  View All ({analysisData.priorityGaps.length})
                </Button>
              )}
            </div>
          </div>

          {/* Top 4 Compact Cards */}
          {filteredGaps.length > 0 ? (
            <div className="skillgap-compact-gaps-grid">
              {filteredGaps.slice(0, 4).map((gap, idx) => {
                const isTracked = !!learningProgress[gap.name];

                return (
                  <div key={gap.name || idx} className="skillgap-compact-card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="skillgap-card-top-row">
                        <div>
                          <h3 className="skillgap-card-title">{gap.name}</h3>
                          <span className="skillgap-card-cat-badge">{gap.category}</span>
                        </div>
                        <PriorityBadge priority={gap.priority} />
                      </div>

                      <p className="skillgap-one-liner" title={gap.whyMatters || gap.whyLearn}>
                        {gap.whyMatters || gap.whyLearn || `Critical proficiency required for ${targetRole} positions.`}
                      </p>

                      <div className="skillgap-meta-pills">
                        <span className="skillgap-pill-tag amber">
                          <Clock className="w-3 h-3" />
                          <span>{gap.estimatedEffort || '1–2 weeks'}</span>
                        </span>
                        <span className="skillgap-pill-tag blue">
                          <span>{gap.requirementType || 'Required'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="skillgap-card-action-bar">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenResources(gap.name)}
                        iconLeft={<BookOpen className="w-3.5 h-3.5 text-primary-500" />}
                        style={{ fontSize: '0.725rem', height: '30px', padding: '0 0.5rem' }}
                      >
                        Curriculum
                      </Button>

                      <Button
                        variant={isTracked ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleAddToRoadmap(gap.name)}
                        iconLeft={isTracked ? <Check className="w-3.5 h-3.5" style={{ color: '#10b981' }} /> : <Plus className="w-3.5 h-3.5" />}
                        style={{ fontSize: '0.725rem', height: '30px' }}
                      >
                        {isTracked ? 'On Roadmap' : 'Add to Roadmap'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center border-border">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <h4 className="text-sm font-semibold text-text-primary">No Gaps Found in This Tier</h4>
              <p className="text-xs text-secondary mt-1">
                You have demonstrated verified proficiency across all evaluated skills in this priority tier.
              </p>
            </Card>
          )}
        </div>

        {/* =========================================================================
            5. PERSONALIZED LEARNING ROADMAP
        ========================================================================= */}
        <PersonalizedRoadmapSection
          structuredRoadmap={analysisData?.structuredRoadmap}
          targetRole={targetRole}
          learningProgress={learningProgress}
          onUpdateProgress={handleUpdateProgress}
          onOpenResources={handleOpenResources}
        />

        {/* =========================================================================
            6. VERIFIED SKILLS INVENTORY (SEARCHABLE & FILTERABLE)
        ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="skillgap-section-head">
            <div>
              <h2 className="skillgap-section-title">
                <Layers className="w-5 h-5" style={{ color: 'var(--primary, #255eff)' }} />
                Verified Skills Inventory
              </h2>
              <p className="skillgap-section-sub">
                Full catalog of verified competencies, evidence sources, and career relevance
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddSkillModalOpen(true)}
              iconLeft={<Plus className="w-3.5 h-3.5" style={{ color: 'var(--primary, #255eff)' }} />}
              style={{ fontSize: '0.75rem', height: '32px' }}
            >
              Add Missing Skill
            </Button>
          </div>

          {/* Filter Bar */}
          <Card className="p-3 bg-card border-border shadow-sm">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <Search className="w-4 h-4" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search skills or context..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  style={{
                    width: '100%',
                    fontSize: '0.75rem',
                    padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Category Filter */}
              <select
                value={inventoryCategoryFilter}
                onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                className="skillgap-role-select"
                style={{ width: '100%' }}
              >
                <option value="all">All Categories</option>
                <option value="Programming Languages">Programming Languages</option>
                <option value="Databases">Databases</option>
                <option value="Frameworks & Development">Frameworks & Development</option>
                <option value="Computer Science Fundamentals">CS Fundamentals</option>
                <option value="Cloud & DevOps">Cloud & DevOps</option>
                <option value="Data Science & AI">Data Science & AI</option>
                <option value="Testing & Software Engineering">Testing & Engineering</option>
              </select>

              {/* Status Filter */}
              <select
                value={inventoryStatusFilter}
                onChange={(e) => setInventoryStatusFilter(e.target.value)}
                className="skillgap-role-select"
                style={{ width: '100%' }}
              >
                <option value="all">All Evidence Types</option>
                <option value="demonstrated">Demonstrated (Project / Work)</option>
                <option value="listed">Listed on Resume</option>
                <option value="unverified">Needs Verification</option>
              </select>
            </div>
          </Card>

          {/* Inventory Grid */}
          {filteredInventory.length > 0 ? (
            <div className="skillgap-inventory-grid">
              {filteredInventory.map((item, idx) => {
                const isDemonstrated = item.evidenceType === 'demonstrated';
                const isListed = item.evidenceType === 'listed';

                return (
                  <div key={idx} className="skillgap-inventory-card">
                    <div className="skillgap-inventory-header">
                      <div className="skillgap-inventory-title-group">
                        <span className="skillgap-inventory-title">{item.name}</span>
                        <span className="skillgap-inventory-cat">{item.category}</span>
                      </div>
                      <Badge
                        variant={item.relevance === 'required' ? 'primary' : 'outline'}
                        className="text-[10px] capitalize"
                      >
                        {item.relevance}
                      </Badge>
                    </div>

                    <p className="skillgap-inventory-desc">{item.context}</p>

                    <div className="skillgap-inventory-footer">
                      <span className={`skillgap-evidence-status ${isDemonstrated ? 'demonstrated' : isListed ? 'listed' : 'unverified'}`}>
                        {isDemonstrated ? (
                          <>
                            <CheckCircle2 style={{ width: '13px', height: '13px', color: '#10b981' }} />
                            <span>Demonstrated</span>
                          </>
                        ) : isListed ? (
                          <>
                            <FileText style={{ width: '13px', height: '13px', color: '#0ea5e9' }} />
                            <span>On Resume</span>
                          </>
                        ) : (
                          <>
                            <HelpCircle style={{ width: '13px', height: '13px', color: '#f59e0b' }} />
                            <span>Unverified</span>
                          </>
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenResources(item.name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary, #255eff)',
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: 0
                        }}
                      >
                        <span>Resources</span>
                        <ChevronRight style={{ width: '12px', height: '12px' }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-card border border-border rounded-xl">
              <Search className="w-8 h-8 text-secondary opacity-40 mx-auto mb-2" />
              <p className="text-xs font-medium text-text-primary">No skills matched your search or filters.</p>
              <p className="text-[11px] text-secondary mt-1">Try resetting search filters or add a new skill.</p>
            </div>
          )}
        </div>

        {/* =========================================================================
            7. EMERGING SKILLS & CAREER OPPORTUNITIES
        ========================================================================= */}
        {analysisData?.emergingRecommendations && analysisData.emergingRecommendations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="skillgap-section-head">
              <div>
                <h2 className="skillgap-section-title">
                  <Flame className="w-5 h-5" style={{ color: '#6366f1' }} />
                  Emerging Skills & Future Technologies
                </h2>
                <p className="skillgap-section-sub">
                  Modern engineering frameworks and architectural competencies to future-proof your career trajectory
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                Forward-Looking
              </Badge>
            </div>

            <div className="skillgap-emerging-grid">
              {analysisData.emergingRecommendations.map((future, idx) => (
                <div key={idx} className="skillgap-emerging-card">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="skillgap-emerging-header">
                      <span className="skillgap-emerging-title">{future.name}</span>
                      <span className="skillgap-emerging-cat">{future.category || 'Emerging'}</span>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                      {future.reason}
                    </p>

                    {future.suggestedProject && (
                      <div className="skillgap-emerging-project-box">
                        <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
                          Recommended Project:
                        </strong>
                        {future.suggestedProject}
                      </div>
                    )}
                  </div>

                  <div className="skillgap-emerging-footer">
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock className="w-3.5 h-3.5" />
                      ~{future.estimatedEffort || '1–2 weeks'}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddToRoadmap(future.name)}
                      style={{ fontSize: '0.725rem', height: '28px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add to Plan</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODALS & DRAWERS
        ========================================================================= */}
        {/* Resume Upload Modal */}
        <ResumeUploadModal
          isOpen={resumeModalOpen}
          onClose={() => setResumeModalOpen(false)}
          onExtractionConfirmed={handleExtractionConfirmed}
        />

        {/* Curated Learning Resources Drawer */}
        <LearningResourcesDrawer
          isOpen={resourcesDrawerOpen}
          onClose={() => setResourcesDrawerOpen(false)}
          skillName={resourceSkill}
          resources={activeResourcesList}
          onAddToRoadmap={handleAddToRoadmap}
        />

        {/* Add Skill to Profile Modal */}
        <Modal
          isOpen={addSkillModalOpen}
          onClose={() => setAddSkillModalOpen(false)}
          title="Add Verified Skill to Student Profile"
          size="sm"
        >
          <form onSubmit={handleAddCustomSkillToProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                Skill or Technology Name:
              </label>
              <Input
                placeholder="e.g. Docker, TypeScript, Redis, GraphQL"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                Category:
              </label>
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="skillgap-role-select"
                style={{ width: '100%' }}
              >
                <option value="programming_languages">Programming Languages</option>
                <option value="frameworks">Frameworks & Libraries</option>
                <option value="databases">Databases & Storage</option>
                <option value="cloud">Cloud & Infrastructure</option>
                <option value="devops">DevOps & Tooling</option>
                <option value="ai_ml">Data Science & AI</option>
                <option value="tools">Testing & Engineering Tools</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <Button variant="ghost" onClick={() => setAddSkillModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={addingSkill || !newSkillName.trim()}>
                {addingSkill ? 'Adding...' : 'Save to Profile'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* View All Gaps Modal */}
        {allGapsModalOpen && (
          <div className="skillgap-gaps-modal-overlay" onClick={() => setAllGapsModalOpen(false)}>
            <div className="skillgap-gaps-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="skillgap-gaps-modal-header">
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    All Priority Skill Gaps ({analysisData?.priorityGaps?.length || 0})
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                    Complete list of unmet required and preferred proficiencies for {targetRole}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllGapsModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.35rem',
                    borderRadius: '8px'
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="skillgap-gaps-modal-body">
                {/* Search & Filter Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                    <Search className="w-4 h-4" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      placeholder="Search gap by skill name or category..."
                      value={modalGapSearch}
                      onChange={(e) => setModalGapSearch(e.target.value)}
                      style={{
                        width: '100%',
                        fontSize: '0.775rem',
                        padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {['all', 'critical', 'high', 'medium', 'low'].map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setModalGapFilter(f)}
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          background: modalGapFilter === f ? 'var(--primary, #255eff)' : 'var(--surface)',
                          color: modalGapFilter === f ? '#ffffff' : 'var(--text-secondary)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gaps Grid inside modal */}
                {modalFilteredGaps.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                    {modalFilteredGaps.map((gap, idx) => {
                      const isTracked = !!learningProgress[gap.name];
                      return (
                        <div key={idx} className="skillgap-compact-card">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div className="skillgap-card-top-row">
                              <div>
                                <h4 className="skillgap-card-title">{gap.name}</h4>
                                <span className="skillgap-card-cat-badge">{gap.category}</span>
                              </div>
                              <PriorityBadge priority={gap.priority} />
                            </div>

                            <p className="skillgap-one-liner" title={gap.whyMatters || gap.whyLearn}>
                              {gap.whyMatters || gap.whyLearn || `Identified requirement for ${targetRole}.`}
                            </p>

                            <div className="skillgap-meta-pills">
                              <span className="skillgap-pill-tag amber">
                                <Clock className="w-3 h-3" />
                                <span>{gap.estimatedEffort || '1–2 weeks'}</span>
                              </span>
                              <span className="skillgap-pill-tag blue">
                                <span>{gap.requirementType || 'Required'}</span>
                              </span>
                            </div>
                          </div>

                          <div className="skillgap-card-action-bar">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAllGapsModalOpen(false);
                                handleOpenResources(gap.name);
                              }}
                              style={{ fontSize: '0.725rem', height: '30px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0 0.5rem' }}
                            >
                              <BookOpen className="w-3.5 h-3.5 text-primary-500" />
                              <span>Resources</span>
                            </Button>

                            <Button
                              variant={isTracked ? 'outline' : 'primary'}
                              size="sm"
                              onClick={() => handleAddToRoadmap(gap.name)}
                              style={{ fontSize: '0.725rem', height: '30px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              {isTracked ? (
                                <>
                                  <Check className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                                  <span>On Roadmap</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add to Roadmap</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Search className="w-8 h-8 opacity-40 mx-auto mb-2" />
                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>No gaps matching this filter</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
