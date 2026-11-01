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
  Layers,
  Award,
  Zap,
  FileText,
  ArrowRight,
  MessageSquare,
  Plus,
  Trash2,
  Clock,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  X,
  PanelLeftClose,
  PanelLeft,
  Bot,
  User,
  RotateCcw,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import {
  getProfile,
  sendCopilotMessage,
  getCopilotConversations,
  getCopilotConversation,
  createCopilotConversation,
  deleteCopilotConversation,
  API_BASE_URL,
} from '../services/api';
import api from '../services/api';
import { formatMarkdown } from '../utils/formatMarkdown';
import { useStream } from '../hooks/useStream';
import LivingAIOrb from '../components/chat/LivingAIOrb';
import { getSafeFieldValue } from '../utils';

const SUGGESTED_PROMPT_CHIPS = [
  {
    label: 'Analyze my resume',
    prompt: 'Analyze my uploaded resume for ATS readiness and identify missing technical skills.',
    icon: FileText
  },
  {
    label: 'Find matching jobs',
    prompt: 'Find active job and internship openings matching my verified profile and skills in CareerPilot.',
    icon: Briefcase
  },
  {
    label: 'What skills am I missing?',
    prompt: 'What mandatory and preferred skills am I missing for my target career role?',
    icon: Zap
  },
  {
    label: 'Track my applications',
    prompt: 'What is the current status of my tracked applications and upcoming interview follow-ups?',
    icon: Layers
  },
  {
    label: 'Prepare for interview',
    prompt: 'Prepare me for upcoming technical interviews with core algorithmic patterns and stack questions.',
    icon: Sparkles
  },
  {
    label: 'Create learning roadmap',
    prompt: 'Create a structured milestone-based learning roadmap to bridge my skill gaps.',
    icon: Compass
  }
];

const HERO_FEATURE_CARDS = [
  {
    title: 'Resume & ATS Audit',
    desc: 'Verify demonstrated project skills and score ATS keyword match.',
    prompt: 'Analyze my uploaded resume for ATS readiness and identify missing technical skills.',
    icon: FileText,
    color: '#3b82f6'
  },
  {
    title: 'Live Matched Opportunities',
    desc: 'Discover verified jobs & internships curated for your skills.',
    prompt: 'Find active job and internship openings matching my verified profile and skills in CareerPilot.',
    icon: Briefcase,
    color: '#10b981'
  },
  {
    title: 'Skill Gap Breakdown',
    desc: 'Find mandatory vs. preferred requirements for your target role.',
    prompt: 'What mandatory and preferred skills am I missing for my target career role?',
    icon: Zap,
    color: '#8b5cf6'
  },
  {
    title: 'Technical Interview Coach',
    desc: 'Practice DSA patterns, system design, and role-specific questions.',
    prompt: 'Prepare me for upcoming technical interviews with core algorithmic patterns and stack questions.',
    icon: Sparkles,
    color: '#f59e0b'
  }
];

