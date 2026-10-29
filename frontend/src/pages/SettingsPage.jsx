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
  Download,
  AlertCircle
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import {
  getProfile,
  updateProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
  triggerDigestSend
} from '../services/api';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [testingDigest, setTestingDigest] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Notification states (Backed by Mongo Student Profile & NotificationPreferenceModel)
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailDigestEnabled, setEmailDigestEnabled] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState('daily');
  const [preferredTime, setPreferredTime] = useState('09:00');
  const [userTimezone, setUserTimezone] = useState('Asia/Kolkata');
  const [categories, setCategories] = useState(['job', 'internship', 'hackathon', 'scholarship']);
  const [minMatchScore, setMinMatchScore] = useState(70);
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

    const loadNotificationPrefs = async () => {
      try {
        const res = await getNotificationPreferences();
        if (res?.data) {
          const p = res.data;
          if (p.in_app_enabled !== undefined) setInAppEnabled(p.in_app_enabled);
          if (p.email_digest_enabled !== undefined) setEmailDigestEnabled(p.email_digest_enabled);
          if (p.digest_frequency) setDigestFrequency(p.digest_frequency);
          if (p.preferred_time) setPreferredTime(p.preferred_time);
          if (p.timezone) setUserTimezone(p.timezone);
          if (Array.isArray(p.categories) && p.categories.length > 0) setCategories(p.categories);
          if (p.min_match_score !== undefined) setMinMatchScore(p.min_match_score);
          if (p.deadline_reminders !== undefined) setDeadlineReminders(p.deadline_reminders);
        }
      } catch (e) {
        console.warn('Could not load server notification preferences:', e);
      }
    };

    loadProfileData();
    loadNotificationPrefs();

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
      setSavedSuccess(false);
      setErrorMessage(err?.response?.data?.message || 'Failed to persist settings. Please check your network and try again.');
      setTimeout(() => setErrorMessage(''), 4500);
    }
  };

  const handleSaveNotificationPreferences = async (e) => {
    e?.preventDefault();
    setSavedSuccess(false);
    try {
      await updateNotificationPreferences({
        in_app_enabled: inAppEnabled,
        email_digest_enabled: emailDigestEnabled,
        digest_frequency: digestFrequency,
        preferred_time: preferredTime,
        timezone: userTimezone,
        categories: categories,
        min_match_score: minMatchScore,
        deadline_reminders: deadlineReminders
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save notification preferences:', err);
      setSavedSuccess(false);
      setErrorMessage(err?.response?.data?.message || 'Failed to update notification preferences.');
      setTimeout(() => setErrorMessage(''), 4500);
    }
  };

  const handleTriggerTestDigest = async () => {
    setTestingDigest(true);
    try {
      const res = await triggerDigestSend(digestFrequency);
      const data = res?.data || {};
      const total = (data.sent || 0) + (data.simulated || 0);
      alert(`Digest execution triggered!\nFrequency: ${digestFrequency}\nSent/Simulated Deliveries: ${total}\nSkipped: ${data.skipped || 0}\nStatus: Completed`);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to dispatch test digest.');
    } finally {
      setTestingDigest(false);
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

        {/* Error Banner */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.25rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#dc2626',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-raised-sm)',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            <AlertCircle size={20} />
            <span style={{ fontWeight: 600 }}>{errorMessage}</span>
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
              <h2 className="text-h3" style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Notification &amp; Digest Preferences</h2>
              <p className="text-small">Configure real-time in-app alerts, personalized email digests, and delivery schedules.</p>
            </Card.Header>
            <Card.Content style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* In-App Alerts */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>In-App Matching Alerts</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    Display telemetry alerts in the in-app notification center when newly ingested opportunities match your profile.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={inAppEnabled}
                  onChange={(e) => setInAppEnabled(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary-600)' }}
                />
              </div>

              {/* Email Digest Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>Personalized Email Digest</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    Receive a clean, markdown &amp; HTML formatted email summary of top verified opportunities directly to your inbox.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailDigestEnabled}
                  onChange={(e) => setEmailDigestEnabled(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary-600)' }}
                />
              </div>

              {/* Digest Frequency & Schedule */}
              {emailDigestEnabled && (
                <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.4rem' }}>
                      Digest Cadence
                    </label>
                    <select
                      value={digestFrequency}
                      onChange={(e) => setDigestFrequency(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--color-surface-elevated, #fff)',
                        fontSize: '0.875rem',
                        color: 'var(--color-text)'
                      }}
                    >
                      <option value="daily">Daily Morning Digest</option>
                      <option value="weekly">Weekly Summary Digest</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.4rem' }}>
                      Preferred Delivery Time
                    </label>
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--color-surface-elevated, #fff)',
                        fontSize: '0.875rem',
                        color: 'var(--color-text)'
                      }}
                    >
                      <option value="08:00">08:00 AM (Early Bird)</option>
                      <option value="09:00">09:00 AM (Recommended)</option>
                      <option value="12:00">12:00 PM (Midday)</option>
                      <option value="18:00">06:00 PM (Evening)</option>
                      <option value="21:00">09:00 PM (Night Summary)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.4rem' }}>
                      Student Timezone
                    </label>
                    <select
                      value={userTimezone}
                      onChange={(e) => setUserTimezone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--color-surface-elevated, #fff)',
                        fontSize: '0.875rem',
                        color: 'var(--color-text)'
                      }}
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">America/New_York (EST/EDT)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+8)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Categories */}
              <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                  Opportunity Categories of Interest
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                  Only receive notifications and digest items for these selected tracks:
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'job', label: 'Full-Time Jobs' },
                    { id: 'internship', label: 'Internships' },
                    { id: 'hackathon', label: 'Hackathons & Contests' },
                    { id: 'scholarship', label: 'Scholarships' }
                  ].map((cat) => {
                    const isChecked = categories.includes(cat.id);
                    return (
                      <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.875rem', color: 'var(--color-text)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCategories([...categories, cat.id]);
                            } else {
                              if (categories.length > 1) {
                                setCategories(categories.filter((c) => c !== cat.id));
                              }
                            }
                          }}
                          style={{ cursor: 'pointer', accentColor: 'var(--color-primary-600)' }}
                        />
                        <span>{cat.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Minimum Match Score Threshold */}
              <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>
                    Minimum Relevance Match Threshold
                  </div>
                  <Badge variant="primary" size="sm">
                    {minMatchScore}% Fit Minimum
                  </Badge>
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                  Opportunities scoring below this threshold will be excluded from alerts and digests to avoid notification fatigue.
                </div>
                <input
                  type="range"
                  min="40"
                  max="95"
                  step="5"
                  value={minMatchScore}
                  onChange={(e) => setMinMatchScore(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--color-primary-600)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  <span>40% (Broader Reach)</span>
                  <span>70% (Balanced - Default)</span>
                  <span>95% (Laser Focused)</span>
                </div>
              </div>

              {/* Deadline Reminders */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>Application Deadline Reminders</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    Automatically receive urgency alerts 48 hours prior to closing deadlines for all saved and tracked opportunities.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={deadlineReminders}
                  onChange={(e) => setDeadlineReminders(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary-600)' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTriggerTestDigest}
                  disabled={testingDigest}
                  icon={<Mail size={15} />}
                >
                  {testingDigest ? 'Dispatching Test Digest...' : 'Dispatch Test Digest Now'}
                </Button>
                <Button variant="primary" icon={<Save size={16} />} onClick={handleSaveNotificationPreferences}>
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
