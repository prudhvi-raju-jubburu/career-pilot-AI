import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Layers,
  Eye,
  Check,
  X,
  Plus,
  Sun,
  Moon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { applicationService } from '../services/applicationService';
import { mockTestService } from '../services/mockTestService';
import Button from '../components/ui/Button';
import './MockTestProctoredPage.css';

const CANONICAL_CATEGORIES = [
  { id: 'tech_mcq', name: 'Technical MCQs', desc: 'Core programming, languages, data structures, concurrency & architecture' },
  { id: 'prog_lang', name: 'Programming Language Fundamentals', desc: 'Core language mechanics, memory models, runtime internals & OOP' },
  { id: 'dsa', name: 'Data Structures & Algorithms', desc: 'Arrays, hash tables, binary search trees, graph traversals & dynamic programming' },
  { id: 'sql_db', name: 'SQL & Databases', desc: 'Relational schema design, complex JOINs, B-Tree indexing & ACID transactions' },
  { id: 'os_net', name: 'Operating Systems, Networking, and DBMS', desc: 'Processes vs threads, deadlock prevention, TCP 3-way handshake & virtual memory' },
  { id: 'job_tech', name: 'Job-Specific Technologies', desc: 'Containerization (Docker), caching (Redis), RESTful API design & cloud deployments' },
  { id: 'aptitude', name: 'Aptitude and Logical Reasoning', desc: 'Quantitative speed math, set theory, permutation/combination & logic puzzles' },
  { id: 'resume_proj', name: 'Resume and Project Concepts', desc: 'Production engineering patterns, authentication security, cursor pagination & scaling' }
];

