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
  MoveRight,
  Inbox,
  Bookmark,
  Send,
  Briefcase,
  Award,
  XCircle,
  LayoutGrid,
  Columns,
  Check,
  Sparkles,
  FileText,
  ArrowRight
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
import { useToast } from '../context/ToastContext';
import { mockApplications } from '../services/mockData';

const STAGES = [
  {
    id: 'Saved',
    label: 'Saved',
    icon: Bookmark,
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.12)',
    description: 'Bookmarked opportunities to research, review requirements, and prepare materials for.',
    tagline: 'Researching & Preparing',
  },
  {
    id: 'Applied',
    label: 'Applied',
    icon: Send,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    description: 'Submitted applications currently undergoing automated ATS review and recruiter screening.',
    tagline: 'Under Initial Screening',
  },
  {
    id: 'Interviewing',
    label: 'Interviewing',
    icon: Briefcase,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    description: 'Active interview processes, online assessments, technical coding rounds, and hiring manager calls.',
    tagline: 'Active Rounds & Assessments',
  },
  {
    id: 'Offered',
    label: 'Offered',
    icon: Award,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    description: 'Official job or internship offers received. Review compensation, equipment, and acceptance deadlines.',
    tagline: 'Offer Received & Negotiation',
  },
  {
    id: 'Rejected',
    label: 'Rejected',
    icon: XCircle,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    description: 'Applications not moving forward. Archive recruiter feedback and track cooldown re-application windows.',
    tagline: 'Archived & Future Re-apply',
  },
];

const formatAppDate = (dateStr) => {
  if (!dateStr) return 'Bookmarked';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `Applied ${months[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}`;
    }
    return `Applied ${dateStr}`;
  } catch {
    return `Applied ${dateStr}`;
  }
};

