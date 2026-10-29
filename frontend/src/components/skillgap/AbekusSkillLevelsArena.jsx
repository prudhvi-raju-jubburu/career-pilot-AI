import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  Trophy,
  X,
  Check,
  BookOpen
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const COURSES = [
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms',
    category: 'Fundamentals',
    gradient: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
    iconBg: '#ffffff',
    iconColor: '#1D4ED8',
    badge: 'DSA',
    hours: '24h',
    questions: '1,540 MCQs',
    rating: '4.9',
    description: 'Master arrays, trees, dynamic programming, graphs, and system design edge cases with instant explanations.',
    verified: true,
    skillKey: 'Data Structures & Algorithms',
    quiz: {
      question: 'What is the time complexity to find an element in a balanced Binary Search Tree (AVL / Red-Black) with N nodes?',
      options: [
        { key: 'A', text: 'O(1)' },
        { key: 'B', text: 'O(log N)', correct: true },
        { key: 'C', text: 'O(N)' },
        { key: 'D', text: 'O(N log N)' },
      ],
      explanation: 'A balanced Binary Search Tree guarantees that the height is bounded by O(log N). At each node comparison, half of the remaining sub-tree is eliminated, yielding O(log N) worst-case lookup time.'
    }
  },
  {
    id: 'python-mastery',
    title: 'Python Interview Mastery',
    category: 'Interview Mastery',
    gradient: 'linear-gradient(135deg, #15803D 0%, #166534 100%)',
    iconBg: '#ffffff',
    iconColor: '#15803D',
    badge: 'PY',
    hours: '14h',
    questions: '1.24k MCQs',
    rating: '4.8',
    description: 'Crack Python interviews focused on memory internals, decorators, generators, and tricky concurrency edge cases.',
    verified: true,
    skillKey: 'Python',
    quiz: {
      question: 'What is the evaluation of bool([]) == bool([0]) in Python?',
      options: [
        { key: 'A', text: 'True' },
        { key: 'B', text: 'False', correct: true },
        { key: 'C', text: 'None' },
        { key: 'D', text: 'TypeError' },
      ],
      explanation: 'In Python, an empty sequence [] evaluates to False in a boolean context, whereas a non-empty sequence [0] evaluates to True regardless of its elements. Therefore, False == True evaluates to False.'
    }
  },
  {
    id: 'sql-analysts',
    title: 'SQL for High-Scale Systems',
    category: 'Fundamentals',
    gradient: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
    iconBg: '#ffffff',
    iconColor: '#0284C7',
    badge: 'SQL',
    hours: '18h',
    questions: '2.15k MCQs',
    rating: '4.9',
    description: 'Write performant queries, window functions, indexing strategies, and database query plan optimizations.',
    verified: true,
    skillKey: 'SQL',
    quiz: {
      question: 'Which index type is optimal in PostgreSQL / MySQL for range queries (e.g. WHERE salary BETWEEN 50000 AND 90000)?',
      options: [
        { key: 'A', text: 'Hash Index' },
        { key: 'B', text: 'B-Tree Index', correct: true },
        { key: 'C', text: 'GIN Index' },
        { key: 'D', text: 'BRIN Index' },
      ],
      explanation: 'B-Tree indexes maintain sorted leaf nodes linked via bidirectional pointers. This enables an initial O(log N) lookup to the start boundary followed by efficient sequential page scans across the range.'
    }
  },
  {
    id: 'genai-prompt',
    title: 'Agentic AI & Prompt Engineering',
    category: 'Exam Prep',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    iconBg: '#ffffff',
    iconColor: '#7C3AED',
    badge: 'AI',
    hours: '12h',
    questions: '980 MCQs',
    rating: '5.0',
    description: 'Learn modern LLM tool-calling, agentic loop architectures, RAG pipelines, and production evaluation criteria.',
    verified: true,
    skillKey: 'Artificial Intelligence',
    quiz: {
      question: 'In modern agentic workflows (ReAct / Tool-Calling), what is the primary purpose of the Observation step?',
      options: [
        { key: 'A', text: 'Fine-tuning neural network weights via backpropagation' },
        { key: 'B', text: 'Ingesting tool execution output back into context for next-step reasoning', correct: true },
        { key: 'C', text: 'Compressing system prompt tokens' },
        { key: 'D', text: 'Validating JSON schema without model invocation' },
      ],
      explanation: 'In the ReAct (Reason + Act) loop, the agent executes a tool and receives the observation. The observation is fed back into the prompt context so the LLM inspects real API output and decides whether to take another action or return the final answer.'
    }
  }
];

