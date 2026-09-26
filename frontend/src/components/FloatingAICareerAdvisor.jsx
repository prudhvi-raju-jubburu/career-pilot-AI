import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Maximize2,
  RefreshCw,
  Zap,
  CheckCircle2,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProfile } from '../services/api';
import { formatMarkdown } from '../utils/formatMarkdown';

const QUICK_PROMPTS = [
  'How do I tailor my resume for FAANG internships?',
  'Top technical interview questions for React & Python',
  'Am I eligible for Google and Microsoft 2025 roles?',
];

export default function FloatingAICareerAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [profile, setProfile] = useState(null);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Initial greeting
    const loadProfile = async () => {
      let studentName = user?.name || 'there';
      try {
        const res = await getProfile();
        if (res?.data) {
          setProfile(res.data);
          if (res.data.personal?.fullName?.value) {
            studentName = res.data.personal.fullName.value.split(' ')[0];
          }
        }
      } catch (e) {}

      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Hi ${studentName}! 👋 I'm your AI Career Advisor.\n\nNeed quick advice on resume bullet points, interview questions, or discovering high-match opportunities? Ask me anytime!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();

      if (lower.includes('faang') || lower.includes('resume') || lower.includes('tailor')) {
        reply = `To tailor your resume for top tech companies:\n• Use the STAR method (Situation, Task, Action, Result).\n• Quantify metrics (e.g. "reduced latency by 35%").\n• Highlight core technologies: Python, React, SQL/NoSQL databases, and API development.\n• Make sure to review our Skill Gap page to check expected competencies!`;
      } else if (lower.includes('interview') || lower.includes('question')) {
        reply = `Key questions to prepare for:\n1. Explain Virtual DOM & optimization in React (useMemo / useCallback).\n2. Concurrency in Python (GIL vs AsyncIO).\n3. Database indexing (B-Tree vs Hash index).\n4. System Design: Rate limiting & caching with Redis.`;
      } else if (lower.includes('eligible') || lower.includes('google') || lower.includes('microsoft')) {
        reply = `If your CGPA is 8.0 or above in CSE/IT, you meet the academic cutoff for Google, Microsoft, and Goldman Sachs early-career roles! Check out the Opportunities tab for live eligibility breakdowns.`;
      } else {
        reply = `Great question! As your personal career advisor, I recommend focusing on building end-to-end full stack projects and participating in upcoming hackathons to stand out.\n\nYou can also jump into our full AI Advisor Workspace for deep mock interview coaching!`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 800);
  };

  const handleOpenFullWorkspace = () => {
    setIsOpen(false);
    navigate('/ai-advisor');
  };

  return (
    <>
      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div
          className="floating-advisor-drawer"
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '520px',
            maxHeight: 'calc(100vh - 120px)',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-control)',
            boxShadow: 'var(--shadow-raised-lg), 0 20px 40px -10px rgba(0,0,0,0.25)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-accent-600) 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <Sparkles size={18} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>
                  CareerPilot AI Advisor
                </div>
                <div style={{ fontSize: '0.725rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#34d399',
                      display: 'inline-block',
                    }}
                  />
                  <span>Active &amp; Ready</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={handleOpenFullWorkspace}
                title="Open Full Workspace"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  padding: '0.35rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  padding: '0.35rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              backgroundColor: 'var(--color-bg)',
            }}
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      padding: '0.75rem 0.95rem',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      backgroundColor: isUser ? 'var(--color-primary-600)' : 'var(--color-surface)',
                      color: isUser ? '#ffffff' : 'var(--color-text)',
                      boxShadow: isUser ? 'var(--shadow-raised-sm)' : 'var(--shadow-sm)',
                      border: isUser ? 'none' : '1px solid var(--border-control)',
                    }}
                  >
                    {isUser ? m.text : formatMarkdown(m.text)}
                  </div>
                  <span
                    style={{
                      fontSize: '0.675rem',
                      color: 'var(--color-text-muted)',
                      marginTop: '0.2rem',
                      textAlign: isUser ? 'right' : 'left',
                      padding: '0 0.25rem',
                    }}
                  >
                    {m.time}
                  </span>
                </div>
              );
            })}

            {isTyping && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.6rem 0.85rem',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-control)',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <RefreshCw size={12} className="spin" />
                <span>AI Advisor is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--color-surface)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
            }}
          >
            {QUICK_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-control)',
                  backgroundColor: 'var(--color-bg)',
                  fontSize: '0.725rem',
                  color: 'var(--color-text)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--color-surface)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="Ask CareerPilot AI..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                padding: '0.55rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-control)',
                backgroundColor: 'var(--color-bg)',
                fontSize: '0.85rem',
                color: 'var(--color-text)',
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-600)',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() ? 'pointer' : 'default',
                opacity: inputValue.trim() ? 1 : 0.6,
                boxShadow: 'var(--shadow-raised-sm)',
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Logo Badge Button */}
      <div
        className="floating-advisor-button-wrapper"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        {/* Floating Tooltip Pill (visible when closed) */}
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="floating-advisor-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-full)',
              boxShadow: 'var(--shadow-raised-md), 0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid var(--border-control)',
              color: 'var(--color-text)',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'transform var(--transition-fast)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <span>AI Career Advisor</span>
          </div>
        )}

        {/* Circular Glowing Floating Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="floating-advisor-btn"
          aria-label="Toggle AI Career Advisor"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.4)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isOpen ? 'rotate(90deg)' : 'scale(1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = isOpen ? 'rotate(90deg) scale(1.06)' : 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = isOpen ? 'rotate(90deg)' : 'scale(1)')}
        >
          {isOpen ? <X size={26} /> : <Sparkles size={26} />}
        </button>
      </div>
    </>
  );
}
