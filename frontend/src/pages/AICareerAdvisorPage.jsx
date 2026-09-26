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
  'How can I improve my resume project bullet points using the STAR method?',
  'What are the top technical interview questions for Full Stack & React roles?',
  'Evaluate my eligibility for Google and Microsoft 2025 internships',
  'What open-source projects can I contribute to with my React & Python skills?',
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

      if (lower.includes('star') || lower.includes('resume') || lower.includes('bullet')) {
        aiResponseText = `Here is how to optimize your project bullets using the **STAR formula** (Situation, Task, Action, Result):\n\n❌ *Weak:* "Built a web app using React and Node.js for users to buy products."\n\n✅ *Strong (STAR):* "Architected an end-to-end full stack e-commerce web platform using React, Node.js, and MongoDB, designing 12+ RESTful API endpoints and reducing average query latency by 35% using indexing."\n\n💡 **Key Tip for Your Profile:** Highlight your quantifiable achievements in Python and React, such as API throughput, database efficiency, or specific user engagement metrics!`;
      } else if (lower.includes('interview') || lower.includes('questions')) {
        aiResponseText = `Based on your technical profile in **React & Python**, here are the top 4 questions you will be asked in tech rounds:\n\n1. **React State & Lifecycle:** Explain how the Virtual DOM works and compare 'useMemo' vs 'useCallback' with real performance examples.\n2. **Python Memory & Concurrency:** What is the Global Interpreter Lock (GIL) and when would you use multiprocessing versus threading or asyncio?\n3. **Database Indexing:** You listed MongoDB and MySQL. Explain B-Tree vs Hash indexes and how you analyze slow queries using EXPLAIN.\n4. **System Design:** How would you design a scalable notification service for real-time deadline alerts?`;
      } else if (lower.includes('google') || lower.includes('microsoft') || lower.includes('internship') || lower.includes('eligibility')) {
        aiResponseText = `Great news! With your **8.9 CGPA** in **Computer Science and Engineering**, you strictly exceed the standard 8.0 CGPA cutoff for both **Google Summer Internships** and **Microsoft SDE Internships**.\n\n📌 **Recommendations to stand out:**\n1. Solidify Data Structures & Algorithms: Practice medium LeetCode problems on Graphs, Dynamic Programming, and Heaps.\n2. Ensure your GitHub contains clean READMEs with architecture diagrams and live demo links.\n3. Apply as early as possible—roles with rolling deadlines review applications in batches!`;
      } else if (lower.includes('open source') || lower.includes('projects')) {
        aiResponseText = `Given your stack in **React, Python, and Node.js**, here are 3 high-impact open-source directions:\n\n1. **FastAPI & LangChain Ecosystems:** Contribute integrations, documentation, and sample apps for AI workflows.\n2. **React Component Libraries:** Look at repositories like Chakra UI or Mantine for "good first issue" tags.\n3. **Postman / REST Tooling:** Build public Postman workspaces demonstrating API testing and CI integration to showcase on your LinkedIn.`;
      } else {
        aiResponseText = `I have analyzed your query with respect to your career trajectory. Since you have strong foundations in full stack engineering (React, Node, Python, SQL/NoSQL), your best leverage point is to build high-complexity portfolio systems and showcase direct measurable outcomes in your resume.\n\nWould you like me to generate a tailored study plan or draft a targeted outreach email to recruiter connections?`;
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
    }, 900);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <PageContainer>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Badge variant="purple" size="sm" dot>
              AI Career Copilot
            </Badge>
          </div>
          <h1 className="text-h1" style={{ fontSize: '1.65rem' }}>AI Career Advisor Workspace</h1>
          <p className="text-small" style={{ fontSize: '0.9rem' }}>
            Personalized guidance grounded in your verified academic credentials and career targets.
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
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
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
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    padding: '0.85rem 1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-control)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <RefreshCw size={14} className="spin" />
                  <span>CareerPilot AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--color-bg)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
            }}
          >
            {PROMPT_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-control)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '0.775rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: 'var(--shadow-raised-sm)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Message Input Footer */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--color-surface)',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for resume optimization, interview questions, or eligibility..."
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-control)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <Button
              variant="primary"
              icon={<Send size={16} />}
              onClick={() => handleSendMessage()}
              disabled={!inputPrompt.trim() || isTyping}
            >
              Send
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