export default function AbekusSkillLevelsArena({ onSelectCourse, onSkillVerified }) {
  const [activeTab, setActiveTab] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [earnedXP, setEarnedXP] = useState(false);

  const filteredCourses = activeTab === 'All'
    ? COURSES
    : COURSES.filter((c) => c.category === activeTab);

  const handleStartCourse = (course) => {
    setSelectedCourse(course);
    setSelectedOption(null);
    setShowExplanation(false);
    setEarnedXP(false);
    if (onSelectCourse) onSelectCourse(course);
  };

  const handleSelectOption = (optKey) => {
    setSelectedOption(optKey);
    setShowExplanation(true);
    const opt = selectedCourse?.quiz?.options?.find((o) => o.key === optKey);
    if (opt?.correct) {
      setEarnedXP(true);
    }
  };

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      {/* Course Catalog Filter Bar matching Screenshot */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--lx-ink, #0E1116)', margin: 0, letterSpacing: '-0.035em' }}>
            All Verified Certification Courses
          </h2>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.88rem', color: 'var(--lx-txt-2, #64748B)' }}>
            High-yield technical question banks with verified recruiter certificates.
          </p>
        </div>

        <div className="lx-filter-tabs">
          {['All', 'Fundamentals', 'Interview Mastery', 'Exam Prep'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`lx-filter-tab ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Courses 4-Grid matching Screenshot */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {filteredCourses.map((course) => (
          <motion.div
            key={course.id}
            whileHover={{ y: -6, boxShadow: '0 20px 40px -8px rgba(14, 17, 22, 0.15)' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '1px solid var(--lx-line, #E2E8F0)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 20px rgba(14, 17, 22, 0.05)',
            }}
          >
            {/* Top Color Banner */}
            <div
              style={{
                background: course.gradient,
                height: '105px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                color: '#ffffff',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  color: course.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
                }}
              >
                {course.badge}
              </div>
              <div style={{ fontSize: '1.18rem', fontWeight: 800, lineHeight: 1.22, letterSpacing: '-0.02em' }}>
                {course.title}
              </div>
            </div>

            {/* Course Card Body */}
            <div style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span
                  style={{
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--lx-line, #CBD5E1)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--lx-txt-2, #64748B)',
                  }}
                >
                  {course.category}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--lx-ink, #0E1116)' }}>
                  <span style={{ color: '#FFC400' }}>★</span>
                  <span>{course.rating}</span>
                </div>
              </div>

              <p style={{ margin: '0 0 1.15rem 0', fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--lx-txt-2, #64748B)', flex: 1 }}>
                {course.description}
              </p>

              {/* Badges: AI Tutor & Certificate & Stats */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1.15rem', alignItems: 'center' }}>
                <span className="lx-pill lx-pill-violet" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                  <Sparkles size={11} />
                  <span>AI Tutor</span>
                </span>
                <span className="lx-pill lx-pill-gold" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                  <Award size={11} />
                  <span>Certificate</span>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--lx-txt-3, #94A3B8)', marginLeft: 'auto' }}>
                  {course.hours} · {course.questions}
                </span>
              </div>

              {/* Start Free CTA Pill */}
              <button
                type="button"
                className="lx-btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.65rem 1rem' }}
                onClick={() => handleStartCourse(course)}
              >
                <span>Start Free</span>
                <span className="arrow-circle" style={{ width: '28px', height: '28px' }}>
                  <ArrowRight size={14} />
                </span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Interactive Assessment Modal when student clicks Start Free */}
      {selectedCourse && (
        <Modal
          isOpen={Boolean(selectedCourse)}
          onClose={() => setSelectedCourse(null)}
          title={`${selectedCourse.title} · Rapid Skill Assessment`}
          size="lg"
        >
          <div style={{ padding: '0.5rem 0' }}>
            {/* Top header badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: selectedCourse.gradient, color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800 }}>
                  {selectedCourse.badge}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Question 1 of 1 · Verified Assessment
                </span>
              </div>
              <span className="lx-pill lx-pill-gold" style={{ fontSize: '0.75rem' }}>
                <Trophy size={12} />
                <span>+25 XP</span>
              </span>
            </div>

            {/* Question title */}
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {selectedCourse.quiz.question}
            </div>

            {/* Options */}
            <div style={{ display: 'grid', gap: '0.65rem', marginBottom: '1.25rem' }}>
              {selectedCourse.quiz.options.map((opt) => {
                const isSelected = selectedOption === opt.key;
                const isCorrect = opt.correct;
                let bg = 'var(--surface-raised, #ffffff)';
                let border = '1px solid var(--border)';
                let textColor = 'var(--text-primary)';

                if (showExplanation) {
                  if (isCorrect) {
                    bg = 'rgba(16, 185, 129, 0.12)';
                    border = '1.5px solid #10b981';
                    textColor = '#047857';
                  } else if (isSelected) {
                    bg = 'rgba(239, 68, 68, 0.1)';
                    border = '1.5px solid #ef4444';
                    textColor = '#b91c1c';
                  }
                }

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelectOption(opt.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      backgroundColor: bg,
                      border: border,
                      color: textColor,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <span
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        backgroundColor: showExplanation && isCorrect ? '#10b981' : isSelected ? 'var(--primary)' : 'var(--bg-secondary)',
                        color: (showExplanation && isCorrect) || isSelected ? '#ffffff' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {opt.key}
                    </span>
                    <span>{opt.text}</span>
                    {showExplanation && isCorrect && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={14} /> Correct
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* AI Tutor Explanation */}
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'var(--surface-sunken, #f8fafc)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '1rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.35rem' }}>
                  <Sparkles size={14} />
                  <span>AI Tutor Explanation</span>
                </div>
                {selectedCourse.quiz.explanation}
              </motion.div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="ghost" onClick={() => setSelectedCourse(null)}>
                Close
              </Button>
              {earnedXP && onSkillVerified && (
                <Button
                  variant="primary"
                  onClick={() => {
                    onSkillVerified(selectedCourse.skillKey);
                    setSelectedCourse(null);
                  }}
                  icon={<ShieldCheck size={16} />}
                >
                  Verify &amp; Add Skill to Profile
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
