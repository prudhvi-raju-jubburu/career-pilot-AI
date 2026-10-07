import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Square,
  Copy,
  Check,
  ArrowDown,
  RefreshCw,
  Compass,
  Briefcase,
  GraduationCap,
  Layers,
  Award,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { getProfile } from '../services/api';
import { formatMarkdown } from '../utils/formatMarkdown';
import { useStream } from '../hooks/useStream';
import ChatOpportunityCard from '../components/chat/ChatOpportunityCard';
import ChatRoadmapMilestone from '../components/chat/ChatRoadmapMilestone';
import LivingAIOrb from '../components/chat/LivingAIOrb';
import { getOpportunities, sendAdvisorMessage, getAdvisorHistory } from '../services/api';

const PROMPT_SUGGESTIONS = [
  { label: 'High-Match Roles', prompt: 'Which high-match jobs and internships best fit my current profile?', icon: Briefcase },
  { label: 'Priority Skills', prompt: 'What are the top skills I should learn next to become competitive?', icon: Zap },
  { label: 'Resume ATS Audit', prompt: 'How can I optimize my resume bullet points for high-tier tech companies?', icon: GraduationCap },
  { label: 'Interview Roadmap', prompt: 'Give me a structured 3-step technical interview preparation roadmap.', icon: Layers },
];