export default function AICareerAdvisorPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'healthy' | 'offline' | 'checking'
  const [aiStatus, setAiStatus] = useState({ provider: 'checking', isAvailable: false, fallbackActive: false });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const textareaRef = useRef(null);

  const {
    streamedText,
    isStreaming,
    isThinking,
    streamSources,
    streamActions,
    startSSEStream,
    startStream,
    stopStream,
  } = useStream();

  // 1. Verify actual backend connectivity state
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await api.get('/api/health');
        if (isMounted) {
          if (res?.data?.data?.status === 'healthy' || res?.data?.status === 'healthy') {
            setBackendStatus('healthy');
          } else {
            setBackendStatus('degraded');
          }
          const aiData = res?.data?.data?.ai;
          if (aiData) {
            setAiStatus({
              provider: aiData.active_provider || 'grounded',
              isAvailable: !!aiData.is_ai_available,
              fallbackActive: !!aiData.fallback_active
            });
          }
        }
      } catch (err) {
        if (isMounted) setBackendStatus('offline');
      }
    };
    checkHealth();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch conversations list
  const loadConversations = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const res = await getCopilotConversations();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res) ? res : [];
      setConversations(list);
    } catch (err) {
      console.warn('Could not load copilot conversations:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 3. Initial welcome greeting tailored to verified profile
  useEffect(() => {
    let isMounted = true;
    const fetchStudentProfile = async () => {
      try {
        const res = await getProfile();
        if (res?.data && isMounted) {
          setProfile(res.data);
          const rawName =
            getSafeFieldValue(res.data.personal?.full_name) ||
            getSafeFieldValue(res.data.personal?.fullName) ||
            '';
          const name = rawName ? rawName.trim().split(' ')[0] : 'there';
          const cgpa = getSafeFieldValue(res.data.education?.cgpa);
          const branch = getSafeFieldValue(res.data.education?.branch);
          const targetRole =
            getSafeFieldValue(res.data.target_role) ||
            getSafeFieldValue(res.data.preferences?.target_roles?.[0]) ||
            getSafeFieldValue(res.data.personal?.targetRole) ||
            'Software Engineer';
          
          const realSkills = [];
          if (Array.isArray(res.data.skills)) {
            realSkills.push(...res.data.skills);
          } else if (res.data.skills && typeof res.data.skills === 'object') {
            Object.values(res.data.skills).forEach((cat) => {
              const list = Array.isArray(cat) ? cat : Array.isArray(cat?.value) ? cat.value : [];
              realSkills.push(...list);
            });
          }

          let profileSummaryText = `I am loaded with your authenticated CareerPilot data targeting **${targetRole}**`;
          if (branch) profileSummaryText += ` with background in **${branch}**`;
          if (cgpa) profileSummaryText += ` (CGPA: **${cgpa}**)`;
          if (realSkills.length > 0) {
            profileSummaryText += ` and verified competencies in **${realSkills.slice(0, 5).join(', ')}**`;
          }
          profileSummaryText += '.';

          setMessages([
            {
              id: 'msg-welcome',
              sender: 'assistant',
              text: `Hello ${name}! 👋 I am your **CareerPilot AI Student Career Copilot**.\n\n${profileSummaryText}\n\nI can analyze your resume, compare mandatory skills against live opportunities, track your applications, or prepare you for technical interviews. What would you like to explore today?`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: [
                { type: 'profile', title: 'Student Career Profile', url: '/profile' }
              ],
              suggested_actions: [
                { label: 'Analyze my resume', query: 'Analyze my resume for ATS compliance and missing skills', target_url: '/profile' },
                { label: 'Find matching jobs', query: 'Find jobs matching my profile', target_url: '/opportunities' },
                { label: 'What skills am I missing?', query: 'What skills am I missing for my target role?', target_url: '/skill-gap' }
              ]
            }
          ]);
        }
      } catch (err) {
        if (isMounted) {
          setMessages([
            {
              id: 'msg-welcome',
              sender: 'assistant',
              text: 'Hello! 👋 I am your **CareerPilot AI Student Career Copilot**. Ask me anything about job hunting, resume optimization, technical interview strategies, or closing skill gaps.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: [],
              suggested_actions: []
            }
          ]);
        }
      }
    };
    fetchStudentProfile();
    return () => { isMounted = false; };
  }, []);

  // 4. Scroll management
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

  // 5. Select or switch conversation thread
  const handleSelectConversation = async (convId) => {
    try {
      setIsLoadingHistory(true);
      const res = await getCopilotConversation(convId);
      const conv = res?.data?.data || res?.data || res;
      if (conv && conv.id) {
        setCurrentConversationId(conv.id);
        const mapped = (conv.messages || []).map((m) => ({
          id: m.id || `msg-${Date.now()}-${Math.random()}`,
          sender: m.role === 'user' ? 'user' : 'assistant',
          text: m.content || '',
          timestamp: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          sources: m.sources || [],
          suggested_actions: m.suggested_actions || [],
          intent: m.intent || null,
          provider: m.provider || null
        }));
        setMessages(mapped);
        toast.success(`Loaded conversation: ${conv.title || 'Discussion'}`);
      }
    } catch (err) {
      toast.error('Failed to load conversation history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 6. Start new conversation
  const handleNewConversation = async () => {
    try {
      const res = await createCopilotConversation('New Career Discussion');
      const newConv = res?.data?.data || res?.data || res;
      if (newConv && newConv.id) {
        setCurrentConversationId(newConv.id);
        setConversations((prev) => [newConv, ...prev.filter(c => c.id !== newConv.id)]);
        setMessages([
          {
            id: 'msg-welcome-new',
            sender: 'assistant',
            text: 'Started a new career discussion. How can I assist you with your career goals, resume, or opportunities today?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: [],
            suggested_actions: []
          }
        ]);
        toast.success('Started new conversation');
      }
    } catch (err) {
      setCurrentConversationId(null);
      setMessages([]);
    }
  };

  // 7. Delete conversation
  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await deleteCopilotConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (currentConversationId === convId) {
        setCurrentConversationId(null);
        handleNewConversation();
      }
      toast.success('Conversation deleted');
    } catch (err) {
      toast.error('Could not delete conversation');
    }
  };

  // 8. Handle Send Message
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

    let activeSources = [];
    let activeActions = [];
    let activeIntent = null;

    try {
      await startSSEStream({
        url: `${API_BASE_URL}/api/copilot/stream`,
        payload: {
          message: text,
          conversation_id: currentConversationId,
        },
        onStart: (evt) => {
          if (evt?.conversation_id && !currentConversationId) {
            setCurrentConversationId(evt.conversation_id);
            loadConversations();
          }
          activeIntent = evt?.intent;
        },
        onSources: (srcList) => {
          activeSources = srcList;
        },
        onActions: (actList) => {
          activeActions = actList;
        },
        onDone: (doneEvt) => {
          if (doneEvt?.conversation_id && !currentConversationId) {
            setCurrentConversationId(doneEvt.conversation_id);
            loadConversations();
          }
          const finalFullText = doneEvt?.full_text || '';
          setMessages((prev) => [
            ...prev,
            {
              id: doneEvt?.message_id || `ai-${Date.now()}`,
              sender: 'assistant',
              text: finalFullText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: activeSources.length ? activeSources : (doneEvt?.sources || []),
              suggested_actions: activeActions.length ? activeActions : (doneEvt?.suggested_actions || []),
              intent: activeIntent,
              provider: doneEvt?.provider,
            },
          ]);
        },
        onError: (err) => {
          console.error('Copilot streaming error:', err);
          const errorText = err?.message || 'I encountered an error connecting to CareerPilot services. Please verify your connection or try asking again.';
          toast.error('Failed to get copilot response. Please retry.');
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              sender: 'assistant',
              text: `⚠️ ${errorText}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: [],
              suggested_actions: [
                { label: 'Retry query', query: text, target_url: null }
              ]
            }
          ]);
        }
      });
    } catch (err) {
      console.error('Copilot send error:', err);
      const errorText = err?.message || 'I encountered an error connecting to CareerPilot services.';
      toast.error('Failed to get copilot response. Please retry.');
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ ${errorText}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: [],
          suggested_actions: [
            { label: 'Retry query', query: text, target_url: null }
          ]
        }
      ]);
    }
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
          sources: streamSources || [],
          suggested_actions: streamActions || []
        },
      ]);
    }
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

  // Lock body scroll so outer window never scrolls while on the copilot route
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const studentName = profile?.personal?.full_name?.split(' ')[0] || profile?.personal?.fullName?.split(' ')[0] || 'Student';
  const hasOnlyWelcome = messages.length <= 1;
  const filteredConversations = conversations.filter(c => (c.title || '').toLowerCase().includes(searchFilter.toLowerCase()));

  return (
    <PageContainer hideFooter fullHeight noPadding>
      <div className="copilot-shell">
        {/* Modern Collapsible Sidebar */}
        <aside className={`copilot-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={handleNewConversation}
              className="new-chat-btn"
            >
              New Chat
            </Button>
            <button
              className="sidebar-close-btn"
              onClick={() => setIsSidebarOpen(false)}
              title="Close sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          <div className="sidebar-search">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="conversations-list">
            <div className="section-label">Your Conversations</div>
            {filteredConversations.length === 0 ? (
              <div className="empty-history">
                {isLoadingHistory ? 'Loading history...' : 'No conversations found'}
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = currentConversationId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`conversation-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectConversation(c.id)}
                  >
                    <MessageSquare size={14} className="conv-icon" />
                    <div className="conv-meta">
                      <span className="conv-title">{c.title || 'Career Discussion'}</span>
                      <span className="conv-date">
                        {c.updated_at ? new Date(c.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recently'}
                      </span>
                    </div>
                    <button
                      className="delete-conv-btn"
                      onClick={(e) => handleDeleteConversation(e, c.id)}
                      title="Delete conversation"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="sidebar-footer">
            <div className="status-indicator">
              <span className={`status-dot ${backendStatus === 'healthy' ? 'online' : 'offline'}`} />
              <span>{backendStatus === 'healthy' ? 'CareerPilot Online' : 'Connecting...'}</span>
            </div>
          </div>
        </aside>

        {/* Main Chat Workspace */}
        <main className="copilot-main">
          {/* Top Control Bar */}
          <header className="copilot-topbar">
            <div className="topbar-left">
              {!isSidebarOpen && (
                <button
                  className="sidebar-toggle-btn"
                  onClick={() => setIsSidebarOpen(true)}
                  title="Open conversation history"
                >
                  <PanelLeft size={18} />
                </button>
              )}
              <div className="topbar-branding">
                <LivingAIOrb
                  state={isStreaming ? 'speaking' : isThinking ? 'thinking' : inputPrompt.trim() ? 'listening' : 'idle'}
                  size={32}
                  showLabel={false}
                />
                <div>
                  <div className="copilot-title-row">
                    <h1 className="copilot-title">CareerPilot AI Copilot</h1>
                    <span className="copilot-badge">Grounded RAG</span>
                  </div>
                  <span className="copilot-subtext">Real-time intelligent student career advisor</span>
                </div>
              </div>
            </div>

            <div className="topbar-actions">
              <button
                className="topbar-action-pill"
                onClick={() => navigate('/opportunities')}
                title="Browse active verified opportunities"
              >
                <Briefcase size={13} />
                <span>Jobs Hub</span>
              </button>
              <button
                className="topbar-action-pill"
                onClick={() => navigate('/skill-gap')}
                title="Evaluate skill gaps against target roles"
              >
                <Zap size={13} />
                <span>Skill Arena</span>
              </button>
              <button
                className="topbar-action-pill"
                onClick={() => navigate('/profile')}
                title="View your verified profile and resume"
              >
                <FileText size={13} />
                <span>Resume</span>
              </button>
            </div>
          </header>

          {/* Messages Scroll Area */}
          <div
            className="copilot-messages-container"
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            {hasOnlyWelcome && (
              <div className="copilot-hero-welcome">
                <div className="hero-orb-wrap">
                  <LivingAIOrb
                    state={isStreaming ? 'speaking' : isThinking ? 'thinking' : inputPrompt.trim() ? 'listening' : 'idle'}
                    size={72}
                    showLabel={false}
                  />
                </div>
                <h2 className="hero-heading">Welcome back, {studentName}! 👋</h2>
                <p className="hero-subheading">
                  I am your personalized AI Career Copilot, grounded with your verified academic profile,
                  resume extractions, and live opportunity database.
                </p>

                <div className="hero-features-grid">
                  {HERO_FEATURE_CARDS.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={idx}
                        className="hero-feature-card"
                        onClick={() => handleSendMessage(card.prompt)}
                      >
                        <div className="card-icon-wrap" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                          <Icon size={20} />
                        </div>
                        <div className="card-info">
                          <h4 className="card-title">{card.title}</h4>
                          <p className="card-desc">{card.desc}</p>
                        </div>
                        <ArrowRight size={14} className="card-arrow" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`chat-bubble-row ${isUser ? 'user-row' : 'assistant-row'}`}
                >
                  {!isUser && (
                    <div className="avatar assistant-avatar">
                      <Sparkles size={16} />
                    </div>
                  )}

                  <div className={`chat-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
                    <div className="bubble-body">
                      {isUser ? msg.text : formatMarkdown(msg.text)}
                    </div>

                    {/* Verified CareerPilot Sources Attribution */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="sources-attribution">
                        <span className="sources-label">
                          <ShieldCheck size={12} color="#10b981" /> Verified Sources:
                        </span>
                        {msg.sources.map((s, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => s.url && navigate(s.url)}
                            className="source-pill"
                          >
                            <span>{s.title}</span>
                            {s.url && <ExternalLink size={9} />}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Suggested Next Action Pills */}
                    {!isUser && msg.suggested_actions && msg.suggested_actions.length > 0 && (
                      <div className="action-suggestions">
                        {msg.suggested_actions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={() => {
                              if (act.target_url) {
                                navigate(act.target_url);
                              } else if (act.query) {
                                handleSendMessage(act.query);
                              }
                            }}
                            className="suggestion-pill"
                          >
                            <span>{act.label}</span>
                            <ArrowRight size={10} />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp & Copy Action */}
                    <div className="bubble-footer">
                      <span className="timestamp">{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopyText(msg.text, msg.id)}
                          className="copy-btn"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="avatar user-avatar">
                      {studentName.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Active Streaming Message */}
            {isStreaming && (
              <div className="chat-bubble-row assistant-row">
                <div className="avatar assistant-avatar">
                  <Sparkles size={16} />
                </div>
                <div className="chat-bubble assistant-bubble streaming">
                  <div className="bubble-body">
                    {formatMarkdown(streamedText)}
                    <span className="streaming-cursor" />
                  </div>
                </div>
              </div>
            )}

            {/* Shimmer Thinking State */}
            {isThinking && (
              <div className="chat-bubble-row assistant-row">
                <div className="avatar assistant-avatar">
                  <Sparkles size={16} />
                </div>
                <div className="thinking-bubble">
                  <div className="typing-dots">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                  <span className="thinking-text">CareerPilot is analyzing your profile & live database...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Scroll to Bottom Button */}
          {userScrolledUp && (
            <button
              onClick={() => scrollToBottom(true)}
              className="scroll-bottom-btn"
              title="Scroll to latest messages"
            >
              <ArrowDown size={14} />
              <span>Latest</span>
            </button>
          )}

          {/* Input Dock & Chips Carousel */}
          <footer className="copilot-input-dock">
            <div className="prompt-chips-carousel no-scrollbar">
              {SUGGESTED_PROMPT_CHIPS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    disabled={isStreaming || isThinking}
                    className="prompt-chip"
                  >
                    <Icon size={12} className="chip-icon" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="input-box-wrapper">
              <input
                ref={textareaRef}
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                placeholder="Ask about your resume, missing skills, jobs, or interview prep..."
                className="chat-input"
              />

              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="send-action-btn stop"
                  title="Stop generating"
                >
                  <Square size={14} fill="currentColor" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputPrompt.trim() || isThinking}
                  className={`send-action-btn send ${inputPrompt.trim() ? 'active' : ''}`}
                  title="Send message (Enter)"
                >
                  <Send size={15} />
                </button>
              )}
            </div>

            <div className="input-hint">
              <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for a new line. Grounded on your CareerPilot data.</span>
            </div>
          </footer>
        </main>
      </div>

      <style>{`
        .copilot-shell {
          display: flex;
          height: calc(100vh - 64px);
          height: calc(100dvh - 64px);
          width: 100%;
          max-width: 100%;
          margin: 0;
          background: #ffffff;
          border-radius: 0;
          border: none;
          box-shadow: none;
          overflow: hidden;
          position: relative;
        }

        /* Sidebar Styling */
        .copilot-sidebar {
          width: 280px;
          flex-shrink: 0;
          height: 100%;
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          transition: transform 0.25s ease, width 0.25s ease;
          overflow: hidden;
        }
        .copilot-sidebar.closed {
          width: 0;
          transform: translateX(-100%);
          border-right: none;
          overflow: hidden;
        }
        .sidebar-header {
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .new-chat-btn {
          flex: 1;
          border-radius: 9999px !important;
          font-weight: 600 !important;
        }
        .sidebar-close-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
        }
        .sidebar-close-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
        .sidebar-search {
          padding: 0.5rem 1rem;
          position: relative;
          display: flex;
          align-items: center;
        }
        .sidebar-search .search-icon {
          position: absolute;
          left: 1.5rem;
          color: #94a3b8;
        }
        .sidebar-search .search-input {
          width: 100%;
          padding: 0.45rem 0.5rem 0.45rem 2rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          font-size: 0.8rem;
          color: #1e293b;
          outline: none;
        }
        .conversations-list {
          flex: 1;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 0.5rem 0.75rem;
          min-height: 0;
        }
        .section-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
          padding: 0.5rem 0.5rem 0.25rem;
        }
        .empty-history {
          font-size: 0.775rem;
          color: #94a3b8;
          text-align: center;
          padding: 2rem 0.5rem;
        }
        .conversation-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 0.75rem;
          border-radius: 10px;
          cursor: pointer;
          margin-bottom: 0.25rem;
          transition: background 0.15s ease;
          border: 1px solid transparent;
        }
        .conversation-item:hover {
          background: #f1f5f9;
        }
        .conversation-item.active {
          background: #eff6ff;
          border-color: #bfdbfe;
        }
        .conversation-item .conv-icon {
          color: #2563eb;
          flex-shrink: 0;
        }
        .conversation-item .conv-meta {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .conversation-item .conv-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .conversation-item .conv-date {
          font-size: 0.675rem;
          color: #94a3b8;
          margin-top: 1px;
        }
        .delete-conv-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.15s ease, color 0.15s ease;
        }
        .conversation-item:hover .delete-conv-btn {
          opacity: 1;
        }
        .delete-conv-btn:hover {
          color: #ef4444;
          background: #fee2e2;
        }
        .sidebar-footer {
          padding: 0.75rem 1rem;
          border-top: 1px solid #e2e8f0;
          font-size: 0.75rem;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #64748b;
          font-weight: 500;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot.online {
          background: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
        .status-dot.offline {
          background: #ef4444;
        }

        /* Main Chat Canvas */
        .copilot-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: 100%;
          background: #ffffff;
          position: relative;
          overflow: hidden;
        }
        .copilot-topbar {
          height: 60px;
          padding: 0 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          background: #ffffff;
          z-index: 5;
          flex-shrink: 0;
        }
        .topbar-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .sidebar-toggle-btn {
          background: none;
          border: 1px solid #e2e8f0;
          color: #475569;
          border-radius: 8px;
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .sidebar-toggle-btn:hover {
          background: #f8fafc;
          color: #1e293b;
        }
        .topbar-branding {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .copilot-title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .copilot-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .copilot-badge {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 999px;
          text-transform: uppercase;
        }
        .copilot-subtext {
          font-size: 0.725rem;
          color: #64748b;
          display: block;
        }
        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .topbar-action-pill {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.75rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .topbar-action-pill:hover {
          background: #eff6ff;
          color: #2563eb;
          border-color: #bfdbfe;
        }

        /* Messages Scroll Container */
        .copilot-messages-container {
          flex: 1;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          min-height: 0;
        }

        /* Hero Welcome State */
        .copilot-hero-welcome {
          margin: auto;
          max-width: 680px;
          text-align: center;
          padding: 2rem 1rem;
        }
        .hero-orb-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .hero-heading {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }
        .hero-subheading {
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.5;
          margin-bottom: 2rem;
        }
        .hero-features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.85rem;
          text-align: left;
        }
        .hero-feature-card {
          padding: 1rem;
          border-radius: 14px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.04);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          transition: all 0.2s ease;
        }
        .hero-feature-card:hover {
          border-color: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px -3px rgba(37, 99, 235, 0.08);
        }
        .card-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .card-info {
          flex: 1;
          min-width: 0;
        }
        .card-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 2px;
        }
        .card-desc {
          font-size: 0.725rem;
          color: #64748b;
          margin: 0;
          line-height: 1.35;
        }
        .card-arrow {
          color: #94a3b8;
          transition: transform 0.15s ease;
        }
        .hero-feature-card:hover .card-arrow {
          color: #2563eb;
          transform: translateX(3px);
        }

        /* Message Bubbles */
        .chat-bubble-row {
          display: flex;
          gap: 0.65rem;
          width: 100%;
          align-items: flex-end;
        }
        .user-row {
          justify-content: flex-end;
        }
        .assistant-row {
          justify-content: flex-start;
          align-items: flex-start;
        }
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .assistant-avatar {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
        }
        .user-avatar {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }
        .chat-bubble {
          word-break: break-word;
          position: relative;
        }
        .user-bubble {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          border-radius: 18px 18px 4px 18px;
          width: fit-content;
          max-width: min(72%, 540px);
          padding: 0.65rem 1rem 0.55rem;
          font-size: 0.885rem;
          line-height: 1.45;
          box-shadow: 0 2px 10px -2px rgba(37, 99, 235, 0.35);
          animation: userBubblePop 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: bottom right;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .user-bubble:hover {
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        }
        .assistant-bubble {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          border-radius: 18px 18px 18px 4px;
          max-width: min(85%, 780px);
          width: fit-content;
          padding: 0.95rem 1.25rem;
          font-size: 0.9rem;
          line-height: 1.6;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
          animation: assistantBubblePop 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: bottom left;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .assistant-bubble:hover {
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.07);
        }
        .assistant-bubble.streaming {
          border-color: #93c5fd;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
        }
        @keyframes userBubblePop {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(8px);
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
        .bubble-body {
          word-break: break-word;
        }
        .user-bubble .bubble-body {
          color: #ffffff;
          font-weight: 450;
        }

        /* Sources Attribution */
        .sources-attribution {
          margin-top: 0.85rem;
          padding-top: 0.65rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.4rem;
          font-size: 0.725rem;
        }
        .sources-label {
          color: #64748b;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .source-pill {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 999px;
          padding: 2px 8px;
          color: #2563eb;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          transition: background 0.15s ease;
        }
        .source-pill:hover {
          background: #eff6ff;
        }

        /* Suggested Actions */
        .action-suggestions {
          margin-top: 0.75rem;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .suggestion-pill {
          background: rgba(37, 99, 235, 0.07);
          border: 1px solid rgba(37, 99, 235, 0.22);
          color: #2563eb;
          font-size: 0.725rem;
          font-weight: 700;
          border-radius: 999px;
          padding: 4px 10px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        }
        .suggestion-pill:hover {
          background: #2563eb;
          color: #ffffff;
        }

        /* Bubble Footer */
        .bubble-footer {
          margin-top: 0.4rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.675rem;
        }
        .user-bubble .bubble-footer {
          margin-top: 0.25rem;
          justify-content: flex-end;
          color: rgba(255, 255, 255, 0.75);
          font-weight: 500;
        }
        .assistant-bubble .bubble-footer {
          margin-top: 0.5rem;
          color: #94a3b8;
        }
        .copy-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .copy-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        /* Thinking State */
        .thinking-bubble {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 0.75rem 1rem;
          border-radius: 16px;
        }
        .typing-dots {
          display: flex;
          gap: 4px;
        }
        .typing-dots .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2563eb;
          animation: bounceDot 1.4s infinite ease-in-out both;
        }
        .typing-dots .dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounceDot {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
        .thinking-text {
          font-size: 0.8rem;
          color: #64748b;
        }

        /* Streaming Cursor */
        .streaming-cursor {
          display: inline-block;
          width: 7px;
          height: 15px;
          background-color: #2563eb;
          margin-left: 3px;
          vertical-align: middle;
          animation: blink 0.8s infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        /* Floating Scroll to Bottom */
        .scroll-bottom-btn {
          position: absolute;
          bottom: 125px;
          right: 24px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #1e293b;
          padding: 0.4rem 0.8rem;
          border-radius: 999px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          z-index: 10;
        }

        /* Input Dock */
        .copilot-input-dock {
          background: #ffffff;
          border-top: 1px solid #f1f5f9;
          padding: 0.75rem 1.25rem 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          flex-shrink: 0;
          z-index: 5;
        }
        .prompt-chips-carousel {
          display: flex;
          gap: 0.45rem;
          overflow-x: auto;
          white-space: nowrap;
          padding-bottom: 2px;
        }
        .prompt-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 0.4rem 0.8rem;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #475569;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .prompt-chip:hover {
          background: #eff6ff;
          color: #2563eb;
          border-color: #bfdbfe;
        }
        .chip-icon {
          color: #2563eb;
        }
        .input-box-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 0.35rem 0.5rem 0.35rem 1rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .input-box-wrapper:focus-within {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .chat-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 0.9rem;
          color: #0f172a;
          outline: none;
          min-height: 38px;
        }
        .send-action-btn {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .send-action-btn.send {
          background: #e2e8f0;
          color: #94a3b8;
        }
        .send-action-btn.send.active {
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
        }
        .send-action-btn.send.active:hover {
          background: #1d4ed8;
        }
        .send-action-btn.stop {
          width: auto;
          padding: 0 0.85rem;
          gap: 4px;
          background: #fee2e2;
          color: #ef4444;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .send-action-btn.stop:hover {
          background: #fecaca;
        }
        .input-hint {
          text-align: center;
          font-size: 0.7rem;
          color: #94a3b8;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .copilot-shell {
            height: calc(100dvh - 75px - var(--bottom-nav-height, 62px));
            border-radius: 0;
            border: none;
          }
          .copilot-sidebar {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 30;
            width: 82% !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          }
          .hero-features-grid {
            grid-template-columns: 1fr;
          }
          .chat-bubble {
            max-width: 90%;
          }
          .topbar-actions {
            display: none;
          }
        }
      `}</style>
    </PageContainer>
  );
}
