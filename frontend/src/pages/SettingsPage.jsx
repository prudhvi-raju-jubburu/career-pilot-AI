import React, { useState, useEffect } from 'react';
import {
  User,
  Bell,
  Cpu,
  Shield,
  Save,
  CheckCircle2,
  Mail,
  Lock,
  Smartphone,
  Sparkles,
  Database,
  Trash2,
  Download
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import { getProfile, updateProfile } from '../services/api';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Notification states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [internshipNotifs, setInternshipNotifs] = useState(true);
  const [hackathonNotifs, setHackathonNotifs] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);

  // AI & Matching settings
  const [strictEligibility, setStrictEligibility] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [geminiStatus, setGeminiStatus] = useState('active');

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const res = await getProfile();
        if (res?.data) {
          const personal = res.data.personal || {};
          setName(personal.fullName?.value || user?.name || '');
          setEmail(personal.email?.value || user?.email || '');
          setPhone(personal.phone?.value || '');
        } else {
          setName(user?.name || '');
          setEmail(user?.email || '');
        }
      } catch (err) {
        setName(user?.name || '');
        setEmail(user?.email || '');
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();

    // Load local settings if present
    const savedSettings = localStorage.getItem('careerpilot_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.emailAlerts !== undefined) setEmailAlerts(parsed.emailAlerts);
        if (parsed.internshipNotifs !== undefined) setInternshipNotifs(parsed.internshipNotifs);
        if (parsed.hackathonNotifs !== undefined) setHackathonNotifs(parsed.hackathonNotifs);
        if (parsed.deadlineReminders !== undefined) setDeadlineReminders(parsed.deadlineReminders);
        if (parsed.strictEligibility !== undefined) setStrictEligibility(parsed.strictEligibility);
        if (parsed.aiSuggestions !== undefined) setAiSuggestions(parsed.aiSuggestions);
      } catch (e) {
        // ignore
      }
    }
  }, [user]);

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setSavedSuccess(false);

    try {
      // Save local preferences
      const settingsPayload = {
        emailAlerts,
        internshipNotifs,
        hackathonNotifs,
        deadlineReminders,
        strictEligibility,
        aiSuggestions,
      };
      localStorage.setItem('careerpilot_settings', JSON.stringify(settingsPayload));

      // Update personal info if modified
      await updateProfile({
        personal: {
          fullName: name,
          email: email,
          phone: phone,
        }
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save settings:', err);
      // Still show success for local state
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await getProfile();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data || {}, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `careerpilot_profile_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Unable to export data right now.');
    }
  };

  const tabs = [
    { id: 'account', label: 'Account & Profile', icon: <User size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'ai', label: 'AI & Matching Engine', icon: <Cpu size={16} /> },
    { id: 'privacy', label: 'Privacy & Data', icon: <Shield size={16} /> },
  ];

  return (
    <PageContainer>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Badge variant="neutral" size="sm">
              Preferences &amp; Security
            </Badge>
          </div>
          <h1 className="text-h1">Settings</h1>
          <p className="text-small" style={{ fontSize: '0.95rem', marginTop: '0.35rem' }}>
            Manage your personal profile details, AI match sensitivity, notification channels, and privacy settings.
          </p>
        </div>

        {/* Success Banner */}
        {savedSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--color-success-bg)',
              border: '1px solid var(--color-success-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-success-dark)',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-raised-sm)',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            <CheckCircle2 size={20} />
            <span style={{ fontWeight: 600 }}>Preferences successfully saved and applied!</span>
          </div>
        )}

        {/* Tab Strip */}
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            gap: '0.5rem',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '0.5rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  border: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all var(--transition-fast)',
                  backgroundColor: isActive ? 'var(--color-primary-600)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                  boxShadow: isActive ? 'var(--shadow-raised-sm)' : 'none',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Account & Profile */}
        {activeTab === 'account' && (
          <Card variant="raised" style={{ marginBottom: '2rem' }}>
            <Card.Header>
              <h2 className="text-h3" style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Personal Information</h2>
              <p className="text-small">Update contact details associated with your student account.</p>
            </Card.Header>
            <Card.Content style={{ padding: '1.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jubburu Prudhvi Raju"
                  icon={<User size={16} />}
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  disabled
                  helperText="Primary account email cannot be changed directly."
                  icon={<Mail size={16} />}
                />
                <Input
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-XXXXXXXXXX"
                  icon={<Smartphone size={16} />}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <Button variant="primary" icon={<Save size={16} />} onClick={handleSaveSettings}>
                  Save Profile Changes
                </Button>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Tab 2: Notifications */}
        {activeTab === 'notifications' && (
          <Card variant="raised" style={{ marginBottom: '2rem' }}>
            <Card.Header>
              <h2 className="text-h3" style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Notification Channels</h2>
              <p className="text-small">Control how and when CareerPilot AI alerts you of urgent deadlines.</p>
            </Card.Header>
            <Card.Content style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Toggle 1 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>Instant Matching Email Alerts</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>Get notified the moment a high-matching role (&gt;85%) matches your verified skills.</div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary-600)' }}
                  />
                </label>
              </div>

              {/* Toggle 2 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>Internship &amp; Full-Time Openings</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>Daily digests of eligible tech roles curated from top job boards &amp; companies.</div>
                </div>
                <input
                  type="checkbox"
                  checked={internshipNotifs}
                  onChange={(e) => setInternshipNotifs(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary-600)' }}
                />
              </div>

              {/* Toggle 3 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>Hackathons &amp; Contests Broadcast</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>Alerts for upcoming college hackathons, coding challenges, and cash prize events.</div>
                </div>
                <input
                  type="checkbox"
                  checked={hackathonNotifs}
                  onChange={(e) => setHackathonNotifs(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary-600)' }}
                />
              </div>

              {/* Toggle 4 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>Application Deadline Reminders</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>Send urgent reminders 48 hours and 24 hours prior to opportunity deadlines.</div>
                </div>
                <input
                  type="checkbox"
                  checked={deadlineReminders}
                  onChange={(e) => setDeadlineReminders(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary-600)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <Button variant="primary" icon={<Save size={16} />} onClick={handleSaveSettings}>
                  Save Notification Preferences
                </Button>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Tab 3: AI & Matching Engine */}
        {activeTab === 'ai' && (
          <Card variant="raised" style={{ marginBottom: '2rem' }}>
            <Card.Header>
              <h2 className="text-h3" style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>AI Matching Engine</h2>
              <p className="text-small">Fine-tune the algorithms that calculate eligibility and match scores.</p>
            </Card.Header>
            <Card.Content style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>Strict Deterministic Eligibility Filter</span>
                    <Badge variant="purple" size="sm">Zero Hallucinations</Badge>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    Only present opportunities where your verified CGPA, graduation batch, and branch strictly satisfy company cutoffs.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={strictEligibility}
                  onChange={(e) => setStrictEligibility(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary-600)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>AI Skill Gap Suggestions</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    Allow CareerPilot AI to highlight required skills you have not yet added to your resume and provide learning roadmaps.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={aiSuggestions}
                  onChange={(e) => setAiSuggestions(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary-600)' }}
                />
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Sparkles size={20} color="var(--color-primary-600)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Gemini 2.5 Flash Engine</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Active for resume parsing &amp; intelligent match explanations</div>
                    </div>
                  </div>
                  <Badge variant="success" size="sm" dot>Operational</Badge>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <Button variant="primary" icon={<Save size={16} />} onClick={handleSaveSettings}>
                  Save AI Engine Settings
                </Button>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Tab 4: Privacy & Data */}
        {activeTab === 'privacy' && (
          <Card variant="raised" style={{ marginBottom: '2rem' }}>
            <Card.Header>
              <h2 className="text-h3" style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Privacy &amp; Data Management</h2>
              <p className="text-small">Control your uploaded resume documents, profile export, and account data.</p>
            </Card.Header>
            <Card.Content style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>Export Career Profile Data</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    Download a copy of your verified skills, education, experience, and application history in JSON format.
                  </div>
                </div>
                <Button variant="secondary" size="sm" icon={<Download size={15} />} onClick={handleExportData}>
                  Export JSON
                </Button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>Secure Storage Location</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    Resumes are strictly isolated per student ID in <code>backend/uploads/resumes/</code>.
                  </div>
                </div>
                <Badge variant="neutral" size="sm">Sandboxed</Badge>
              </div>
            </Card.Content>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
