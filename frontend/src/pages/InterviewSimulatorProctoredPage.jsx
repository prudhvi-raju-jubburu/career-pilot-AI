import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Cpu,
  Code,
  Layers,
  Users,
  Target,
  Award,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Clock,
  ShieldAlert,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileText,
  RotateCcw,
  Send,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { applicationService } from '../services/applicationService';
import Button from '../components/ui/Button';
import './InterviewSimulatorProctoredPage.css';

const MODE_ICONS = {
  technical: Cpu,
  coding_discussion: Code,
  project_deep_dive: Layers,
  behavioral: Users,
  weak_topics: Target
};

const SCORE_BAND_METRICS = {
  Strong: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.35)' },
  Competent: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818CF8', border: 'rgba(99, 102, 241, 0.35)' },
  Developing: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.35)' },
  'Needs Improvement': { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.35)' }
};

export default function InterviewSimulatorProctoredPage() {
  const { appId, sessionId: paramSessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  // Theme State: 'dark' | 'light'
  const [theme, setTheme] = useState(() => localStorage.getItem('cp_sim_theme') || 'dark');
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('cp_sim_theme', next);
  };

  // Core Data
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState('loading'); // 'lobby' | 'active' | 'completed'

  // Lobby Config
  const [supportedModes, setSupportedModes] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [selectedMode, setSelectedMode] = useState('technical');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(5);
  const [isStarting, setIsStarting] = useState(false);

  // Active Session State
  const [session, setSession] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showSampleOutline, setShowSampleOutline] = useState(false);
  const [showExpectedHints, setShowExpectedHints] = useState(false);
  const [addedRoadmapTasks, setAddedRoadmapTasks] = useState(new Set());
  const [addingTask, setAddingTask] = useState(false);

  // Voice Speech-to-Text State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Audio Text-to-Speech (Question reading) State
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const synthRef = useRef(window.speechSynthesis || null);

  const answerRef = useRef(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          setAnswerText((prev) => {
            const clean = prev.trim();
            return clean ? `${clean} ${final.trim()}` : final.trim();
          });
        }
        setLiveTranscript(interim);
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          toast.error('Microphone access was denied. Please allow microphone permissions to speak your answers.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setLiveTranscript('');
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      if (synthRef.current) {
        try {
          synthRef.current.cancel();
        } catch (_) {}
      }
    };
  }, []);

  // Toggle Voice Input
  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      toast.info('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari, or type your answer.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        toast.info('Microphone active. Speak your interview answer clearly.');
      } catch (e) {
        console.warn('Could not start recognition:', e);
      }
    }
  };

  // Toggle Text-to-Speech (interviewer reads question)
  const toggleSpeakQuestion = (text) => {
    if (!synthRef.current) return;
    if (isSpeakingQuestion) {
      synthRef.current.cancel();
      setIsSpeakingQuestion(false);
    } else {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeakingQuestion(false);
      utterance.onerror = () => setIsSpeakingQuestion(false);
      setIsSpeakingQuestion(true);
      synthRef.current.speak(utterance);
    }
  };

  // Load application and session data on mount or param change
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Fetch application info
        const apps = await applicationService.getApplications();
        const app = (apps || []).find((a) => String(a.id) === String(appId));
        if (mounted && app) {
          setApplication(app);
        }

        // 2. Fetch simulator overview (supported modes and history)
        const overview = await applicationService.getInterviewSimulatorOverview(appId);
        if (mounted) {
          setSupportedModes(overview.supported_modes || []);
          setPastSessions(overview.recent_sessions || []);
        }

        // 3. Resolve active session or requested session
        if (paramSessionId) {
          const s = await applicationService.getInterviewSimulatorSession(appId, paramSessionId);
          if (mounted && s) {
            setSession(s);
            if (s.status === 'completed' || s.status === 'ended_early') {
              setViewState('completed');
            } else {
              setViewState('active');
              const qIdx = s.current_question_index || 0;
              setAnswerText((s.answers && s.answers[String(qIdx)]) || '');
            }
          }
        } else if (overview.active_session) {
          setSession(overview.active_session);
          setViewState('active');
          const qIdx = overview.active_session.current_question_index || 0;
          setAnswerText((overview.active_session.answers && overview.active_session.answers[String(qIdx)]) || '');
        } else {
          setViewState('lobby');
        }
      } catch (err) {
        console.error('Error loading simulator data:', err);
        toast.error('Could not load interview simulator details.');
        if (mounted) setViewState('lobby');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (appId) {
      loadData();
    }
    return () => { mounted = false; };
  }, [appId, paramSessionId]);

  // Start new simulation session
  const handleStartSession = async () => {
    setIsStarting(true);
    try {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
      const newSession = await applicationService.startInterviewSimulatorSession(appId, {
        mode: selectedMode,
        difficulty: selectedDifficulty,
        question_count: selectedQuestionCount,
        resume_active: false
      });
      setSession(newSession);
      setViewState('active');
      setAnswerText('');
      setShowSampleOutline(false);
      setShowExpectedHints(false);
      navigate(`/applications/${appId}/interview/${newSession.id}`, { replace: true });
      toast.success(`Started ${newSession.mode || 'Technical'} interview session (${newSession.total_questions || selectedQuestionCount} questions).`);
    } catch (err) {
      console.error('Could not start interview session:', err);
      toast.error(err.response?.data?.error || 'Could not start interview session.');
    } finally {
      setIsStarting(false);
    }
  };

  // Submit Answer for AI Evaluation
  const handleSubmitAnswer = async () => {
    if (!session) return;
    const qIdx = session.current_question_index ?? 0;
    const clean = answerText.trim();
    if (clean.length < 5) {
      toast.error('Please provide a substantive answer (at least 5 characters) before submitting.');
      return;
    }

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setIsSubmitting(true);
    try {
      const updated = await applicationService.submitInterviewSimulatorAnswer(appId, session.id, qIdx, clean);
      setSession(updated);
      toast.success('Response evaluated by AI! Review your feedback below.');
    } catch (err) {
      console.error('Submission failed:', err);
      toast.error(err.response?.data?.error || 'Could not evaluate answer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Advance to Next Question
  const handleNextQuestion = async () => {
    if (!session) return;
    setIsAdvancing(true);
    try {
      if (synthRef.current) synthRef.current.cancel();
      setIsSpeakingQuestion(false);

      const updated = await applicationService.advanceInterviewSimulatorQuestion(appId, session.id);
      setSession(updated);
      setShowSampleOutline(false);
      setShowExpectedHints(false);

      if (updated.status === 'completed' || updated.status === 'ended_early') {
        setViewState('completed');
        try {
          confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
        } catch (_) {}
      } else {
        const nextIdx = updated.current_question_index ?? 0;
        setAnswerText((updated.answers && updated.answers[String(nextIdx)]) || '');
      }
    } catch (err) {
      console.error('Could not advance question:', err);
      toast.error('Could not advance to next question.');
    } finally {
      setIsAdvancing(false);
    }
  };

  // End Session Early
  const handleEndEarly = async () => {
    if (!session) return;
    if (!window.confirm('Are you sure you want to conclude this interview session early? Evaluated questions will be saved.')) {
      return;
    }
    try {
      if (recognitionRef.current && isListening) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();

      const ended = await applicationService.endInterviewSimulatorSession(appId, session.id);
      setSession(ended);
      setViewState('completed');
      toast.info('Interview session concluded.');
    } catch (err) {
      console.error('Could not end session:', err);
      toast.error('Failed to end interview session.');
    }
  };

  // Add Improvement Task to Preparation Roadmap
  const handleAddToRoadmap = async (taskTitle, category = 'Technical') => {
    if (!session || !taskTitle) return;
    setAddingTask(true);
    try {
      await applicationService.addSimulatorTaskToRoadmap(appId, session.id, taskTitle, category);
      setAddedRoadmapTasks((prev) => new Set([...prev, taskTitle]));
      toast.success(`Added "${taskTitle}" to your application preparation checklist!`);
    } catch (err) {
      console.error('Failed to add task to roadmap:', err);
      toast.error('Could not add item to preparation checklist.');
    } finally {
      setAddingTask(false);
    }
  };

  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

  // --------------------------------------------------------------------------
  // RENDER: LOADING STATE
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className={`sim-page-container theme-${theme}`}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
          <Sparkles size={36} style={{ color: 'var(--sim-primary)', animation: 'spin 2s linear infinite' }} />
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sim-ink-bright)' }}>
            Initializing Personalized AI Interview Simulator...
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--sim-ink-dim)' }}>
            Loading job description and student resume context
          </div>
        </div>
      </div>
    );
  }

  const roleTitle = application?.role || 'Software Engineer';
  const companyName = application?.company || 'Target Company';
  const currentQIndex = session?.current_question_index ?? 0;
  const currentQ = session?.questions ? session.questions[currentQIndex] : null;
  const currentEvaluation = session?.evaluations ? session.evaluations[String(currentQIndex)] : null;
  const hasEvaluated = !!currentEvaluation;
  const totalQuestions = session?.total_questions || session?.questions?.length || selectedQuestionCount;

  return (
    <div className={`sim-page-container theme-${theme}`}>
      {/* --------------------------------------------------------------------
          HUD TOP BAR
          -------------------------------------------------------------------- */}
      <header className="sim-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <button
            type="button"
            onClick={() => navigate('/applications')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--sim-border)',
              background: 'var(--sim-pill-bg)',
              color: 'var(--sim-ink-bright)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <ArrowLeft size={14} />
            <span>Applications</span>
          </button>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--sim-ink-bright)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {roleTitle} • {companyName}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--sim-ink-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Personalized AI Interview Simulator</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span style={{ color: 'var(--sim-emerald)' }}>Grounding: JD + Resume</span>
            </div>
          </div>
        </div>

        {/* Right HUD Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {viewState === 'active' && session && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                background: 'var(--sim-primary-glow)',
                color: 'var(--sim-ink-bright)',
                border: '1px solid var(--sim-border-focus)'
              }}>
                Question {currentQIndex + 1} of {totalQuestions}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={handleEndEarly}
                style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', color: 'var(--sim-rose)', borderColor: 'var(--sim-border)' }}
              >
                End Session
              </Button>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              padding: '0.45rem',
              borderRadius: '8px',
              border: '1px solid var(--sim-border)',
              background: 'var(--sim-pill-bg)',
              color: 'var(--sim-ink-bright)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Progress Bar (during active session) */}
      {viewState === 'active' && session && (
        <div style={{ height: '3px', background: 'var(--sim-border)', width: '100%' }}>
          <div style={{
            height: '100%',
            background: 'var(--sim-primary)',
            width: `${((currentQIndex + (hasEvaluated ? 1 : 0.5)) / totalQuestions) * 100}%`,
            transition: 'width 0.4s ease'
          }} />
        </div>
      )}

      {/* Practice Simulation Legal Disclaimer Banner */}
      <div style={{
        margin: '0.75rem 1.5rem 0',
        padding: '0.65rem 1rem',
        borderRadius: '8px',
        backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
        border: theme === 'dark' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FCD34D',
        color: theme === 'dark' ? '#FBBF24' : '#92400E',
        fontSize: '0.76rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem'
      }}>
        <ShieldAlert size={16} style={{ flexShrink: 0 }} />
        <div style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          <strong>Practice Simulation Disclaimer: </strong>
          Interview questions, feedback rubrics, and reference outlines are AI-assisted practice aids synthesized directly from your verified profile, projects, and target job description. They do not represent official questions from {companyName}.
        </div>
      </div>

      {/* --------------------------------------------------------------------
          VIEW 1: LOBBY & CONFIGURATION SCREEN
          -------------------------------------------------------------------- */}
      {viewState === 'lobby' && (
        <div style={{ maxWidth: '1000px', width: '100%', margin: '1.25rem auto', padding: '0 1.5rem 3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxSizing: 'border-box' }}>
          {/* Intro Card */}
          <div style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: 'var(--sim-bg-card)',
            border: '1px solid var(--sim-border)',
            boxShadow: 'var(--sim-card-shadow)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--sim-ink-bright)', margin: '0 0 0.35rem' }}>
                  Interactive AI Interview Simulator
                </h1>
                <p style={{ fontSize: '0.86rem', color: 'var(--sim-ink-muted)', margin: 0 }}>
                  Practice realistic, one-on-one interview questions grounded directly in the <strong>{roleTitle}</strong> job description and your verified resume projects.
                </p>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', borderRadius: '8px', background: 'var(--sim-pill-bg)', border: '1px solid var(--sim-border)', fontSize: '0.76rem' }}>
                <CheckCircle2 size={14} color="var(--sim-emerald)" />
                <span>Text or Voice Microphone Input</span>
              </div>
            </div>

            {/* Step 1: Select Mode */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: 'var(--sim-ink-bright)', marginBottom: '0.75rem' }}>
                1. Select Interview Practice Mode
              </label>

              <div className="sim-mode-grid">
                {(supportedModes.length > 0 ? supportedModes : [
                  { id: 'technical', name: 'Technical Interview', description: 'Job-specific technical questions covering required technologies, frameworks, and core engineering fundamentals.' },
                  { id: 'coding_discussion', name: 'Coding & Problem Solving', description: 'Algorithmic reasoning, time/space complexity analysis, edge cases, debugging, and database query architecture.' },
                  { id: 'project_deep_dive', name: 'Project Deep-Dive', description: 'In-depth discussion grounded directly in your verified student projects, architecture, challenges, and trade-offs.' },
                  { id: 'behavioral', name: 'Behavioral & HR (STAR)', description: 'Scenario-based behavioral questions evaluated using the STAR framework (Situation, Task, Action, Result).' },
                  { id: 'weak_topics', name: 'Weak-Topic Revision', description: 'Targeted practice focusing on topics where you missed questions in mock tests or have priority skill gaps.' }
                ]).map((m) => {
                  const isSelected = selectedMode === m.id;
                  const IconComp = MODE_ICONS[m.id] || Sparkles;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`sim-mode-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedMode(m.id)}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <IconComp size={18} color={isSelected ? 'var(--sim-primary)' : 'var(--sim-ink-muted)'} style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--sim-ink-bright)' }}>
                            {m.name}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--sim-ink-muted)', lineHeight: 1.45 }}>
                          {m.description}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--sim-ink-dim)', paddingTop: '0.45rem', borderTop: '1px dashed var(--sim-border)', marginTop: '0.5rem' }}>
                        <span>AI Evaluated + Voice Enabled</span>
                        {isSelected && <Check size={14} color="var(--sim-primary)" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2 & 3: Difficulty & Question Count (5 to 15 Questions) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--sim-border)'
            }}>
              {/* Difficulty */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--sim-ink-bright)', marginBottom: '0.5rem' }}>
                  2. Difficulty Level
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['Easy', 'Medium', 'Hard'].map((diff) => {
                    const val = diff.toLowerCase();
                    const isSel = selectedDifficulty === val;
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setSelectedDifficulty(val)}
                        style={{
                          flex: 1,
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          border: isSel ? '2px solid var(--sim-primary)' : '1px solid var(--sim-border)',
                          background: isSel ? 'var(--sim-primary-glow)' : 'var(--sim-pill-bg)',
                          color: isSel ? 'var(--sim-ink-bright)' : 'var(--sim-ink-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {diff}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Count (Updated 5 to 15 questions) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--sim-ink-bright)', marginBottom: '0.5rem' }}>
                  3. Session Question Count (5 to 15 Questions)
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[5, 8, 10, 12, 15].map((cnt) => {
                    const isSel = selectedQuestionCount === cnt;
                    return (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setSelectedQuestionCount(cnt)}
                        style={{
                          flex: '1 0 50px',
                          padding: '0.55rem 0.5rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          border: isSel ? '2px solid var(--sim-primary)' : '1px solid var(--sim-border)',
                          background: isSel ? 'var(--sim-primary-glow)' : 'var(--sim-pill-bg)',
                          color: isSel ? 'var(--sim-ink-bright)' : 'var(--sim-ink-muted)',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        {cnt} Qs
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartSession}
                disabled={isStarting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.85rem 2rem',
                  fontSize: '0.95rem',
                  fontWeight: 800
                }}
              >
                {isStarting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Preparing Grounded Questions...</span>
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    <span>Start AI Interview Session</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Past Sessions History */}
          {pastSessions && pastSessions.length > 0 && (
            <div style={{
              padding: '1.5rem',
              borderRadius: '16px',
              background: 'var(--sim-bg-card)',
              border: '1px solid var(--sim-border)'
            }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--sim-ink-bright)', margin: '0 0 1rem' }}>
                Previous Interview Simulations
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pastSessions.map((s) => {
                  const sMode = s.mode || s.session_type || 'technical';
                  const isDone = s.status === 'completed' || s.status === 'ended_early';
                  const IconComp = MODE_ICONS[sMode] || Sparkles;
                  return (
                    <div
                      key={s.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        border: '1px solid var(--sim-border)',
                        background: 'var(--sim-bg-card-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--sim-pill-bg)' }}>
                          <IconComp size={20} color="var(--sim-primary)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--sim-ink-bright)' }}>
                            {s.mode?.replace('_', ' ').toUpperCase()} INTERVIEW
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--sim-ink-muted)' }}>
                            {new Date(s.created_at || Date.now()).toLocaleDateString()} • {s.total_questions || 5} Questions • {s.difficulty || 'Medium'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {s.summary?.score_percentage != null && (
                          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--sim-emerald)' }}>
                            {s.summary.score_percentage}% • {s.summary.score_band}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSession(s);
                            if (isDone) {
                              setViewState('completed');
                            } else {
                              setViewState('active');
                              const qIdx = s.current_question_index || 0;
                              setAnswerText((s.answers && s.answers[String(qIdx)]) || '');
                            }
                            navigate(`/applications/${appId}/interview/${s.id}`);
                          }}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '6px',
                            border: '1px solid var(--sim-border)',
                            background: 'var(--sim-pill-bg)',
                            color: 'var(--sim-ink-bright)',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {isDone ? 'Review Session' : 'Resume Session'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------
          VIEW 2: ACTIVE INTERVIEW QUESTION & ANSWER INTERFACE
          -------------------------------------------------------------------- */}
      {viewState === 'active' && session && currentQ && (
        <div style={{ maxWidth: '900px', width: '100%', margin: '1.25rem auto', padding: '0 1.5rem 3rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxSizing: 'border-box' }}>
          {/* Question Card */}
          <div style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: 'var(--sim-bg-card)',
            border: '1px solid var(--sim-border)',
            boxShadow: 'var(--sim-card-shadow)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  background: 'var(--sim-primary-glow)',
                  color: 'var(--sim-primary)',
                  border: '1px solid var(--sim-border-focus)'
                }}>
                  {currentQ.category || 'Technical Practice'}
                </span>

                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  background: 'var(--sim-pill-bg)',
                  color: 'var(--sim-ink-muted)'
                }}>
                  Difficulty: {currentQ.difficulty || session.difficulty || 'Medium'}
                </span>
              </div>

              {/* Text-to-Speech audio button */}
              <button
                type="button"
                onClick={() => toggleSpeakQuestion(currentQ.question_text)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--sim-border)',
                  background: isSpeakingQuestion ? 'var(--sim-rose-glow)' : 'var(--sim-pill-bg)',
                  color: isSpeakingQuestion ? 'var(--sim-rose)' : 'var(--sim-ink-bright)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Listen to interviewer speak this question"
              >
                {isSpeakingQuestion ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{isSpeakingQuestion ? 'Stop Audio' : 'Listen to Question'}</span>
              </button>
            </div>

            {/* Grounded Source Tag */}
            {currentQ.grounded_source && (
              <div style={{ fontSize: '0.72rem', color: 'var(--sim-emerald)', fontWeight: 700, marginBottom: '0.75rem' }}>
                🎯 Grounded in: {currentQ.grounded_source}
              </div>
            )}

            {/* Question Text */}
            <div style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--sim-ink-bright)',
              lineHeight: 1.55,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              marginBottom: '1rem'
            }}>
              {currentQ.question_text}
            </div>

            {/* Context / Relevance info */}
            {currentQ.why_relevant && (
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--sim-ink-muted)',
                lineHeight: 1.45,
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'var(--sim-bg-card-subtle)',
                border: '1px solid var(--sim-border)'
              }}>
                <span style={{ fontWeight: 800, color: 'var(--sim-ink-bright)' }}>Interview Context: </span>
                {currentQ.why_relevant}
              </div>
            )}

            {/* Collapsible Key Discussion Points */}
            {currentQ.expected_points && currentQ.expected_points.length > 0 && (
              <div style={{ marginTop: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => setShowExpectedHints(!showExpectedHints)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: 'var(--sim-primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <HelpCircle size={14} />
                  <span>{showExpectedHints ? 'Hide Key Discussion Prompts' : 'View Key Discussion Prompts'}</span>
                  {showExpectedHints ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {showExpectedHints && (
                  <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', fontSize: '0.78rem', color: 'var(--sim-ink-muted)' }}>
                    {currentQ.expected_points.map((pt, pIdx) => (
                      <li key={pIdx} style={{ marginBottom: '0.3rem' }}>{pt}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Answer Input Card (Text OR Voice Input) */}
          <div style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: 'var(--sim-bg-card)',
            border: '1px solid var(--sim-border)',
            boxShadow: 'var(--sim-card-shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--sim-ink-bright)' }}>
                  Your Response (Text or Voice)
                </label>
                <span className="sim-word-count">
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>
              </div>

              {/* Voice Microphone Input Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={isListening ? 'mic-recording-pulse' : ''}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 0.95rem',
                  borderRadius: '999px',
                  border: isListening ? '2px solid #EF4444' : '1px solid var(--sim-border)',
                  background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'var(--sim-pill-bg)',
                  color: isListening ? '#EF4444' : 'var(--sim-ink-bright)',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {isListening ? (
                  <>
                    <div style={{ display: 'inline-flex', gap: '2px', alignItems: 'center', marginRight: '3px' }}>
                      <span className="sound-bar" />
                      <span className="sound-bar" />
                      <span className="sound-bar" />
                      <span className="sound-bar" />
                    </div>
                    <MicOff size={15} />
                    <span>Listening... (Click to Stop)</span>
                  </>
                ) : (
                  <>
                    <Mic size={15} color="var(--sim-primary)" />
                    <span>Answer with Voice (Mic)</span>
                  </>
                )}
              </button>
            </div>

            {/* Live voice transcription status banner */}
            {isListening && (
              <div style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                <span>Microphone recording active. Speak clearly — your answer will appear in the box below.</span>
              </div>
            )}

            {/* Textarea */}
            <textarea
              ref={answerRef}
              rows={8}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your response or click 'Answer with Voice' above to speak into your microphone..."
              disabled={hasEvaluated}
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: '10px',
                border: '1px solid var(--sim-input-border)',
                background: 'var(--sim-input-bg)',
                color: 'var(--sim-ink-bright)',
                fontSize: '0.9rem',
                lineHeight: 1.55,
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
            />

            {/* Submission controls */}
            {!hasEvaluated ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--sim-ink-dim)' }}>
                  Tip: Structure answers with context, actions taken, and measurable results.
                </div>

                <Button
                  variant="primary"
                  onClick={handleSubmitAnswer}
                  disabled={isSubmitting || answerText.trim().length < 5}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Evaluating Response...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Submit Answer for Evaluation</span>
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </div>

          {/* ------------------------------------------------------------------
              EVALUATION FEEDBACK CARD (Rendered after answer submission)
              ------------------------------------------------------------------ */}
          {hasEvaluated && currentEvaluation && (
            <div style={{
              padding: '1.5rem',
              borderRadius: '16px',
              background: 'var(--sim-bg-card)',
              border: '1px solid var(--sim-border)',
              boxShadow: 'var(--sim-card-shadow)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              {/* Score Band Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--sim-ink-dim)', textTransform: 'uppercase' }}>
                    AI Evaluation & Rubric Feedback
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--sim-ink-bright)', marginTop: '2px' }}>
                    Readiness Evaluation: {currentEvaluation.overall_assessment}
                  </div>
                </div>

                {(() => {
                  const band = currentEvaluation.score_band || 'Competent';
                  const style = SCORE_BAND_METRICS[band] || SCORE_BAND_METRICS.Competent;
                  return (
                    <span style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      background: style.bg,
                      color: style.text,
                      border: `1px solid ${style.border}`
                    }}>
                      Score Band: {band}
                    </span>
                  );
                })()}
              </div>

              {/* 6-Dimension Evaluation Breakdown */}
              {currentEvaluation.dimensions && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--sim-ink-bright)', marginBottom: '0.65rem' }}>
                    Performance Across 6 Assessment Dimensions
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                    {[
                      { key: 'technical_correctness', label: 'Technical Correctness' },
                      { key: 'completeness', label: 'Completeness' },
                      { key: 'problem_solving', label: 'Problem Solving' },
                      { key: 'clarity', label: 'Clarity & Structure' },
                      { key: 'practical_examples', label: 'Practical Examples' },
                      { key: 'relevance', label: 'Role Relevance' }
                    ].map((dim) => {
                      const score = currentEvaluation.dimensions[dim.key] ?? 7;
                      const pct = Math.min(100, Math.max(0, (score / 10) * 100));
                      let barColor = 'var(--sim-primary)';
                      if (score >= 8) barColor = 'var(--sim-emerald)';
                      else if (score < 5) barColor = 'var(--sim-rose)';
                      else if (score < 7) barColor = 'var(--sim-amber)';

                      return (
                        <div key={dim.key} style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'var(--sim-bg-card-subtle)', border: '1px solid var(--sim-border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: 'var(--sim-ink-bright)', marginBottom: '0.35rem' }}>
                            <span>{dim.label}</span>
                            <span style={{ color: barColor }}>{score}/10</span>
                          </div>
                          <div className="sim-dimension-meter">
                            <div className="sim-dimension-fill" style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Strengths & Missing Concepts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {/* What Was Explained Well */}
                <div style={{ padding: '0.9rem', borderRadius: '10px', background: 'var(--sim-bg-card-subtle)', border: '1px solid var(--sim-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--sim-emerald)', marginBottom: '0.5rem' }}>
                    <CheckCircle2 size={16} />
                    <span>What Was Explained Well</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: 'var(--sim-ink-muted)', lineHeight: 1.45 }}>
                    {(currentEvaluation.what_was_explained_well || ['Clear conceptual framing']).map((w, wIdx) => (
                      <li key={wIdx} style={{ marginBottom: '0.35rem' }}>{w}</li>
                    ))}
                  </ul>
                </div>

                {/* Missing or Under-Explained Concepts */}
                <div style={{ padding: '0.9rem', borderRadius: '10px', background: 'var(--sim-bg-card-subtle)', border: '1px solid var(--sim-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--sim-amber)', marginBottom: '0.5rem' }}>
                    <AlertCircle size={16} />
                    <span>Areas to Expand or Clarify</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: 'var(--sim-ink-muted)', lineHeight: 1.45 }}>
                    {(currentEvaluation.missing_concepts || ['Consider discussing production edge cases and recovery']).map((m, mIdx) => (
                      <li key={mIdx} style={{ marginBottom: '0.35rem' }}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Improvement Tip + Add to Roadmap */}
              {currentEvaluation.improvement_tip && (
                <div style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'var(--sim-primary-glow)',
                  border: '1px solid var(--sim-border-focus)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--sim-primary)', textTransform: 'uppercase' }}>
                      Recommended Action Item
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--sim-ink-bright)', fontWeight: 600, marginTop: '2px' }}>
                      {currentEvaluation.improvement_tip}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddToRoadmap(currentEvaluation.improvement_tip, currentQ.category || 'Technical')}
                    disabled={addingTask || addedRoadmapTasks.has(currentEvaluation.improvement_tip)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.9rem',
                      borderRadius: '8px',
                      border: '1px solid var(--sim-primary)',
                      background: addedRoadmapTasks.has(currentEvaluation.improvement_tip) ? 'var(--sim-emerald)' : 'var(--sim-primary)',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {addedRoadmapTasks.has(currentEvaluation.improvement_tip) ? (
                      <>
                        <Check size={14} />
                        <span>Added to Roadmap</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Add to Roadmap</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Collapsible Sample Reference Outline */}
              <div style={{ borderTop: '1px solid var(--sim-border)', paddingTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowSampleOutline(!showSampleOutline)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.5rem 0',
                    background: 'none',
                    border: 'none',
                    color: 'var(--sim-ink-bright)',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BookOpen size={16} color="var(--sim-primary)" />
                    <span>Sample Reference Answer Outline (Study Aid)</span>
                  </div>
                  {showSampleOutline ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showSampleOutline && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '1rem',
                    borderRadius: '8px',
                    background: 'var(--sim-bg-card-subtle)',
                    border: '1px solid var(--sim-border)',
                    fontSize: '0.84rem',
                    color: 'var(--sim-ink-muted)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere'
                  }}>
                    {currentEvaluation.sample_answer_outline || currentQ.sample_outline || '1. Introduce high-level concept.\n2. Explain architectural implementation.\n3. Discuss trade-offs and edge cases.'}
                  </div>
                )}
              </div>

              {/* Next Question / Finish Session Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--sim-border)' }}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNextQuestion}
                  disabled={isAdvancing}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}
                >
                  {isAdvancing ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Advancing...</span>
                    </>
                  ) : (
                    <>
                      <span>{currentQIndex + 1 < totalQuestions ? 'Next Question' : 'View Session Results'}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------
          VIEW 3: COMPLETED SESSION SUMMARY & ROADMAP REPORT
          -------------------------------------------------------------------- */}
      {viewState === 'completed' && session && (
        <div style={{ maxWidth: '900px', width: '100%', margin: '1.5rem auto', padding: '0 1.5rem 3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxSizing: 'border-box' }}>
          {/* Summary Banner */}
          <div style={{
            padding: '2rem',
            borderRadius: '16px',
            background: 'var(--sim-bg-card)',
            border: '1px solid var(--sim-border)',
            boxShadow: 'var(--sim-card-shadow)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--sim-emerald-glow)',
              color: 'var(--sim-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Award size={32} />
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sim-ink-bright)', margin: '0 0 0.4rem' }}>
              Interview Simulation Completed!
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--sim-ink-muted)', margin: '0 0 1.5rem' }}>
              Target Opportunity: <strong>{roleTitle}</strong> at <strong>{companyName}</strong>
            </p>

            {/* Score & Band */}
            {session.summary && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '0.75rem 1.75rem',
                borderRadius: '12px',
                background: 'var(--sim-bg-card-subtle)',
                border: '1px solid var(--sim-border)',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--sim-ink-dim)', fontWeight: 700 }}>OVERALL SCORE</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--sim-emerald)' }}>
                    {session.summary.score_percentage}%
                  </div>
                </div>

                <div style={{ width: '1px', height: '36px', background: 'var(--sim-border)' }} />

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--sim-ink-dim)', fontWeight: 700 }}>READINESS BAND</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--sim-ink-bright)' }}>
                    {session.summary.score_band || 'Competent'}
                  </div>
                </div>
              </div>
            )}

            {/* Dimension Breakdown */}
            {session.summary?.dimension_averages && (
              <div style={{ maxWidth: '650px', margin: '0 auto 1.5rem', textAlign: 'left' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--sim-ink-bright)', marginBottom: '0.65rem' }}>
                  Average Dimension Performance
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
                  {Object.entries(session.summary.dimension_averages).map(([k, val]) => (
                    <div key={k} style={{ padding: '0.55rem 0.75rem', borderRadius: '8px', background: 'var(--sim-bg-card-subtle)', border: '1px solid var(--sim-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, color: 'var(--sim-ink-bright)', marginBottom: '0.25rem' }}>
                        <span style={{ textTransform: 'capitalize' }}>{k.replace('_', ' ')}</span>
                        <span>{val}/10</span>
                      </div>
                      <div className="sim-dimension-meter">
                        <div className="sim-dimension-fill" style={{ width: `${(val / 10) * 100}%`, background: 'var(--sim-primary)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button
                variant="outline"
                onClick={() => setViewState('lobby')}
                style={{ fontWeight: 700 }}
              >
                Practice Another Mode
              </Button>

              <Button
                variant="primary"
                onClick={() => navigate('/applications')}
                style={{ fontWeight: 800 }}
              >
                Return to Applications
              </Button>
            </div>
          </div>

          {/* Full Q&A Review List */}
          <div style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: 'var(--sim-bg-card)',
            border: '1px solid var(--sim-border)'
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--sim-ink-bright)', margin: '0 0 1rem' }}>
              Review Questions & Answers
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(session.questions || []).map((q, idx) => {
                const ans = (session.answers && session.answers[String(idx)]) || '';
                const ev = (session.evaluations && session.evaluations[String(idx)]) || null;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--sim-border)',
                      background: 'var(--sim-bg-card-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.55rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--sim-primary)' }}>
                        Question {idx + 1}: {q.category || 'Technical'}
                      </span>
                      {ev && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--sim-emerald)' }}>
                          {ev.score_band}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--sim-ink-bright)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {q.question_text}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--sim-ink-muted)', background: 'var(--sim-bg-card)', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid var(--sim-border)', fontStyle: 'italic', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      <span style={{ fontWeight: 700, fontStyle: 'normal' }}>Your Answer: </span>
                      {ans || 'No response provided'}
                    </div>

                    {ev && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--sim-ink-bright)', background: 'var(--sim-primary-glow)', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid var(--sim-border-focus)' }}>
                        <span style={{ fontWeight: 800 }}>Feedback: </span>
                        {ev.overall_assessment}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
