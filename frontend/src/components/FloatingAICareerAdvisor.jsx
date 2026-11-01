import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  Maximize2,
  RotateCcw,
  Zap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileText,
  Briefcase,
  GraduationCap,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProfile, sendCopilotMessage } from '../services/api';
import { formatMarkdown } from '../utils/formatMarkdown';
import LivingAIOrb from './chat/LivingAIOrb';

const QUICK_PROMPTS = [
  { label: 'Analyze my resume', query: 'Analyze my uploaded resume for ATS readiness and identify missing technical skills.' },
  { label: 'Jobs matching my profile', query: 'Which job and internship opportunities best match my profile and resume?' },
  { label: 'What skills am I missing?', query: 'What are the critical skill gaps for my target role and how do I bridge them?' },
  { label: 'Prepare for interview', query: 'Prepare me for a technical interview based on my verified projects and skills.' },
  { label: 'Track applications', query: 'What is the status of my active job applications and which should I prioritize?' },
];

export default function FloatingAICareerAdvisor() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [profile, setProfile] = useState(null);
  const [conversationId, setConversationId] = useState(() => {
    return sessionStorage.getItem('cp_floating_conv_id') || null;
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Do not render floating advisor on dedicated advisor page, auth pages, or admin routes
  const isExcluded =
    location.pathname === '/ai-advisor' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/admin');

  // Load student profile & construct grounded greeting
  useEffect(() => {
    if (isExcluded) return;

    let isMounted = true;
    const loadProfile = async () => {
      let studentName = user?.name || 'there';
      let targetRole = 'Software Engineer';
      let hasResume = false;

      try {
        const res = await getProfile();
        if (res?.data && isMounted) {
          setProfile(res.data);
          const fullName =
            res.data.personal?.full_name?.value ||
            res.data.personal?.fullName?.value ||
            res.data.personal?.fullName ||
            res.data.name ||
            '';
          if (fullName) {
            studentName = fullName.trim().split(' ')[0];
          }

          targetRole =
            res.data.target_role?.value ||
            res.data.preferences?.target_roles?.[0] ||
            res.data.personal?.targetRole?.value ||
            'Software Engineer';

          hasResume = Boolean(
            res.data.resume?.file_name ||
            res.data.resume?.fileName ||
            res.data.resume_file
          );
        }
      } catch (err) {
        // Fallback gracefully to authenticated user session
      }

      if (!isMounted) return;

      const welcomeText = user
        ? `Hi **${studentName}**! 👋 I'm your **CareerPilot AI Student Career Copilot**.\n\nConnected to your authenticated CareerPilot data targeting **${targetRole}**${
            hasResume ? ' with your verified uploaded resume loaded' : ''
          }. Ask me anything about job matching, ATS resume audits, interview prep, or closing skill gaps!`
        : `Hi there! 👋 I'm your **CareerPilot AI Student Career Copilot**.\n\nAsk me about job hunting, technical resumes, interview prep, or career acceleration. Sign in to unlock personalized profile and resume grounding!`;

      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: welcomeText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: user ? [{ type: 'profile', title: 'Student Profile', url: '/profile' }] : [],
          suggested_actions: [
            { label: 'Analyze my resume', query: 'Analyze my uploaded resume for ATS readiness and identify missing technical skills.', target_url: '/profile' },
            { label: 'Find matching jobs', query: 'Which job and internship opportunities best match my profile and resume?', target_url: '/opportunities' },
            { label: 'What skills am I missing?', query: 'What are the critical skill gaps for my target role and how do I bridge them?', target_url: '/skill-gap' }
          ]
        }
      ]);
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user, isExcluded]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isTyping) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Connect to personalized Student Career Copilot RAG endpoint
      const res = await sendCopilotMessage(text.trim(), conversationId);
      const rawData = res?.data;
      const resData = rawData?.data || rawData;

      const reply =
        resData?.answer ||
        resData?.reply ||
        resData?.content ||
        resData?.text ||
        rawData?.answer ||
        rawData?.reply ||
        rawData?.content ||
        'I could not generate a response for your inquiry right now. Please try asking again.';

      const newConvId = resData?.conversation_id || conversationId;
      if (newConvId) {
        setConversationId(newConvId);
        sessionStorage.setItem('cp_floating_conv_id', newConvId);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: resData?.message_id || `a-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: resData?.sources || [],
          suggested_actions: resData?.suggested_actions || []
        },
      ]);
    } catch (err) {
      console.warn('Floating copilot request error:', err);
      const errMessage =
        err?.response?.data?.message ||
        'Unable to connect to CareerPilot Copilot. Please check your network connection or try again shortly.';

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          isError: true,
          text: `⚠️ ${errMessage}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggested_actions: [
            { label: 'Retry query', query: text.trim(), target_url: null }
          ]
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setConversationId(null);
    sessionStorage.removeItem('cp_floating_conv_id');
    const studentName = profile?.personal?.fullName?.value?.split(' ')[0] || user?.name || 'there';
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `Chat cleared. Ready for your next career question, **${studentName}**! How can I assist you with your resume, jobs, or interviews?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggested_actions: [
          { label: 'Analyze my resume', query: 'Analyze my uploaded resume for ATS readiness and identify missing technical skills.', target_url: '/profile' },
          { label: 'Find matching jobs', query: 'Which job and internship opportunities best match my profile and resume?', target_url: '/opportunities' },
        ]
      }
    ]);
  };

  const handleOpenFullWorkspace = () => {
    setIsOpen(false);
    navigate('/ai-advisor', {
      state: { conversationId }
    });
  };

  if (isExcluded) return null;

  return (
    <>
      <style>{`
        @keyframes floatDrawerFadeIn {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes userBubblePop {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(6px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes assistantBubblePop {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(6px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes kineticDotBounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          40% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
        @keyframes floatBadgePulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        .custom-floating-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-floating-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-floating-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.35);
          border-radius: 4px;
        }
        .custom-floating-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.6);
        }
      `}</style>

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div
          className="floating-advisor-drawer"
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '410px',
            maxWidth: 'calc(100vw - 32px)',
            height: '570px',
            maxHeight: 'calc(100vh - 120px)',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow: '0 24px 60px -12px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(0, 0, 0, 0.04)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'floatDrawerFadeIn 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1.15rem',
              background: 'linear-gradient(135deg, #090d16 0%, #151c2e 55%, #1e1b4b 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ position: 'relative', width: '32px', height: '32px' }}>
                <LivingAIOrb
                  state={isTyping ? 'thinking' : 'idle'}
                  size={32}
                  showLabel={false}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.925rem', letterSpacing: '-0.01em', color: '#ffffff' }}>
                    CareerPilot Copilot
                  </span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.18)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                    }}
                  >
                    RAG
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '1px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      display: 'inline-block',
                      boxShadow: '0 0 6px #10b981',
                      animation: 'floatBadgePulse 2s infinite',
                    }}
                  />
                  <span>Active &amp; Grounded</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={handleResetChat}
                title="Start new conversation"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  padding: '0.4rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={handleOpenFullWorkspace}
                title="Expand to Full Workspace"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  padding: '0.4rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              >
                <Maximize2 size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize Copilot"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  padding: '0.4rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            className="custom-floating-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9rem',
              backgroundColor: '#f8fafc',
            }}
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: isUser ? 'min(82%, 320px)' : '92%',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: isUser ? 'userBubblePop 0.22s cubic-bezier(0.16, 1, 0.3, 1)' : 'assistantBubblePop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div
                    style={{
                      padding: isUser ? '0.62rem 0.95rem' : '0.85rem 1rem',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      fontSize: '0.84rem',
                      lineHeight: 1.52,
                      backgroundColor: isUser
                        ? '#2563eb'
                        : m.isError
                        ? '#fef2f2'
                        : '#ffffff',
                      backgroundImage: isUser
                        ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                        : 'none',
                      color: isUser
                        ? '#ffffff'
                        : m.isError
                        ? '#b91c1c'
                        : '#1e293b',
                      boxShadow: isUser
                        ? '0 4px 14px rgba(37, 99, 235, 0.28)'
                        : '0 2px 10px rgba(0, 0, 0, 0.04)',
                      border: isUser
                        ? 'none'
                        : m.isError
                        ? '1px solid rgba(239, 68, 68, 0.25)'
                        : '1px solid rgba(226, 232, 240, 0.85)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {isUser ? m.text : formatMarkdown(m.text)}

                    {/* Verified Grounding Sources (if provided by Copilot) */}
                    {!isUser && Array.isArray(m.sources) && m.sources.length > 0 && (
                      <div
                        style={{
                          marginTop: '0.65rem',
                          paddingTop: '0.55rem',
                          borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.35rem',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Verified Sources:
                        </span>
                        {m.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.68rem',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(37, 99, 235, 0.08)',
                              color: '#1d4ed8',
                              fontWeight: 600,
                              cursor: src.url ? 'pointer' : 'default',
                            }}
                            onClick={() => {
                              if (src.url) {
                                setIsOpen(false);
                                navigate(src.url);
                              }
                            }}
                          >
                            <ShieldCheck size={11} color="#2563eb" />
                            {src.title || src.type}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Suggested Follow-up Actions (if provided) */}
                    {!isUser && Array.isArray(m.suggested_actions) && m.suggested_actions.length > 0 && (
                      <div
                        style={{
                          marginTop: '0.65rem',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.35rem',
                        }}
                      >
                        {m.suggested_actions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => {
                              if (act.query) {
                                handleSend(act.query);
                              } else if (act.target_url) {
                                setIsOpen(false);
                                navigate(act.target_url);
                              }
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '3px 8px',
                              borderRadius: '8px',
                              border: '1px solid rgba(37, 99, 235, 0.25)',
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#dbeafe';
                              e.currentTarget.style.borderColor = '#2563eb';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#eff6ff';
                              e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.25)';
                            }}
                          >
                            <Sparkles size={11} />
                            {act.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '0.66rem',
                      color: '#94a3b8',
                      marginTop: '0.2rem',
                      textAlign: isUser ? 'right' : 'left',
                      padding: '0 0.35rem',
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
                  padding: '0.65rem 0.95rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px 16px 16px 4px',
                  border: '1px solid rgba(226, 232, 240, 0.85)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  fontSize: '0.78rem',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  animation: 'assistantBubblePop 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#2563eb',
                      display: 'inline-block',
                      animation: 'kineticDotBounce 1.2s infinite ease-in-out',
                    }}
                  />
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#2563eb',
                      display: 'inline-block',
                      animation: 'kineticDotBounce 1.2s infinite ease-in-out 0.2s',
                    }}
                  />
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#2563eb',
                      display: 'inline-block',
                      animation: 'kineticDotBounce 1.2s infinite ease-in-out 0.4s',
                    }}
                  />
                </div>
                <span>Copilot is reasoning...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div
            style={{
              padding: '0.45rem 0.75rem',
              backgroundColor: '#ffffff',
              borderTop: '1px solid rgba(226, 232, 240, 0.8)',
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
            className="custom-floating-scrollbar"
          >
            {QUICK_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.query)}
                style={{
                  padding: '0.32rem 0.65rem',
                  borderRadius: '14px',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.72rem',
                  color: '#334155',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.color = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.9)';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                <Sparkles size={11} color="#2563eb" />
                {p.label}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <div
            style={{
              padding: '0.65rem 0.85rem',
              backgroundColor: '#ffffff',
              borderTop: '1px solid rgba(226, 232, 240, 0.9)',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask Copilot about resume, jobs, or skills..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              style={{
                flex: 1,
                padding: '0.55rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid rgba(203, 213, 225, 0.8)',
                backgroundColor: '#f8fafc',
                fontSize: '0.84rem',
                color: '#0f172a',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.8)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: inputValue.trim() ? '#2563eb' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() && !isTyping ? 'pointer' : 'default',
                opacity: inputValue.trim() && !isTyping ? 1 : 0.6,
                boxShadow: inputValue.trim() ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Logo Launcher Button */}
      <div
        className="floating-advisor-button-wrapper"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9998,
        }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="floating-advisor-btn"
          aria-label="Toggle CareerPilot AI Advisor"
          title={isOpen ? 'Close Copilot' : 'Open CareerPilot Copilot'}
          style={{
            position: 'relative',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: isOpen
              ? '#0f172a'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: isOpen
              ? '2px solid rgba(255, 255, 255, 0.2)'
              : '2px solid rgba(37, 99, 235, 0.35)',
            boxShadow: isOpen
              ? '0 12px 30px rgba(15, 23, 42, 0.35)'
              : '0 10px 32px rgba(37, 99, 235, 0.28), 0 2px 8px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isOpen ? 'rotate(90deg)' : 'scale(1)',
            padding: 0,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = isOpen
              ? 'rotate(90deg) scale(1.08)'
              : 'scale(1.08)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = isOpen ? 'rotate(90deg)' : 'scale(1)')
          }
        >
          {isOpen ? (
            <X size={24} color="#ffffff" />
          ) : (
            <>
              <img
                src="/careerpilot-logo.png"
                alt="CareerPilot Copilot"
                style={{
                  width: '38px',
                  height: '38px',
                  objectFit: 'contain',
                }}
              />
              {/* Online Green Indicator Dot */}
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  border: '2.5px solid #ffffff',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)',
                }}
              />
            </>
          )}
        </button>
      </div>
    </>
  );
}