export default function MockTestProctoredPage() {
  const { appId, testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  // Theme State: 'dark' | 'light'
  const [theme, setTheme] = useState(() => localStorage.getItem('cp_proc_theme') || 'dark');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('cp_proc_theme', nextTheme);
  };

  // Core application & test state
  const [application, setApplication] = useState(null);
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState('loading'); // 'lobby' | 'active' | 'result'
  
  // Lobby / Configuration state (10 to 25 questions default)
  const [availableCategories, setAvailableCategories] = useState(CANONICAL_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('Technical MCQs');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10);
  const [isTimed, setIsTimed] = useState(true);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [isStarting, setIsStarting] = useState(false);

  // Active exam taking state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(900);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [paletteFilter, setPaletteFilter] = useState('all'); // 'all' | 'answered' | 'unanswered' | 'flagged'

  // Proctored Security & Focus monitoring
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusInfractions, setFocusInfractions] = useState(0);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [showInfractionAlert, setShowInfractionAlert] = useState(false);

  // Results state
  const [resultData, setResultData] = useState(null);
  const [resultFilter, setResultFilter] = useState('all'); // 'all' | 'correct' | 'incorrect' | 'skipped'
  const [addingTopicRoadmap, setAddingTopicRoadmap] = useState(null);
  const [addedTopics, setAddedTopics] = useState(new Set());

  // Confetti trigger ref
  const confettiFiredRef = useRef(false);

  // Load application and test attempt on mount
  useEffect(() => {
    let active = true;

    const initializeData = async () => {
      setLoading(true);
      try {
        // 1. Fetch application info for candidate context
        const apps = await applicationService.getApplications();
        const currentApp = Array.isArray(apps) ? apps.find(a => a.id === appId) : null;
        if (active && currentApp) {
          setApplication(currentApp);
        }

        // 2. If testId is provided in URL, load the test attempt or result
        if (testId) {
          try {
            const attempt = await mockTestService.getAttempt(appId, testId);
            if (!active) return;

            if (attempt.status === 'submitted' || attempt.status === 'graded') {
              // Test is already completed, fetch full results
              const res = await mockTestService.getResult(appId, testId);
              if (active) {
                setResultData(res);
                setViewState('result');
              }
            } else {
              // Test is active / in_progress
              setActiveAttempt(attempt);
              setAnswers(attempt.submitted_answers || {});
              const remaining = attempt.remaining_seconds != null
                ? attempt.remaining_seconds
                : (attempt.is_timed ? (attempt.time_limit_minutes || 15) * 60 : null);
              setRemainingSeconds(remaining);
              setTotalTimeSeconds((attempt.time_limit_minutes || 15) * 60);
              setViewState('active');
            }
          } catch (testErr) {
            console.warn('Could not load specified test attempt:', testErr);
            toast.error('Test session not found or access expired.');
            setViewState('lobby');
          }
        } else {
          // No testId: load lobby with categories and previous history
          try {
            const lobbyData = await mockTestService.getMockTests(appId);
            if (active && lobbyData.categories?.length) {
              setAvailableCategories(lobbyData.categories);
            }
          } catch (e) {
            console.warn('Using canonical categories:', e);
          }
          if (active) setViewState('lobby');
        }
      } catch (err) {
        console.error('Failed to initialize proctored session:', err);
        toast.error('Could not load proctored assessment.');
      } finally {
        if (active) setLoading(false);
      }
    };

    initializeData();
    return () => { active = false; };
  }, [appId, testId]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Window Focus / Blur Proctoring Monitor
  useEffect(() => {
    if (viewState !== 'active') return;

    const handleBlur = () => {
      setFocusInfractions(prev => {
        const next = prev + 1;
        setShowInfractionAlert(true);
        setTimeout(() => setShowInfractionAlert(false), 5000);
        return next;
      });
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [viewState]);

  // Submission handler (wrapped in useCallback for timer dependencies)
  const handleFinalSubmit = useCallback(async (isAutoExpired = false) => {
    if (isSubmitting || !activeAttempt) return;
    setIsSubmitting(true);
    setShowSubmitModal(false);

    try {
      const result = await mockTestService.submitMockTest(appId, activeAttempt.id, answers);
      setResultData(result);
      setViewState('result');

      // Update URL to test result view
      navigate(`/applications/${appId}/mock-test/${activeAttempt.id}`, { replace: true });

      if (isAutoExpired) {
        toast.info('Test timer expired. Your answers have been automatically graded.');
      } else {
        toast.success(`Assessment completed! Score: ${result.percentage}%`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to submit test.');
    } finally {
      setIsSubmitting(false);
    }
  }, [activeAttempt, answers, appId, isSubmitting, navigate, toast]);

  // Server-Authoritative Timer Countdown
  useEffect(() => {
    if (viewState !== 'active' || !activeAttempt?.is_timed || remainingSeconds === null) {
      return;
    }

    if (remainingSeconds <= 0) {
      handleFinalSubmit(true);
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [viewState, activeAttempt?.is_timed, remainingSeconds, handleFinalSubmit]);

  // Confetti celebration on successful result
  useEffect(() => {
    if (viewState === 'result' && resultData && !confettiFiredRef.current) {
      if (resultData.percentage >= 70) {
        confettiFiredRef.current = true;
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      }
    }
  }, [viewState, resultData]);

  // Start test from lobby
  const handleStartFromLobby = async () => {
    setIsStarting(true);
    try {
      const config = {
        category: selectedCategory,
        difficulty: selectedDifficulty,
        question_count: selectedQuestionCount,
        is_timed: isTimed,
        time_limit_minutes: timeLimitMinutes
      };
      const attempt = await mockTestService.startMockTest(appId, config);
      setActiveAttempt(attempt);
      setAnswers(attempt.submitted_answers || {});
      const rem = attempt.remaining_seconds != null
        ? attempt.remaining_seconds
        : (isTimed ? timeLimitMinutes * 60 : null);
      setRemainingSeconds(rem);
      setTotalTimeSeconds(timeLimitMinutes * 60);
      setCurrentIndex(0);
      setFlaggedQuestions(new Set());
      setViewState('active');

      // Update URL with newly created test ID
      navigate(`/applications/${appId}/mock-test/${attempt.id}`, { replace: true });
      toast.success(`Proctored assessment session initialized with ${attempt.questions?.length || selectedQuestionCount} questions.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not initialize test session.');
    } finally {
      setIsStarting(false);
    }
  };

  // Option selection with background auto-save
  const handleSelectOption = async (questionId, optionText) => {
    const updatedAnswers = { ...answers, [questionId]: optionText };
    setAnswers(updatedAnswers);

    if (activeAttempt) {
      try {
        await mockTestService.saveAnswers(appId, activeAttempt.id, { [questionId]: optionText });
        const now = new Date();
        setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (e) {
        console.warn('Background auto-save ping failed:', e);
      }
    }
  };

  // Flag / Bookmark question toggle
  const toggleFlagQuestion = (qIndex) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qIndex)) {
        next.delete(qIndex);
      } else {
        next.add(qIndex);
      }
      return next;
    });
  };

  // Clear answer for current question
  const handleClearAnswer = (questionId) => {
    if (!answers[questionId]) return;
    const copy = { ...answers };
    delete copy[questionId];
    setAnswers(copy);

    if (activeAttempt) {
      mockTestService.saveAnswers(appId, activeAttempt.id, { [questionId]: null }).catch(() => {});
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (viewState !== 'active' || !activeAttempt?.questions) return;
    const questions = activeAttempt.questions;
    const currentQ = questions[currentIndex];

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (['1', '2', '3', '4'].includes(e.key) && currentQ?.options) {
        const optIndex = parseInt(e.key, 10) - 1;
        if (currentQ.options[optIndex]) {
          handleSelectOption(currentQ.id, currentQ.options[optIndex]);
        }
      } else if (e.key.toLowerCase() === 'f') {
        toggleFlagQuestion(currentIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState, activeAttempt, currentIndex, answers]);

  // Add weak topic to roadmap
  const handleAddWeakTopic = async (topicName) => {
    if (!resultData?.id || addedTopics.has(topicName)) return;
    setAddingTopicRoadmap(topicName);
    try {
      await mockTestService.addWeakTopicToRoadmap(appId, resultData.id, topicName);
      setAddedTopics(prev => new Set(prev).add(topicName));
      toast.success(`"${topicName}" added to your application preparation roadmap!`);
    } catch (err) {
      toast.error('Failed to link topic to preparation roadmap.');
    } finally {
      setAddingTopicRoadmap(null);
    }
  };

  // Formatter for MM:SS
  const formatTime = (secs) => {
    if (secs == null || isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Questions and navigation helpers
  const questions = activeAttempt?.questions || [];
  const currentQ = questions[currentIndex];
  // Robust question prompt resolution across all possible schemas
  const currentPromptText = currentQ ? (currentQ.question_text || currentQ.question || currentQ.prompt || currentQ.title || 'Question prompt') : '';

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);
  const flaggedCount = flaggedQuestions.size;

  // Filtered palette indices
  const getFilteredQuestionIndices = () => {
    return questions.map((q, idx) => ({ q, idx })).filter(({ q, idx }) => {
      const isAnswered = !!answers[q.id];
      const isFlagged = flaggedQuestions.has(idx);
      if (paletteFilter === 'answered') return isAnswered;
      if (paletteFilter === 'unanswered') return !isAnswered;
      if (paletteFilter === 'flagged') return isFlagged;
      return true;
    });
  };

  // Loading Screen
  if (loading || viewState === 'loading') {
    return (
      <div className={`proc-page-container theme-${theme}`} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="proc-brand-icon" style={{ width: 48, height: 48, margin: '0 auto 1.25rem' }}>
            <Shield size={24} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--proc-ink-bright)', marginBottom: '0.5rem' }}>
            Initializing Proctored Assessment
          </div>
          <div style={{ color: 'var(--proc-ink-muted)', fontSize: '0.85rem' }}>
            Verifying cryptographic session tokens and loading question bank...
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: LOBBY & PRE-CHECK PORTAL
  // =========================================================================
  if (viewState === 'lobby') {
    return (
      <div className={`proc-page-container theme-${theme}`}>
        {/* Top Header */}
        <header className="proc-header">
          <div className="proc-brand">
            <button
              type="button"
              onClick={() => navigate(`/applications?appId=${appId}`)}
              style={{
                background: 'transparent',
                border: '1px solid var(--proc-border)',
                borderRadius: '8px',
                padding: '0.4rem 0.6rem',
                color: 'var(--proc-ink-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.8rem'
              }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <div className="proc-brand-icon">
              <Shield size={18} />
            </div>
            <div>
              <div className="proc-brand-title">CareerPilot AI Proctored Environment</div>
              <div className="proc-brand-sub">
                Candidate: {user?.name || user?.email || 'Applicant'} • Target: {application?.company_name} ({application?.job_title})
              </div>
            </div>
          </div>

          <div className="proc-status-cluster">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="proc-pill"
              style={{ cursor: 'pointer' }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
            >
              {theme === 'dark' ? <Sun size={13} color="#F59E0B" /> : <Moon size={13} color="#4F46E5" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <span className="proc-pill active">
              <span className="proc-dot"></span> System Ready
            </span>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="proc-pill"
              style={{ cursor: 'pointer' }}
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            </button>
          </div>
        </header>

        {/* Lobby Content */}
        <main style={{ maxWidth: '980px', margin: '2.5rem auto', padding: '0 1.5rem', width: '100%', boxSizing: 'border-box' }}>
          <div style={{
            background: 'var(--proc-bg-card)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--proc-border)',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: 'var(--proc-card-shadow)',
            animation: 'sectionFadeUp 0.35s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--proc-primary)'
              }}>
                <Award size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--proc-ink-bright)' }}>
                  Pre-Assessment Verification & Setup
                </h1>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--proc-ink-muted)' }}>
                  Select your test category, difficulty, and question count (10 to 25 questions). Once started, you will enter a full-screen, high-focus assessment environment.
                </p>
              </div>
            </div>

            {/* System Readiness Checklist */}
            <div style={{
              background: 'var(--proc-bg-card-subtle)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1.75rem',
              border: '1px solid var(--proc-border)'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--proc-ink-bright)', marginBottom: '0.65rem' }}>
                System Readiness Checklist
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--proc-emerald)' }}>
                  <CheckCircle2 size={16} /> Browser Lock & Focus Detection Ready
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--proc-emerald)' }}>
                  <CheckCircle2 size={16} /> Server-Authoritative Timer Active
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--proc-emerald)' }}>
                  <CheckCircle2 size={16} /> Continuous Background Answer Sync
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--proc-emerald)' }}>
                  <CheckCircle2 size={16} /> 200+ Verified Original Questions
                </div>
              </div>
            </div>

            {/* Category Selector */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--proc-ink-bright)', marginBottom: '0.65rem' }}>
                1. Select Subject Category
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                {availableCategories.map(cat => {
                  const isSel = selectedCategory === cat.name;
                  return (
                    <div
                      key={cat.id || cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className="proc-category-card"
                      style={{
                        background: isSel ? 'var(--proc-option-selected)' : 'var(--proc-bg-card-subtle)',
                        border: isSel ? '2px solid var(--proc-primary)' : '1px solid var(--proc-border)',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: isSel ? 'var(--proc-primary)' : 'var(--proc-ink-bright)', wordBreak: 'break-word' }}>
                          {cat.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--proc-ink-muted)', marginTop: '0.25rem', lineHeight: 1.4, wordBreak: 'break-word' }}>
                          {cat.desc || cat.description || 'Comprehensive evaluation across core industry patterns.'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--proc-ink-dim)', borderTop: '1px dashed var(--proc-border)', paddingTop: '0.35rem', marginTop: '0.35rem' }}>
                        <span>25 questions pool</span>
                        {isSel && <Check size={12} color="var(--proc-primary)" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assessment Parameters Grid: 10 to 25 questions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--proc-ink-bright)', marginBottom: '0.4rem' }}>
                  2. Difficulty Level
                </label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {['Easy', 'Medium', 'Hard'].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedDifficulty(lvl)}
                      style={{
                        flex: 1,
                        padding: '0.55rem',
                        borderRadius: '8px',
                        border: selectedDifficulty === lvl ? '1.5px solid var(--proc-primary)' : '1px solid var(--proc-border)',
                        background: selectedDifficulty === lvl ? 'var(--proc-primary)' : 'var(--proc-pill-bg)',
                        color: selectedDifficulty === lvl ? '#fff' : 'var(--proc-ink-bright)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--proc-ink-bright)', marginBottom: '0.4rem' }}>
                  3. Question Count (10 - 25 Qs)
                </label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[10, 15, 20, 25].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setSelectedQuestionCount(cnt)}
                      style={{
                        flex: 1,
                        padding: '0.55rem',
                        borderRadius: '8px',
                        border: selectedQuestionCount === cnt ? '1.5px solid var(--proc-primary)' : '1px solid var(--proc-border)',
                        background: selectedQuestionCount === cnt ? 'var(--proc-primary)' : 'var(--proc-pill-bg)',
                        color: selectedQuestionCount === cnt ? '#fff' : 'var(--proc-ink-bright)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cnt} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--proc-ink-bright)', marginBottom: '0.4rem' }}>
                  4. Assessment Timer
                </label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[15, 25, 45, 60].map(min => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => { setIsTimed(true); setTimeLimitMinutes(min); }}
                      style={{
                        flex: 1,
                        padding: '0.55rem',
                        borderRadius: '8px',
                        border: (isTimed && timeLimitMinutes === min) ? '1.5px solid var(--proc-primary)' : '1px solid var(--proc-border)',
                        background: (isTimed && timeLimitMinutes === min) ? 'var(--proc-primary)' : 'var(--proc-pill-bg)',
                        color: (isTimed && timeLimitMinutes === min) ? '#fff' : 'var(--proc-ink-bright)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {min} Mins
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--proc-border)', paddingTop: '1.25rem' }}>
              <Button
                variant="outline"
                onClick={() => navigate(`/applications?appId=${appId}`)}
                style={{ color: 'var(--proc-ink-muted)', borderColor: 'var(--proc-border)' }}
              >
                Cancel
              </Button>

              <button
                type="button"
                onClick={handleStartFromLobby}
                disabled={isStarting}
                style={{
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.75rem 1.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: isStarting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 4px 20px var(--proc-primary-glow)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Play size={16} fill="#fff" />
                <span>{isStarting ? 'Preparing Environment...' : `Enter Proctored Exam (${selectedQuestionCount} Questions)`}</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE PROCTORED EXAM TAKING
  // =========================================================================
  if (viewState === 'active' && activeAttempt) {
    const isFlaggedCurrent = flaggedQuestions.has(currentIndex);
    const isCriticalTime = remainingSeconds !== null && remainingSeconds < 120;

    return (
      <div className={`proc-page-container theme-${theme}`}>
        {/* Proctored Top Navigation Header */}
        <header className="proc-header">
          <div className="proc-brand">
            <div className="proc-brand-icon">
              <Shield size={18} />
            </div>
            <div>
              <div className="proc-brand-title">
                {activeAttempt.category} Assessment
              </div>
              <div className="proc-brand-sub">
                Candidate: {user?.name || user?.email || 'Applicant'} • {application?.company_name || 'Target Role'}
              </div>
            </div>
          </div>

          {/* Security Status Badges */}
          <div className="proc-status-cluster">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="proc-pill"
              style={{ cursor: 'pointer' }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
            >
              {theme === 'dark' ? <Sun size={13} color="#F59E0B" /> : <Moon size={13} color="#4F46E5" />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <span className="proc-pill active" title="Proctoring stream and focus detection active">
              <span className="proc-dot"></span> Proctor Active
            </span>

            <span className={`proc-pill ${focusInfractions > 0 ? 'warning' : ''}`} title="Screen focus monitoring active">
              <Eye size={12} /> Focus: {focusInfractions === 0 ? 'Clean' : `${focusInfractions} Blurs`}
            </span>

            {lastSavedTime && (
              <span className="proc-pill" style={{ fontSize: '0.7rem' }}>
                <Check size={11} color="var(--proc-emerald)" /> Saved {lastSavedTime}
              </span>
            )}
          </div>

          {/* Right Header: Timer & Finish Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {activeAttempt.is_timed && remainingSeconds !== null && (
              <div className={`proc-timer-box ${isCriticalTime ? 'critical-time' : ''}`}>
                <Clock size={16} color={isCriticalTime ? 'var(--proc-rose)' : 'var(--proc-primary)'} />
                <span className={`proc-timer-text ${isCriticalTime ? 'critical' : ''}`}>
                  {formatTime(remainingSeconds)}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="proc-pill"
              style={{ cursor: 'pointer', padding: '0.45rem' }}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.55rem 1.15rem',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)'
              }}
            >
              <CheckCircle2 size={15} /> Finish & Submit
            </button>
          </div>
        </header>

        {/* Focus Lost Alert Toast Bar */}
        {showInfractionAlert && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.95)',
            color: '#fff',
            padding: '0.5rem 1rem',
            textAlign: 'center',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <ShieldAlert size={16} /> Window focus lost! Focus lost events are logged in your proctored assessment report.
          </div>
        )}

        {/* Main Examination Workspace */}
        <div className="proc-main-layout">
          {/* Left Column: Interactive Question Card */}
          <div className="proc-question-panel">
            {currentQ ? (
              <div key={currentIndex} className="proc-question-animated-wrapper">
                {/* Question Metadata Bar */}
                <div className="proc-question-header">
                  <div className="proc-q-number">
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <span className="proc-q-topic-tag">{currentQ.topic || 'Core Concept'}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--proc-ink-dim)' }}>
                      Difficulty: {currentQ.difficulty || activeAttempt.difficulty}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => toggleFlagQuestion(currentIndex)}
                      className={`proc-flag-btn ${isFlaggedCurrent ? 'flagged' : ''}`}
                    >
                      <Flag size={13} fill={isFlaggedCurrent ? 'var(--proc-amber)' : 'none'} />
                      {isFlaggedCurrent ? 'Flagged for Review' : 'Mark for Review'}
                    </button>

                    {answers[currentQ.id] && (
                      <button
                        type="button"
                        onClick={() => handleClearAnswer(currentQ.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--proc-ink-dim)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Prompt: Guarantees prompt displays cleanly */}
                <div className="proc-prompt-text">
                  {currentPromptText}
                </div>

                {/* 4 Interactive Option Tiles */}
                <div className="proc-options-list">
                  {(currentQ.options || []).map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isSelected = answers[currentQ.id] === opt;
                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQ.id, opt)}
                        className={`proc-option-card ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="proc-option-badge">
                          {isSelected ? <Check size={16} /> : letter}
                        </div>
                        <div className="proc-option-text">
                          {opt}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Navigation Control Bar */}
                <div className="proc-controls-bar">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    style={{
                      background: 'var(--proc-pill-bg)',
                      border: '1px solid var(--proc-border)',
                      borderRadius: '10px',
                      color: currentIndex === 0 ? 'var(--proc-ink-dim)' : 'var(--proc-ink-bright)',
                      padding: '0.6rem 1.25rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ArrowLeft size={15} /> Previous
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--proc-ink-dim)' }}>
                    <span>Keys: [1-4] to select • [← →] to navigate</span>
                  </div>

                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIndex(prev => prev + 1)}
                      style={{
                        background: 'var(--proc-primary)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        padding: '0.6rem 1.4rem',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 10px var(--proc-primary-glow)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      Next <ArrowRight size={15} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(true)}
                      style={{
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        padding: '0.6rem 1.4rem',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 12px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      <CheckCircle2 size={15} /> Review & Submit
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--proc-ink-muted)' }}>
                No questions available for this assessment.
              </div>
            )}
          </div>

          {/* Right Column: Question Palette Sidebar */}
          <aside className="proc-sidebar">
            <div className="proc-palette-card">
              {/* Simulated Proctored Webcam / AI Monitor Preview */}
              <div className="proc-cam-preview">
                <div className="proc-cam-grid"></div>
                <div className="proc-cam-scanline"></div>
                <div style={{ textAlign: 'center', zIndex: 2 }}>
                  <ShieldCheck size={28} color="#34D399" style={{ margin: '0 auto 0.25rem' }} />
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                    Candidate Session Monitored
                  </div>
                </div>
                <div className="proc-cam-badge">
                  <span className="proc-dot" style={{ width: 5, height: 5 }}></span> AI Proctor Active
                </div>
              </div>

              {/* Progress Summary Metrics */}
              <div className="proc-palette-title">
                <span>Question Matrix</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--proc-emerald)' }}>
                  {answeredCount} / {questions.length} Answered
                </span>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem', background: 'var(--proc-bg-card-subtle)', padding: '0.2rem', borderRadius: '8px' }}>
                {[
                  { id: 'all', label: `All (${questions.length})` },
                  { id: 'answered', label: `Ans (${answeredCount})` },
                  { id: 'unanswered', label: `Unans (${unansweredCount})` },
                  { id: 'flagged', label: `Flagged (${flaggedCount})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPaletteFilter(tab.id)}
                    style={{
                      flex: 1,
                      padding: '0.3rem 0.2rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: paletteFilter === tab.id ? 'var(--proc-primary)' : 'transparent',
                      color: paletteFilter === tab.id ? '#fff' : 'var(--proc-ink-muted)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Question Number Palette Grid */}
              <div className="proc-palette-grid">
                {questions.map((q, idx) => {
                  const isCurrent = currentIndex === idx;
                  const isAns = !!answers[q.id];
                  const isFlag = flaggedQuestions.has(idx);

                  // Filter visibility
                  if (paletteFilter === 'answered' && !isAns) return null;
                  if (paletteFilter === 'unanswered' && isAns) return null;
                  if (paletteFilter === 'flagged' && !isFlag) return null;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`proc-palette-btn ${isCurrent ? 'current' : ''} ${isAns ? 'answered' : ''} ${isFlag ? 'flagged' : ''}`}
                    >
                      {idx + 1}
                      {isFlag && <div className="proc-palette-flag-pip"></div>}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--proc-ink-muted)', marginTop: '0.75rem', borderTop: '1px solid var(--proc-border)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(16, 185, 129, 0.5)' }}></div>
                  <span>Answered</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(245, 158, 11, 0.5)' }}></div>
                  <span>Flagged</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, border: '1px solid var(--proc-primary)' }}></div>
                  <span>Current</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--proc-border)' }}></div>
                  <span>Unanswered</span>
                </div>
              </div>

              {/* Big Submit Button */}
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                style={{
                  width: '100%',
                  marginTop: '1.25rem',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                <CheckCircle2 size={16} /> Submit Assessment
              </button>
            </div>
          </aside>
        </div>

        {/* ===================================================================
            SUBMISSION CONFIRMATION MODAL
           =================================================================== */}
        {showSubmitModal && (
          <div className="proc-modal-overlay">
            <div className="proc-modal-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--proc-primary)'
                }}>
                  <Shield size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--proc-ink-bright)' }}>
                    Finalize & Submit Assessment?
                  </h2>
                  <div style={{ fontSize: '0.78rem', color: 'var(--proc-ink-muted)' }}>
                    Once submitted, answers are graded deterministically against the verified answer key.
                  </div>
                </div>
              </div>

              {/* Summary Matrix */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.65rem',
                margin: '1.25rem 0',
                background: 'var(--proc-bg-card-subtle)',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid var(--proc-border)',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--proc-emerald)' }}>{answeredCount}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--proc-ink-muted)', fontWeight: 700 }}>Answered</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: unansweredCount > 0 ? 'var(--proc-rose)' : 'var(--proc-ink-muted)' }}>
                    {unansweredCount}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--proc-ink-muted)', fontWeight: 700 }}>Unanswered</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--proc-amber)' }}>{flaggedCount}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--proc-ink-muted)', fontWeight: 700 }}>Flagged</div>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: 'var(--proc-rose)',
                  fontSize: '0.78rem',
                  marginBottom: '1.5rem',
                  lineHeight: 1.4
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Warning:</strong> You have {unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}. Blank answers receive 0 points.
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button
                  variant="outline"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={isSubmitting}
                  style={{ color: 'var(--proc-ink-bright)', borderColor: 'var(--proc-border)' }}
                >
                  Return to Test
                </Button>

                <Button
                  variant="primary"
                  onClick={() => handleFinalSubmit(false)}
                  disabled={isSubmitting}
                  style={{
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    fontWeight: 800
                  }}
                >
                  {isSubmitting ? 'Grading Assessment...' : 'Confirm Submission'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: PROCTORED RESULTS & PERFORMANCE ANALYTICS
  // =========================================================================
  if (viewState === 'result' && resultData) {
    const isPassed = (resultData.percentage || 0) >= 70;
    const reviewQuestions = resultData.review_questions || [];
    const weakTopics = resultData.weak_topics || [];
    const topicBreakdown = resultData.topic_breakdown || {};

    const filteredReviewQuestions = reviewQuestions.filter(q => {
      if (resultFilter === 'correct') return q.is_correct;
      if (resultFilter === 'incorrect') return !q.is_correct && q.submitted_answer;
      if (resultFilter === 'skipped') return !q.submitted_answer;
      return true;
    });

    return (
      <div className={`proc-page-container theme-${theme}`}>
        {/* Top Header */}
        <header className="proc-header">
          <div className="proc-brand">
            <button
              type="button"
              onClick={() => navigate(`/applications?appId=${appId}`)}
              style={{
                background: 'transparent',
                border: '1px solid var(--proc-border)',
                borderRadius: '8px',
                padding: '0.4rem 0.6rem',
                color: 'var(--proc-ink-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.8rem'
              }}
            >
              <ArrowLeft size={14} /> Back to Application
            </button>
            <div className="proc-brand-icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="proc-brand-title">Proctored Assessment Report</div>
              <div className="proc-brand-sub">
                Candidate: {user?.name || user?.email || 'Applicant'} • {application?.company_name || 'Application'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="proc-pill"
              style={{ cursor: 'pointer' }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
            >
              {theme === 'dark' ? <Sun size={13} color="#F59E0B" /> : <Moon size={13} color="#4F46E5" />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <span className="proc-pill active">
              <span className="proc-dot"></span> Certified Proctored Result
            </span>
            <button
              type="button"
              onClick={() => {
                setViewState('lobby');
                navigate(`/applications/${appId}/mock-test`);
              }}
              style={{
                background: 'var(--proc-pill-bg)',
                color: 'var(--proc-ink-bright)',
                border: '1px solid var(--proc-border)',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <RotateCcw size={13} /> Retake / New Test
            </button>
          </div>
        </header>

        {/* Results Container */}
        <main className="proc-result-container">
          {/* Hero Performance Card */}
          <div className="proc-result-hero">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 800,
              background: isPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isPassed ? 'var(--proc-emerald)' : 'var(--proc-amber)',
              border: isPassed ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
              marginBottom: '1rem'
            }}>
              {isPassed ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {isPassed ? 'Ready for Technical Interview' : 'Skill Gap Remediation Recommended'}
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--proc-ink-bright)' }}>
              {resultData.category} Performance Evaluation
            </h1>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--proc-ink-muted)', fontSize: '0.85rem' }}>
              Target Role: {application?.job_title || 'Software Engineer'} at {application?.company_name}
            </p>

            {/* Circular Gauge */}
            <div className="proc-score-gauge">
              <svg className="proc-score-gauge-svg" width="150" height="150" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="var(--proc-border)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={isPassed ? '#10B981' : '#F59E0B'}
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * (resultData.percentage || 0)) / 100}
                  strokeLinecap="round"
                  fill="none"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div className="proc-score-number">
                {resultData.percentage}%
              </div>
            </div>

            {/* Metrics Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
              maxWidth: '700px',
              margin: '1.5rem auto 0',
              textAlign: 'center'
            }}>
              <div style={{ background: 'var(--proc-bg-card-subtle)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--proc-border)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--proc-ink-bright)' }}>
                  {resultData.score} / {resultData.total_questions}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--proc-ink-muted)', marginTop: '2px' }}>Correct Questions</div>
              </div>

              <div style={{ background: 'var(--proc-bg-card-subtle)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--proc-border)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--proc-primary)' }}>
                  {resultData.difficulty}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--proc-ink-muted)', marginTop: '2px' }}>Difficulty Tier</div>
              </div>

              <div style={{ background: 'var(--proc-bg-card-subtle)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--proc-border)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--proc-emerald)' }}>
                  {resultData.time_taken_seconds ? `${Math.round(resultData.time_taken_seconds / 60)}m` : 'Completed'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--proc-ink-muted)', marginTop: '2px' }}>Time Elapsed</div>
              </div>
            </div>
          </div>

          {/* Topic-wise Breakdown */}
          {Object.keys(topicBreakdown).length > 0 && (
            <div style={{
              background: 'var(--proc-bg-card)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--proc-border)',
              borderRadius: '20px',
              padding: '1.75rem',
              marginBottom: '2rem'
            }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 1rem', color: 'var(--proc-ink-bright)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="var(--proc-primary)" /> Topic Accuracy Breakdown
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {Object.entries(topicBreakdown).map(([topic, stats]) => {
                  const pct = stats.percentage != null ? stats.percentage : Math.round((stats.correct / stats.total) * 100);
                  const isTopicWeak = pct < 70;
                  return (
                    <div key={topic}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        <span style={{ color: 'var(--proc-ink-bright)' }}>{topic}</span>
                        <span style={{ color: isTopicWeak ? 'var(--proc-rose)' : 'var(--proc-emerald)' }}>
                          {stats.correct} / {stats.total} ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: '8px', borderRadius: '4px', background: 'var(--proc-border)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: isTopicWeak ? 'var(--proc-rose)' : 'var(--proc-emerald)',
                            borderRadius: '4px',
                            transition: 'width 0.8s ease'
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weak Topics & Remediation Section */}
          {weakTopics.length > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '20px',
              padding: '1.75rem',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <AlertCircle size={20} color="var(--proc-rose)" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--proc-rose)' }}>
                  Targeted Skill Gaps & Weak Topics ({weakTopics.length})
                </h2>
              </div>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.82rem', color: 'var(--proc-ink-muted)' }}>
                Accuracy fell below 70% in the following areas. Add them directly to your application roadmap to track deliberate practice:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                {weakTopics.map((wt, wIdx) => {
                  const topicName = typeof wt === 'string' ? wt : wt.topic;
                  const isAdded = addedTopics.has(topicName);
                  const isAdding = addingTopicRoadmap === topicName;

                  return (
                    <div
                      key={wIdx}
                      style={{
                        background: 'var(--proc-bg-card)',
                        border: '1px solid var(--proc-border)',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--proc-ink-bright)' }}>
                          {topicName}
                        </div>
                        {wt.resources && wt.resources[0] && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--proc-ink-muted)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <BookOpen size={13} color="var(--proc-primary)" />
                            <a
                              href={wt.resources[0].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--proc-primary)', textDecoration: 'none' }}
                            >
                              {wt.resources[0].title || 'Curated Documentation'}
                            </a>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddWeakTopic(topicName)}
                        disabled={isAdded || isAdding}
                        style={{
                          background: isAdded ? 'rgba(16, 185, 129, 0.2)' : 'var(--proc-primary)',
                          border: isAdded ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                          color: isAdded ? 'var(--proc-emerald)' : '#fff',
                          borderRadius: '8px',
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: isAdded ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isAdded ? (
                          <>
                            <Check size={13} /> Added to Checklist Roadmap
                          </>
                        ) : (
                          <>
                            <Plus size={13} /> {isAdding ? 'Adding...' : 'Add to Career Roadmap'}
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Question-by-Question Detailed Review */}
          <div style={{
            background: 'var(--proc-bg-card)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--proc-border)',
            borderRadius: '20px',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--proc-ink-bright)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="var(--proc-emerald)" /> Question Review & Explanations ({reviewQuestions.length})
              </h2>

              {/* Review Filter */}
              <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--proc-bg-card-subtle)', padding: '0.2rem', borderRadius: '8px' }}>
                {['all', 'correct', 'incorrect', 'skipped'].map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setResultFilter(f)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: resultFilter === f ? 'var(--proc-primary)' : 'transparent',
                      color: resultFilter === f ? '#fff' : 'var(--proc-ink-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Review Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredReviewQuestions.map((rq, qIdx) => {
                const isCorrect = rq.is_correct;
                const isSkipped = !rq.submitted_answer;
                const reviewPrompt = rq.question_text || rq.question || rq.prompt || 'Question prompt';

                return (
                  <div
                    key={rq.id || qIdx}
                    style={{
                      background: 'var(--proc-bg-card-subtle)',
                      border: `1.5px solid ${isCorrect ? 'rgba(16, 185, 129, 0.3)' : isSkipped ? 'rgba(148, 163, 184, 0.2)' : 'rgba(239, 68, 68, 0.3)'}`,
                      borderRadius: '14px',
                      padding: '1.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--proc-primary)' }}>
                          Q{qIdx + 1}.
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: isCorrect ? 'rgba(16, 185, 129, 0.15)' : isSkipped ? 'rgba(148, 163, 184, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isCorrect ? 'var(--proc-emerald)' : isSkipped ? 'var(--proc-ink-muted)' : 'var(--proc-rose)'
                        }}>
                          {isCorrect ? '✓ Correct' : isSkipped ? '— Skipped' : '✗ Incorrect'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--proc-ink-dim)' }}>
                          Topic: {rq.topic}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--proc-ink-bright)', marginBottom: '0.85rem', wordBreak: 'break-word' }}>
                      {reviewPrompt}
                    </div>

                    {/* Answers Comparison */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.65rem', marginBottom: '0.85rem' }}>
                      <div style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: 'var(--proc-bg-card)',
                        border: '1px solid var(--proc-border)',
                        fontSize: '0.8rem'
                      }}>
                        <span style={{ color: 'var(--proc-ink-muted)', display: 'block', fontSize: '0.7rem' }}>Your Answer:</span>
                        <span style={{ color: isCorrect ? 'var(--proc-emerald)' : 'var(--proc-rose)', fontWeight: 700, wordBreak: 'break-word' }}>
                          {rq.submitted_answer || '(Unanswered)'}
                        </span>
                      </div>

                      <div style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        fontSize: '0.8rem'
                      }}>
                        <span style={{ color: 'var(--proc-ink-muted)', display: 'block', fontSize: '0.7rem' }}>Correct Answer:</span>
                        <span style={{ color: 'var(--proc-emerald)', fontWeight: 700, wordBreak: 'break-word' }}>
                          {rq.correct_answer}
                        </span>
                      </div>
                    </div>

                    {/* Explanation Box */}
                    {rq.explanation && (
                      <div style={{
                        background: 'var(--proc-bg-card)',
                        borderRadius: '8px',
                        padding: '0.75rem 0.95rem',
                        fontSize: '0.8rem',
                        color: 'var(--proc-ink-bright)',
                        lineHeight: 1.5,
                        borderLeft: '3px solid var(--proc-primary)'
                      }}>
                        <strong style={{ color: 'var(--proc-primary)' }}>Technical Rationale: </strong>
                        {rq.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
