import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  ChevronRight,
  TrendingUp,
  FileCheck,
  AlertCircle,
  MoreVertical,
  X
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

const DEFAULT_APPLICATIONS = [
  {
    id: 'app-1',
    company: 'Google',
    role: 'Software Engineering Intern — Summer 2025',
    type: 'Internship',
    stage: 'interview', // wishlist, applied, assessment, interview, offer
    appliedDate: '2025-09-15',
    deadline: '2025-10-30',
    notes: 'Completed technical phone screen. Round 2 Coding Interview scheduled on Google Meet.',
    compensation: '₹1,20,000 / mo',
  },
  {
    id: 'app-2',
    company: 'Microsoft',
    role: 'Full Stack Developer Intern',
    type: 'Internship',
    stage: 'assessment',
    appliedDate: '2025-09-20',
    deadline: '2025-10-15',
    notes: 'Online assessment link received via Codility. 3 algorithmic tasks.',
    compensation: '₹1,00,000 / mo',
  },
  {
    id: 'app-3',
    company: 'Flipkart',
    role: 'Flipkart GRiD 6.0 — Software Track',
    type: 'Contest',
    stage: 'applied',
    appliedDate: '2025-09-22',
    deadline: '2025-10-18',
    notes: 'Team registered. Problem statement submission in progress.',
    compensation: '₹5,00,000 Prize',
  },
  {
    id: 'app-4',
    company: 'Amazon',
    role: 'SDE-1 (Full Time 2023-2025)',
    type: 'Full-Time',
    stage: 'wishlist',
    appliedDate: '2025-09-24',
    deadline: '2025-11-01',
    notes: 'Need to review AWS services and Low Level Design before applying.',
    compensation: '₹28,00,000 / yr',
  },
];

