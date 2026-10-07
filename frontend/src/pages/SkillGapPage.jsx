import React, { useState, useEffect } from 'react';
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
  Bookmark,
  ChevronDown,
  ShieldCheck,
  RefreshCw,
  FolderGit2,
  Zap,
  ListTodo
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card, { CardHeader, CardContent, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { PriorityBadge } from '../components/ui/Badge';
import ProgressBar, { CircularProgress } from '../components/ui/ProgressBar';
import Drawer from '../components/ui/Drawer';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import SearchInput from '../components/ui/SearchInput';
import { useToast } from '../context/ToastContext';
import { getProfile, updateProfile, getSkillGap, analyzeSkillGap, getLearningProgress, updateLearningProgress } from '../services/api';
import {
  CANONICAL_ROLES,
  normalizeSkill,
  skillsMatch,
  VERIFIED_RESOURCES,
  PRACTICAL_PROJECTS,
  TOPIC_SEQUENCES
} from '../services/skillCatalog';
import SkillRadarChart from '../components/skillgap/SkillRadarChart';
import InteractiveLearningTimeline from '../components/skillgap/InteractiveLearningTimeline';


export default function SkillGapPage() {
  const toast = useToast();

  // Core State
  const [profile, setProfile] = useState(null);
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [targetOpportunity, setTargetOpportunity] = useState('');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Analysis result
  const [analysisData, setAnalysisData] = useState(null);

  // Detail Drawer State
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Learning Progress State (synced with backend & localStorage)
  const [learningProgress, setLearningProgress] = useState(() => {
    const saved = localStorage.getItem('careerpilot_skill_progress');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      Docker: { status: 'learning', progress: 60, completedTopics: ['Containers vs Virtual Machines', 'Writing clean Dockerfiles', 'Exposing Ports'] },
    };
  });

  // Modal to add skill to profile
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('technical');

  // Load initial student profile & run initial analysis
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const profileRes = await getProfile();
        let studentProfile = null;
        if (profileRes?.data) {
          studentProfile = profileRes.data;
          setProfile(studentProfile);
          // Check student preferred target role
          const savedRole = studentProfile.preferences?.targetRoles?.value?.[0];
          if (savedRole) {
            setTargetRole(savedRole);
          }
        }

        // Fetch backend skill gap
        const initialRole = studentProfile?.preferences?.targetRoles?.value?.[0] || 'Software Engineer';
        const gapRes = await getSkillGap(initialRole);
        if (gapRes?.data) {
          setAnalysisData(gapRes.data);
          if (gapRes.data.userProgress) {
            const progressMap = {};
            gapRes.data.userProgress.forEach((item) => {
              progressMap[item.skill] = {
                status: item.status,
                progress: item.progress,
                completedTopics: item.completed_topics || [],
              };
            });
            if (Object.keys(progressMap).length > 0) {
              setLearningProgress((prev) => ({ ...prev, ...progressMap }));
            }
          }
        }
      } catch (err) {
        console.warn('Backend skill gap error, utilizing client catalog fallback:', err.message);
        runClientFallbackAnalysis('Software Engineer', null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync learning progress to localStorage
  useEffect(() => {
    localStorage.setItem('careerpilot_skill_progress', JSON.stringify(learningProgress));
  }, [learningProgress]);

  // Client-side fallback analyzer ensuring 100% resilience
  const runClientFallbackAnalysis = (role, opportunity) => {
    const extractedSkills = extractSkillsFromProfile(profile);
    const requiredList = [
      { name: 'Data Structures & Algorithms', importance: 'Critical', category: 'Core', prereqs: [] },
      { name: 'Python', importance: 'Critical', category: 'Language', prereqs: [] },
      { name: 'C++', importance: 'High', category: 'Language', prereqs: [] },
      { name: 'SQL', importance: 'High', category: 'Database', prereqs: [] },
      { name: 'REST APIs', importance: 'High', category: 'Development', prereqs: ['Python'] },
      { name: 'Docker', importance: 'Critical', category: 'DevOps', prereqs: [] },
      { name: 'System Design', importance: 'High', category: 'Engineering', prereqs: ['REST APIs', 'SQL'] },
      { name: 'Redis', importance: 'Medium', category: 'Caching', prereqs: ['SQL'] },
      { name: 'AWS', importance: 'Medium', category: 'Cloud', prereqs: ['Docker'] },
    ];

    const matched = [];
    const missing = [];
    let score = 0;

    requiredList.forEach((req) => {
      const has = extractedSkills.some((s) => skillsMatch(s, req.name));
      if (has) {
        matched.push({ name: req.name, category: req.category, importance: req.importance, status: 'MATCHED' });
        score += req.importance === 'Critical' ? 25 : 15;
      } else {
        missing.push({
          name: req.name,
          category: req.category,
          importance: req.importance,
          priority: req.importance,
          status: 'MISSING',
          estimatedEffort: '1–2 weeks',
          whyLearn: `Essential foundational technology for modern ${role} workflows.`,
          whyMatters: `Elevates your resume from academic theory to commercial production readiness.`,
          resources: VERIFIED_RESOURCES.filter((r) => skillsMatch(r.skill, req.name)),
          project: PRACTICAL_PROJECTS[req.name] || PRACTICAL_PROJECTS.Docker,
          topics: TOPIC_SEQUENCES[req.name] || [
            { level: 1, title: 'Fundamentals', topics: ['Core Concepts', 'Syntax & Setup'] },
            { level: 2, title: 'Development', topics: ['Building Real Apps', 'Best Practices'] },
            { level: 3, title: 'Production', topics: ['Optimization', 'Deployment'] },
          ],
        });
      }
    });

    const finalScore = Math.min(Math.max(score, 20), 95);
    const nowSkills = missing.filter((m) => m.priority === 'Critical');
    const nextSkills = missing.filter((m) => m.priority === 'High');
    const afterSkills = missing.filter((m) => m.priority === 'Medium' || m.priority === 'Low');

    setAnalysisData({
      targetRole: role,
      roleDescription: 'Develop reliable, scalable software solutions by mastering core computer science foundations, algorithms, and production engineering.',
      readinessScore: finalScore,
      readinessTier: finalScore >= 80 ? 'Interview Ready' : finalScore >= 60 ? 'Strong Contender' : 'Building Foundations',
      stats: {
        totalRequired: requiredList.length,
        matchedCount: matched.length,
        partialCount: 0,
        missingCount: missing.length,
      },
      matchedSkills: matched,
      partialSkills: [],
      missingSkills: missing,
      prioritySpotlight: [...nowSkills, ...nextSkills].slice(0, 4),
      roadmap: {
        now: nowSkills.length > 0 ? nowSkills : missing.slice(0, 1),
        next: nextSkills.length > 0 ? nextSkills : missing.slice(1, 3),
        afterThat: afterSkills,
        capstoneProject: PRACTICAL_PROJECTS.Docker,
      },
      futureSkills: [
        { name: 'System Design & Distributed Systems', reason: 'Critical for high-volume backend microservices.', category: 'Architecture', badge: 'Recommended Future Skill' },
        { name: 'Cloud Native AWS / Serverless', reason: 'Deploying zero-cold-start cloud APIs globally.', category: 'Cloud', badge: 'Recommended Future Skill' },
        { name: 'AI-Assisted Development', reason: 'Accelerating test creation and boilerplate velocity with LLMs.', category: 'AI Tools', badge: 'Recommended Future Skill' },
      ],
    });
  };

  const extractSkillsFromProfile = (prof) => {
    if (!prof?.skills) return ['Python', 'C++', 'SQL', 'React', 'Flask', 'MongoDB', 'Git'];
    const list = [];
    Object.values(prof.skills).forEach((cat) => {
      if (Array.isArray(cat?.value)) list.push(...cat.value);
      else if (Array.isArray(cat)) list.push(...cat);
    });
    return list.length > 0 ? list : ['Python', 'C++', 'SQL', 'React', 'Flask', 'MongoDB', 'Git'];
  };

  // Re-run analysis on target role change
  const handleRoleChange = async (newRole) => {
    setTargetRole(newRole);
    setAnalyzing(true);
    try {
      const res = await analyzeSkillGap({
        targetRole: newRole,
        targetOpportunity: targetOpportunity ? { name: targetOpportunity } : null,
      });
      if (res?.data) {
        setAnalysisData(res.data);
        toast.info(`Updated skill gap for ${newRole}`);
      }
    } catch (e) {
      runClientFallbackAnalysis(newRole, targetOpportunity);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCustomRoleSubmit = (e) => {
    e.preventDefault();
    if (customRoleInput.trim()) {
      handleRoleChange(customRoleInput.trim());
      setIsCustomRole(false);
    }
  };

  // Open Skill Detail Drawer
  const handleOpenSkillDetail = (skillItem) => {
    // Merge topics & project if not already populated
    const norm = normalizeSkill(skillItem.name);
    const enriched = {
      ...skillItem,
      topics: skillItem.topics || TOPIC_SEQUENCES[norm] || [
        { level: 1, title: 'Fundamentals', topics: ['Core Concepts & Architecture', 'Syntax & Setup'] },
        { level: 2, title: 'Development', topics: ['Practical Application Build', 'Best Practices & Debugging'] },
        { level: 3, title: 'Production', topics: ['Performance Tuning', 'Deployment & CI/CD'] },
      ],
      resources: skillItem.resources?.length > 0 ? skillItem.resources : VERIFIED_RESOURCES.filter((r) => skillsMatch(r.skill, norm)),
      project: skillItem.project || PRACTICAL_PROJECTS[norm] || PRACTICAL_PROJECTS.Docker,
    };
    setSelectedSkill(enriched);
    setDrawerOpen(true);
  };

  // Progress Update Handlers
  const handleToggleTopic = async (skillName, topic) => {
    const current = learningProgress[skillName] || { status: 'learning', progress: 0, completedTopics: [] };
    const topics = current.completedTopics || [];
    const hasTopic = topics.includes(topic);
    const updatedTopics = hasTopic ? topics.filter((t) => t !== topic) : [...topics, topic];

    // Compute progress % based on total topics in sequence
    const allTopics = selectedSkill?.topics?.flatMap((t) => t.topics) || [];
    const totalCount = allTopics.length || 5;
    const newProgress = Math.min(Math.round((updatedTopics.length / totalCount) * 100), 100);
    const newStatus = newProgress === 100 ? 'completed' : newProgress > 0 ? 'learning' : 'not_started';

    const updatedData = {
      ...current,
      status: newStatus,
      progress: newProgress,
      completedTopics: updatedTopics,
    };

    setLearningProgress((prev) => ({ ...prev, [skillName]: updatedData }));

    try {
      await updateLearningProgress(skillName, updatedData);
    } catch (err) {
      // Local storage already synced via useEffect
    }

    if (newProgress === 100) {
      toast.success(`🎉 Congratulations on completing ${skillName}!`);
    }
  };

  const handleSetSkillStatus = async (skillName, status) => {
    const current = learningProgress[skillName] || { status: 'not_started', progress: 0, completedTopics: [] };
    const newProgress = status === 'completed' ? 100 : status === 'learning' ? Math.max(current.progress, 25) : 0;

    const updatedData = {
      ...current,
      status,
      progress: newProgress,
    };

    setLearningProgress((prev) => ({ ...prev, [skillName]: updatedData }));
    toast.info(`Marked ${skillName} as ${status.replace('_', ' ')}`);

    try {
      await updateLearningProgress(skillName, updatedData);
    } catch (err) {}
  };

  // Add Skill to Student Profile
  const handleAddSkillToProfile = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const skillToAdd = newSkillName.trim();
    try {
      const updatedProfile = { ...profile };
      if (!updatedProfile.skills) updatedProfile.skills = {};
      if (!updatedProfile.skills[newSkillCategory]) {
        updatedProfile.skills[newSkillCategory] = { value: [], source: 'manual' };
      }
      const existing = updatedProfile.skills[newSkillCategory].value || [];
      if (!existing.includes(skillToAdd)) {
        updatedProfile.skills[newSkillCategory].value = [...existing, skillToAdd];
        await updateProfile(updatedProfile);
        setProfile(updatedProfile);
        toast.success(`Added ${skillToAdd} to your verified profile!`);
        handleRoleChange(targetRole);
      }
    } catch (err) {
      toast.error('Could not save skill to profile.');
    } finally {
      setNewSkillName('');
      setShowAddSkillModal(false);
    }
  };

  const studentSkillsList = extractSkillsFromProfile(profile);

  const timelineItems = React.useMemo(() => {
    if (!analysisData?.roadmap) return [];
    const items = [];
    ['now', 'next', 'afterThat'].forEach((stage) => {
      (analysisData.roadmap[stage] || []).forEach((sk) => {
        items.push({
          skillName: sk.name,
          priority: sk.priority ? sk.priority.toLowerCase() : (stage === 'now' ? 'high' : 'medium'),
          difficulty: stage === 'now' ? 'Foundational' : stage === 'next' ? 'Intermediate' : 'Advanced',
          whyImportant: sk.whyMatters || sk.whyLearn,
          estimatedHours: sk.estimatedHours || (stage === 'now' ? '12-16' : '20-25'),
          topics: TOPIC_SEQUENCES[sk.name]?.map((t) => t.title) || [
            `${sk.name} Core Architecture & Syntax`,
            `${sk.name} Practical Project Implementation`,
            `${sk.name} Performance & Production Deployment`,
          ],
        });
      });
    });
    return items;
  }, [analysisData]);

  const handleToggleTimelineTopic = (skillName, topicTitle) => {
    const current = learningProgress[skillName] || { status: 'learning', progress: 20, completedTopics: [] };
    const alreadyDone = (current.completedTopics || []).includes(topicTitle);
    const updatedTopics = alreadyDone
      ? current.completedTopics.filter((t) => t !== topicTitle)
      : [...(current.completedTopics || []), topicTitle];

    const totalTopics = (TOPIC_SEQUENCES[skillName]?.length) || 3;
    const newProgress = Math.min(100, Math.round((updatedTopics.length / totalTopics) * 100));
    const newStatus = newProgress === 100 ? 'completed' : newProgress > 0 ? 'learning' : 'not_started';

    const updatedData = {
      ...current,
      status: newStatus,
      progress: newProgress,
      completedTopics: updatedTopics,
    };

    setLearningProgress((prev) => {
      const next = { ...prev, [skillName]: updatedData };
      try {
        localStorage.setItem('careerpilot_skill_progress', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    updateLearningProgress(skillName, updatedData).catch(() => {});
  };


  return (
    <PageContainer style={{ maxWidth: '1440px' }}>
      {/* =====================================================================
          1. HEADER & TARGET ROLE SELECTION
          ===================================================================== */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <Badge variant="purple" size="sm" dot>
                Personalized Learning Engine
              </Badge>
              {analyzing && (
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={12} className="spin" /> Recalculating...
                </span>
              )}
            </div>
            <h1 className="text-h1" style={{ margin: 0, color: 'var(--text-primary)' }}>
              Skill Gap &amp; Learning Roadmap
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.35rem', maxWidth: '680px' }}>
              Discover exact missing competencies for your target career role, organized into a priority timeline with verified resources and practical projects.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="md"
              icon={<Plus size={16} />}
              onClick={() => setShowAddSkillModal(true)}
            >
              Add Skill to Profile
            </Button>
          </div>
        </div>

        {/* Target Role & Target Opportunity Control Bar */}
        <Card variant="raised" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 220px', minWidth: 0 }}>
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
                  flexShrink: 0,
                }}
              >
                <Target size={22} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  Target Career Role
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px', minWidth: 0 }}>
                  {!isCustomRole ? (
                    <select
                      value={targetRole}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomRole(true);
                        } else {
                          handleRoleChange(e.target.value);
                        }
                      }}
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--surface-raised)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.35rem 0.65rem',
                        cursor: 'pointer',
                        outline: 'none',
                        maxWidth: '100%',
                      }}
                    >
                      {CANONICAL_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                      <option value="__custom__">+ Enter Custom Role...</option>
                    </select>
                  ) : (
                    <form onSubmit={handleCustomRoleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="e.g. Distributed Systems Engineer"
                        value={customRoleInput}
                        onChange={(e) => setCustomRoleInput(e.target.value)}
                        autoFocus
                        style={{
                          fontSize: '0.875rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--primary)',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          maxWidth: '180px',
                        }}
                      />
                      <Button variant="primary" size="sm" type="submit">
                        Set
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setIsCustomRole(false)}>
                        Cancel
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Target Opportunity Input */}
            <div style={{ flex: '1 1 200px', minWidth: 0, width: '100%' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                Target Opportunity (Optional)
              </span>
              <div style={{ marginTop: '2px' }}>
                <input
                  type="text"
                  placeholder="e.g. Stripe SDE Intern, Google 2026..."
                  value={targetOpportunity}
                  onChange={(e) => setTargetOpportunity(e.target.value)}
                  onBlur={() => targetOpportunity && handleRoleChange(targetRole)}
                  style={{
                    width: '100%',
                    fontSize: '0.875rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-raised)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* =====================================================================
          2. SKILL OVERVIEW & COMPETENCY RADAR (RECHARTS)
          ===================================================================== */}
      {analysisData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <Card variant="raised" style={{ borderTop: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <CardContent style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Badge variant={analysisData.readinessScore >= 80 ? 'success' : analysisData.readinessScore >= 60 ? 'primary' : 'warning'} size="sm">
                  {analysisData.readinessTier}
                </Badge>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Market Benchmark Fit
                </span>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0' }}>
                {analysisData.targetRole} Readiness: {analysisData.readinessScore}%
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0.4rem 0 1.25rem' }}>
                {analysisData.roleDescription}
              </p>

              {/* Counter statistics & gauge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success)' }}>
                      {analysisData.stats.matchedCount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Matched Skills</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--warning)' }}>
                      {analysisData.stats.missingCount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Missing Gaps</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {analysisData.stats.totalRequired}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Required Skills</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <CircularProgress
                    value={analysisData.readinessScore}
                    size={100}
                    strokeWidth={9}
                    variant={analysisData.readinessScore >= 80 ? 'success' : analysisData.readinessScore >= 60 ? 'primary' : 'warning'}
                  />
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '0.45rem' }}>
                    BENCHMARK
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recharts Radar Chart */}
          <SkillRadarChart
            targetRole={targetRole}
            studentSkills={studentSkillsList}
          />
        </div>
      )}


      {/* =====================================================================
          3. SKILL GAP COMPARISON (MATCHED vs MISSING)
          ===================================================================== */}
      {analysisData && (
        <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
          {/* Matched Skills */}
          <Card variant="default">
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <CheckCircle2 size={18} color="var(--success)" />
                <CardTitle style={{ fontSize: '1.05rem' }}>
                  Verified Skills in Your Profile ({analysisData.matchedSkills.length})
                </CardTitle>
              </div>
              <Badge variant="success" size="sm">MATCHED</Badge>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Skills already extracted from your verified resume or added manually.
              </p>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                {analysisData.matchedSkills.map((sk) => (
                  <Badge key={sk.name} variant="success" size="md">
                    ✓ {sk.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Missing Skills */}
          <Card variant="default">
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <AlertTriangle size={18} color="var(--warning)" />
                <CardTitle style={{ fontSize: '1.05rem' }}>
                  High-Impact Missing Skills ({analysisData.missingSkills.length})
                </CardTitle>
              </div>
              <Badge variant="warning" size="sm">ACTION REQUIRED</Badge>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Click any skill to view why it matters, topic sequence, and project blueprints.
              </p>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                {analysisData.missingSkills.map((sk) => (
                  <button
                    key={sk.name}
                    type="button"
                    onClick={() => handleOpenSkillDetail(sk)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                    title={`Click for ${sk.name} learning roadmap`}
                  >
                    <Badge variant={sk.priority === 'Critical' ? 'danger' : 'warning'} size="md">
                      + {sk.name} <span style={{ opacity: 0.75, fontSize: '0.7rem' }}>({sk.priority})</span>
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* =====================================================================
          4. PRIORITY SKILLS SPOTLIGHT (TOP 3-5)
          ===================================================================== */}
      {analysisData?.prioritySpotlight?.length > 0 && (
        <div style={{ marginBottom: '2.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <Zap size={20} color="var(--primary)" />
            <h3 className="text-h3" style={{ margin: 0, fontSize: '1.2rem' }}>
              Top Priority Skills to Focus on First
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {analysisData.prioritySpotlight.map((skill, idx) => {
              const currentProgress = learningProgress[skill.name]?.progress || 0;
              const isLearning = learningProgress[skill.name]?.status === 'learning';
              const isDone = learningProgress[skill.name]?.status === 'completed';

              return (
                <Card
                  key={skill.name}
                  variant="raised"
                  className="hover-lift"
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  onClick={() => handleOpenSkillDetail(skill)}
                >
                  <CardContent style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        #{idx + 1} RECOMMENDED
                      </span>
                      <PriorityBadge priority={skill.priority} size="sm" />
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.4rem' }}>
                      {skill.name}
                    </h4>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 0.85rem' }}>
                      {skill.whyLearn}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={13} /> {skill.estimatedEffort || '1–2 weeks'}
                      </span>
                      <span>Level: {skill.recommendedLevel || 'Intermediate'}</span>
                    </div>

                    <ProgressBar value={currentProgress} size="sm" showPercentage={false} />
                  </CardContent>

                  <div
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderTop: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isDone ? 'var(--success)' : isLearning ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {isDone ? '✓ Completed' : isLearning ? `In Progress (${currentProgress}%)` : 'Not Started'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      Roadmap <ChevronRight size={13} />
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          5. PERSONALIZED LEARNING ROADMAP (INTERACTIVE TIMELINE & MILESTONES)
          ===================================================================== */}
      {analysisData?.roadmap && (
        <div style={{ marginBottom: '3rem' }}>
          <InteractiveLearningTimeline
            roadmap={timelineItems}
            learningProgress={learningProgress}
            onToggleTopic={handleToggleTimelineTopic}
            onOpenSkillDrawer={(skName) => {
              const matched = analysisData.missingSkills.find((s) => s.name === skName) || { name: skName };
              handleOpenSkillDetail(matched);
            }}
          />

          {/* Step 4: CAPSTONE PRACTICAL PROJECT */}
          {analysisData.roadmap.capstoneProject && (
            <Card variant="raised" style={{ borderLeft: '4px solid var(--success)', marginTop: '1.5rem' }}>
              <CardContent style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Badge variant="success" size="sm">STAGE 4: CAPSTONE PRACTICE PROJECT</Badge>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Tie all newly learned skills into a portfolio deliverable
                  </span>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.35rem' }}>
                    {analysisData.roadmap.capstoneProject.title}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                    {analysisData.roadmap.capstoneProject.description}
                  </p>
                  <div style={{ fontSize: '0.78125rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Key Technical Deliverables:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {analysisData.roadmap.capstoneProject.requirements?.map((req, rIdx) => (
                      <li key={rIdx}>{req}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}


      {/* =====================================================================
          6. RECOMMENDED VERIFIED RESOURCES
          ===================================================================== */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <BookOpen size={20} color="var(--primary)" />
          <div>
            <h3 className="text-h3" style={{ margin: 0, fontSize: '1.25rem' }}>
              Verified Learning Resources
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
              Curated official documentation and reputable open-source handbooks. Zero fabricated links or instructors.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {VERIFIED_RESOURCES.slice(0, 6).map((res) => (
            <Card key={res.id} variant="raised" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <CardContent style={{ padding: '1.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <Badge variant="primary" size="sm">{res.skill}</Badge>
                  <span style={{ fontSize: '0.71875rem', fontWeight: 700, color: 'var(--success)' }}>
                    {res.isFree ? 'Free' : 'Paid'}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.975rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.35rem', lineHeight: 1.35 }}>
                  {res.title}
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.65rem' }}>
                  By {res.provider} • {res.type}
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 0.85rem' }}>
                  {res.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>⏱ ~{res.estimatedHours} hours</span>
                  <span>Level: {res.difficulty}</span>
                </div>
              </CardContent>

              <div style={{ padding: '0.85rem 1.35rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', width: '100%', display: 'block' }}
                >
                  <Button variant="secondary" size="sm" style={{ width: '100%' }} icon={<ExternalLink size={14} />}>
                    Open Resource ↗
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* =====================================================================
          7. PRACTICAL PROJECTS BLUEPRINTS
          ===================================================================== */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <FolderGit2 size={20} color="var(--primary)" />
          <div>
            <h3 className="text-h3" style={{ margin: 0, fontSize: '1.25rem' }}>
              Practical Practice Projects
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
              Hands-on projects designed to demonstrate capability on your resume and in technical interview deep-dives.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {Object.entries(PRACTICAL_PROJECTS).slice(0, 3).map(([skillKey, proj]) => (
            <Card key={skillKey} variant="raised" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <Badge variant="purple" size="sm">{skillKey}</Badge>
                <Badge variant="neutral" size="sm">{proj.estimatedDays}</Badge>
              </div>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.4rem' }}>
                {proj.title}
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 0.85rem' }}>
                {proj.description}
              </p>

              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Requirements:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                {proj.requirements.map((req, rIdx) => (
                  <div key={rIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 800 }}>•</span>
                    <span>{req}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                <strong>Deliverable:</strong> {proj.deliverable}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* =====================================================================
          8. LEARNING PROGRESS TRACKER
          ===================================================================== */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <ListTodo size={20} color="var(--primary)" />
          <div>
            <h3 className="text-h3" style={{ margin: 0, fontSize: '1.25rem' }}>
              Your Active Learning Progress
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
              Track completed topics and milestones across your target skill roadmap.
            </p>
          </div>
        </div>

        <Card variant="raised" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {Object.entries(learningProgress).map(([skName, prog]) => (
              <div
                key={skName}
                style={{
                  padding: '1.15rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{skName}</strong>
                    <span style={{ marginLeft: '0.65rem', fontSize: '0.75rem', fontWeight: 700, color: prog.status === 'completed' ? 'var(--success)' : 'var(--primary)' }}>
                      {prog.status === 'completed' ? '✓ Completed' : 'In Progress'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                      variant={prog.status === 'learning' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => handleSetSkillStatus(skName, 'learning')}
                    >
                      Learning
                    </Button>
                    <Button
                      variant={prog.status === 'completed' ? 'success' : 'secondary'}
                      size="sm"
                      onClick={() => handleSetSkillStatus(skName, 'completed')}
                    >
                      {prog.status === 'completed' ? '✓ Completed' : 'Mark Complete'}
                    </Button>
                  </div>
                </div>

                <ProgressBar
                  value={prog.progress}
                  variant={prog.status === 'completed' ? 'success' : 'primary'}
                  size="md"
                  label={`${prog.completedTopics?.length || 0} Topics Completed`}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* =====================================================================
          9. FUTURE SKILLS SECTION
          ===================================================================== */}
      {analysisData?.futureSkills?.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <Sparkles size={20} color="var(--accent)" />
            <div>
              <h3 className="text-h3" style={{ margin: 0, fontSize: '1.25rem' }}>
                Recommended Future Skills
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                Forward-looking capabilities that distinguish high-performing engineers. These are recommended future milestones, not immediate prerequisites.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {analysisData.futureSkills.map((fs) => (
              <Card key={fs.name} variant="raised" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <Badge variant="accent" size="sm">
                    Recommended Future Skill
                  </Badge>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{fs.category}</span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.35rem' }}>
                  {fs.name}
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  {fs.reason}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          10. INTERACTIVE SKILL DETAIL DRAWER
          ===================================================================== */}
      {selectedSkill && (
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={selectedSkill.name}
          subtitle={`Personalized Learning & Implementation Roadmap`}
          width="560px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <Button
                variant={learningProgress[selectedSkill.name]?.status === 'completed' ? 'success' : 'primary'}
                size="md"
                onClick={() => {
                  const currentStatus = learningProgress[selectedSkill.name]?.status;
                  handleSetSkillStatus(selectedSkill.name, currentStatus === 'completed' ? 'learning' : 'completed');
                }}
              >
                {learningProgress[selectedSkill.name]?.status === 'completed' ? '✓ Completed' : 'Start Learning'}
              </Button>
              <Button variant="ghost" size="md" onClick={() => setDrawerOpen(false)}>
                Close
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '1rem' }}>
            {/* Priority & Metadata Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <PriorityBadge priority={selectedSkill.priority} size="md" />
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>⏱ Effort: {selectedSkill.estimatedEffort || '1–2 weeks'}</span>
                <span>Target: {selectedSkill.recommendedLevel || 'Intermediate'}</span>
              </div>
            </div>

            {/* Why learn this? */}
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                Why learn this?
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: '0 0 0.65rem', lineHeight: 1.5 }}>
                {selectedSkill.whyLearn}
              </p>

              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                Why it matters for your goal:
              </div>
              <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                {selectedSkill.whyMatters}
              </p>
            </div>

            {/* 5-Level Learning Sequence */}
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Structured Learning Progression
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedSkill.topics?.map((lvl) => (
                  <div
                    key={lvl.level}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Level {lvl.level} — {lvl.title}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {lvl.topics.map((tpc) => {
                        const isChecked = learningProgress[selectedSkill.name]?.completedTopics?.includes(tpc);

                        return (
                          <label
                            key={tpc}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.8125rem',
                              color: isChecked ? 'var(--text-muted)' : 'var(--text-primary)',
                              textDecoration: isChecked ? 'line-through' : 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={!!isChecked}
                              onChange={() => handleToggleTopic(selectedSkill.name, tpc)}
                              style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                            />
                            <span>{tpc}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Resources */}
            {selectedSkill.resources?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  Recommended Verified Resources
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedSkill.resources.map((res) => (
                    <div
                      key={res.title}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--surface-raised)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {res.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {res.provider} • {res.type} • {res.isFree ? 'Free' : 'Paid'}
                        </div>
                      </div>
                      <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <Button variant="secondary" size="sm" icon={<ExternalLink size={13} />}>
                          Open
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practice Project */}
            {selectedSkill.project && (
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Practice Project
                </div>
                <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {selectedSkill.project.title}
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem', lineHeight: 1.4 }}>
                    {selectedSkill.project.description}
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedSkill.project.requirements?.slice(0, 3).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* =====================================================================
          11. ADD SKILL TO PROFILE MODAL
          ===================================================================== */}
      <Modal
        isOpen={showAddSkillModal}
        onClose={() => setShowAddSkillModal(false)}
        title="Add Skill to Your Profile"
      >
        <form onSubmit={handleAddSkillToProfile}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Skill Name
            </label>
            <Input
              placeholder="e.g. Docker, TypeScript, Redis..."
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Category
            </label>
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="programmingLanguages">Programming Languages</option>
              <option value="technical">Technical Core</option>
              <option value="frameworks">Frameworks &amp; Libraries</option>
              <option value="databases">Databases &amp; Caching</option>
              <option value="cloud">Cloud &amp; DevOps</option>
              <option value="tools">Tools &amp; Infrastructure</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="secondary" onClick={() => setShowAddSkillModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save to Profile
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
