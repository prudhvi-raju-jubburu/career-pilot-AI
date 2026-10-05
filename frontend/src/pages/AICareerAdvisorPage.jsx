import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  User,
  Bot,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Award,
  BookOpen,
  Compass
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { getProfile } from '../services/api';
import { formatMarkdown } from '../utils/formatMarkdown';

const PROMPT_SUGGESTIONS = [
  'What should I learn next?',
  'Which jobs fit my profile?',
  'How can I improve my resume?',
  'Help me prepare for an interview.',
];

export default function AICareerAdvisorPage() {
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        const res = await getProfile();
        if (res?.data) {
          setProfile(res.data);
          const name = res.data.personal?.fullName?.value || 'Prudhvi';
          const cgpa = res.data.education?.cgpa?.value || '8.9';
          const branch = res.data.education?.branch?.value || 'Computer Science';

          // Initial welcome greeting from AI Advisor tailored to user
          setMessages([
            {
              id: 'msg-1',
              sender: 'assistant',
              text: `Hello ${name}! 👋 I am your CareerPilot AI Advisor.\n\nI have reviewed your verified academic background (${branch}, CGPA ${cgpa}) and technical skills (Python, JavaScript, React, Node.js, MongoDB, REST APIs).\n\nHow can I help you accelerate your career preparation today? Feel free to ask about resume bullet point enhancements, mock interview prep, or closing skill gaps for top tech roles!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
        }
      } catch (err) {
        // Fallback default greeting
        setMessages([
          {
            id: 'msg-1',
            sender: 'assistant',
            text: 'Hello! 👋 I am your CareerPilot AI Career Advisor. Ask me anything about job hunting, resume optimization, technical interview strategies, or discovering high-match opportunities.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      }
    };
    fetchStudentProfile();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputPrompt;
    if (!text.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsTyping(true);

    // Simulate intelligent contextual AI response
    setTimeout(() => {
      let aiResponseText = '';
      const lower = text.toLowerCase();

      if (lower.includes('learn next') || lower.includes('skills')) {
        aiResponseText = `Based on your target role (**Full Stack Developer**) and your verified skills (Python, React, MongoDB):\n\n1. **Docker & Containers** (High priority): Learn how to containerize your Node and Python backends and write clean Dockerfiles.\n2. **Cloud Fundamentals** (Medium priority): Deploy a containerized full-stack project to AWS (EC2/S3) or Render.\n3. **System Design Basics**: Focus on database caching with Redis and REST API optimization.\n\nCheck out the **Skill Gap** tab for your full interactive roadmap with courses and practice projects!`;
      } else if (lower.includes('jobs fit') || lower.includes('profile') || lower.includes('fit my profile')) {
        aiResponseText = `With your **8.9 CGPA** in Information Technology/CSE and foundation in React, Node, and Python, here are top roles that match your profile right now:\n\n• **Google Software Engineering Intern** (91% Match — fully eligible)\n• **Stripe Core Platform Intern** (94% Match — excellent backend alignment)\n• **Microsoft SDE Intern** (88% Match — good match for your full-stack projects)\n\nTip: You can view full requirements, check eligibility, and save them directly from the **Opportunities** page!`;
      } else if (lower.includes('resume') || lower.includes('improve my resume')) {
        aiResponseText = `Here are 3 quick improvements you can make to your resume right now:\n\n1. **Quantify Your Impact**: Use the STAR method. Instead of "built React app", write: *"Engineered full-stack app with React & Node.js, reducing API response times by 35% using indexing."*\n2. **Highlight Your Core Stack**: Ensure Python, React, MongoDB, and REST APIs are prominently listed under Skills.\n3. **Add Project Links**: Include GitHub links and live demos for your top 2 portfolio projects.`;
      } else if (lower.includes('interview') || lower.includes('prepare for an interview')) {
        aiResponseText = `Here is a 3-step technical interview preparation plan for tech roles:\n\n1. **Core CS Foundations**: Review Data Structures (Arrays, Trees, HashMaps, Graphs) and practice medium LeetCode questions.\n2. **Framework Fundamentals**: Be ready to explain React lifecycle, hooks (useMemo, useCallback), and Node.js event-loop mechanics.\n3. **Behavioral STAR Stories**: Prepare 2-3 concise stories about a technical bug you solved and how you collaborated with teammates.`;
      } else {
        aiResponseText = `I have analyzed your query with respect to your career trajectory. Since you have strong foundations in full stack engineering (React, Node, Python, MongoDB), your best leverage point is to build high-complexity portfolio systems and showcase direct measurable outcomes in your resume.\n\nWould you like me to recommend specific practice projects or help you optimize a resume bullet point?`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 800);
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
        {/* Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Badge variant="primary" size="sm" dot>
              AI Career Advisor
            </Badge>
          </div>
          <h1 className="text-h1" style={{ fontSize: '1.65rem', marginBottom: '0.25rem' }}>AI Career Advisor</h1>
          <p className="text-small" style={{ fontSize: '0.925rem', color: 'var(--text-secondary)' }}>
            Ask me about your career, skills, resume, or interviews.
          </p>
        </div>

        {/* Chat Conversation Card */}
        <Card variant="raised" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {/* Scrollable messages container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
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
                    maxWidth: '82%',
                  }}
                >
                  {!isUser && (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-600)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: 'var(--shadow-raised-sm)',
                      }}
                    >
                      <Sparkles size={18} />
                    </div>
                  )}

                  <div
                    style={{
                      backgroundColor: isUser ? 'var(--color-primary-600)' : 'var(--color-bg)',
                      color: isUser ? '#ffffff' : 'var(--color-text)',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-lg)',
                      border: isUser ? 'none' : '1px solid var(--border-control)',
                      boxShadow: isUser ? 'var(--shadow-raised-sm)' : 'var(--shadow-sunken)',
                      fontSize: '0.92rem',
                      lineHeight: 1.6,
                    }}
                  >
                    {isUser ? msg.text : formatMarkdown(msg.text)}
                    <div
                      style={{
                        fontSize: '0.725rem',
                        marginTop: '0.5rem',
                        textAlign: isUser ? 'right' : 'left',
                        color: isUser ? 'rgba(255, 255, 255, 0.75)' : 'var(--color-text-muted)',
                      }}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {isUser && (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--border-control)',
                        color: 'var(--color-primary-600)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontWeight: 700,
                        boxShadow: 'var(--shadow-raised-sm)',
                      }}
                    >
                      U
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', margin: '0.25rem 0' }} className="animate-fade-in">
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <Sparkles size={16} />
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--surface-raised)',
                    padding: '0.75rem 1.15rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  aria-label="CareerPilot AI is typing"
                >
                  <span className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                  <span className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary)', animationDelay: '0.2s' }} />
                  <span className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary)', animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

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
            {PROMPT_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-raised)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Message Input Footer */}
          <div
            className="advisor-input-bar"
            style={{
              padding: '1rem 1.25rem',
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
              placeholder="Ask for resume feedback, interview prep, or eligibility..."
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
            <Button
              variant="primary"
              icon={<Send size={16} />}
              onClick={() => handleSendMessage()}
              disabled={!inputPrompt.trim() || isTyping}
              className="touch-target"
            >
              Send
            </Button>
          </div>
        </Card>
      </div>

      <style>{`
        .advisor-chat-wrapper {
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 140px);
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
