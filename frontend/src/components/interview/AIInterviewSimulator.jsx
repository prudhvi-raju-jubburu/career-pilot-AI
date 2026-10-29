import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Cpu,
  Code,
  Layers,
  Users,
  Target,
  Award,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Play,
  Pause,
  Plus,
  BookOpen,
  ArrowRight,
  Clock,
  ShieldAlert,
  Send,
  FileText,
  Check,
  RotateCcw,
  ExternalLink,
  Mic,
  MicOff,
  Volume2
} from 'lucide-react';
import Button from '../ui/Button';
import applicationService from '../../services/applicationService';

const MODE_ICONS = {
  technical: Cpu,
  coding_discussion: Code,
  project_deep_dive: Layers,
  behavioral: Users,
  weak_topics: Target
};

const SCORE_BAND_COLORS = {
  Strong: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  Competent: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  Developing: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  'Needs Improvement': { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' }
};

export default function AIInterviewSimulator({
  application,
  prepPack,
  toast,
  onChecklistUpdated
}) {
  const appId = application?.id;
  const navigate = useNavigate();

  // View state: 'lobby' | 'session' | 'completed' | 'review'
  const [viewMode, setViewMode] = useState('lobby');
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [supportedModes, setSupportedModes] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);

  // Session configuration (5 to 15 questions)
  const [selectedMode, setSelectedMode] = useState('technical');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(5);
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Active session state
  const [activeSession, setActiveSession] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isAdvancingQuestion, setIsAdvancingQuestion] = useState(false);
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  const [showConceptHints, setShowConceptHints] = useState(false);
  const [addingTaskToRoadmap, setAddingTaskToRoadmap] = useState(false);
  const [addedRoadmapTasks, setAddedRoadmapTasks] = useState(new Set());

  // Voice Speech-to-Text State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Reviewing specific past session
  const [reviewingSession, setReviewingSession] = useState(null);

  const answerTextareaRef = useRef(null);

  // Initialize Speech Recognition for Voice Answers
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onresult = (evt) => {
        let final = '';
        for (let i = evt.resultIndex; i < evt.results.length; ++i) {
          if (evt.results[i].isFinal) final += evt.results[i][0].transcript;
        }
        if (final) {
          setCurrentAnswer((prev) => {
            const clean = prev.trim();
            return clean ? `${clean} ${final.trim()}` : final.trim();
          });
        }
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast?.info('Voice input is supported in Chrome, Edge, and Safari. You can also type your answer.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        toast?.info('Microphone active. Speak your interview answer clearly.');
      } catch (e) {
        console.warn('Speech error:', e);
      }
    }
  };

  // Load overview (modes, active session, history) on mount
  useEffect(() => {
    if (!appId) return;
    loadOverview();
  }, [appId]);

  const loadOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await applicationService.getInterviewSimulatorOverview(appId);
      const data = res?.data || res || {};
      if (data.modes) setSupportedModes(data.modes);
      if (data.history) setPastSessions(data.history);

      if (data.active_session && (data.active_session.status === 'active' || data.active_session.status === 'paused')) {
        setActiveSession(data.active_session);
        // Pre-fill answer if already submitted for current question
        const currIdx = data.active_session.current_question_index || 0;
        const existingAns = data.active_session.answers?.[String(currIdx)]?.answer_text || '';
        setCurrentAnswer(existingAns);
        setViewMode('session');
      }
    } catch (err) {
      console.warn('Could not load interview simulator overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  // Start new session
  const handleStartSession = async (openInPage = true) => {
    if (!appId) return;
    setIsStartingSession(true);
    try {
      if (recognitionRef.current && isListening) recognitionRef.current.stop();
      const config = {
        mode: selectedMode,
        difficulty: selectedDifficulty,
        question_count: selectedQuestionCount,
        resume_active: false
      };
      const res = await applicationService.startInterviewSimulatorSession(appId, config);
      const session = res?.data || res;
      if (openInPage && session?.id) {
        navigate(`/applications/${appId}/interview/${session.id}`);
        return;
      }
      setActiveSession(session);
      setCurrentAnswer('');
      setShowSampleAnswer(false);
      setShowConceptHints(false);
      setViewMode('session');
      toast?.success(`Interview simulation started in ${session.mode?.replace('_', ' ')} mode!`);
    } catch (err) {
      toast?.error(err?.response?.data?.message || err?.message || 'Failed to start interview session');
    } finally {
      setIsStartingSession(false);
    }
  };

  // Resume active session
  const handleResumeActiveSession = async () => {
    if (!appId || !activeSession) return;
    try {
      const res = await applicationService.resumeInterviewSimulatorSession(appId, activeSession.id);
      const updated = res?.data || res;
      setActiveSession(updated);
      setViewMode('session');
    } catch (err) {
      toast?.error('Could not resume session');
    }
  };

  // Pause active session
  const handlePauseSession = async () => {
    if (!appId || !activeSession) return;
    try {
      const res = await applicationService.pauseInterviewSimulatorSession(appId, activeSession.id);
      const updated = res?.data || res;
      setActiveSession(updated);
      toast?.info('Session paused. You can resume anytime.');
    } catch (err) {
      toast?.error('Failed to pause session');
    }
  };

  // End active session early
  const handleEndSessionEarly = async () => {
    if (!appId || !activeSession) return;
    try {
      const res = await applicationService.endInterviewSimulatorSession(appId, activeSession.id);
      const updated = res?.data || res;
      setActiveSession(updated);
      setViewMode('completed');
      loadOverview();
      toast?.info('Session completed and saved to history.');
    } catch (err) {
      toast?.error('Failed to complete session');
    }
  };

  // Submit answer for evaluation
  const handleSubmitAnswer = async () => {
    if (!appId || !activeSession) return;
    const clean = currentAnswer.trim();
    if (clean.length < 5) {
      toast?.error('Please provide a substantive answer (at least 5 characters).');
      return;
    }

    const currIdx = activeSession.current_question_index || 0;
    setIsSubmittingAnswer(true);

    try {
      const res = await applicationService.submitInterviewSimulatorAnswer(
        appId,
        activeSession.id,
        currIdx,
        clean
      );
      const payload = res?.data || res;

      // Update active session locally with evaluation
      setActiveSession((prev) => {
        if (!prev) return prev;
        const newAnswers = { ...prev.answers, [String(currIdx)]: { answer_text: clean } };
        const newEvals = { ...prev.evaluations, [String(currIdx)]: payload.evaluation };
        return {
          ...prev,
          answers: newAnswers,
          evaluations: newEvals
        };
      });

      toast?.success('Answer evaluated! Review your feedback below.');
    } catch (err) {
      toast?.error(err?.response?.data?.message || err?.message || 'Evaluation request failed');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Advance to next question or complete session
  const handleAdvanceQuestion = async () => {
    if (!appId || !activeSession) return;
    setIsAdvancingQuestion(true);
    try {
      const res = await applicationService.advanceInterviewSimulatorQuestion(appId, activeSession.id);
      const updated = res?.data || res;
      setActiveSession(updated);
      setShowSampleAnswer(false);
      setShowConceptHints(false);

      if (updated.status === 'completed') {
        setViewMode('completed');
        loadOverview();
        toast?.success('Simulation session completed! Great job practicing.');
      } else {
        const nextIdx = updated.current_question_index || 0;
        const existingAns = updated.answers?.[String(nextIdx)]?.answer_text || '';
        setCurrentAnswer(existingAns);
        setTimeout(() => answerTextareaRef.current?.focus(), 100);
      }
    } catch (err) {
      toast?.error(err?.response?.data?.message || err?.message || 'Could not advance to next question');
    } finally {
      setIsAdvancingQuestion(false);
    }
  };

  // Add simulator feedback task to preparation roadmap
  const handleAddSimulatorTaskToRoadmap = async (taskTitle, category = 'Technical') => {
    if (!appId || !activeSession || !taskTitle) return;
    setAddingTaskToRoadmap(true);
    try {
      const res = await applicationService.addSimulatorTaskToRoadmap(
        appId,
        activeSession.id,
        taskTitle,
        category
      );
      setAddedRoadmapTasks((prev) => new Set(prev).add(taskTitle));
      toast?.success(`"${taskTitle}" added to preparation checklist!`);
      if (onChecklistUpdated) {
        onChecklistUpdated(res?.data || res);
      }
    } catch (err) {
      toast?.error('Failed to add task to roadmap');
    } finally {
      setAddingTaskToRoadmap(false);
    }
  };

  // =========================================================================
  // VIEW: LOBBY & MODE SELECTION
  // =========================================================================
  if (viewMode === 'lobby') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Intro Card */}
        <div style={{
          padding: '1.2rem',
          backgroundColor: '#ffffff',
          border: '1px solid var(--lx-line)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lx-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1.05rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                <Sparkles size={18} color="#2563EB" />
                <span>Personalized AI Interview Simulator</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--lx-txt-2)', marginTop: '3px' }}>
                Practice realistic 1-on-1 interview questions grounded in your target role ({application?.role}) and verified projects. Receive detailed feedback across 6 technical dimensions.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                Target: {application?.role || 'Software Engineer'}
              </span>
            </div>
          </div>

          {/* Active Session Resume Banner if one is waiting */}
          {activeSession && (activeSession.status === 'active' || activeSession.status === 'paused') && (
            <div style={{
              marginTop: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#92400E' }}>
                  Active Simulation Session in Progress ({activeSession.mode?.replace('_', ' ').toUpperCase()})
                </div>
                <div style={{ fontSize: '0.76rem', color: '#B45309', marginTop: '2px' }}>
                  Question {(activeSession.current_question_index || 0) + 1} of {activeSession.total_questions || 3} • Status: {activeSession.status}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button size="sm" variant="primary" onClick={handleResumeActiveSession}>
                  Resume Session
                </Button>
                <Button size="sm" variant="outline" onClick={handleEndSessionEarly}>
                  End Early
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Setup Card */}
        <div style={{
          padding: '1.2rem',
          backgroundColor: '#ffffff',
          border: '1px solid var(--lx-line)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lx-card)'
        }}>
          {/* 1. Mode Selection Grid */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.65rem' }}>
              1. Select Interview Practice Mode
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0.75rem',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {(supportedModes.length > 0 ? supportedModes : [
                { id: 'technical', name: 'Technical Interview', description: 'Job-specific technical questions covering frameworks and CS fundamentals.' },
                { id: 'coding_discussion', name: 'Coding & Problem Solving', description: 'Algorithmic reasoning, time/space complexity, edge cases, and SQL.' },
                { id: 'project_deep_dive', name: 'Project Deep-Dive', description: 'In-depth discussion grounded directly in your verified student projects.' },
                { id: 'behavioral', name: 'Behavioral & HR (STAR)', description: 'Scenario-based behavioral questions evaluated with the STAR framework.' },
                { id: 'weak_topics', name: 'Weak-Topic Revision', description: 'Targeted practice on topics flagged from mock tests and skill gaps.' }
              ]).map((m) => {
                const isSelected = selectedMode === m.id;
                const IconComponent = MODE_ICONS[m.id] || Sparkles;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMode(m.id)}
                    style={{
                      textAlign: 'left',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid var(--lx-blue)' : '1px solid var(--lx-line)',
                      backgroundColor: isSelected ? '#EFF6FF' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.55rem',
                      minWidth: 0,
                      width: '100%',
                      boxSizing: 'border-box',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ minWidth: 0, width: '100%', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem', minWidth: 0 }}>
                        <IconComponent size={16} style={{ flexShrink: 0, color: isSelected ? '#1D4ED8' : 'var(--lx-txt-2)' }} />
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: isSelected ? '#1D4ED8' : 'var(--lx-ink)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {m.name}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--lx-txt-2)', lineHeight: 1.45, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {m.description}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--lx-txt-3)', paddingTop: '0.35rem', borderTop: '1px dashed var(--lx-line)', marginTop: '0.35rem' }}>
                      <span>AI Evaluated + Voice Enabled</span>
                      {isSelected && <Check size={14} style={{ color: 'var(--lx-blue)' }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Controls Grid: Difficulty & Question Count (5 to 15 Questions) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--lx-line)'
          }}>
            {/* Difficulty */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.35rem' }}>
                2. Difficulty Level
              </label>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
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
                        padding: '0.4rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: isSel ? '1px solid var(--lx-blue)' : '1px solid var(--lx-line)',
                        backgroundColor: isSel ? '#EFF6FF' : '#ffffff',
                        color: isSel ? '#1D4ED8' : 'var(--lx-txt-2)',
                        cursor: 'pointer'
                      }}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Count (Updated 5 to 15 Questions) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.35rem' }}>
                3. Session Question Count (5 to 15 Questions)
              </label>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {[5, 8, 10, 12, 15].map((cnt) => {
                  const isSel = selectedQuestionCount === cnt;
                  return (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setSelectedQuestionCount(cnt)}
                      style={{
                        flex: '1 0 45px',
                        padding: '0.4rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: isSel ? '1px solid var(--lx-blue)' : '1px solid var(--lx-line)',
                        backgroundColor: isSel ? '#EFF6FF' : '#ffffff',
                        color: isSel ? '#1D4ED8' : 'var(--lx-txt-2)',
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

          {/* Start Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--lx-line)'
          }}>
            <button
              type="button"
              onClick={() => navigate(`/applications/${appId}/interview`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                border: '1px solid var(--lx-line)',
                background: '#ffffff',
                color: 'var(--lx-ink)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <ExternalLink size={14} color="var(--lx-blue)" />
              <span>Open Dedicated Page</span>
            </button>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStartSession(false)}
                disabled={isStartingSession}
                style={{ fontSize: '0.78rem' }}
              >
                Practice in Modal
              </Button>

              <Button
                variant="primary"
                onClick={() => handleStartSession(true)}
                disabled={isStartingSession}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem', fontWeight: 800 }}
              >
                <Play size={14} />
                <span>{isStartingSession ? 'Launching Simulator...' : 'Start Interview (New Page)'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Previous Simulation Sessions History */}
        <div style={{
          padding: '1.2rem',
          backgroundColor: '#ffffff',
          border: '1px solid var(--lx-line)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lx-card)'
        }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.75rem' }}>
            Previous Simulation History ({pastSessions.length})
          </div>

          {pastSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', border: '1px dashed var(--lx-line)', borderRadius: '10px', backgroundColor: '#fafafa', color: 'var(--lx-txt-3)' }}>
              <Sparkles size={24} style={{ color: 'var(--lx-txt-3)', margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--lx-ink)' }}>No simulation sessions taken yet</div>
              <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                Launch your first interactive practice session above to evaluate your answers with constructive dimension-level feedback.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {pastSessions.map((sess) => {
                const band = sess.summary?.overall_band || 'Competent';
                const bandStyle = SCORE_BAND_COLORS[band] || SCORE_BAND_COLORS.Competent;
                return (
                  <div
                    key={sess.id}
                    style={{
                      padding: '0.75rem 0.95rem',
                      borderRadius: '10px',
                      border: '1px solid var(--lx-line)',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                          {sess.mode?.replace('_', ' ').toUpperCase()} INTERVIEW
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: '4px', backgroundColor: bandStyle.bg, color: bandStyle.text, border: `1px solid ${bandStyle.border}` }}>
                          {band}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--lx-txt-3)' }}>
                          • {sess.status === 'completed' ? 'Completed' : sess.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--lx-txt-3)', marginTop: '2px' }}>
                        {sess.created_at ? new Date(sess.created_at).toLocaleDateString() : 'Recent'} • {Object.keys(sess.answers || {}).length} of {sess.total_questions || 3} questions answered
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReviewingSession(sess);
                        setViewMode('review');
                      }}
                      style={{ fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      Review Session
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: ACTIVE SIMULATOR SESSION
  // =========================================================================
  if (viewMode === 'session' && activeSession) {
    const questions = activeSession.questions || [];
    const currIdx = activeSession.current_question_index || 0;
    const currentQ = questions[currIdx] || {};
    const currKey = String(currIdx);
    const existingEvaluation = activeSession.evaluations?.[currKey];
    const isAnswerEvaluated = Boolean(existingEvaluation);
    const isLastQuestion = currIdx + 1 >= (activeSession.total_questions || questions.length);

    const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;
    const charCount = currentAnswer.length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Session Top HUD Bar */}
        <div style={{
          padding: '0.9rem 1.15rem',
          backgroundColor: '#ffffff',
          border: '1px solid var(--lx-line)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lx-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              {activeSession.mode?.replace('_', ' ').toUpperCase()}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '6px', backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}>
              {activeSession.difficulty?.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
              Question {currIdx + 1} of {activeSession.total_questions || questions.length}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {activeSession.status === 'paused' ? (
              <Button size="sm" variant="outline" onClick={handleResumeActiveSession} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Play size={12} /> Resume
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={handlePauseSession} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Pause size={12} /> Pause
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleEndSessionEarly} style={{ fontSize: '0.78rem', color: '#991B1B' }}>
              End Session
            </Button>
          </div>
        </div>

        {/* Grounding Source Info Pill */}
        {currentQ.grounded_source && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            fontSize: '0.76rem',
            color: '#166534',
            fontWeight: 700
          }}>
            <CheckCircle2 size={13} color="#166534" />
            <span>Grounded In: {currentQ.grounded_source}</span>
          </div>
        )}

        {/* Question Card */}
        <div style={{
          padding: '1.25rem',
          backgroundColor: '#ffffff',
          border: '1px solid var(--lx-line)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lx-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--lx-blue)' }}>
              {currentQ.category || 'Interview Question'}
            </span>
            <button
              type="button"
              onClick={() => setShowConceptHints(!showConceptHints)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--lx-blue)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <span>{showConceptHints ? 'Hide Key Concepts' : 'View Key Concepts'}</span>
              {showConceptHints ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--lx-ink)', lineHeight: 1.45, marginBottom: '0.75rem' }}>
            {currentQ.question_text || currentQ.question}
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--lx-txt-2)', fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            Why this matters: {currentQ.why_relevant}
          </div>

          {/* Collapsible Key Concepts Hint */}
          {showConceptHints && Array.isArray(currentQ.expected_points) && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1E40AF', marginBottom: '0.35rem' }}>
                Key Technical Concepts an Interviewer Looks For:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: '#1E40AF', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {currentQ.expected_points.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Answer Input Section */}
        <div style={{
          padding: '1.25rem',
          backgroundColor: '#ffffff',
          border: '1px solid var(--lx-line)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lx-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                Your Response (Text or Voice)
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--lx-txt-3)' }}>
                {wordCount} words • {charCount} / 5000 chars
              </span>
            </div>

            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={isAnswerEvaluated || isSubmittingAnswer}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '999px',
                border: isListening ? '1.5px solid #EF4444' : '1px solid var(--lx-line)',
                background: isListening ? '#FEE2E2' : '#F8FAFC',
                color: isListening ? '#DC2626' : 'var(--lx-ink)',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isListening ? <MicOff size={13} color="#DC2626" /> : <Mic size={13} color="var(--lx-blue)" />}
              <span>{isListening ? 'Listening (Click to Stop)' : 'Voice Input (Mic)'}</span>
            </button>
          </div>

          <textarea
            ref={answerTextareaRef}
            rows={7}
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            disabled={isAnswerEvaluated || isSubmittingAnswer}
            placeholder={
              activeSession.mode === 'behavioral'
                ? "Structure with STAR: Situation (what happened), Task (your goal), Action (what YOU did), Result (quantifiable impact)..."
                : "Type your detailed technical explanation here. State key architectural decisions, concrete metrics, and operational trade-offs..."
            }
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--lx-line)',
              fontSize: '0.85rem',
              lineHeight: 1.45,
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              backgroundColor: isAnswerEvaluated ? '#F8FAFC' : '#ffffff',
              color: 'var(--lx-ink)'
            }}
          />

          {!isAnswerEvaluated && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <Button
                variant="primary"
                onClick={handleSubmitAnswer}
                disabled={isSubmittingAnswer || currentAnswer.trim().length < 5}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}
              >
                <Send size={14} />
                <span>{isSubmittingAnswer ? 'Evaluating Response...' : 'Submit Answer'}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Evaluation Feedback Card */}
        {existingEvaluation && (
          <div style={{
            padding: '1.25rem',
            backgroundColor: '#ffffff',
            border: '2px solid var(--lx-blue)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lx-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {/* Header: Score Band & Assessment */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--lx-blue)' }}>
                  Evaluation Feedback
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--lx-ink)', marginTop: '2px' }}>
                  {existingEvaluation.overall_assessment}
                </div>
              </div>

              {(() => {
                const band = existingEvaluation.score_band || 'Competent';
                const style = SCORE_BAND_COLORS[band] || SCORE_BAND_COLORS.Competent;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '6px', backgroundColor: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
                      {band} ({existingEvaluation.score_percentage || 75}%)
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* 6 Dimension Ratings Grid */}
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.5rem' }}>
                Competency Breakdown across 6 Dimensions:
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '0.55rem'
              }}>
                {Object.entries(existingEvaluation.dimensions || {}).map(([dimName, dimData]) => {
                  const score = dimData.score || 3;
                  const label = dimName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return (
                    <div
                      key={dimName}
                      style={{
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                          {label}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: score >= 4 ? '#166534' : score >= 3 ? '#1D4ED8' : '#B45309' }}>
                          {score}/5
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--lx-txt-2)', lineHeight: 1.35 }}>
                        {dimData.feedback}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths & Missing Concepts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
              {/* Strengths */}
              <div style={{ padding: '0.75rem', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', fontWeight: 800, color: '#166534', marginBottom: '0.35rem' }}>
                  <CheckCircle2 size={13} color="#166534" />
                  <span>What You Explained Well:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.74rem', color: '#166534', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {(existingEvaluation.what_went_well || ['Good foundational clarity']).map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>

              {/* Missing Concepts */}
              <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', fontWeight: 800, color: '#991B1B', marginBottom: '0.35rem' }}>
                  <AlertCircle size={13} color="#991B1B" />
                  <span>Missing or Deep-Dive Concepts:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.74rem', color: '#991B1B', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {(existingEvaluation.missing_concepts || ['Further system trade-off analysis']).map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actionable Improvement Tip */}
            {existingEvaluation.suggested_improvement && (
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A', fontSize: '0.76rem', color: '#92400E' }}>
                <span style={{ fontWeight: 800 }}>Suggested Improvement: </span>
                {existingEvaluation.suggested_improvement}
              </div>
            )}

            {/* Contextual Follow-up Question */}
            {existingEvaluation.follow_up_question && (
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', fontSize: '0.76rem', color: '#1E40AF' }}>
                <span style={{ fontWeight: 800 }}>Anticipated Follow-up: </span>
                {existingEvaluation.follow_up_question}
              </div>
            )}

            {/* Collapsible Sample Answer */}
            <div>
              <button
                type="button"
                onClick={() => setShowSampleAnswer(!showSampleAnswer)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--lx-blue)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{showSampleAnswer ? 'Hide Sample Reference Answer' : 'View Sample Reference Answer Outline'}</span>
                {showSampleAnswer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showSampleAnswer && (
                <div style={{ marginTop: '0.5rem', padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.78rem', color: 'var(--lx-ink)', lineHeight: 1.45 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--lx-txt-3)', marginBottom: '0.35rem' }}>
                    Reference Guide (Learning Example — Not a Model Script)
                  </div>
                  {existingEvaluation.sample_answer}
                </div>
              )}
            </div>

            {/* Actions: Add to Roadmap & Next Question */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--lx-line)' }}>
              {/* Add to roadmap */}
              {(() => {
                const improvementTopic = existingEvaluation.missing_concepts?.[0] || `Revise ${currentQ.category}`;
                const isAdded = addedRoadmapTasks.has(improvementTopic);
                return (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={addingTaskToRoadmap || isAdded}
                    onClick={() => handleAddSimulatorTaskToRoadmap(improvementTopic, 'Technical')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem' }}
                  >
                    {isAdded ? <Check size={12} color="#166534" /> : <Plus size={12} />}
                    <span>{isAdded ? 'Added to Preparation Checklist' : `Add "${improvementTopic.slice(0, 32)}..." to Roadmap`}</span>
                  </Button>
                );
              })()}

              {/* Next Question / Finish */}
              <Button
                variant="primary"
                onClick={handleAdvanceQuestion}
                disabled={isAdvancingQuestion}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800 }}
              >
                <span>{isLastQuestion ? 'Complete & View Summary' : 'Next Question'}</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW: SESSION COMPLETED / REVIEW
  // =========================================================================
  const sessionToView = viewMode === 'review' ? reviewingSession : activeSession;
  if ((viewMode === 'completed' || viewMode === 'review') && sessionToView) {
    const summary = sessionToView.summary || {};
    const band = summary.overall_band || 'Competent';
    const bandStyle = SCORE_BAND_COLORS[band] || SCORE_BAND_COLORS.Competent;
    const questions = sessionToView.questions || [];
    const evals = sessionToView.evaluations || {};
    const answers = sessionToView.answers || {};

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Celebration / Completion Card */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#ffffff',
          border: '1px solid var(--lx-line)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lx-card)',
          textAlign: 'center'
        }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: bandStyle.bg, border: `1px solid ${bandStyle.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
            <Award size={22} color={bandStyle.text} />
          </div>

          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
            Interview Practice Session Completed!
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--lx-txt-2)', marginTop: '4px', maxWidth: '520px', margin: '4px auto 1rem' }}>
            {sessionToView.mode?.replace('_', ' ').toUpperCase()} Practice • Grounded in {application?.role} requirements
          </div>

          {/* Metrics Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.65rem 1rem', borderRadius: '10px', backgroundColor: bandStyle.bg, border: `1px solid ${bandStyle.border}` }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: bandStyle.text }}>
                {band}
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: bandStyle.text, textTransform: 'uppercase' }}>
                Overall Band ({summary.average_score || 75}%)
              </div>
            </div>

            <div style={{ padding: '0.65rem 1rem', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                {Object.keys(answers).length} / {sessionToView.total_questions || questions.length}
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--lx-txt-3)', textTransform: 'uppercase' }}>
                Questions Answered
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <Button
              variant="outline"
              onClick={() => {
                setViewMode('lobby');
                loadOverview();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RotateCcw size={13} />
              <span>Back to Simulator Lobby</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setViewMode('lobby');
                handleStartSession();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Play size={13} />
              <span>Start Another Session</span>
            </Button>
          </div>
        </div>

        {/* Full Session Q&A Breakdown */}
        <div style={{
          padding: '1.2rem',
          backgroundColor: '#ffffff',
          border: '1px solid var(--lx-line)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lx-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
            Session Questions &amp; Feedback Review
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {questions.map((q, idx) => {
              const k = String(idx);
              const ans = answers[k]?.answer_text;
              const ev = evals[k];

              return (
                <div
                  key={idx}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--lx-line)',
                    backgroundColor: '#FAFAFA',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.55rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                      Q{idx + 1}: {q.question_text || q.question}
                    </div>
                    {ev && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', flexShrink: 0 }}>
                        {ev.score_band}
                      </span>
                    )}
                  </div>

                  {ans ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--lx-txt-2)', backgroundColor: '#ffffff', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontWeight: 700, color: 'var(--lx-ink)' }}>Your Answer: </span>
                      {ans}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'var(--lx-txt-3)', fontStyle: 'italic' }}>
                      No answer recorded for this question.
                    </div>
                  )}

                  {ev && (
                    <div style={{ fontSize: '0.78rem', color: '#166534', backgroundColor: '#F0FDF4', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                      <span style={{ fontWeight: 800 }}>Evaluation: </span>
                      {ev.overall_assessment}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