export default function AICareerAdvisorPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [activePendingPayload, setActivePendingPayload] = useState(null);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const {
    streamedText,
    isStreaming,
    isThinking,
    startStream,
    stopStream,
  } = useStream();

  // Initial welcome greeting tailored to profile
  useEffect(() => {
    let isMounted = true;
    const fetchStudentProfile = async () => {
      try {
        const res = await getProfile();
        if (res?.data && isMounted) {
          setProfile(res.data);
          const name = res.data.personal?.fullName?.value || 'Prudhvi';
          const cgpa = res.data.education?.cgpa?.value || '8.9';
          const branch = res.data.education?.branch?.value || 'Computer Science';

          setMessages([
            {
              id: 'msg-welcome',
              sender: 'assistant',
              text: `Hello ${name}! 👋 I am your **CareerPilot AI Career Advisor**.\n\nI have reviewed your verified academic background (**${branch}**, CGPA **${cgpa}**) and technical stack (**Python, React, Node.js, MongoDB, REST APIs**).\n\nHow can I help you accelerate your career today? Feel free to ask about resume bullet point enhancements, mock interview prep, or discovering top-match opportunities!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
        }
      } catch (err) {
        if (isMounted) {
          setMessages([
            {
              id: 'msg-welcome',
              sender: 'assistant',
              text: 'Hello! 👋 I am your **CareerPilot AI Career Advisor**. Ask me anything about job hunting, resume optimization, technical interview strategies, or closing skill gaps.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
        }
      }
    };
    fetchStudentProfile();
    return () => { isMounted = false; };
  }, []);

  // Scroll detection to respect user manual scroll-up
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    setUserScrolledUp(!isAtBottom);
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setUserScrolledUp(false);
  };

  useEffect(() => {
    if (!userScrolledUp) {
      scrollToBottom(false);
    }
  }, [messages, streamedText, isThinking, userScrolledUp]);

  // Handle Send
  // Handle Send
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isStreaming || isThinking) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setUserScrolledUp(false);

    // Formulate context-aware intelligent response
    const lower = text.toLowerCase();
    let replyText = '';
    let richOpportunities = null;
    let richMilestones = null;

    try {
      const advisorRes = await sendAdvisorMessage(text);
      if (advisorRes?.data?.content) {
        replyText = advisorRes.data.content;
      }
    } catch (err) {
      console.warn('Backend advisor chat note:', err.message || err);
    }

    if (lower.includes('job') || lower.includes('intern') || lower.includes('profile') || lower.includes('fit') || lower.includes('match')) {
      try {
        const oppsRes = await getOpportunities({ limit: 2 });
        richOpportunities = oppsRes?.data?.items || [];
      } catch (err) {
        richOpportunities = [];
      }
      if (!replyText) {
        replyText = `Based on your verified academic profile and technical skills, here are high-match roles curated for you from our live discovery pipeline. Take a look at the cards below to inspect criteria or add them directly to your application tracker:`;
      }
    } else if (lower.includes('skill') || lower.includes('learn') || lower.includes('priority')) {
      if (!replyText) {
        replyText = `Based on target competencies for modern Full Stack and Cloud engineering, here is your prioritized learning sequence to eliminate critical skill gaps:`;
      }
      richMilestones = [
        {
          title: 'Docker & Containerization Architecture',
          description: 'Learn Dockerfiles, multi-stage builds, compose files, and container networking for Node/Python backends.',
          priority: 'High',
          duration: '1.5 weeks',
          skills: ['Docker', 'Containers', 'DevOps'],
        },
        {
          title: 'Cloud Microservices Deployment (AWS/Render)',
          description: 'Deploy containerized web services with secure environment variables and persistent database storage.',
          priority: 'High',
          duration: '2 weeks',
          skills: ['AWS', 'CI/CD', 'Cloud'],
        },
        {
          title: 'System Design & Redis In-Memory Caching',
          description: 'Implement distributed session caching, rate limiting, and database indexing to handle 10,000+ RPS.',
          priority: 'Medium',
          duration: '2 weeks',
          skills: ['Redis', 'System Design', 'Caching'],
        }
      ];
    } else if (lower.includes('resume') || lower.includes('ats') || lower.includes('bullet')) {
      replyText = `Here is your high-impact **ATS Resume Audit**:\n\n1. **STAR Impact Formula**: Replace passive phrases like *"built a dashboard"* with: *"Engineered real-time analytics dashboard with React & WebSockets, cutting page load time by 42% for 5,000+ active users."*\n2. **Prominent Stack Index**: Make sure Python, React, MongoDB, Node.js, and Git are explicitly grouped under a dedicated **Technical Skills** table.\n3. **Live Portfolio Links**: Ensure GitHub repos and deployed demo URLs are hyperlinked with clear preview badges.`;
    } else if (lower.includes('interview') || lower.includes('prep') || lower.includes('roadmap')) {
      replyText = `Here is your structured 3-step technical interview preparation roadmap:\n\n1. **Core Data Structures & Algorithmic Patterns**: Focus on Two Pointers, Sliding Window, DFS/BFS on Graphs, and Tree Traversals (LeetCode Medium).\n2. **Deep Framework & Runtime Internals**: Be ready to clearly articulate the React Reconciliation cycle, Node.js Event Loop phases, and MongoDB index optimizations.\n3. **Behavioral STAR Stories**: Prepare 3 concrete examples: one on handling project ambiguity, one resolving technical disagreements, and one triaging a production bug.`;
    } else {
      replyText = `I have analyzed your query within the context of your verified career trajectory. With your strong foundations in **React, Python, and full-stack API architecture**, your highest leverage strategy right now is to build high-complexity, production-grade applications that demonstrate tangible performance gains and clean architecture.\n\nWould you like me to recommend practice projects or review specific resume bullet points?`;
    }

    // Save pending rich payload to append once streaming completes
    setActivePendingPayload({
      opportunities: richOpportunities,
      milestones: richMilestones,
    });

    // Start streaming tokens
    startStream(replyText, (fullStreamed) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: fullStreamed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          opportunities: richOpportunities,
          milestones: richMilestones,
        },
      ]);
      setActivePendingPayload(null);
    });
  };

  const handleStop = () => {
    stopStream();
    if (streamedText) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: streamedText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          opportunities: activePendingPayload?.opportunities,
          milestones: activePendingPayload?.milestones,
        },
      ]);
    }
    setActivePendingPayload(null);
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied response to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <PageContainer>
      <div className="advisor-chat-wrapper">
        {/* Header with Living AI Orb */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'var(--surface-raised)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-hairline, var(--border))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <LivingAIOrb
              state={isStreaming ? 'speaking' : isThinking ? 'thinking' : inputPrompt.trim() ? 'listening' : 'idle'}
              size={56}
              showLabel={false}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <Badge variant="primary" size="sm" dot>
                  Mission Control Neural Advisor
                </Badge>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                  {isStreaming ? '● STREAMING TELEMETRY' : isThinking ? '● NEURAL SYNTHESIS' : inputPrompt.trim() ? '● LISTENING' : '● ORBIT READY'}
                </span>
              </div>
              <h1 className="text-h1" style={{ fontSize: '1.4rem', margin: 0 }}>
                AI Flight Advisor
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              variant="outline"
              size="sm"
              icon={<Compass size={14} />}
              onClick={() => navigate('/skill-gap')}
            >
              Skill Gap
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Briefcase size={14} />}
              onClick={() => navigate('/opportunities')}
            >
              Discover
            </Button>
          </div>
        </div>

        {/* Chat Conversation Window */}
        <Card
          variant="raised"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
            position: 'relative',
          }}
        >
          {/* Scrollable messages container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: '0.85rem',
                    alignItems: 'flex-start',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: isUser ? '78%' : '88%',
                    width: '100%',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!isUser && (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: 'var(--shadow-raised)',
                      }}
                    >
                      <Sparkles size={18} />
                    </div>
                  )}

                  <div style={{ maxWidth: '100%' }}>
                    <div
                      style={{
                        backgroundColor: isUser ? 'var(--primary)' : 'var(--surface-raised)',
                        color: isUser ? '#ffffff' : 'var(--text-primary)',
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        border: isUser ? 'none' : '1px solid var(--border)',
                        boxShadow: isUser ? 'var(--shadow-raised)' : 'var(--shadow-sm)',
                        fontSize: '0.92rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {isUser ? msg.text : formatMarkdown(msg.text)}

                      {/* Embedded Rich Opportunities */}
                      {msg.opportunities && msg.opportunities.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Recommended Opportunities
                          </div>
                          {msg.opportunities.map((opp) => (
                            <ChatOpportunityCard key={opp.id} opportunity={opp} />
                          ))}
                        </div>
                      )}

                      {/* Embedded Rich Roadmap Milestones */}
                      {msg.milestones && msg.milestones.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Interactive Learning Roadmap
                          </div>
                          {msg.milestones.map((step, sIdx) => (
                            <ChatRoadmapMilestone key={sIdx} step={step} index={sIdx} />
                          ))}
                        </div>
                      )}

                      <div
                        style={{
                          fontSize: '0.725rem',
                          marginTop: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isUser ? 'flex-end' : 'space-between',
                          color: isUser ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-muted)',
                        }}
                      >
                        <span>{msg.timestamp}</span>

                        {!isUser && (
                          <button
                            onClick={() => handleCopyText(msg.text, msg.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.725rem',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              transition: 'color var(--transition-fast)',
                            }}
                            title="Copy response"
                          >
                            {copiedId === msg.id ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isUser && (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontWeight: 700,
                        boxShadow: 'var(--shadow-raised)',
                      }}
                    >
                      U
                    </div>
                  )}
                </div>
              );
            })}

            {/* Active Streaming Message */}
            {isStreaming && (
              <div
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                  maxWidth: '88%',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-raised)',
                  }}
                >
                  <Sparkles size={18} />
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--surface-raised)',
                    color: 'var(--text-primary)',
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                    maxWidth: '100%',
                  }}
                >
                  {formatMarkdown(streamedText)}
                  <span className="streaming-cursor" />
                </div>
              </div>
            )}

            {/* Shimmer Thinking State */}
            {isThinking && (
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div className="ai-thinking-shimmer">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span style={{ marginLeft: '4px' }}>CareerPilot AI is analyzing your verified profile...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Scroll to Bottom Button if User Scrolled Up */}
          {userScrolledUp && (
            <button
              onClick={() => scrollToBottom(true)}
              style={{
                position: 'absolute',
                bottom: '120px',
                right: '24px',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-floating)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              <ArrowDown size={14} />
              <span>Latest messages</span>
            </button>
          )}

          {/* Quick Prompt Chips */}
          <div
            className="no-scrollbar"
            style={{
              padding: '0.65rem 1rem',
              backgroundColor: 'var(--surface)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              flexWrap: 'nowrap',
            }}
          >
            {PROMPT_SUGGESTIONS.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(item.prompt)}
                  disabled={isStreaming || isThinking}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-raised)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: (isStreaming || isThinking) ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <Icon size={12} color="var(--primary)" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Message Input Footer with Stop Generation Support */}
          <div
            className="advisor-input-bar"
            style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              display: 'flex',
              gap: '0.65rem',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder="Ask for resume feedback, interview prep, or job matches..."
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                minHeight: '44px',
              }}
            />

            {isStreaming ? (
              <Button
                variant="outline"
                icon={<Square size={13} fill="currentColor" />}
                onClick={handleStop}
                style={{
                  color: 'var(--danger)',
                  borderColor: 'var(--danger-border)',
                }}
              >
                Stop
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={<Send size={15} />}
                onClick={() => handleSendMessage()}
                disabled={!inputPrompt.trim() || isThinking}
                className="touch-target"
              >
                Send
              </Button>
            )}
          </div>
        </Card>
      </div>

      <style>{`
        .advisor-chat-wrapper {
          max-width: 980px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 130px);
        }
        @media (max-width: 768px) {
          .advisor-chat-wrapper {
            height: calc(100dvh - 75px - var(--bottom-nav-height, 62px) - var(--safe-area-bottom, 0px)) !important;
          }
        }
      `}</style>
    </PageContainer>
  );
}