const STAGES = [
  { id: 'wishlist', label: 'Saved / Wishlist', variant: 'neutral' },
  { id: 'applied', label: 'Applied', variant: 'primary' },
  { id: 'assessment', label: 'Online Assessment', variant: 'purple' },
  { id: 'interview', label: 'Interview Scheduled', variant: 'accent' },
  { id: 'offer', label: 'Offer Received', variant: 'success' },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'

  // New Application Form State
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newType, setNewType] = useState('Internship');
  const [newStage, setNewStage] = useState('applied');
  const [newDeadline, setNewDeadline] = useState('');
  const [newCompensation, setNewCompensation] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('careerpilot_applications');
    if (saved) {
      try {
        setApplications(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    setApplications(DEFAULT_APPLICATIONS);
  }, []);

  const saveApplicationsToStorage = (updated) => {
    setApplications(updated);
    localStorage.setItem('careerpilot_applications', JSON.stringify(updated));
  };

  const handleStageChange = (appId, nextStage) => {
    const updated = applications.map((app) =>
      app.id === appId ? { ...app, stage: nextStage } : app
    );
    saveApplicationsToStorage(updated);
  };

  const handleDelete = (appId) => {
    const updated = applications.filter((app) => app.id !== appId);
    saveApplicationsToStorage(updated);
  };

  const handleAddApplication = (e) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) return;

    const newApp = {
      id: `app-${Date.now()}`,
      company: newCompany,
      role: newRole,
      type: newType,
      stage: newStage,
      appliedDate: new Date().toISOString().split('T')[0],
      deadline: newDeadline || '2025-11-30',
      compensation: newCompensation || 'Competitive',
      notes: newNotes,
    };

    const updated = [newApp, ...applications];
    saveApplicationsToStorage(updated);

    // Reset Form
    setNewCompany('');
    setNewRole('');
    setNewDeadline('');
    setNewCompensation('');
    setNewNotes('');
    setShowAddModal(false);
  };

  // Metrics
  const totalCount = applications.length;
  const appliedCount = applications.filter((a) => a.stage === 'applied').length;
  const assessmentCount = applications.filter((a) => a.stage === 'assessment').length;
  const interviewCount = applications.filter((a) => a.stage === 'interview').length;
  const offerCount = applications.filter((a) => a.stage === 'offer').length;

  return (
    <PageContainer>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Badge variant="primary" size="sm" dot>
                Application Pipeline
              </Badge>
            </div>
            <h1 className="text-h1">Applications Tracker</h1>
            <p className="text-small" style={{ fontSize: '0.95rem', marginTop: '0.35rem' }}>
              Monitor your job and internship search pipeline from discovery through interviews and final offers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowAddModal(true)}
            >
              Add Application
            </Button>
          </div>
        </div>

        {/* Pipeline Summary Metrics */}
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          <Card variant="raised">
            <Card.Content style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Active
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.25rem' }}>
                {totalCount}
              </div>
            </Card.Content>
          </Card>

          <Card variant="raised">
            <Card.Content style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Assessments
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-accent-600)', marginTop: '0.25rem' }}>
                {assessmentCount}
              </div>
            </Card.Content>
          </Card>

          <Card variant="raised">
            <Card.Content style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Interviews
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-600)', marginTop: '0.25rem' }}>
                {interviewCount}
              </div>
            </Card.Content>
          </Card>

          <Card variant="raised">
            <Card.Content style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Offers Received
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success-dark)', marginTop: '0.25rem' }}>
                {offerCount}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Kanban Board */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
            gap: '1.25rem',
            alignItems: 'flex-start',
          }}
        >
          {STAGES.map((stage) => {
            const stageApps = applications.filter((a) => a.stage === stage.id);
            return (
              <div
                key={stage.id}
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem',
                  border: '1px solid var(--border-subtle)',
                  minHeight: '400px',
                  boxShadow: 'var(--shadow-sunken)',
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {stage.label}
                  </span>
                  <Badge variant={stage.variant} size="sm">
                    {stageApps.length}
                  </Badge>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {stageApps.length === 0 ? (
                    <div style={{ padding: '2rem 0.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      No applications in this stage
                    </div>
                  ) : (
                    stageApps.map((app) => (
                      <div
                        key={app.id}
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          border: '1px solid var(--border-control)',
                          boxShadow: 'var(--shadow-raised-sm)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                            {app.company}
                          </span>
                          <button
                            onClick={() => handleDelete(app.id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px' }}
                            title="Delete Application"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div style={{ fontSize: '0.825rem', color: 'var(--color-primary-600)', fontWeight: 600 }}>
                          {app.role}
                        </div>

                        {app.notes && (
                          <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', lineHeight: 1.4, backgroundColor: 'var(--color-bg)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                            {app.notes}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          <span>Deadline: {app.deadline}</span>
                          <span style={{ fontWeight: 600, color: 'var(--color-success-dark)' }}>{app.compensation}</span>
                        </div>

                        {/* Move Stage Selector */}
                        <div style={{ marginTop: '0.25rem' }}>
                          <select
                            value={app.stage}
                            onChange={(e) => handleStageChange(app.id, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.35rem 0.5rem',
                              fontSize: '0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-control)',
                              backgroundColor: 'var(--color-surface)',
                              color: 'var(--color-text)',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            {STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                Move to: {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Application Modal */}
        {showAddModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '1.5rem',
            }}
            onClick={() => setShowAddModal(false)}
          >
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '540px',
                width: '100%',
                boxShadow: 'var(--shadow-raised-lg)',
                padding: '2rem',
                border: '1px solid var(--border-control)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="text-h3" style={{ margin: 0 }}>Add Application</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddApplication} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Input
                  label="Company Name"
                  placeholder="e.g. Google, Atlassian, Microsoft"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  required
                />
                <Input
                  label="Role Title"
                  placeholder="e.g. Software Engineer Intern"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  required
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text)' }}>
                      Initial Stage
                    </label>
                    <select
                      value={newStage}
                      onChange={(e) => setNewStage(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.875rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-control)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text)',
                      }}
                    >
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Application Deadline"
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                  />
                </div>

                <Input
                  label="Stipend / Salary"
                  placeholder="e.g. ₹80,000 / month"
                  value={newCompensation}
                  onChange={(e) => setNewCompensation(e.target.value)}
                />

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text)' }}>
                    Interview / Application Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Applied via referral, OA due next Friday..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-control)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Save to Tracker
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
