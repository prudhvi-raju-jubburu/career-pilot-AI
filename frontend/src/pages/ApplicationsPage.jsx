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
  AlertCircle,
  MoreVertical,
  X,
  Filter,
  Search,
  MoveRight
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SearchInput from '../components/ui/SearchInput';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Badge, { StatusBadge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import { mockApplications } from '../services/mockData';

const STAGES = [
  { id: 'Saved', label: 'Saved', color: 'var(--text-muted)' },
  { id: 'Applied', label: 'Applied', color: 'var(--primary)' },
  { id: 'Interviewing', label: 'Interviewing', color: 'var(--secondary)' },
  { id: 'Offered', label: 'Offered', color: 'var(--success)' },
  { id: 'Rejected', label: 'Rejected', color: 'var(--danger)' },
];

export default function ApplicationsPage() {
  const toast = useToast();
  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem('careerpilot_applications_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return mockApplications;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMobileStage, setSelectedMobileStage] = useState('Interviewing');

  // Form State
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newType, setNewType] = useState('Internship');
  const [newStatus, setNewStatus] = useState('Applied');
  const [newNextAction, setNewNextAction] = useState('');
  const [newNextActionDate, setNewNextActionDate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('careerpilot_applications_v2', JSON.stringify(applications));
  }, [applications]);

  const handleAddApplication = (e) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) {
      toast.error('Please provide company and role name');
      return;
    }

    const newApp = {
      id: `app-${Date.now()}`,
      company: newCompany.trim(),
      role: newRole.trim(),
      type: newType,
      status: newStatus,
      appliedDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      nextAction: newNextAction.trim() || 'Awaiting response',
      nextActionDate: newNextActionDate || 'TBD',
      notes: newNotes.trim() || 'Added manually to tracker',
      timeline: [{ date: new Date().toISOString().split('T')[0], event: `Added to ${newStatus} stage` }],
    };

    setApplications((prev) => [newApp, ...prev]);
    toast.success(`Tracked application for ${newCompany}!`);

    // Reset Form
    setNewCompany('');
    setNewRole('');
    setNewNextAction('');
    setNewNextActionDate('');
    setNewNotes('');
    setShowAddModal(false);
  };

  const handleMoveStage = (appId, targetStatus) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          toast.info(`Moved ${app.company} to ${targetStatus}`);
          return {
            ...app,
            status: targetStatus,
            lastUpdated: new Date().toISOString().split('T')[0],
            timeline: [
              ...app.timeline,
              { date: new Date().toISOString().split('T')[0], event: `Moved to ${targetStatus}` },
            ],
          };
        }
        return app;
      })
    );
  };

  const handleDelete = (appId, company) => {
    setApplications((prev) => prev.filter((a) => a.id !== appId));
    toast.info(`Removed ${company} from your tracker`);
  };

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.company.toLowerCase().includes(q) ||
      app.role.toLowerCase().includes(q) ||
      app.notes.toLowerCase().includes(q)
    );
  });

  return (
    <PageContainer style={{ maxWidth: '1600px', width: '100%' }}>
      {/* 1. Header & Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <h1 className="text-h1" style={{ margin: 0, color: 'var(--text-primary)' }}>
              Application Tracker
            </h1>
            <Badge variant="primary" size="md">
              {applications.length} Tracked
            </Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0 }}>
            Manage and track every job application, technical assessment, and interview round end-to-end.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            icon={<Plus size={16} />}
          >
            Add Application
          </Button>
        </div>
      </div>

      {/* 2. Search & Pipeline Stats Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ maxWidth: '380px', width: '100%' }}>
          <SearchInput
            placeholder="Search tracked companies or roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {STAGES.map((s) => {
            const count = applications.filter((a) => a.status === s.id).length;
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{s.label}:</span>
                <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{count}</strong>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Mobile / Tablet Column Selector (Only visible on screens <= 1024px) */}
      <div className="mobile-kanban-nav" style={{ display: 'none', marginBottom: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
          }}
          className="no-scrollbar"
        >
          {STAGES.map((stage) => {
            const count = filteredApplications.filter((a) => a.status === stage.id).length;
            const isSelected = selectedMobileStage === stage.id;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedMobileStage(stage.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 0.95rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  boxShadow: isSelected ? 'var(--shadow-btn-primary)' : 'none',
                }}
              >
                <span>{stage.label}</span>
                <span
                  style={{
                    fontSize: '0.71875rem',
                    padding: '0.05rem 0.4rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-secondary)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Desktop Kanban Board */}
      <div className="kanban-desktop-board">
        {STAGES.map((stage) => {
          const stageApps = filteredApplications.filter((app) => app.status === stage.id);

          return (
            <div
              key={stage.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                minHeight: '520px',
                overflow: 'hidden',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-raised)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stage.color }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {stage.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.71875rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {stageApps.length}
                </span>
              </div>

              {/* Cards Stream */}
              <div
                style={{
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  flex: 1,
                  overflowY: 'auto',
                }}
              >
                {stageApps.length === 0 ? (
                  <div
                    style={{
                      padding: '2.5rem 1rem',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.8125rem',
                      fontStyle: 'italic',
                    }}
                  >
                    No applications in {stage.label.toLowerCase()}
                  </div>
                ) : (
                  stageApps.map((app) => (
                    <Card
                      key={app.id}
                      variant="raised"
                      style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
                      className="hover-lift"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {app.company}
                          </div>
                          <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                            {app.role}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(app.id, app.company)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                          title="Delete application"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Next Action Box */}
                      {app.nextAction && (
                        <div
                          style={{
                            padding: '0.5rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            fontSize: '0.75rem',
                          }}
                        >
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            Next Step
                          </div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                            {app.nextAction}
                          </div>
                          {app.nextActionDate && (
                            <div style={{ color: 'var(--primary)', fontSize: '0.6875rem', marginTop: '2px' }}>
                              Due: {app.nextActionDate}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Card Bottom: Move status selector & applied timestamp */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          marginTop: '0.35rem',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid var(--border)',
                        }}
                      >
                        <span style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {app.appliedDate ? `Applied ${app.appliedDate}` : 'Bookmarked'}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <select
                            value={app.status}
                            onChange={(e) => handleMoveStage(app.id, e.target.value)}
                            aria-label={`Change stage for ${app.company}`}
                            style={{
                              fontSize: '0.71875rem',
                              fontWeight: 600,
                              padding: '0.2rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border)',
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            {STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Mobile Tabbed Single Column View (Only rendered on mobile) */}
      <div className="kanban-mobile-view" style={{ display: 'none' }}>
        {filteredApplications
          .filter((a) => a.status === selectedMobileStage)
          .map((app) => (
            <Card key={app.id} variant="raised" style={{ padding: '1.25rem', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {app.company}
                  </div>
                  <div style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)' }}>
                    {app.role}
                  </div>
                </div>
                <StatusBadge status={app.status} size="sm" />
              </div>

              {app.nextAction && (
                <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', margin: '0.75rem 0', fontSize: '0.8125rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Next Step</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.nextAction}</div>
                  <div style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '2px' }}>Target: {app.nextActionDate}</div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Applied: {app.appliedDate || 'Saved'}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(app.id, app.company)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
      </div>

      {/* 6. Add Application Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Track New Application"
        description="Add a company and role you applied to or wish to save."
        maxWidth="500px"
      >
        <form onSubmit={handleAddApplication} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Company Name"
            placeholder="e.g. Stripe, Google, Razorpay"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            required
          />

          <Input
            label="Job / Role Title"
            placeholder="e.g. Software Engineering Intern"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            required
          />

          <div className="grid-2">
            <Select
              label="Application Stage"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={STAGES.map((s) => ({ value: s.id, label: s.label }))}
            />

            <Select
              label="Opportunity Type"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              options={['Internship', 'Full-Time', 'Hackathons', 'Coding Contests', 'Scholarships']}
            />
          </div>

          <div className="grid-2">
            <Input
              label="Next Step Action"
              placeholder="e.g. Online Assessment, HR Round"
              value={newNextAction}
              onChange={(e) => setNewNextAction(e.target.value)}
            />

            <Input
              label="Target Date / Deadline"
              type="date"
              value={newNextActionDate}
              onChange={(e) => setNewNextActionDate(e.target.value)}
            />
          </div>

          <Textarea
            label="Notes & Interview Links"
            placeholder="Key notes, recruiter contact, or interview schedule link..."
            rows={3}
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Track Application
            </Button>
          </div>
        </form>
      </Modal>

      <style>{`
        .kanban-desktop-board {
          display: grid;
          grid-template-columns: repeat(5, minmax(260px, 1fr));
          gap: 1.25rem;
          overflow-x: auto;
          padding-bottom: 1.5rem;
        }

        @media (max-width: 1024px) {
          .kanban-desktop-board {
            display: none !important;
          }
          .mobile-kanban-nav {
            display: block !important;
          }
          .kanban-mobile-view {
            display: block !important;
          }
        }
      `}</style>
    </PageContainer>
  );
}