export default function ApplicationsPage() {
  const toast = useToast();
  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem('careerpilot_applications_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return mockApplications;
  });

  const [viewMode, setViewMode] = useState('sections'); // 'sections' | 'kanban'
  const [selectedStage, setSelectedStage] = useState('Interviewing');
  const [selectedAppForDetail, setSelectedAppForDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');

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

  // Sync editing notes when selected app changes
  useEffect(() => {
    if (selectedAppForDetail) {
      setEditingNotes(selectedAppForDetail.notes || '');
    }
  }, [selectedAppForDetail]);

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
      appliedDate: newStatus === 'Saved' ? null : new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      nextAction: newNextAction.trim() || 'Awaiting response',
      nextActionDate: newNextActionDate || 'TBD',
      notes: newNotes.trim() || 'Added to CareerPilot tracker',
      matchScore: 88,
      timeline: [
        { date: new Date().toISOString().split('T')[0], event: `Application tracked in ${newStatus}` },
      ],
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
          const updated = {
            ...app,
            status: targetStatus,
            lastUpdated: new Date().toISOString().split('T')[0],
            timeline: [
              ...(app.timeline || []),
              { date: new Date().toISOString().split('T')[0], event: `Moved to ${targetStatus}` },
            ],
          };
          if (selectedAppForDetail && selectedAppForDetail.id === appId) {
            setSelectedAppForDetail(updated);
          }
          return updated;
        }
        return app;
      })
    );
  };

  const handleSaveNotes = (appId) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          toast.success('Interview notes saved');
          const updated = { ...app, notes: editingNotes };
          setSelectedAppForDetail(updated);
          return updated;
        }
        return app;
      })
    );
  };

  const handleDelete = (appId, company) => {
    setApplications((prev) => prev.filter((a) => a.id !== appId));
    if (selectedAppForDetail && selectedAppForDetail.id === appId) {
      setSelectedAppForDetail(null);
    }
    toast.info(`Removed ${company} from your tracker`);
  };

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.company.toLowerCase().includes(q) ||
      app.role.toLowerCase().includes(q) ||
      (app.notes && app.notes.toLowerCase().includes(q))
    );
  });

  const currentStageObj = STAGES.find((s) => s.id === selectedStage) || STAGES[0];
  const CurrentStageIcon = currentStageObj.icon;
  const selectedStageApps = filteredApplications.filter((app) => app.status === selectedStage);

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
          {/* View Mode Toggle: Horizontal Sections vs Kanban */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--surface)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('sections')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'sections' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'sections' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
              title="Horizontal Sectional View"
            >
              <LayoutGrid size={15} />
              <span>Sections View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'kanban' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'kanban' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
              title="Kanban Board View"
            >
              <Columns size={15} />
              <span>Kanban Board</span>
            </button>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setNewStatus(selectedStage);
              setShowAddModal(true);
            }}
            icon={<Plus size={16} />}
          >
            Add Application
          </Button>
        </div>
      </div>

      {/* 2. Global Search Bar */}
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
        <div style={{ maxWidth: '420px', width: '100%' }}>
          <SearchInput
            placeholder="Search tracked companies, roles, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {STAGES.map((s) => {
            const count = applications.filter((a) => a.status === s.id).length;
            const isCurrent = selectedStage === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStage(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.8125rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.2rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isCurrent ? 'var(--surface-raised)' : 'transparent',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color }} />
                <span style={{ color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isCurrent ? 700 : 500 }}>
                  {s.label}:
                </span>
                <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{count}</strong>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PRIMARY VIEW: HORIZONTAL SECTIONAL LAYOUT */}
      {viewMode === 'sections' && (
        <div className="horizontal-sectional-layout">
          {/* 3A. Horizontal Stage Sections Header Cards */}
          <div className="horizontal-sections-grid">
            {STAGES.map((stage) => {
              const stageApps = applications.filter((a) => a.status === stage.id);
              const isSelected = selectedStage === stage.id;
              const StageIcon = stage.icon;
              const percent = applications.length > 0 ? Math.round((stageApps.length / applications.length) * 100) : 0;

              return (
                <div
                  key={stage.id}
                  onClick={() => setSelectedStage(stage.id)}
                  className={`stage-section-tab ${isSelected ? 'active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedStage(stage.id);
                  }}
                  style={{
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '1.15rem 1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: isSelected ? 'var(--surface-raised)' : 'var(--surface)',
                    border: `2px solid ${isSelected ? stage.color : 'var(--border)'}`,
                    boxShadow: isSelected
                      ? `0 10px 25px -5px ${stage.color}33, var(--shadow-md)`
                      : 'var(--shadow-sm)',
                    transition: 'all var(--transition-normal)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    userSelect: 'none',
                  }}
                >
                  {/* Top Bar: Icon + Label + Count Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: isSelected ? stage.color : stage.bg,
                          color: isSelected ? '#ffffff' : stage.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all var(--transition-fast)',
                          boxShadow: isSelected ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
                        }}
                      >
                        <StageIcon size={16} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.9375rem',
                          fontWeight: 700,
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-primary)',
                        }}
                      >
                        {stage.label}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isSelected ? stage.color : 'var(--bg-secondary)',
                        color: isSelected ? '#ffffff' : 'var(--text-primary)',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {stageApps.length}
                    </span>
                  </div>

                  {/* Tagline / Subtitle */}
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isSelected ? 600 : 400,
                      lineHeight: 1.3,
                    }}
                  >
                    {stage.tagline}
                  </div>

                  {/* Percentage progress indicator */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.35rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.6875rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span>Share of pipeline</span>
                      <span>{percent}%</span>
                    </div>
                    <div
                      style={{
                        height: '4px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--bg-secondary)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${percent}%`,
                          backgroundColor: stage.color,
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Active Triangle Arrow */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '9px solid transparent',
                        borderRight: '9px solid transparent',
                        borderTop: `9px solid ${stage.color}`,
                        zIndex: 3,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* 3B. Section Details Container */}
          <div className="section-details-view animate-fade-in" style={{ marginTop: '1.75rem' }}>
            {/* Active Section Banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '1.25rem 1.5rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: currentStageObj.bg,
                    color: currentStageObj.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    flexShrink: 0,
                  }}
                >
                  <CurrentStageIcon size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {currentStageObj.label} Applications
                    </h2>
                    <Badge variant="primary" size="md">
                      {selectedStageApps.length} {selectedStageApps.length === 1 ? 'Opportunity' : 'Opportunities'}
                    </Badge>
                  </div>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.84375rem', color: 'var(--text-secondary)' }}>
                    {currentStageObj.description}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewStatus(selectedStage);
                    setShowAddModal(true);
                  }}
                  icon={<Plus size={14} />}
                >
                  Add to {currentStageObj.label}
                </Button>
              </div>
            </div>

            {/* Applications Grid in Active Section */}
            {selectedStageApps.length === 0 ? (
              <div
                style={{
                  padding: '4.5rem 2rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    backgroundColor: currentStageObj.bg,
                    color: currentStageObj.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <CurrentStageIcon size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.35rem', color: 'var(--text-primary)' }}>
                    No Applications in {currentStageObj.label}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, maxWidth: '440px', lineHeight: 1.5 }}>
                    You currently have no opportunities tracked under the {currentStageObj.label} stage. Add a new application or move one from another stage above.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setNewStatus(selectedStage);
                    setShowAddModal(true);
                  }}
                  icon={<Plus size={14} />}
                >
                  Track Application in {currentStageObj.label}
                </Button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {selectedStageApps.map((app) => (
                  <Card
                    key={app.id}
                    variant="raised"
                    className="hover-lift"
                    style={{
                      padding: '1.35rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.9rem',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onClick={() => setSelectedAppForDetail(app)}
                  >
                    {/* Top Accent Strip */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        backgroundColor: currentStageObj.color,
                      }}
                    />

                    {/* Company Header & Type Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, var(--surface-raised), var(--surface-hover))',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            fontSize: '1rem',
                            flexShrink: 0,
                          }}
                        >
                          {app.company.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {app.company}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {app.role}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {app.matchScore && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'rgba(59, 130, 246, 0.15)',
                              color: 'var(--primary)',
                            }}
                          >
                            {app.matchScore}% Match
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(app.id, app.company);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                          title="Delete application"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Next Action Box */}
                    {app.nextAction && (
                      <div
                        style={{
                          padding: '0.75rem 0.85rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          fontSize: '0.8125rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            Next Milestone
                          </span>
                          {app.nextActionDate && (
                            <span style={{ color: 'var(--primary)', fontSize: '0.71875rem', fontWeight: 600 }}>
                              Due: {app.nextActionDate}
                            </span>
                          )}
                        </div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {app.nextAction}
                        </div>
                      </div>
                    )}

                    {/* Notes Snippet */}
                    {app.notes && (
                      <div
                        style={{
                          fontSize: '0.78125rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        "{app.notes}"
                      </div>
                    )}

                    {/* Card Footer: Applied Date + Move Stage Pill + View Details Link */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        marginTop: 'auto',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--border)',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        style={{
                          fontSize: '0.71875rem',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <Calendar size={12} style={{ opacity: 0.7 }} />
                        {formatAppDate(app.appliedDate)}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select
                          value={app.status}
                          onChange={(e) => handleMoveStage(app.id, e.target.value)}
                          aria-label={`Change stage for ${app.company}`}
                          className="stage-select-pill"
                          style={{
                            fontSize: '0.71875rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--surface)',
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

                        <button
                          type="button"
                          onClick={() => setSelectedAppForDetail(app)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.71875rem',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.2rem 0.4rem',
                          }}
                        >
                          <span>Details</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SECONDARY VIEW: KANBAN MULTI-COLUMN BOARD */}
      {viewMode === 'kanban' && (
        <div className="kanban-desktop-board">
          {STAGES.map((stage) => {
            const stageApps = filteredApplications.filter((app) => app.status === stage.id);
            const StageIcon = stage.icon;

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
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        border: '1px dashed var(--border)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-secondary)',
                        margin: '0.25rem',
                        gap: '0.5rem',
                        minHeight: '130px',
                      }}
                    >
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <Inbox size={18} />
                      </div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        No {stage.label}
                      </div>
                      <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', maxWidth: '170px', lineHeight: 1.3 }}>
                        Move applications here or track a new one.
                      </div>
                    </div>
                  ) : (
                    stageApps.map((app) => (
                      <Card
                        key={app.id}
                        variant="raised"
                        style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
                        className="hover-lift"
                        onClick={() => setSelectedAppForDetail(app)}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(app.id, app.company);
                            }}
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
                            paddingTop: '0.6rem',
                            borderTop: '1px solid var(--border)',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Calendar size={11} style={{ opacity: 0.7 }} />
                            {formatAppDate(app.appliedDate)}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <select
                              value={app.status}
                              onChange={(e) => handleMoveStage(app.id, e.target.value)}
                              aria-label={`Change stage for ${app.company}`}
                              className="stage-select-pill"
                              style={{
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                padding: '0.2rem 0.5rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'var(--surface)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border)',
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'border-color var(--transition-fast)',
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
      )}

      {/* 5. APPLICATION DETAIL MODAL */}
      <Modal
        isOpen={!!selectedAppForDetail}
        onClose={() => setSelectedAppForDetail(null)}
        title={selectedAppForDetail ? selectedAppForDetail.company : ''}
        description={selectedAppForDetail ? selectedAppForDetail.role : ''}
        maxWidth="680px"
      >
        {selectedAppForDetail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Quick Metrics Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Current Stage
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedAppForDetail.status}
                </div>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Role Type
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedAppForDetail.type || 'Internship'}
                </div>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Profile Match
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                  {selectedAppForDetail.matchScore || 90}%
                </div>
              </div>
            </div>

            {/* Pipeline Stage Stepper */}
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Pipeline Progress Stage (Click to move)
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.35rem',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                }}
              >
                {STAGES.map((s) => {
                  const isActive = selectedAppForDetail.status === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleMoveStage(selectedAppForDetail.id, s.id)}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.2rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: isActive ? s.color : 'transparent',
                        color: isActive ? '#ffffff' : 'var(--text-secondary)',
                        transition: 'all var(--transition-fast)',
                        textAlign: 'center',
                      }}
                      title={`Move to ${s.label}`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Action Milestone Box */}
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  Next Action Required
                </span>
                {selectedAppForDetail.nextActionDate && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Target: {selectedAppForDetail.nextActionDate}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedAppForDetail.nextAction || 'Awaiting response from recruiting team'}
              </div>
            </div>

            {/* Notes & Preparation Scratchpad */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Candidate Notes & Preparation Log
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveNotes(selectedAppForDetail.id)}
                  style={{
                    fontSize: '0.71875rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Save Notes
                </button>
              </div>
              <Textarea
                rows={3}
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                placeholder="Log interview round questions, salary discussions, recruiter contacts, or referral notes..."
              />
            </div>

            {/* Timeline Stream */}
            {selectedAppForDetail.timeline && selectedAppForDetail.timeline.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                  Application Activity History
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedAppForDetail.timeline.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        fontSize: '0.8125rem',
                        position: 'relative',
                        paddingLeft: '0.25rem',
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <Check size={11} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.event}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.71875rem' }}>{item.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div
              style={{
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(selectedAppForDetail.id, selectedAppForDetail.company)}
                icon={<Trash2 size={14} />}
              >
                Delete Application
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedAppForDetail(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
        .horizontal-sections-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
        }

        .kanban-desktop-board {
          display: grid;
          grid-template-columns: repeat(5, minmax(240px, 1fr));
          gap: 1.15rem;
          overflow-x: auto;
          padding-bottom: 1.5rem;
          scrollbar-width: thin;
          scrollbar-color: var(--border-hover) var(--bg-secondary);
        }

        .kanban-desktop-board::-webkit-scrollbar {
          height: 8px;
        }

        .kanban-desktop-board::-webkit-scrollbar-track {
          background: var(--bg-secondary);
          border-radius: var(--radius-full);
        }

        .kanban-desktop-board::-webkit-scrollbar-thumb {
          background: var(--border-hover);
          border-radius: var(--radius-full);
        }

        .kanban-desktop-board::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }

        .stage-select-pill:hover {
          border-color: var(--primary) !important;
        }

        @media (max-width: 1180px) {
          .horizontal-sections-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .horizontal-sections-grid {
            display: flex !important;
            overflow-x: auto !important;
            gap: 0.65rem !important;
            flex-wrap: nowrap !important;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 0.5rem !important;
            scroll-snap-type: x mandatory;
          }
          .stage-section-tab {
            min-width: 140px !important;
            flex-shrink: 0 !important;
            scroll-snap-align: start;
            padding: 0.75rem 0.85rem !important;
          }
        }
      `}</style>
    </PageContainer>
  );
}
