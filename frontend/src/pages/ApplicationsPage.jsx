import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  ChevronLeft,
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
  ArrowRight,
  Compass,
  ArrowUpRight,
  GripVertical,
  RotateCcw,
  Zap
} from 'lucide-react';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import confetti from 'canvas-confetti';
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
import { applicationService, notifyApplicationsUpdated } from '../services/applicationService';
import DndKanbanBoard from '../components/applications/DndKanbanBoard';
import ApplicationCalendarView from '../components/applications/ApplicationCalendarView';

const STAGES = [
  {
    id: 'Saved',
    label: 'Saved',
    icon: Bookmark,
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.12)',
    description: 'Bookmarked opportunities to research, review requirements, and prepare materials for.',
    tagline: 'Researching & Preparing',
    nextStage: 'Applied',
    nextLabel: 'Advance to Applied',
    nextIcon: Send,
    prevStage: null,
  },
  {
    id: 'Applied',
    label: 'Applied',
    icon: Send,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    description: 'Submitted applications currently undergoing automated ATS review and recruiter screening.',
    tagline: 'Under Initial Screening',
    nextStage: 'Interviewing',
    nextLabel: 'Advance to Interviewing',
    nextIcon: Briefcase,
    prevStage: 'Saved',
  },
  {
    id: 'Interviewing',
    label: 'Interviewing',
    icon: Briefcase,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    description: 'Active interview processes, online assessments, technical coding rounds, and hiring manager calls.',
    tagline: 'Active Rounds & Assessments',
    nextStage: 'Offered',
    nextLabel: 'Mark as Offered',
    nextIcon: Award,
    prevStage: 'Applied',
  },
  {
    id: 'Offered',
    label: 'Offered',
    icon: Award,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    description: 'Official job or internship offers received. Review compensation, equipment, and acceptance deadlines.',
    tagline: 'Offer Received & Negotiation',
    nextStage: null,
    nextLabel: null,
    prevStage: 'Interviewing',
  },
  {
    id: 'Rejected',
    label: 'Rejected',
    icon: XCircle,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    description: 'Applications not moving forward. Archive recruiter feedback and track cooldown re-application windows.',
    tagline: 'Archived & Future Re-apply',
    nextStage: 'Saved',
    nextLabel: 'Re-activate to Saved',
    nextIcon: RotateCcw,
    prevStage: null,
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem('careerpilot_applications_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState('sections'); // 'sections' | 'kanban' | 'calendar'
  const [selectedStage, setSelectedStage] = useState('ALL'); // 'ALL' or stage id ('Saved' | 'Applied' | etc.)
  const [selectedAppForDetail, setSelectedAppForDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');

  // Drag and Drop & Inter-section transfer state
  const [activeDraggingApp, setActiveDraggingApp] = useState(null);
  const [lastTransferred, setLastTransferred] = useState(null);

  // Form State
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newType, setNewType] = useState('Internship');
  const [newStatus, setNewStatus] = useState('Applied');
  const [newNextAction, setNewNextAction] = useState('');
  const [newNextActionDate, setNewNextActionDate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  // Auto-dismiss transfer banner after 8 seconds
  useEffect(() => {
    if (lastTransferred) {
      const timer = setTimeout(() => {
        setLastTransferred(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [lastTransferred]);

  // Fetch applications from server on mount
  useEffect(() => {
    let active = true;
    const loadApps = async () => {
      setLoading(true);
      try {
        const data = await applicationService.getApplications();
        if (active && Array.isArray(data)) {
          setApplications(data);
          localStorage.setItem('careerpilot_applications_v2', JSON.stringify(data));
        }
      } catch (err) {
        console.warn('Could not load applications from server:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadApps();
    return () => { active = false; };
  }, []);

  // Listen for real-time updates from Opportunities page or storage events
  useEffect(() => {
    const handleSync = async () => {
      try {
        const data = await applicationService.getApplications();
        if (Array.isArray(data)) {
          setApplications(data);
          localStorage.setItem('careerpilot_applications_v2', JSON.stringify(data));
        }
      } catch (e) {}
    };
    window.addEventListener('careerpilot_applications_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('careerpilot_applications_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Handle URL deep link queries: ?appId=... or ?oppId=... / ?opportunityId=...
  useEffect(() => {
    const appIdParam = searchParams.get('appId');
    const oppIdParam = searchParams.get('opportunityId') || searchParams.get('oppId');
    if (!appIdParam && !oppIdParam) return;

    const matched = applications.find(
      (a) =>
        (appIdParam && (a.id === appIdParam || a.opportunityId === appIdParam)) ||
        (oppIdParam && a.opportunityId === oppIdParam)
    );

    if (matched) {
      setSelectedStage(matched.status);
      setSelectedAppForDetail(matched);
    }
  }, [searchParams, applications]);

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

  const handleAddApplication = async (e) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) {
      toast.error('Please provide company and role name');
      return;
    }

    const payload = {
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

    try {
      const created = await applicationService.addApplication(payload);
      setApplications((prev) => [created, ...prev.filter(a => a.id !== created.id)]);
      toast.success(`Tracked application for ${newCompany}!`);

      // Reset Form
      setNewCompany('');
      setNewRole('');
      setNewNextAction('');
      setNewNextActionDate('');
      setNewNotes('');
      setShowAddModal(false);
    } catch (err) {
      toast.error('Failed to create application on server');
    }
  };

  const handleMoveStage = async (appId, targetStatus) => {
    const prevApps = [...applications];
    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp) return;

    const oldStatus = targetApp.status;
    if (oldStatus === targetStatus) return;

    // Trigger confetti on Offer
    if (targetStatus === 'Offer' || targetStatus === 'Offered') {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b']
      });
      toast.success(`🎉 Congratulations on your offer from ${targetApp.company}!`);
    } else {
      toast.info(`Moved ${targetApp.company} from ${oldStatus} to ${targetStatus}`);
    }

    // Set floating transfer notification
    setLastTransferred({
      app: targetApp,
      fromStage: oldStatus,
      toStage: targetStatus,
    });

    const updated = {
      ...targetApp,
      status: targetStatus,
      lastUpdated: new Date().toISOString().split('T')[0],
      timeline: [
        ...(targetApp.timeline || []),
        { date: new Date().toISOString().split('T')[0], event: `Moved from ${oldStatus} to ${targetStatus}` },
      ],
    };

    setApplications((prev) => prev.map((app) => (app.id === appId ? updated : app)));
    if (selectedAppForDetail && selectedAppForDetail.id === appId) {
      setSelectedAppForDetail(updated);
    }
    notifyApplicationsUpdated({ action: 'update', appId, status: targetStatus, app: updated });

    // Optimistic sync with backend
    try {
      await applicationService.updateStage(appId, targetStatus);
    } catch (err) {
      setApplications(prevApps);
      notifyApplicationsUpdated({ action: 'sync_error' });
      toast.error('Failed to sync stage update with server. Rolled back.');
    }
  };

  const handleSaveNotes = async (appId) => {
    try {
      await applicationService.updateApplication(appId, { notes: editingNotes });
      setApplications((prev) =>
        prev.map((app) => {
          if (app.id === appId) {
            const updated = { ...app, notes: editingNotes };
            if (selectedAppForDetail && selectedAppForDetail.id === appId) {
              setSelectedAppForDetail(updated);
            }
            return updated;
          }
          return app;
        })
      );
      toast.success('Interview notes saved');
    } catch (err) {
      toast.error('Failed to save notes to server');
    }
  };

  const handleDelete = async (appId, company) => {
    try {
      await applicationService.deleteApplication(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      if (selectedAppForDetail && selectedAppForDetail.id === appId) {
        setSelectedAppForDetail(null);
      }
      toast.info(`Removed ${company} from your tracker`);
    } catch (err) {
      toast.error('Failed to delete application on server');
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const found = applications.find((a) => a.id === active.id);
    setActiveDraggingApp(found || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDraggingApp(null);
    if (!over) return;

    const appId = active.id;
    let targetStageId = over.id;

    if (typeof targetStageId === 'string') {
      if (targetStageId.startsWith('tab-')) {
        targetStageId = targetStageId.replace('tab-', '');
      } else if (targetStageId.startsWith('lane-')) {
        targetStageId = targetStageId.replace('lane-', '');
      }
    }

    // If dropped over another card, resolve that card's status
    const overApp = applications.find((a) => a.id === over.id);
    if (overApp) {
      targetStageId = overApp.status;
    }

    const validStage = STAGES.find((s) => s.id === targetStageId);
    if (!validStage) return;

    const currentApp = applications.find((a) => a.id === appId);
    if (currentApp && currentApp.status !== targetStageId) {
      handleMoveStage(appId, targetStageId);
    }
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

  const isAllStagesView = selectedStage === 'ALL';
  const currentStageObj = STAGES.find((s) => s.id === selectedStage) || STAGES[0];
  const CurrentStageIcon = currentStageObj.icon;
  const selectedStageApps = isAllStagesView
    ? filteredApplications
    : filteredApplications.filter((app) => app.status === selectedStage);

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
            Interactive pipeline workflow — move applications across Saved, Applied, Interviewing, and Offered.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View Mode Toggle: Horizontal Sections vs Kanban vs Calendar */}
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
              title="Horizontal Sectional View with Interactive Drag & Quick Advance"
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
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
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
                backgroundColor: viewMode === 'calendar' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'calendar' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
              title="Calendar & Deadlines View"
            >
              <Calendar size={15} />
              <span>Calendar</span>
            </button>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate('/opportunities')}
            icon={<Compass size={16} />}
            style={{
              borderColor: 'var(--primary)',
              color: 'var(--primary)',
            }}
          >
            Explore Opportunities
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              setNewStatus(selectedStage === 'ALL' ? 'Applied' : selectedStage);
              setShowAddModal(true);
            }}
            icon={<Plus size={16} />}
          >
            Add Application
          </Button>
        </div>
      </div>

      {/* 2. Global Search Bar & Interactive Pipeline Filter Row */}
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

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* All Pipeline Toggle Button */}
          <button
            type="button"
            onClick={() => setSelectedStage('ALL')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8125rem',
              fontWeight: isAllStagesView ? 700 : 500,
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: isAllStagesView ? '1px solid var(--primary)' : '1px solid var(--border)',
              backgroundColor: isAllStagesView ? 'var(--primary)' : 'transparent',
              color: isAllStagesView ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Sparkles size={13} />
            <span>All Pipeline Flow:</span>
            <strong style={{ fontWeight: 800 }}>{applications.length}</strong>
          </button>

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
                  border: isCurrent ? `1px solid ${s.color}` : '1px solid transparent',
                  cursor: 'pointer',
                  padding: '0.3rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isCurrent ? 'var(--surface-raised)' : 'transparent',
                  transition: 'all var(--transition-fast)'
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

      {/* 3. PRIMARY VIEW: INTERACTIVE SECTIONAL PIPELINE LAYOUT */}
      {viewMode === 'sections' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="horizontal-sectional-layout">
            {/* 3A. Interactive Droppable Stage Section Tabs Header */}
            <div className="horizontal-sections-grid">
              {STAGES.map((stage) => {
                const stageApps = applications.filter((a) => a.status === stage.id);
                const isSelected = selectedStage === stage.id;
                return (
                  <DroppableSectionTab
                    key={stage.id}
                    stage={stage}
                    count={stageApps.length}
                    totalCount={applications.length}
                    isSelected={isSelected}
                    onSelect={(stageId) => setSelectedStage(stageId)}
                    isDraggingAny={!!activeDraggingApp}
                  />
                );
              })}
            </div>

            {/* Quick helper banner when dragging */}
            {activeDraggingApp && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  border: '1px dashed var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.84375rem',
                  fontWeight: 600,
                  animation: 'fadeIn 0.2s ease-in-out'
                }}
              >
                <MoveRight size={16} style={{ color: 'var(--primary)' }} />
                <span>
                  Drop <strong>{activeDraggingApp.company}</strong> onto any section tab above or pipeline column below to move its stage!
                </span>
              </div>
            )}

            {/* 3B. Pipeline View (ALL FLOW vs SINGLE STAGE FOCUS) */}
            {isAllStagesView ? (
              /* ALL PIPELINE FLOW VIEW: Visual Interactive Sequential Swimlanes */
              <div className="all-pipeline-flow-container animate-fade-in" style={{ marginTop: '1.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    padding: '1.15rem 1.35rem',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        All Pipeline Flow
                      </h2>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        Drag cards between sections or click the quick-advance buttons to advance opportunities across stages.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                      Click any section tab above to focus on a single stage.
                    </span>
                  </div>
                </div>

                {/* 5-Column Interactive Flow Grid */}
                <div className="all-pipeline-columns-grid">
                  {STAGES.map((stage) => {
                    const stageApps = filteredApplications.filter((a) => a.status === stage.id);
                    return (
                      <DroppablePipelineColumn
                        key={stage.id}
                        stage={stage}
                        apps={stageApps}
                        onMoveStage={handleMoveStage}
                        onSelectDetail={setSelectedAppForDetail}
                        onDelete={handleDelete}
                        onFocusStage={() => setSelectedStage(stage.id)}
                        onAddInStage={() => {
                          setNewStatus(stage.id);
                          setShowAddModal(true);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              /* SINGLE STAGE FOCUSED VIEW with inter-stage navigation */
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

                  {/* Inter-Section Navigation Controls */}
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {currentStageObj.prevStage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStage(currentStageObj.prevStage)}
                        icon={<ChevronLeft size={14} />}
                        title={`Navigate back to ${currentStageObj.prevStage}`}
                      >
                        Previous: {currentStageObj.prevStage}
                      </Button>
                    )}

                    {currentStageObj.nextStage && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedStage(currentStageObj.nextStage)}
                        icon={<ChevronRight size={14} />}
                        title={`Advance view to ${currentStageObj.nextStage}`}
                        style={{
                          backgroundColor: STAGES.find((s) => s.id === currentStageObj.nextStage)?.color || 'var(--primary)',
                          borderColor: STAGES.find((s) => s.id === currentStageObj.nextStage)?.color || 'var(--primary)'
                        }}
                      >
                        Next: {currentStageObj.nextStage}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStage('ALL')}
                      icon={<Layers size={14} />}
                      title="View all pipeline sections side-by-side"
                    >
                      All Pipeline Flow
                    </Button>

                    <Button
                      variant="primary"
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
                        Drag cards from other stages onto the {currentStageObj.label} tab above, or track a new application here.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStage('ALL')}
                        icon={<Sparkles size={14} />}
                      >
                        View All Pipeline Flow
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/opportunities')}
                        icon={<Compass size={14} />}
                      >
                        Find on Opportunity Radar
                      </Button>
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
                      <DraggableSectionAppCard
                        key={app.id}
                        app={app}
                        stage={currentStageObj}
                        onMoveStage={handleMoveStage}
                        onSelectDetail={setSelectedAppForDetail}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Drag Overlay for Section View */}
          <DragOverlay>
            {activeDraggingApp ? (
              <div
                style={{
                  opacity: 0.95,
                  transform: 'rotate(2deg) scale(1.03)',
                  width: '320px',
                  pointerEvents: 'none',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--surface-raised)',
                  border: '2px solid var(--primary)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.4)',
                  padding: '1.15rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {activeDraggingApp.company}
                  </div>
                  <Badge variant="primary" size="sm">
                    {activeDraggingApp.status}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {activeDraggingApp.role}
                </div>
                <div style={{ fontSize: '0.71875rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MoveRight size={13} />
                  <span>Drop onto section tab or column to update stage</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* 4. INTERACTIVE KANBAN BOARD WITH DND-KIT */}
      {viewMode === 'kanban' && (
        <DndKanbanBoard
          stages={STAGES}
          applications={filteredApplications}
          onMoveStage={handleMoveStage}
          onSelectDetail={setSelectedAppForDetail}
          onDelete={handleDelete}
          onViewRadar={(oppId) => navigate(`/opportunities?selected=${oppId}`)}
          onAddInStage={(stageId) => {
            setNewStatus(stageId);
            setShowAddModal(true);
          }}
        />
      )}

      {/* 5. APPLICATION CALENDAR & MILESTONES VIEW */}
      {viewMode === 'calendar' && (
        <ApplicationCalendarView
          applications={filteredApplications}
          onSelectDetail={setSelectedAppForDetail}
          onMoveStage={handleMoveStage}
        />
      )}

      {/* 6. FLOATING INTER-SECTION TRANSFER NOTIFICATION TOAST */}
      {lastTransferred && (
        <div
          className="transfer-toast-banner"
          style={{
            position: 'fixed',
            bottom: '1.75rem',
            right: '1.75rem',
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.85rem 1.25rem',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45), 0 0 15px rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            zIndex: 1000,
            maxWidth: '460px',
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Moved <strong>{lastTransferred.app.company}</strong> to{' '}
                <span style={{ color: STAGES.find((s) => s.id === lastTransferred.toStage)?.color || 'var(--primary)' }}>
                  {lastTransferred.toStage}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Application stage updated across your tracker.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
            {selectedStage !== lastTransferred.toStage && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStage(lastTransferred.toStage);
                  setLastTransferred(null);
                }}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>View {lastTransferred.toStage}</span>
                <ArrowRight size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setLastTransferred(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
              }}
              title="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 7. APPLICATION DETAIL MODAL */}
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

            {/* Opportunity Radar Connection Card */}
            <div
              style={{
                padding: '0.9rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.85rem',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Compass size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedAppForDetail.opportunityId ? 'Linked with Opportunity Radar' : 'Live Opportunity Discovery'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {selectedAppForDetail.opportunityId
                      ? 'Connected to real-time radar listing with match breakdowns and requirements.'
                      : `Search live listings and eligibility for ${selectedAppForDetail.company} on the radar.`}
                  </div>
                </div>
              </div>

              {selectedAppForDetail.opportunityId ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const oppId = selectedAppForDetail.opportunityId;
                    setSelectedAppForDetail(null);
                    navigate(`/opportunities?selected=${oppId}`);
                  }}
                  icon={<ArrowUpRight size={14} />}
                >
                  View on Radar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const company = selectedAppForDetail.company;
                    setSelectedAppForDetail(null);
                    navigate(`/opportunities?search=${encodeURIComponent(company)}`);
                  }}
                  icon={<Compass size={14} />}
                >
                  Search on Radar
                </Button>
              )}
            </div>

            {/* Pipeline Stage Stepper */}
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Pipeline Progress Stage (Click any stage to transition)
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
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {selectedAppForDetail.opportunityId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const oppId = selectedAppForDetail.opportunityId;
                      setSelectedAppForDetail(null);
                      navigate(`/opportunities?selected=${oppId}`);
                    }}
                    icon={<Compass size={14} />}
                  >
                    View Radar Listing
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedAppForDetail(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 8. Add Application Modal */}
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

        .all-pipeline-columns-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(280px, 1fr));
          gap: 1.15rem;
          overflow-x: auto;
          padding-bottom: 1.5rem;
          align-items: start;
        }

        .all-pipeline-columns-grid::-webkit-scrollbar {
          height: 8px;
        }
        .all-pipeline-columns-grid::-webkit-scrollbar-track {
          background: var(--bg-secondary);
          border-radius: var(--radius-full);
        }
        .all-pipeline-columns-grid::-webkit-scrollbar-thumb {
          background: var(--border-hover);
          border-radius: var(--radius-full);
        }

        .stage-section-tab:hover {
          border-color: var(--primary) !important;
          transform: translateY(-2px);
        }

        .stage-select-pill:hover {
          border-color: var(--primary) !important;
        }

        .drop-target-active {
          border-style: dashed !important;
          border-color: rgba(99, 102, 241, 0.45) !important;
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
            min-width: 150px !important;
            flex-shrink: 0 !important;
            scroll-snap-align: start;
            padding: 0.75rem 0.85rem !important;
          }
        }
      `}</style>
    </PageContainer>
  );
}

/* ==========================================================================
   Sub-components for Sections View Interactivity
   ========================================================================== */

function DroppableSectionTab({ stage, count, totalCount, isSelected, onSelect, isDraggingAny }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `tab-${stage.id}`,
    data: { stageId: stage.id, type: 'stage-tab' },
  });

  const StageIcon = stage.icon;
  const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSelect(stage.id)}
      className={`stage-section-tab ${isSelected ? 'active' : ''} ${isOver ? 'drag-over' : ''} ${isDraggingAny ? 'drop-target-active' : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(stage.id);
      }}
      style={{
        cursor: 'pointer',
        position: 'relative',
        padding: '1.15rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: isOver
          ? `color-mix(in srgb, ${stage.color} 15%, var(--surface-raised))`
          : isSelected
          ? 'var(--surface-raised)'
          : 'var(--surface)',
        border: `2px solid ${isOver ? stage.color : isSelected ? stage.color : 'var(--border)'}`,
        boxShadow: isOver
          ? `0 0 20px ${stage.color}55, var(--shadow-lg)`
          : isSelected
          ? `0 10px 25px -5px ${stage.color}33, var(--shadow-md)`
          : 'var(--shadow-sm)',
        transition: 'all var(--transition-fast)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        userSelect: 'none',
        transform: isOver ? 'scale(1.03) translateY(-2px)' : 'none',
      }}
    >
      {/* Drop Badge Indicator when hovering */}
      {isOver && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: stage.color,
            color: '#ffffff',
            fontSize: '0.6875rem',
            fontWeight: 800,
            padding: '0.2rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <span>📥 Drop into {stage.label}</span>
        </div>
      )}

      {/* Top Bar: Icon + Label + Count Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isSelected || isOver ? stage.color : stage.bg,
              color: isSelected || isOver ? '#ffffff' : stage.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)',
              boxShadow: isSelected || isOver ? `0 2px 8px ${stage.color}44` : 'none',
            }}
          >
            <StageIcon size={16} />
          </div>
          <span
            style={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
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
            backgroundColor: isSelected || isOver ? stage.color : 'var(--bg-secondary)',
            color: isSelected || isOver ? '#ffffff' : 'var(--text-primary)',
            transition: 'all var(--transition-fast)',
          }}
        >
          {count}
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
        {isOver ? `Release to move application here` : stage.tagline}
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
}

function CardStageStepper({ currentStage, onSelectStage }) {
  const CORE_STAGES = ['Saved', 'Applied', 'Interviewing', 'Offered'];
  const currentIndex = CORE_STAGES.indexOf(currentStage);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.2rem',
        padding: '0.35rem 0.5rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        width: '100%',
        boxSizing: 'border-box',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <span style={{ fontSize: '0.65625rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.15rem' }}>
        Stage:
      </span>
      {CORE_STAGES.map((stageId, idx) => {
        const stageObj = STAGES.find((s) => s.id === stageId);
        const isActive = currentStage === stageId;
        const isPast = currentIndex !== -1 && idx < currentIndex;
        const StageIcon = stageObj.icon;

        return (
          <React.Fragment key={stageId}>
            <button
              type="button"
              onClick={() => onSelectStage(stageId)}
              title={isActive ? `Currently in ${stageId}` : `Move to ${stageId}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.2rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.6875rem',
                fontWeight: isActive ? 800 : isPast ? 600 : 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isActive
                  ? stageObj.color
                  : isPast
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'transparent',
                color: isActive
                  ? '#ffffff'
                  : isPast
                  ? 'var(--text-primary)'
                  : 'var(--text-muted)',
                transition: 'all var(--transition-fast)',
                boxShadow: isActive ? `0 2px 6px ${stageObj.color}44` : 'none',
              }}
            >
              {isPast ? (
                <Check size={9} style={{ color: '#10b981' }} />
              ) : (
                <StageIcon size={9} />
              )}
              <span>{stageId}</span>
            </button>
            {idx < CORE_STAGES.length - 1 && (
              <ChevronRight size={9} style={{ color: 'var(--text-muted)', opacity: 0.5, flexShrink: 0 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function DraggableSectionAppCard({ app, stage, onMoveStage, onSelectDetail, onDelete }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app.id,
    data: { app, stageId: app.status },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 999 : 'auto',
      }
    : undefined;

  const currentStageMeta = STAGES.find((s) => s.id === app.status) || stage;

  return (
    <Card
      ref={setNodeRef}
      variant="raised"
      className="hover-lift"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--surface)',
        ...style,
      }}
      onClick={() => onSelectDetail(app)}
    >
      {/* Top Accent Strip */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          backgroundColor: currentStageMeta.color,
        }}
      />

      {/* Header: Grip Handle + Company + Match Score + Delete */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: 'grab',
              padding: '4px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              borderRadius: 'var(--radius-sm)',
            }}
            title="Drag card to move between stages"
          >
            <GripVertical size={16} />
          </div>

          {/* Company Avatar Initial */}
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--surface-raised), var(--surface-hover))',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontSize: '0.9375rem',
              flexShrink: 0,
            }}
          >
            {app.company.charAt(0)}
          </div>

          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {app.company}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {app.role}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
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
              onDelete(app.id, app.company);
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
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Interactive Pipeline Stepper Row */}
      <CardStageStepper
        currentStage={app.status}
        onSelectStage={(newStage) => onMoveStage(app.id, newStage)}
      />

      {/* Next Milestone Box */}
      {app.nextAction && (
        <div
          style={{
            padding: '0.65rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            fontSize: '0.8125rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.65625rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Next Milestone
            </span>
            {app.nextActionDate && (
              <span style={{ color: 'var(--primary)', fontSize: '0.6875rem', fontWeight: 600 }}>
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

      {/* Interactive Quick Advance Action Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          marginTop: 'auto',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {app.opportunityId ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/opportunities?selected=${app.opportunityId}`);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--primary)',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-full)',
                padding: '0.2rem 0.5rem',
                cursor: 'pointer',
              }}
              title="View on Opportunity Radar"
            >
              <Compass size={11} />
              <span>Radar</span>
              <ArrowUpRight size={10} />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/opportunities?search=${encodeURIComponent(app.company)}`);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                padding: '0.2rem 0.45rem',
                cursor: 'pointer',
              }}
              title="Search Radar for this company"
            >
              <Search size={10} />
              <span>Radar</span>
            </button>
          )}

          <select
            value={app.status}
            onChange={(e) => onMoveStage(app.id, e.target.value)}
            aria-label={`Change stage for ${app.company}`}
            className="stage-select-pill"
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              padding: '0.2rem 0.45rem',
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
        </div>

        {/* Dedicated Stage Advancement Button */}
        <div>
          {app.status === 'Saved' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveStage(app.id, 'Applied');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.71875rem',
                fontWeight: 700,
                color: '#ffffff',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.25rem 0.55rem',
                cursor: 'pointer',
              }}
              title="Move application to Applied stage"
            >
              <Send size={11} />
              <span>Advance to Applied</span>
            </button>
          )}

          {app.status === 'Applied' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveStage(app.id, 'Interviewing');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.71875rem',
                fontWeight: 700,
                color: '#ffffff',
                backgroundColor: '#8b5cf6',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.25rem 0.55rem',
                cursor: 'pointer',
              }}
              title="Move application to Interviewing stage"
            >
              <Briefcase size={11} />
              <span>Advance to Interview</span>
            </button>
          )}

          {app.status === 'Interviewing' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveStage(app.id, 'Offered');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.71875rem',
                fontWeight: 700,
                color: '#ffffff',
                backgroundColor: '#10b981',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.25rem 0.55rem',
                cursor: 'pointer',
              }}
              title="Mark this application as an official offer"
            >
              <Award size={11} />
              <span>Mark as Offered 🎉</span>
            </button>
          )}

          {app.status === 'Offered' && (
            <span
              style={{
                fontSize: '0.71875rem',
                fontWeight: 700,
                color: '#10b981',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Award size={12} />
              <span>Offer Active! 🏆</span>
            </span>
          )}

          {app.status === 'Rejected' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveStage(app.id, 'Saved');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.71875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.22rem 0.5rem',
                cursor: 'pointer',
              }}
              title="Re-activate back to Saved opportunities"
            >
              <RotateCcw size={11} />
              <span>Re-activate</span>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

function DroppablePipelineColumn({ stage, apps, onMoveStage, onSelectDetail, onDelete, onFocusStage, onAddInStage }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `lane-${stage.id}`,
    data: { stageId: stage.id, type: 'pipeline-lane' },
  });

  const StageIcon = stage.icon;

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: isOver
          ? `color-mix(in srgb, ${stage.color} 8%, var(--surface))`
          : 'var(--surface)',
        border: `1px solid ${isOver ? stage.color : 'var(--border)'}`,
        minHeight: '480px',
        boxShadow: isOver ? `0 0 16px ${stage.color}35` : 'var(--shadow-sm)',
        transition: 'all var(--transition-fast)',
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
          borderTopLeftRadius: 'inherit',
          borderTopRightRadius: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: stage.bg,
              color: stage.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StageIcon size={14} />
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {stage.label}
          </span>
          <span
            style={{
              fontSize: '0.71875rem',
              fontWeight: 700,
              padding: '0.1rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {apps.length}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={onFocusStage}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '0.6875rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
            }}
            title={`Focus on ${stage.label} stage only`}
          >
            Focus
          </button>
          <button
            type="button"
            onClick={onAddInStage}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
            }}
            title={`Add application directly to ${stage.label}`}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Cards Stream */}
      <div
        style={{
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          flex: 1,
        }}
      >
        {apps.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: 'var(--text-muted)',
              fontSize: '0.78125rem',
              flex: 1,
            }}
          >
            <StageIcon size={20} style={{ opacity: 0.5 }} />
            <span>Drop card here to move into {stage.label}</span>
          </div>
        ) : (
          apps.map((app) => (
            <DraggableSectionAppCard
              key={app.id}
              app={app}
              stage={stage}
              onMoveStage={onMoveStage}
              onSelectDetail={onSelectDetail}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
