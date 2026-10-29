import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Video,
  Plus,
  Search,
  ExternalLink,
  ChevronDown,
  Check,
  Trash2,
  Sparkles,
  FileText,
  Calendar,
  Building,
  Briefcase,
  Award,
  X,
  Compass,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Layers,
  ArrowUpRight,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  CalendarDays,
  Download,
  RefreshCw,
  CheckSquare,
  Square,
  Link as LinkIcon,
  User,
  ListChecks,
  Shield,
  ShieldAlert,
  BookOpen,
  ChevronUp,
  Target,
  Play,
  RotateCcw,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { applicationService } from '../services/applicationService';
import { mockTestService } from '../services/mockTestService';
import AIInterviewSimulator from '../components/interview/AIInterviewSimulator';

const CANONICAL_STATUSES = [
  'Saved',
  'Applied',
  'Assessment',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn'
];

const EVENT_TYPES = [
  { value: 'technical_interview', label: 'Technical Interview' },
  { value: 'hr_interview', label: 'HR / Behavioral Round' },
  { value: 'online_assessment', label: 'Online Assessment' },
  { value: 'coding_test', label: 'Live Coding Challenge' },
  { value: 'group_discussion', label: 'Group Discussion' },
  { value: 'other', label: 'Other Assessment' },
];

const COMPANY_PALETTES = [
  { bg: '#EFF6FF', text: '#2563EB', border: 'rgba(37, 99, 235, 0.2)' },
  { bg: '#F5F3FF', text: '#7C3AED', border: 'rgba(124, 58, 237, 0.2)' },
  { bg: '#ECFDF5', text: '#059669', border: 'rgba(5, 150, 105, 0.2)' },
  { bg: '#FFFBEB', text: '#D97706', border: 'rgba(217, 119, 6, 0.2)' },
  { bg: '#FFF1F2', text: '#E11D48', border: 'rgba(225, 29, 72, 0.2)' },
  { bg: '#F0FDF4', text: '#16A34A', border: 'rgba(22, 163, 74, 0.2)' },
];

function getCompanyPalette(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COMPANY_PALETTES[Math.abs(hash) % COMPANY_PALETTES.length];
}

function formatTableDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${day} ${months[mIdx] || ''} ${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function formatEventTime(isoStr, tz = 'UTC') {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch {
    return isoStr;
  }
}

function getStatusBadgeProps(status = '') {
  switch (status.toLowerCase()) {
    case 'applied':
      return { bg: '#DCFCE7', color: '#15803D', border: 'rgba(22, 163, 74, 0.3)' };
    case 'assessment':
      return { bg: '#DBEAFE', color: '#1D4ED8', border: 'rgba(29, 78, 216, 0.3)' };
    case 'interview':
    case 'interviewing':
      return { bg: '#F3E8FF', color: '#7E22CE', border: 'rgba(147, 51, 234, 0.3)' };
    case 'offer':
    case 'offered':
    case 'hired':
      return { bg: '#ECFDF5', color: '#047857', border: 'rgba(5, 150, 105, 0.3)' };
    case 'rejected':
      return { bg: '#FEE2E2', color: '#B91C1C', border: 'rgba(220, 38, 38, 0.3)' };
    case 'withdrawn':
      return { bg: '#FEF3C7', color: '#B45309', border: 'rgba(180, 83, 9, 0.3)' };
    case 'saved':
    default:
      return { bg: '#F1F5F9', color: '#475569', border: 'rgba(100, 116, 139, 0.3)' };
  }
}

export default function ApplicationsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusDropdownId, setStatusDropdownId] = useState(null);

  // Detail Modal State & Active Tab
  const [selectedAppForDetail, setSelectedAppForDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('details'); // 'details' | 'schedule' | 'prep'
  const [editingNotes, setEditingNotes] = useState('');
  const [editingFollowUp, setEditingFollowUp] = useState('');
  const [editingContactName, setEditingContactName] = useState('');
  const [editingContactInfo, setEditingContactInfo] = useState('');
  const [editingNextAction, setEditingNextAction] = useState('');
  const [editingSubmissionDate, setEditingSubmissionDate] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Phase 5: Events State for Selected Application
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState('technical_interview');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');
  const [newEventTimezone, setNewEventTimezone] = useState(
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC'
  );
  const [newEventLink, setNewEventLink] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventNotes, setNewEventNotes] = useState('');

  // Stage 4: Grounded Interview Prep & Skill Gap State
  const [prepPack, setPrepPack] = useState(null);
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [refreshingPrep, setRefreshingPrep] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState(null);
  const [prepSectionTab, setPrepSectionTab] = useState('overview'); // 'overview' | 'skill_gaps' | 'questions' | 'resources'
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState('All');
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [addingSkillToRoadmap, setAddingSkillToRoadmap] = useState(null);

  // Stage 5: Mock Test Engine State
  const [mockTestCategories, setMockTestCategories] = useState([]);
  const [mockTestAttempts, setMockTestAttempts] = useState([]);
  const [loadingMockTests, setLoadingMockTests] = useState(false);
  const [activeMockTest, setActiveMockTest] = useState(null);
  const [mockTestViewMode, setMockTestViewMode] = useState('lobby'); // 'lobby' | 'active' | 'result'
  const [selectedTestCategory, setSelectedTestCategory] = useState('Technical MCQs');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10);
  const [isTestTimed, setIsTestTimed] = useState(true);
  const [testTimeLimitMinutes, setTestTimeLimitMinutes] = useState(15);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testAnswers, setTestAnswers] = useState({});
  const [isStartingTest, setIsStartingTest] = useState(false);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [completedTestResult, setCompletedTestResult] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [addingWeakTopicToRoadmap, setAddingWeakTopicToRoadmap] = useState(null);
  const [expandedReviewQuestionId, setExpandedReviewQuestionId] = useState(null);

  // Add Application Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newType, setNewType] = useState('Job');
  const [newStatus, setNewStatus] = useState('Applied');
  const [newLink, setNewLink] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newFollowUp, setNewFollowUp] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactInfo, setNewContactInfo] = useState('');
  const [newNextAction, setNewNextAction] = useState('');
  const [newSubmissionDate, setNewSubmissionDate] = useState('');

  // Delete Confirmation State
  const [appToDelete, setAppToDelete] = useState(null);

  // Load from backend on mount
  useEffect(() => {
    let active = true;
    const loadApps = async () => {
      setLoading(true);
      try {
        const data = await applicationService.getApplications();
        if (active && Array.isArray(data)) {
          setApplications(data);
        }
      } catch (e) {
        console.warn('Could not sync applications from server:', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadApps();
    return () => { active = false; };
  }, []);

  // Sync editing details when modal opens
  useEffect(() => {
    if (selectedAppForDetail) {
      setEditingNotes(selectedAppForDetail.notes || '');
      setEditingFollowUp(selectedAppForDetail.follow_up_date || selectedAppForDetail.followUpDate || '');
      setEditingContactName(selectedAppForDetail.contact_name || selectedAppForDetail.contactName || '');
      setEditingContactInfo(selectedAppForDetail.contact_info || selectedAppForDetail.contactInfo || '');
      setEditingNextAction(selectedAppForDetail.next_action || selectedAppForDetail.nextAction || '');
      setEditingSubmissionDate(selectedAppForDetail.submission_date || selectedAppForDetail.appliedDate || '');
      setDetailTab('details');
      setPrepPack(null);
      setEvents([]);
      setShowAddEventForm(false);
      setMockTestViewMode('lobby');
      setActiveMockTest(null);
      setCompletedTestResult(null);
      setMockTestAttempts([]);
      loadEventsForApp(selectedAppForDetail.id);
    }
  }, [selectedAppForDetail]);

  // Load events & mock tests when switching to tabs
  useEffect(() => {
    if (selectedAppForDetail && detailTab === 'schedule') {
      loadEventsForApp(selectedAppForDetail.id);
    } else if (selectedAppForDetail && detailTab === 'prep') {
      if (!prepPack && !loadingPrep) {
        loadPrepPackForApp(selectedAppForDetail.id, false);
      }
      loadMockTestsForApp(selectedAppForDetail.id);
    }
  }, [detailTab]);

  const loadEventsForApp = async (appId) => {
    setLoadingEvents(true);
    try {
      const data = await applicationService.getEvents(appId);
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Could not load events:', e);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadPrepPackForApp = async (appId, forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshingPrep(true);
    } else {
      setLoadingPrep(true);
    }
    try {
      const data = await applicationService.getInterviewPrep(appId, forceRefresh);
      setPrepPack(data || null);
    } catch (e) {
      toast.error('Could not generate interview preparation pack.');
    } finally {
      setLoadingPrep(false);
      setRefreshingPrep(false);
    }
  };

  const loadMockTestsForApp = async (appId) => {
    setLoadingMockTests(true);
    try {
      const data = await applicationService.getMockTests(appId);
      if (data) {
        setMockTestCategories(data.categories || []);
        setMockTestAttempts(data.previous_attempts || []);
      }
    } catch (e) {
      console.warn('Could not load mock tests:', e);
    } finally {
      setLoadingMockTests(false);
    }
  };

  // Timer countdown for active timed mock test
  useEffect(() => {
    if (mockTestViewMode !== 'active' || !activeMockTest?.is_timed || remainingSeconds === null) {
      return;
    }
    if (remainingSeconds <= 0) {
      handleSubmitMockTest(true);
      return;
    }
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev == null || prev <= 1) {
          clearInterval(timer);
          handleSubmitMockTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mockTestViewMode, activeMockTest?.is_timed, remainingSeconds]);

  const formatSeconds = (sec) => {
    if (sec == null || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartMockTest = async () => {
    if (!selectedAppForDetail) return;
    setIsStartingTest(true);
    try {
      const config = {
        category: selectedTestCategory,
        difficulty: selectedDifficulty,
        question_count: selectedQuestionCount,
        is_timed: isTestTimed,
        time_limit_minutes: testTimeLimitMinutes
      };
      const attempt = await applicationService.startMockTest(selectedAppForDetail.id, config);
      setActiveMockTest(attempt);
      setTestAnswers(attempt.submitted_answers || {});
      setRemainingSeconds(
        attempt.remaining_seconds != null
          ? attempt.remaining_seconds
          : (isTestTimed ? testTimeLimitMinutes * 60 : null)
      );
      setCurrentQuestionIndex(0);
      loadMockTestsForApp(selectedAppForDetail.id);

      // Navigate to dedicated proctored exam page
      navigate(`/applications/${selectedAppForDetail.id}/mock-test/${attempt.id}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Could not start mock test.');
    } finally {
      setIsStartingTest(false);
    }
  };

  const handleSelectAnswer = async (questionId, optionText) => {
    const updated = { ...testAnswers, [questionId]: optionText };
    setTestAnswers(updated);
    if (selectedAppForDetail && activeMockTest) {
      try {
        await applicationService.saveMockTestAnswers(selectedAppForDetail.id, activeMockTest.id, { [questionId]: optionText });
      } catch (err) {
        console.warn('Failed to save answer in background:', err);
      }
    }
  };

  const handleSubmitMockTest = async (isAutoExpire = false) => {
    if (!selectedAppForDetail || !activeMockTest) return;
    setIsSubmittingTest(true);
    setShowSubmitConfirmModal(false);
    try {
      const result = await applicationService.submitMockTest(selectedAppForDetail.id, activeMockTest.id, testAnswers);
      setCompletedTestResult(result);
      setMockTestViewMode('result');
      loadMockTestsForApp(selectedAppForDetail.id);
      if (isAutoExpire) {
        toast.info('Test time limit expired. Your test was automatically graded.');
      } else {
        toast.success(`Mock test completed! Score: ${result.percentage}%`);
        if (result.percentage >= 75) {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        }
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to submit mock test.');
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const handleReviewPastAttempt = async (attemptId) => {
    if (!selectedAppForDetail) return;
    navigate(`/applications/${selectedAppForDetail.id}/mock-test/${attemptId}`);
  };

  const handleAddWeakTopicToRoadmap = async (topicName) => {
    if (!selectedAppForDetail || !completedTestResult) return;
    setAddingWeakTopicToRoadmap(topicName);
    try {
      const updated = await applicationService.addWeakTopicToRoadmap(
        selectedAppForDetail.id,
        completedTestResult.id,
        topicName
      );
      toast.success(`"${topicName}" added to preparation roadmap!`);
      if (updated) {
        setPrepPack(updated);
      }
    } catch (e) {
      toast.error('Could not add topic to roadmap.');
    } finally {
      setAddingWeakTopicToRoadmap(null);
    }
  };

  // Close status dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setStatusDropdownId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Summary Metrics computed directly from real records
  const metrics = {
    total: applications.length,
    inProgress: applications.filter((a) => ['Applied', 'Assessment', 'Interview', 'Interviewing'].includes(a.status)).length,
    offers: applications.filter((a) => ['Offer', 'Offered', 'Hired'].includes(a.status)).length,
    saved: applications.filter((a) => a.status === 'Saved').length,
    closed: applications.filter((a) => ['Rejected', 'Withdrawn'].includes(a.status)).length,
  };

  // Filter applications by tab & search query
  const filteredApplications = applications.filter((app) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchComp = (app.company || '').toLowerCase().includes(q);
      const matchRole = (app.role || '').toLowerCase().includes(q);
      const matchNotes = (app.notes || '').toLowerCase().includes(q);
      if (!matchComp && !matchRole && !matchNotes) return false;
    }

    if (activeTab === 'All') return true;
    if (activeTab === 'In Progress') {
      return ['Applied', 'Assessment', 'Interview', 'Interviewing'].includes(app.status);
    }
    return app.status.toLowerCase() === activeTab.toLowerCase();
  });

  const handleMoveStage = async (appId, targetStatus, note = null) => {
    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp || targetApp.status === targetStatus) return;

    if (targetStatus === 'Offer' || targetStatus === 'Offered') {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#10B981', '#FFC400', '#7C3AED'],
      });
      toast.success(`🎉 Congratulations on your offer from ${targetApp.company}!`);
    } else {
      toast.info(`Updated status to ${targetStatus}`);
    }

    const today = new Date().toISOString().split('T')[0];
    const newHistory = [
      ...(targetApp.status_history || targetApp.timeline || []),
      { date: today, status: targetStatus, event: `Moved to ${targetStatus}`, note: note || '' }
    ];

    const updated = {
      ...targetApp,
      status: targetStatus,
      lastUpdated: today,
      status_history: newHistory,
      timeline: newHistory,
    };

    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
    if (selectedAppForDetail && selectedAppForDetail.id === appId) {
      setSelectedAppForDetail(updated);
    }

    try {
      await applicationService.updateStage(appId, targetStatus, note);
    } catch (e) {
      toast.error('Could not sync stage update to server.');
    }
  };

  const handleSaveAppDetails = async () => {
    if (!selectedAppForDetail) return;
    setIsSavingDetails(true);
    const updated = {
      ...selectedAppForDetail,
      notes: editingNotes,
      follow_up_date: editingFollowUp,
      followUpDate: editingFollowUp,
      contact_name: editingContactName,
      contact_info: editingContactInfo,
      next_action: editingNextAction,
      submission_date: editingSubmissionDate,
    };

    setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedAppForDetail(updated);

    try {
      await applicationService.updateApplication(updated.id, {
        notes: editingNotes,
        followUpDate: editingFollowUp,
        contactName: editingContactName,
        contactInfo: editingContactInfo,
        nextAction: editingNextAction,
        submissionDate: editingSubmissionDate,
      });
      toast.success('Application details and contacts saved!');
    } catch (e) {
      toast.error('Failed to save to server.');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Phase 5: Event Handlers
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventStart || !newEventEnd) {
      toast.error('Please enter title, start time, and end time.');
      return;
    }

    if (newEventEnd < newEventStart) {
      toast.error('End time must be after start time.');
      return;
    }

    if (newEventLink.trim()) {
      const lower = newEventLink.trim().toLowerCase();
      if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
        toast.error('Meeting link must start with http:// or https://');
        return;
      }
    }

    setIsSavingEvent(true);
    try {
      const payload = {
        title: newEventTitle.trim(),
        event_type: newEventType,
        start_time: new Date(newEventStart).toISOString(),
        end_time: new Date(newEventEnd).toISOString(),
        timezone: newEventTimezone,
        meeting_link: newEventLink.trim() || undefined,
        location: newEventLocation.trim() || undefined,
        notes: newEventNotes.trim() || undefined,
      };

      const created = await applicationService.addEvent(selectedAppForDetail.id, payload);
      setEvents((prev) => [...prev, created]);
      setShowAddEventForm(false);
      setNewEventTitle('');
      setNewEventStart('');
      setNewEventEnd('');
      setNewEventLink('');
      setNewEventLocation('');
      setNewEventNotes('');
      toast.success('Interview scheduled successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to schedule interview');
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleStatusEvent = async (eventId, newStatus) => {
    try {
      const updated = await applicationService.updateEvent(selectedAppForDetail.id, eventId, { status: newStatus });
      setEvents((prev) => prev.map((ev) => (ev.id === eventId ? updated : ev)));
      toast.success(`Event marked as ${newStatus}`);
    } catch (err) {
      toast.error('Could not update event status');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await applicationService.deleteEvent(selectedAppForDetail.id, eventId);
      setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      toast.info('Event removed');
    } catch (err) {
      toast.error('Could not remove event');
    }
  };

  const handleDownloadCalendarIcs = async (eventId) => {
    try {
      await applicationService.downloadCalendarIcs(selectedAppForDetail.id, eventId);
      toast.success('Calendar file (.ics) downloaded!');
    } catch (err) {
      toast.error('Could not download calendar file.');
    }
  };

  // Phase 5: Checklist Toggle Handler
  const handleToggleChecklist = async (taskId, currentCompleted) => {
    if (!selectedAppForDetail || !prepPack) return;
    const newStatus = !currentCompleted;
    setTogglingTaskId(taskId);

    // Optimistic UI update
    setPrepPack((prev) => {
      if (!prev || !prev.checklist) return prev;
      return {
        ...prev,
        checklist: prev.checklist.map((item) =>
          item.id === taskId ? { ...item, completed: newStatus } : item
        ),
      };
    });

    try {
      const updatedPack = await applicationService.toggleChecklistItem(
        selectedAppForDetail.id,
        taskId,
        newStatus
      );
      if (updatedPack && updatedPack.checklist) {
        setPrepPack(updatedPack);
      }
    } catch (err) {
      toast.error('Could not save checklist progress.');
    } finally {
      setTogglingTaskId(null);
    }
  };

  const handleAddSkillToRoadmap = async (skillName) => {
    if (!selectedAppForDetail || !skillName) return;
    setAddingSkillToRoadmap(skillName);
    try {
      const response = await applicationService.addSkillToRoadmap(selectedAppForDetail.id, skillName);
      const updatedPack = response.data || response;
      setPrepPack(updatedPack);
      toast.success(`Added ${skillName} to preparation roadmap!`);
    } catch (e) {
      toast.error(e.message || `Failed to add ${skillName} to roadmap`);
    } finally {
      setAddingSkillToRoadmap(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!appToDelete) return;
    const appId = appToDelete.id;
    setApplications((prev) => prev.filter((a) => a.id !== appId));
    if (selectedAppForDetail && selectedAppForDetail.id === appId) {
      setSelectedAppForDetail(null);
    }
    setAppToDelete(null);
    toast.info('Application removed from tracker');

    try {
      await applicationService.deleteApplication(appId);
    } catch (e) {
      toast.error('Server sync failed.');
    }
  };

  const handleAddApplication = async (e) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) {
      toast.error('Please enter company and role name');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newAppPayload = {
      company: newCompany.trim(),
      role: newRole.trim(),
      type: newType,
      status: newStatus,
      appliedDate: newSubmissionDate || (newStatus === 'Applied' ? today : null),
      applicationUrl: newLink.trim() || undefined,
      notes: newNotes.trim() || '',
      followUpDate: newFollowUp || undefined,
      contactName: newContactName.trim() || undefined,
      contactInfo: newContactInfo.trim() || undefined,
      nextAction: newNextAction.trim() || undefined,
    };

    setShowAddModal(false);

    try {
      const savedApp = await applicationService.addApplication(newAppPayload);
      if (savedApp?.id || savedApp?._id) {
        setApplications((prev) => [savedApp, ...prev]);
      }
      toast.success(`Tracked application for ${newCompany}!`);
    } catch (e) {
      toast.error(e.message || 'Failed to save application');
    }

    setNewCompany('');
    setNewRole('');
    setNewLink('');
    setNewNotes('');
    setNewFollowUp('');
    setNewContactName('');
    setNewContactInfo('');
    setNewNextAction('');
    setNewSubmissionDate('');
  };

  // Compute checklist stats if prepPack loaded
  const checklistItems = prepPack?.checklist || [];
  const completedCount = checklistItems.filter((i) => i.completed).length;
  const checklistPercent = checklistItems.length > 0 ? Math.round((completedCount / checklistItems.length) * 100) : 0;

  return (
    <PageContainer
      title="Application Tracker"
      subtitle="Track your applications, interview schedules, recruiter contacts, and grounded AI interview preparation."
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '3rem' }}>
        {/* 1. Summary Metrics Cards (From Real Records) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--lx-line)', borderRadius: '16px', padding: '1.25rem', boxShadow: 'var(--shadow-lx-card)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--lx-txt-3)', textTransform: 'uppercase' }}>
              Total Tracked
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--lx-ink)', marginTop: '4px' }}>
              {metrics.total}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--lx-line)', borderRadius: '16px', padding: '1.25rem', boxShadow: 'var(--shadow-lx-card)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
              In Progress
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2563EB', marginTop: '4px' }}>
              {metrics.inProgress}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--lx-line)', borderRadius: '16px', padding: '1.25rem', boxShadow: 'var(--shadow-lx-card)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
              Offers
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
              {metrics.offers}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--lx-line)', borderRadius: '16px', padding: '1.25rem', boxShadow: 'var(--shadow-lx-card)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--lx-txt-3)', textTransform: 'uppercase' }}>
              Saved Leads
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--lx-ink)', marginTop: '4px' }}>
              {metrics.saved}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--lx-line)', borderRadius: '16px', padding: '1.25rem', boxShadow: 'var(--shadow-lx-card)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase' }}>
              Archived / Closed
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#B91C1C', marginTop: '4px' }}>
              {metrics.closed}
            </div>
          </div>
        </div>

        {/* 2. Controls Bar: Tabs, Search, Add Application */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['All', 'In Progress', 'Applied', 'Assessment', 'Interview', 'Offer', 'Saved', 'Rejected'].map((tab) => {
              const isActive = activeTab.toLowerCase() === tab.toLowerCase();
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isActive ? 'var(--lx-ink)' : 'var(--lx-surface-2)',
                    color: isActive ? '#ffffff' : 'var(--lx-txt-2)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Search + Add Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', width: '100%', maxWidth: '420px' }}>
            <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '160px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--lx-txt-3)',
                }}
              />
              <Input
                placeholder="Search company, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2rem', height: '38px', fontSize: '0.82rem' }}
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '38px' }}
            >
              <Plus size={16} />
              <span>Track Application</span>
            </Button>
          </div>
        </div>

        {/* 3. Applications Table / List View */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--lx-txt-3)' }}>
            Loading your applications pipeline...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px dashed var(--lx-line)',
              borderRadius: '16px',
              padding: '4rem 2rem',
              textAlign: 'center',
            }}
          >
            <Briefcase size={36} style={{ color: 'var(--lx-txt-3)', margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
              No applications match this filter
            </div>
            <p style={{ color: 'var(--lx-txt-2)', fontSize: '0.85rem', maxWidth: '380px', margin: '0.35rem auto 1.25rem' }}>
              Discover verified opportunities or manually track a custom application from external career boards.
            </p>
            <Button variant="primary" size="sm" onClick={() => navigate('/opportunities')}>
              Explore Opportunities
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredApplications.map((app) => {
              const palette = getCompanyPalette(app.company);
              const badgeProps = getStatusBadgeProps(app.status);

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedAppForDetail(app)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--lx-line)',
                    borderRadius: '16px',
                    padding: '1.15rem 1.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    boxShadow: 'var(--shadow-lx-card)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(14, 17, 22, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lx-card)';
                  }}
                >
                  {/* Left: Avatar + Company + Role */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: palette.bg,
                        color: palette.text,
                        border: `1px solid ${palette.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        flexShrink: 0,
                      }}
                    >
                      {(app.company || 'C').charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                        {app.role}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--lx-txt-2)', marginTop: '2px' }}>
                        {app.company} · <span style={{ color: 'var(--lx-txt-3)' }}>{app.type || 'Job'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Applied Date + Next Action / Follow up */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ color: 'var(--lx-txt-3)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
                        Applied Date
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--lx-ink)', marginTop: '2px' }}>
                        {formatTableDate(app.submission_date || app.appliedDate || app.applied_at)}
                      </div>
                    </div>

                    {app.next_action && (
                      <div style={{ maxWidth: '200px' }}>
                        <div style={{ color: 'var(--lx-txt-3)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
                          Next Action
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--lx-ink)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {app.next_action}
                        </div>
                      </div>
                    )}

                    {app.follow_up_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#D97706', backgroundColor: '#FFFBEB', padding: '0.25rem 0.6rem', borderRadius: '8px' }}>
                        <Clock size={12} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Follow-up: {formatTableDate(app.follow_up_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Status Pill + Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                    {/* Status Dropdown */}
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setStatusDropdownId(statusDropdownId === app.id ? null : app.id)}
                        style={{
                          backgroundColor: badgeProps.bg,
                          color: badgeProps.color,
                          border: `1px solid ${badgeProps.border}`,
                          padding: '0.35rem 0.85rem',
                          borderRadius: '9999px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <span>{app.status}</span>
                        <ChevronDown size={13} />
                      </button>

                      {statusDropdownId === app.id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '110%',
                            backgroundColor: '#ffffff',
                            border: '1px solid var(--lx-line)',
                            borderRadius: '12px',
                            boxShadow: 'var(--shadow-lx-card)',
                            padding: '0.35rem',
                            zIndex: 40,
                            minWidth: '150px',
                          }}
                        >
                          {CANONICAL_STATUSES.map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                handleMoveStage(app.id, st);
                                setStatusDropdownId(null);
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '0.4rem 0.75rem',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: app.status === st ? 700 : 500,
                                backgroundColor: app.status === st ? 'var(--lx-surface-2)' : 'transparent',
                                color: 'var(--lx-ink)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span>{st}</span>
                              {app.status === st && <Check size={13} style={{ color: 'var(--lx-blue)' }} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={() => setAppToDelete(app)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--lx-txt-3)',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                      }}
                      title="Delete tracking record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Phase 5: Application Detail, Interview Schedule & AI Prep Modal */}
        {selectedAppForDetail && (
          <Modal
            isOpen={Boolean(selectedAppForDetail)}
            onClose={() => setSelectedAppForDetail(null)}
            title={`Application Workspace — ${selectedAppForDetail.company}`}
            maxWidth="940px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Header Summary Card */}
              <div style={{ padding: '1rem', backgroundColor: 'var(--lx-surface-2)', borderRadius: '14px', border: '1px solid var(--lx-line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                      {selectedAppForDetail.role}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--lx-txt-2)', marginTop: '2px' }}>
                      {selectedAppForDetail.company} · {selectedAppForDetail.type || 'Job'}
                    </div>
                  </div>

                  {selectedAppForDetail.applicationUrl && (
                    <a
                      href={selectedAppForDetail.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--lx-blue)',
                        textDecoration: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '0.35rem 0.65rem',
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid var(--lx-line)',
                      }}
                    >
                      <span>Open Application Link</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {/* Subheader Navigation Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--lx-line)', paddingTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setDetailTab('details')}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: detailTab === 'details' ? 'var(--lx-ink)' : 'transparent',
                      color: detailTab === 'details' ? '#ffffff' : 'var(--lx-txt-2)',
                    }}
                  >
                    Details &amp; Contacts
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailTab('schedule')}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: detailTab === 'schedule' ? 'var(--lx-ink)' : 'transparent',
                      color: detailTab === 'schedule' ? '#ffffff' : 'var(--lx-txt-2)',
                    }}
                  >
                    <span>Interview Schedule</span>
                    {events.length > 0 && (
                      <span style={{
                        backgroundColor: detailTab === 'schedule' ? 'rgba(255,255,255,0.2)' : 'var(--lx-line)',
                        color: detailTab === 'schedule' ? '#ffffff' : 'var(--lx-ink)',
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '999px',
                        fontWeight: 800
                      }}>
                        {events.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailTab('prep')}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: detailTab === 'prep' ? 'var(--lx-blue)' : 'transparent',
                      color: detailTab === 'prep' ? '#ffffff' : 'var(--lx-txt-2)',
                    }}
                  >
                    <Sparkles size={14} />
                    <span>AI Interview Prep Pack</span>
                    {checklistItems.length > 0 && (
                      <span style={{
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '999px',
                        fontWeight: 800
                      }}>
                        {checklistPercent}%
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* TAB 1: DETAILS & RECRUITER CONTACTS */}
              {detailTab === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Status Selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--lx-ink)', marginBottom: '0.4rem' }}>
                      Current Status Stage
                    </label>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {CANONICAL_STATUSES.map((st) => {
                        const isActive = selectedAppForDetail.status === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleMoveStage(selectedAppForDetail.id, st)}
                            style={{
                              padding: '0.4rem 0.85rem',
                              borderRadius: '9999px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              border: isActive ? 'none' : '1px solid var(--lx-line)',
                              backgroundColor: isActive ? 'var(--lx-blue)' : '#ffffff',
                              color: isActive ? '#ffffff' : 'var(--lx-txt-2)',
                              cursor: 'pointer',
                            }}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recruiter & Contact Information */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--lx-ink)', marginBottom: '0.4rem' }}>
                        Recruiter / Contact Name
                      </label>
                      <Input
                        placeholder="e.g. Sarah Jenkins (Senior Technical Recruiter)"
                        value={editingContactName}
                        onChange={(e) => setEditingContactName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--lx-ink)', marginBottom: '0.4rem' }}>
                        Contact Info (Email / LinkedIn)
                      </label>
                      <Input
                        placeholder="e.g. sjenkins@company.com or linkedin.com/in/..."
                        value={editingContactInfo}
                        onChange={(e) => setEditingContactInfo(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Dates & Next Action */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--lx-ink)', marginBottom: '0.4rem' }}>
                        Submission / Applied Date
                      </label>
                      <input
                        type="date"
                        value={editingSubmissionDate}
                        onChange={(e) => setEditingSubmissionDate(e.target.value)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid var(--lx-line)',
                          fontSize: '0.85rem',
                          outline: 'none',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--lx-ink)', marginBottom: '0.4rem' }}>
                        Follow-up Reminder Date
                      </label>
                      <input
                        type="date"
                        value={editingFollowUp}
                        onChange={(e) => setEditingFollowUp(e.target.value)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid var(--lx-line)',
                          fontSize: '0.85rem',
                          outline: 'none',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--lx-ink)', marginBottom: '0.4rem' }}>
                        Next Action Item
                      </label>
                      <Input
                        placeholder="e.g. Send thank you note"
                        value={editingNextAction}
                        onChange={(e) => setEditingNextAction(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Notes Editor */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--lx-ink)', marginBottom: '0.4rem' }}>
                      Application Notes &amp; Preparation Thoughts
                    </label>
                    <textarea
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      placeholder="Record interview notes, technical questions asked, feedback received, or follow-up insights..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: '1px solid var(--lx-line)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveAppDetails}
                        disabled={isSavingDetails}
                      >
                        {isSavingDetails ? 'Saving...' : 'Save Details & Contacts'}
                      </Button>
                    </div>
                  </div>

                  {/* Status History Timeline */}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--lx-ink)', marginBottom: '0.5rem' }}>
                      Status History &amp; Timeline
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                      {Array.isArray(selectedAppForDetail.status_history || selectedAppForDetail.timeline) && (selectedAppForDetail.status_history || selectedAppForDetail.timeline).length > 0 ? (
                        (selectedAppForDetail.status_history || selectedAppForDetail.timeline).map((evt, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'baseline',
                              gap: '0.65rem',
                              fontSize: '0.8rem',
                              padding: '0.45rem 0.65rem',
                              backgroundColor: 'var(--lx-surface-2)',
                              borderRadius: '8px',
                            }}
                          >
                            <span style={{ color: 'var(--lx-txt-3)', fontWeight: 600, minWidth: '85px' }}>
                              {formatTableDate(evt.date)}
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--lx-ink)' }}>
                              {evt.status ? `Stage: ${evt.status}` : (evt.event || 'Status updated')}
                            </span>
                            {evt.note && (
                              <span style={{ color: 'var(--lx-txt-2)', fontStyle: 'italic' }}>
                                — {evt.note}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--lx-txt-3)' }}>
                          No history events recorded yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INTERVIEW & ASSESSMENT SCHEDULE */}
              {detailTab === 'schedule' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Top Bar with Add Event Toggle */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                        Scheduled Interviews &amp; Assessments
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--lx-txt-2)' }}>
                        Manage rounds, join meeting rooms, and export RFC 5545 calendar files.
                      </div>
                    </div>

                    <Button
                      variant={showAddEventForm ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => setShowAddEventForm(!showAddEventForm)}
                    >
                      {showAddEventForm ? 'Cancel' : '+ Schedule Round'}
                    </Button>
                  </div>

                  {/* Inline Add Event Form */}
                  {showAddEventForm && (
                    <form
                      onSubmit={handleCreateEvent}
                      style={{
                        padding: '1.2rem',
                        backgroundColor: 'var(--lx-surface-2)',
                        borderRadius: '12px',
                        border: '1px solid var(--lx-line)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem',
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                        New Interview / Assessment Details
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                            Round Title *
                          </label>
                          <Input
                            placeholder="e.g. Technical Round 1: Algorithms & Systems"
                            value={newEventTitle}
                            onChange={(e) => setNewEventTitle(e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                            Round Type
                          </label>
                          <select
                            value={newEventType}
                            onChange={(e) => setNewEventType(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.55rem',
                              borderRadius: '8px',
                              border: '1px solid var(--lx-line)',
                              fontSize: '0.82rem',
                              outline: 'none',
                              backgroundColor: '#ffffff'
                            }}
                          >
                            {EVENT_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                            Start Time *
                          </label>
                          <input
                            type="datetime-local"
                            value={newEventStart}
                            onChange={(e) => setNewEventStart(e.target.value)}
                            required
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              borderRadius: '8px',
                              border: '1px solid var(--lx-line)',
                              fontSize: '0.82rem',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                            End Time *
                          </label>
                          <input
                            type="datetime-local"
                            value={newEventEnd}
                            onChange={(e) => setNewEventEnd(e.target.value)}
                            required
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              borderRadius: '8px',
                              border: '1px solid var(--lx-line)',
                              fontSize: '0.82rem',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                            Timezone
                          </label>
                          <Input
                            value={newEventTimezone}
                            onChange={(e) => setNewEventTimezone(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                            Meeting Link (https://...)
                          </label>
                          <Input
                            placeholder="https://meet.google.com/xyz or Zoom link"
                            value={newEventLink}
                            onChange={(e) => setNewEventLink(e.target.value)}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                            Location / Platform
                          </label>
                          <Input
                            placeholder="e.g. Google Meet, HackerRank, Office"
                            value={newEventLocation}
                            onChange={(e) => setNewEventLocation(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                          Instructions &amp; Round Notes
                        </label>
                        <textarea
                          placeholder="Interviewer names, topics to prepare, test login codes..."
                          value={newEventNotes}
                          onChange={(e) => setNewEventNotes(e.target.value)}
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '0.55rem',
                            borderRadius: '8px',
                            border: '1px solid var(--lx-line)',
                            fontSize: '0.82rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowAddEventForm(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm" disabled={isSavingEvent}>
                          {isSavingEvent ? 'Scheduling...' : 'Confirm Schedule'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* List of Events */}
                  {loadingEvents ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--lx-txt-3)', fontSize: '0.85rem' }}>
                      Loading interview schedule...
                    </div>
                  ) : events.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', border: '1px dashed var(--lx-line)', borderRadius: '12px', backgroundColor: '#fafafa' }}>
                      <CalendarDays size={32} style={{ color: 'var(--lx-txt-3)', margin: '0 auto 0.5rem' }} />
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--lx-ink)' }}>
                        No interview rounds scheduled yet
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--lx-txt-2)', marginTop: '2px' }}>
                        Track your coding tests, HR calls, and technical deep dives to receive automated reminders.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {events.map((ev) => {
                        const isCancelled = ev.status === 'cancelled';
                        const isCompleted = ev.status === 'completed';
                        const typeLabel = EVENT_TYPES.find((t) => t.value === ev.event_type)?.label || ev.event_type;

                        return (
                          <div
                            key={ev.id}
                            style={{
                              padding: '1rem',
                              borderRadius: '12px',
                              border: isCancelled ? '1px dashed #CBD5E1' : '1px solid var(--lx-line)',
                              backgroundColor: isCancelled ? '#F8FAFC' : '#ffffff',
                              boxShadow: isCancelled ? 'none' : 'var(--shadow-lx-card)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.65rem',
                              opacity: isCancelled ? 0.75 : 1,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--lx-ink)', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                                    {ev.title}
                                  </span>
                                  <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    backgroundColor: 'var(--lx-surface-2)',
                                    color: 'var(--lx-txt-2)',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '6px'
                                  }}>
                                    {typeLabel}
                                  </span>
                                  <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '6px',
                                    backgroundColor: isCompleted ? '#DCFCE7' : (isCancelled ? '#FEE2E2' : '#EFF6FF'),
                                    color: isCompleted ? '#166534' : (isCancelled ? '#991B1B' : '#1D4ED8')
                                  }}>
                                    {ev.status}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--lx-txt-2)', marginTop: '4px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={13} style={{ color: 'var(--lx-txt-3)' }} />
                                    <span>{formatEventTime(ev.start_time, ev.timezone)} &ndash; {formatEventTime(ev.end_time, ev.timezone)}</span>
                                  </div>
                                  {ev.location && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <MapPin size={13} style={{ color: 'var(--lx-txt-3)' }} />
                                      <span>{ev.location}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons: Calendar download, completion, delete */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadCalendarIcs(ev.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', height: '30px', padding: '0 0.55rem' }}
                                  title="Download RFC 5545 .ics Calendar File"
                                >
                                  <Download size={13} />
                                  <span>.ics Calendar</span>
                                </Button>

                                {!isCompleted && !isCancelled && (
                                  <button
                                    type="button"
                                    onClick={() => handleStatusEvent(ev.id, 'completed')}
                                    style={{
                                      background: '#DCFCE7',
                                      color: '#166534',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '0.3rem 0.6rem',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Done
                                  </button>
                                )}

                                {!isCancelled && !isCompleted && (
                                  <button
                                    type="button"
                                    onClick={() => handleStatusEvent(ev.id, 'cancelled')}
                                    style={{
                                      background: '#FEE2E2',
                                      color: '#991B1B',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '0.3rem 0.6rem',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Cancel
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteEvent(ev.id)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--lx-txt-3)',
                                    cursor: 'pointer',
                                    padding: '4px'
                                  }}
                                  title="Delete event"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Meeting Link Banner if provided */}
                            {ev.meeting_link && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                borderRadius: '8px',
                                padding: '0.45rem 0.75rem',
                                fontSize: '0.8rem'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1E40AF', fontWeight: 600 }}>
                                  <Video size={14} />
                                  <span>Meeting Link Ready</span>
                                </div>
                                <a
                                  href={ev.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: '#2563EB',
                                    fontWeight: 700,
                                    textDecoration: 'none'
                                  }}
                                >
                                  <span>Join Meeting</span>
                                  <ExternalLink size={12} />
                                </a>
                              </div>
                            )}

                            {ev.notes && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--lx-txt-2)', fontStyle: 'italic', backgroundColor: '#fafafa', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                                Notes: {ev.notes}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: GROUNDED AI INTERVIEW PREPARATION PACK */}
              {detailTab === 'prep' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Top Bar with Re-generate button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                        Personalized Grounded Interview Preparation
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--lx-txt-2)' }}>
                        AI study kit grounded directly in your verified profile, student projects, and role specifications.
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadPrepPackForApp(selectedAppForDetail.id, true)}
                      disabled={refreshingPrep || loadingPrep}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <RefreshCw size={13} className={refreshingPrep ? 'animate-spin' : ''} />
                      <span>{refreshingPrep ? 'Regenerating...' : 'Re-generate Prep'}</span>
                    </Button>
                  </div>

                  {/* Practice Simulation Disclaimer Banner */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    borderRadius: '10px',
                    padding: '0.75rem 0.9rem',
                    fontSize: '0.8rem',
                    color: '#92400E'
                  }}>
                    <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#B45309' }} />
                    <div>
                      <span style={{ fontWeight: 800 }}>Practice Simulation Disclaimer: </span>
                      {prepPack?.disclaimer ||
                        "These interview preparation questions, checklists, and simulation materials are AI-assisted study aids grounded in your candidate profile, projects, and target role requirements. They are designed for practice and revision, and do not represent leaked or official questions from the hiring organization."}
                    </div>
                  </div>

                  {loadingPrep ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--lx-txt-3)' }}>
                      <Sparkles size={28} style={{ color: 'var(--lx-blue)', margin: '0 auto 0.75rem', animation: 'spin 3s linear infinite' }} />
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Synthesizing personalized prep pack...</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--lx-txt-3)', marginTop: '2px' }}>
                        Analyzing candidate projects and role requirements
                      </div>
                    </div>
                  ) : !prepPack ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--lx-txt-3)' }}>
                      No preparation pack available. Click "Re-generate Prep" to initialize.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* Stage 4 Sub-Navigation Bar */}
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        borderBottom: '1px solid var(--lx-line)',
                        paddingBottom: '0.65rem',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                      }}>
                        {[
                          { id: 'overview', label: 'Overview', icon: Compass },
                          { id: 'skill_gaps', label: `Skill Gaps (${prepPack.skill_gaps?.priority_gaps?.length ?? 0})`, icon: Target },
                          { id: 'questions', label: `Interview Questions (${prepPack.question_bank?.length ?? 0})`, icon: HelpCircle },
                          { id: 'mock_tests', label: `Mock Tests (${mockTestAttempts.length})`, icon: Award },
                          { id: 'simulator', label: 'AI Simulator', icon: Sparkles },
                          { id: 'resources', label: `Learning Resources (${prepPack.learning_resources?.length ?? 0})`, icon: BookOpen }
                        ].map((sub) => {
                          const isActive = prepSectionTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => setPrepSectionTab(sub.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                padding: '0.45rem 0.85rem',
                                borderRadius: '8px',
                                border: isActive ? '1px solid var(--lx-blue)' : '1px solid var(--lx-line)',
                                backgroundColor: isActive ? '#EFF6FF' : '#ffffff',
                                color: isActive ? '#1D4ED8' : 'var(--lx-ink)',
                                fontSize: '0.8rem',
                                fontWeight: isActive ? 800 : 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <sub.icon size={14} style={{ color: isActive ? '#2563EB' : 'var(--lx-txt-3)' }} />
                              <span>{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* SUB-TAB 1: OVERVIEW */}
                      {prepSectionTab === 'overview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {/* Target Opportunity & Coverage Card */}
                          <div style={{
                            padding: '1.1rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid var(--lx-line)',
                            borderRadius: '12px',
                            boxShadow: 'var(--shadow-lx-card)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.85rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--lx-txt-3)', textTransform: 'uppercase' }}>
                                  Target Opportunity
                                </div>
                                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                                  {prepPack.role_title} • {prepPack.company_name}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  backgroundColor: prepPack.is_ai_generated ? '#ECFDF5' : '#F1F5F9',
                                  color: prepPack.is_ai_generated ? '#065F46' : '#475569',
                                  border: prepPack.is_ai_generated ? '1px solid #A7F3D0' : '1px solid #CBD5E1'
                                }}>
                                  {prepPack.is_ai_generated ? '✨ AI-Synthesized Pack' : '⚙️ Deterministic Grounded Pack'}
                                </span>
                              </div>
                            </div>

                            {/* Job Description Status Alert if missing */}
                            {prepPack.skill_gaps?.job_description_status === 'missing' && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.6rem 0.75rem',
                                backgroundColor: '#FFFBEB',
                                border: '1px solid #FDE68A',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                color: '#92400E'
                              }}>
                                <AlertCircle size={15} style={{ flexShrink: 0, color: '#D97706' }} />
                                <div>
                                  <strong>Notice:</strong> No job description snapshot provided. Analysis is based on industry standard requirements for <em>{prepPack.role_title}</em>. Add a job description in the Application Details tab to unlock company-specific requirement parsing.
                                </div>
                              </div>
                            )}

                            {/* Skill Coverage Score Bar */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                                <span style={{ color: 'var(--lx-ink)' }}>Mandatory Job Requirement Coverage</span>
                                <span style={{ color: 'var(--lx-blue)' }}>{prepPack.skill_gaps?.skill_coverage ?? 100}%</span>
                              </div>
                              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--lx-surface-2)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${prepPack.skill_gaps?.skill_coverage ?? 100}%`,
                                  height: '100%',
                                  backgroundColor: (prepPack.skill_gaps?.skill_coverage ?? 100) >= 70 ? '#10B981' : '#F59E0B',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                            </div>
                          </div>

                          {/* Interactive Preparation Checklist */}
                          <div style={{
                            padding: '1.1rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid var(--lx-line)',
                            borderRadius: '12px',
                            boxShadow: 'var(--shadow-lx-card)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ListChecks size={18} style={{ color: 'var(--lx-blue)' }} />
                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                                  Interactive Preparation Checklist
                                </span>
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--lx-blue)' }}>
                                {completedCount} / {checklistItems.length} ({checklistPercent}%)
                              </span>
                            </div>

                            <div style={{ width: '100%', height: '7px', backgroundColor: 'var(--lx-surface-2)', borderRadius: '999px', overflow: 'hidden', marginBottom: '1rem' }}>
                              <div style={{
                                width: `${checklistPercent}%`,
                                height: '100%',
                                backgroundColor: checklistPercent === 100 ? '#10B981' : 'var(--lx-blue)',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {checklistItems.map((item) => {
                                const isDone = item.completed;
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => handleToggleChecklist(item.id, isDone)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.65rem',
                                      padding: '0.5rem 0.65rem',
                                      borderRadius: '8px',
                                      backgroundColor: isDone ? '#F0FDF4' : 'var(--lx-surface-2)',
                                      border: isDone ? '1px solid #BBF7D0' : '1px solid transparent',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    {isDone ? (
                                      <CheckSquare size={17} style={{ color: '#16A34A', flexShrink: 0 }} />
                                    ) : (
                                      <Square size={17} style={{ color: 'var(--lx-txt-3)', flexShrink: 0 }} />
                                    )}

                                    <div style={{
                                      flex: 1,
                                      fontSize: '0.82rem',
                                      color: isDone ? '#166534' : 'var(--lx-ink)',
                                      textDecoration: isDone ? 'line-through' : 'none',
                                      fontWeight: isDone ? 500 : 600
                                    }}>
                                      {item.task}
                                    </div>

                                    {item.category && (
                                      <span style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        backgroundColor: isDone ? '#DCFCE7' : '#ffffff',
                                        color: isDone ? '#15803D' : 'var(--lx-txt-3)',
                                        padding: '0.15rem 0.45rem',
                                        borderRadius: '6px',
                                        border: '1px solid var(--lx-line)'
                                      }}>
                                        {item.category}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Questions to Ask Interviewer */}
                          {Array.isArray(prepPack.questions_for_interviewer) && prepPack.questions_for_interviewer.length > 0 && (
                            <div style={{
                              padding: '1.1rem',
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--lx-line)',
                              borderRadius: '12px',
                              boxShadow: 'var(--shadow-lx-card)'
                            }}>
                              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.5rem' }}>
                                High-Impact Reverse-Interview Questions to Ask {prepPack.company_name}
                              </div>
                              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--lx-ink)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {prepPack.questions_for_interviewer.map((q, idx) => (
                                  <li key={idx}>{q}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUB-TAB 2: SKILL GAPS */}
                      {prepSectionTab === 'skill_gaps' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {/* Summary Statistics Pills */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                            gap: '0.65rem'
                          }}>
                            {[
                              { label: 'Demonstrated', count: prepPack.skill_gaps?.summary?.demonstrated_count ?? (prepPack.skill_gaps?.demonstrated?.length || 0), bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46' },
                              { label: 'Listed', count: prepPack.skill_gaps?.summary?.listed_count ?? (prepPack.skill_gaps?.listed?.length || 0), bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF' },
                              { label: 'Priority Gaps', count: prepPack.skill_gaps?.summary?.priority_gap_count ?? (prepPack.skill_gaps?.priority_gaps?.length || 0), bg: '#FEF2F2', border: '#FECACA', color: '#991B1B' },
                              { label: 'Preferred', count: prepPack.skill_gaps?.summary?.preferred_count ?? (prepPack.skill_gaps?.preferred?.length || 0), bg: '#FAF5FF', border: '#E9D5FF', color: '#6B21A8' },
                              { label: 'Unknown Evidence', count: prepPack.skill_gaps?.summary?.unknown_count ?? (prepPack.skill_gaps?.unknown?.length || 0), bg: '#F8FAFC', border: '#E2E8F0', color: '#475569' }
                            ].map((stat, sIdx) => (
                              <div
                                key={sIdx}
                                style={{
                                  padding: '0.65rem 0.85rem',
                                  borderRadius: '10px',
                                  backgroundColor: stat.bg,
                                  border: `1px solid ${stat.border}`,
                                  textAlign: 'center'
                                }}
                              >
                                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: stat.color }}>
                                  {stat.count}
                                </div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: stat.color, textTransform: 'uppercase' }}>
                                  {stat.label}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* 1. Priority Gaps Section */}
                          <div style={{
                            padding: '1.1rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid var(--lx-line)',
                            borderRadius: '12px',
                            boxShadow: 'var(--shadow-lx-card)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                              <Target size={18} style={{ color: '#DC2626' }} />
                              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                                Priority Skill Gaps (Mandatory Qualifications Requiring Focus)
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--lx-txt-2)', marginBottom: '0.85rem' }}>
                              These skills are mandatory for this role and missing or unverified in your candidate profile. Add them to your preparation roadmap to close the gap before technical rounds.
                            </div>

                            {(!prepPack.skill_gaps?.priority_gaps || prepPack.skill_gaps.priority_gaps.length === 0) ? (
                              <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', color: '#166534', fontSize: '0.85rem', fontWeight: 700 }}>
                                🎉 No priority skill gaps! Your projects and verified profile satisfy all mandatory requirements for this role.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {prepPack.skill_gaps.priority_gaps.map((gap, gIdx) => {
                                  const isInChecklist = checklistItems.some(
                                    (c) => c.skill_name?.toLowerCase() === gap.skill_name?.toLowerCase() || c.task?.toLowerCase().includes(gap.skill_name?.toLowerCase())
                                  );
                                  const inRoadmap = gap.in_roadmap || isInChecklist;
                                  const isAdding = addingSkillToRoadmap === gap.skill_name;

                                  return (
                                    <div
                                      key={gIdx}
                                      style={{
                                        padding: '0.9rem',
                                        borderRadius: '10px',
                                        backgroundColor: '#FEF2F2',
                                        border: '1px solid #FECACA',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.55rem'
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#991B1B' }}>
                                              {gap.skill_name}
                                            </span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' }}>
                                              {gap.requirement_type || 'Mandatory Requirement'}
                                            </span>
                                            {gap.category && (
                                              <span style={{ fontSize: '0.7rem', color: 'var(--lx-txt-3)' }}>
                                                • {gap.category}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Action Button: Add to Roadmap */}
                                        <div>
                                          {inRoadmap ? (
                                            <span style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '0.35rem',
                                              fontSize: '0.72rem',
                                              fontWeight: 700,
                                              padding: '0.3rem 0.6rem',
                                              borderRadius: '6px',
                                              backgroundColor: '#DCFCE7',
                                              color: '#166534',
                                              border: '1px solid #86EFAC'
                                            }}>
                                              <Check size={12} />
                                              <span>In Preparation Roadmap</span>
                                            </span>
                                          ) : (
                                            <Button
                                              variant="primary"
                                              size="sm"
                                              onClick={() => handleAddSkillToRoadmap(gap.skill_name)}
                                              disabled={isAdding}
                                              style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
                                            >
                                              {isAdding ? 'Adding...' : '+ Add to Roadmap'}
                                            </Button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Priority Rationale & Learning Objective */}
                                      <div style={{ fontSize: '0.8rem', color: '#7F1D1D' }}>
                                        <strong>Why Prioritized:</strong> {gap.priority_reason || 'Core technical qualification expected by hiring team.'}
                                      </div>
                                      <div style={{ fontSize: '0.8rem', color: 'var(--lx-ink)' }}>
                                        <strong>Learning Objective:</strong> {gap.learning_objective || `Build competency in ${gap.skill_name} architecture and patterns.`}
                                      </div>

                                      {/* Estimated Effort */}
                                      <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>
                                        ⏱️ {gap.estimated_effort || 'Estimated effort: ~8–12 hours (clearly marked as estimate)'}
                                      </div>

                                      {/* Job & Candidate Evidence */}
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem', marginTop: '0.2rem' }}>
                                        <div style={{ fontSize: '0.74rem', backgroundColor: '#ffffff', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #FCA5A5', color: '#991B1B' }}>
                                          <strong>Job Evidence:</strong> "{gap.job_evidence}"
                                        </div>
                                        <div style={{ fontSize: '0.74rem', backgroundColor: '#ffffff', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #E2E8F0', color: 'var(--lx-txt-2)' }}>
                                          <strong>Student Profile:</strong> {gap.student_evidence || 'No verified project or keyword evidence found.'}
                                        </div>
                                      </div>

                                      {/* Curated Resources */}
                                      {Array.isArray(gap.resources) && gap.resources.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.3rem' }}>
                                          {gap.resources.map((res, rIdx) => (
                                            <a
                                              key={rIdx}
                                              href={res.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '0.72rem',
                                                padding: '0.2rem 0.45rem',
                                                borderRadius: '5px',
                                                backgroundColor: '#ffffff',
                                                color: '#2563EB',
                                                border: '1px solid #BFDBFE',
                                                textDecoration: 'none',
                                                fontWeight: 600
                                              }}
                                            >
                                              <span>{res.title}</span>
                                              <ExternalLink size={10} />
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* 2. Demonstrated & Listed Skills Section */}
                          <div style={{
                            padding: '1.1rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid var(--lx-line)',
                            borderRadius: '12px',
                            boxShadow: 'var(--shadow-lx-card)'
                          }}>
                            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.5rem' }}>
                              Demonstrated &amp; Listed Skills (Profile Match)
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {(prepPack.skill_gaps?.demonstrated || []).map((item, idx) => (
                                <div
                                  key={`dem_${idx}`}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.55rem 0.75rem',
                                    borderRadius: '8px',
                                    backgroundColor: '#F0FDF4',
                                    border: '1px solid #BBF7D0',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  <div>
                                    <strong style={{ color: '#166534' }}>{item.skill_name}</strong>
                                    <span style={{ fontSize: '0.74rem', color: '#15803D', marginLeft: '0.5rem' }}>
                                      {item.student_evidence}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#166534' }}>
                                    Demonstrated
                                  </span>
                                </div>
                              ))}

                              {(prepPack.skill_gaps?.listed || []).map((item, idx) => (
                                <div
                                  key={`list_${idx}`}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.55rem 0.75rem',
                                    borderRadius: '8px',
                                    backgroundColor: '#EFF6FF',
                                    border: '1px solid #BFDBFE',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  <div>
                                    <strong style={{ color: '#1E40AF' }}>{item.skill_name}</strong>
                                    <span style={{ fontSize: '0.74rem', color: '#2563EB', marginLeft: '0.5rem' }}>
                                      {item.student_evidence} (Project proof recommended)
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                                    Listed
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 3. Preferred & Unknown Qualifications */}
                          {((prepPack.skill_gaps?.preferred?.length || 0) > 0 || (prepPack.skill_gaps?.unknown?.length || 0) > 0) && (
                            <div style={{
                              padding: '1.1rem',
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--lx-line)',
                              borderRadius: '12px',
                              boxShadow: 'var(--shadow-lx-card)'
                            }}>
                              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.5rem' }}>
                                Preferred Qualifications &amp; Foundational Review
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {(prepPack.skill_gaps?.preferred || []).map((item, idx) => (
                                  <div
                                    key={`pref_${idx}`}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '0.55rem 0.75rem',
                                      borderRadius: '8px',
                                      backgroundColor: '#FAF5FF',
                                      border: '1px solid #E9D5FF',
                                      fontSize: '0.8rem'
                                    }}
                                  >
                                    <div>
                                      <strong style={{ color: '#6B21A8' }}>{item.skill_name}</strong>
                                      <span style={{ fontSize: '0.74rem', color: '#7E22CE', marginLeft: '0.5rem' }}>
                                        Preferred qualification • {item.learning_objective}
                                      </span>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: '#F3E8FF', color: '#6B21A8' }}>
                                      Preferred
                                    </span>
                                  </div>
                                ))}

                                {(prepPack.skill_gaps?.unknown || []).map((item, idx) => (
                                  <div
                                    key={`unk_${idx}`}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '0.55rem 0.75rem',
                                      borderRadius: '8px',
                                      backgroundColor: '#F8FAFC',
                                      border: '1px solid #E2E8F0',
                                      fontSize: '0.8rem'
                                    }}
                                  >
                                    <div>
                                      <strong style={{ color: '#334155' }}>{item.skill_name}</strong>
                                      <span style={{ fontSize: '0.74rem', color: '#64748B', marginLeft: '0.5rem' }}>
                                        {item.student_evidence}
                                      </span>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#475569' }}>
                                      Unknown
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUB-TAB 3: INTERVIEW QUESTIONS */}
                      {prepSectionTab === 'questions' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {/* Category Filter Pills */}
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {[
                              'All',
                              'Technical Fundamentals',
                              'Job-Specific Technologies',
                              'Coding and DSA',
                              'SQL and Databases',
                              'Resume and Project Deep-Dives',
                              'Behavioral and HR Questions',
                              'Role and Company Preparation'
                            ].map((cat) => {
                              const isSelected = questionCategoryFilter === cat;
                              const count = cat === 'All'
                                ? (prepPack.question_bank?.length || 0)
                                : (prepPack.question_bank?.filter((q) => q.category === cat).length || 0);

                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setQuestionCategoryFilter(cat)}
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: isSelected ? 800 : 600,
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '999px',
                                    border: isSelected ? '1px solid var(--lx-blue)' : '1px solid var(--lx-line)',
                                    backgroundColor: isSelected ? 'var(--lx-blue)' : '#ffffff',
                                    color: isSelected ? '#ffffff' : 'var(--lx-ink)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {cat} ({count})
                                </button>
                              );
                            })}
                          </div>

                          {/* Questions List */}
                          {(() => {
                            const filtered = (prepPack.question_bank || []).filter((q) => {
                              if (questionCategoryFilter === 'All') return true;
                              return q.category === questionCategoryFilter;
                            });

                            if (filtered.length === 0) {
                              return (
                                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid var(--lx-line)', color: 'var(--lx-txt-3)' }}>
                                  No interview questions found for category "{questionCategoryFilter}".
                                </div>
                              );
                            }

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {filtered.map((q, idx) => {
                                  const isExpanded = expandedQuestionId === q.id || expandedQuestionId === `q_${idx}`;
                                  const qId = q.id || `q_${idx}`;

                                  return (
                                    <div
                                      key={qId}
                                      style={{
                                        padding: '1rem',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid var(--lx-line)',
                                        borderRadius: '12px',
                                        boxShadow: 'var(--shadow-lx-card)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.55rem'
                                      }}
                                    >
                                      {/* Header with Category & Difficulty */}
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                            {q.category}
                                          </span>
                                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}>
                                            {q.difficulty || 'Intermediate'}
                                          </span>
                                          <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>
                                            • Practice Question
                                          </span>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => setExpandedQuestionId(isExpanded ? null : qId)}
                                          style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: 'var(--lx-blue)',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '3px'
                                          }}
                                        >
                                          <span>{isExpanded ? 'Hide Guidance' : 'View Answer & Guidance'}</span>
                                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                      </div>

                                      {/* Question Text */}
                                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                                        {q.question}
                                      </div>

                                      {/* Why Relevant */}
                                      {q.why_relevant && (
                                        <div style={{ fontSize: '0.78rem', color: 'var(--lx-txt-2)', fontStyle: 'italic', backgroundColor: 'var(--lx-surface-2)', padding: '0.35rem 0.6rem', borderRadius: '6px' }}>
                                          <strong>Why Relevant:</strong> {q.why_relevant}
                                        </div>
                                      )}

                                      {/* Expandable Accordion Body */}
                                      {isExpanded && (
                                        <div style={{
                                          marginTop: '0.5rem',
                                          paddingTop: '0.75rem',
                                          borderTop: '1px solid var(--lx-line)',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '0.75rem'
                                        }}>
                                          {/* Expected Answer Points */}
                                          {Array.isArray(q.expected_answer_points) && q.expected_answer_points.length > 0 && (
                                            <div>
                                              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.25rem' }}>
                                                Expected Key Points (Interviewer Evaluation Criteria):
                                              </div>
                                              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--lx-ink)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                {q.expected_answer_points.map((pt, pIdx) => (
                                                  <li key={pIdx}>{pt}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}

                                          {/* Sample Answer / Solution */}
                                          {q.sample_answer && (
                                            <div>
                                              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.25rem' }}>
                                                Sample Solution / Recommended Response:
                                              </div>
                                              <div style={{
                                                fontSize: '0.8rem',
                                                lineHeight: 1.55,
                                                color: '#1E293B',
                                                backgroundColor: '#F8FAFC',
                                                padding: '0.65rem 0.85rem',
                                                borderRadius: '8px',
                                                border: '1px solid #E2E8F0',
                                                whiteSpace: 'pre-line'
                                              }}>
                                                {q.sample_answer}
                                              </div>
                                            </div>
                                          )}

                                          {/* Common Mistakes */}
                                          {Array.isArray(q.common_mistakes) && q.common_mistakes.length > 0 && (
                                            <div>
                                              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B91C1C', marginBottom: '0.25rem' }}>
                                                Common Pitfalls to Avoid:
                                              </div>
                                              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#991B1B', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                {q.common_mistakes.map((m, mIdx) => (
                                                  <li key={mIdx}>{m}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}

                                          {/* Follow-up Questions */}
                                          {Array.isArray(q.follow_up_questions) && q.follow_up_questions.length > 0 && (
                                            <div>
                                              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1D4ED8', marginBottom: '0.25rem' }}>
                                                Anticipated Follow-up Questions:
                                              </div>
                                              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#1E40AF', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                {q.follow_up_questions.map((fq, fIdx) => (
                                                  <li key={fIdx}>{fq}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}

                                          {/* Relevant Resources */}
                                          {Array.isArray(q.learning_resources) && q.learning_resources.length > 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
                                              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--lx-txt-3)' }}>
                                                Study Resource:
                                              </span>
                                              {q.learning_resources.map((res, rIdx) => (
                                                <a
                                                  key={rIdx}
                                                  href={res.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                    fontSize: '0.72rem',
                                                    padding: '0.15rem 0.45rem',
                                                    borderRadius: '4px',
                                                    backgroundColor: '#EFF6FF',
                                                    color: '#2563EB',
                                                    border: '1px solid #BFDBFE',
                                                    textDecoration: 'none',
                                                    fontWeight: 600
                                                  }}
                                                >
                                                  <span>{res.title}</span>
                                                  <ExternalLink size={10} />
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* SUB-TAB: JOB-SPECIFIC PRACTICE MOCK TESTS */}
                      {prepSectionTab === 'mock_tests' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {/* 1. LOBBY VIEW: Configuration & Past Attempts History */}
                          {mockTestViewMode === 'lobby' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                              {/* Introduction Card */}
                              <div style={{
                                padding: '1.15rem',
                                borderRadius: '12px',
                                backgroundColor: '#ffffff',
                                border: '1px solid var(--lx-line)',
                                boxShadow: 'var(--shadow-lx-card)'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                  <div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                                      Job-Specific Practice Mock Tests
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--lx-txt-2)', marginTop: '2px' }}>
                                      Evaluate your technical depth, coding concepts, and problem-solving readiness under timed or untimed conditions.
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                      Target: {prepPack.role_title}
                                    </span>
                                  </div>
                                </div>

                                {/* Category Selection Grid */}
                                <div style={{ marginTop: '1rem' }}>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.5rem' }}>
                                    1. Choose Test Category
                                  </label>
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                    gap: '0.85rem',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                  }}>
                                    {(mockTestCategories.length > 0 ? mockTestCategories : CANONICAL_TEST_CATEGORIES).map((cat) => {
                                      const isSelected = selectedTestCategory === cat.name;
                                      return (
                                        <button
                                          key={cat.id || cat.name}
                                          type="button"
                                          onClick={() => setSelectedTestCategory(cat.name)}
                                          style={{
                                            textAlign: 'left',
                                            padding: '0.85rem 1rem',
                                            borderRadius: '10px',
                                            border: isSelected ? '2px solid var(--lx-blue)' : '1px solid var(--lx-line)',
                                            backgroundColor: isSelected ? '#EFF6FF' : '#ffffff',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            gap: '0.65rem',
                                            minWidth: 0,
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            whiteSpace: 'normal',
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word'
                                          }}
                                        >
                                          <div style={{ width: '100%', minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', width: '100%', marginBottom: '0.35rem' }}>
                                              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: isSelected ? '#1D4ED8' : 'var(--lx-ink)', lineHeight: 1.35, whiteSpace: 'normal', wordBreak: 'break-word', flex: 1, minWidth: 0 }}>
                                                {cat.name}
                                              </span>
                                              {cat.recommended && (
                                                <span style={{ fontSize: '0.64rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#166534', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                                  Role Match
                                                </span>
                                              )}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--lx-txt-2)', lineHeight: 1.45, whiteSpace: 'normal', wordBreak: 'normal', overflowWrap: 'break-word', width: '100%' }}>
                                              {cat.description}
                                            </div>
                                          </div>

                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--lx-txt-3)', paddingTop: '0.5rem', borderTop: '1px dashed var(--lx-line)', marginTop: '0.35rem', width: '100%', whiteSpace: 'normal' }}>
                                            <span>~{cat.available_questions || 25} questions available</span>
                                            {isSelected && <Check size={14} style={{ color: 'var(--lx-blue)', flexShrink: 0 }} />}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Configuration Controls: Difficulty, Questions, Timer */}
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                  gap: '1rem',
                                  marginTop: '1.25rem',
                                  paddingTop: '1rem',
                                  borderTop: '1px solid var(--lx-line)'
                                }}>
                                  {/* Difficulty */}
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.35rem' }}>
                                      2. Difficulty
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                                      {['Easy', 'Medium', 'Hard'].map((diff) => (
                                        <button
                                          key={diff}
                                          type="button"
                                          onClick={() => setSelectedDifficulty(diff)}
                                          style={{
                                            flex: 1,
                                            padding: '0.35rem 0.5rem',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            border: selectedDifficulty === diff ? '1px solid var(--lx-blue)' : '1px solid var(--lx-line)',
                                            backgroundColor: selectedDifficulty === diff ? '#EFF6FF' : '#ffffff',
                                            color: selectedDifficulty === diff ? '#1D4ED8' : 'var(--lx-txt-2)',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          {diff}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Question Count */}
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.35rem' }}>
                                      3. Question Count
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                                      {[10, 15, 20, 25].map((cnt) => (
                                        <button
                                          key={cnt}
                                          type="button"
                                          onClick={() => {
                                            setSelectedQuestionCount(cnt);
                                            const calcMinutes = cnt <= 10 ? 15 : cnt <= 15 ? 25 : cnt <= 20 ? 35 : 45;
                                            setTestTimeLimitMinutes(calcMinutes);
                                          }}
                                          style={{
                                            flex: 1,
                                            padding: '0.35rem 0.5rem',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            border: selectedQuestionCount === cnt ? '1px solid var(--lx-blue)' : '1px solid var(--lx-line)',
                                            backgroundColor: selectedQuestionCount === cnt ? '#EFF6FF' : '#ffffff',
                                            color: selectedQuestionCount === cnt ? '#1D4ED8' : 'var(--lx-txt-2)',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          {cnt} Qs
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Mode / Timer */}
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.35rem' }}>
                                      4. Timer Mode
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                                      <button
                                        type="button"
                                        onClick={() => setIsTestTimed(true)}
                                        style={{
                                          flex: 1,
                                          padding: '0.35rem 0.5rem',
                                          borderRadius: '6px',
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          border: isTestTimed ? '1px solid var(--lx-blue)' : '1px solid var(--lx-line)',
                                          backgroundColor: isTestTimed ? '#EFF6FF' : '#ffffff',
                                          color: isTestTimed ? '#1D4ED8' : 'var(--lx-txt-2)',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <Clock size={12} />
                                        <span>Timed ({testTimeLimitMinutes}m)</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setIsTestTimed(false)}
                                        style={{
                                          flex: 1,
                                          padding: '0.35rem 0.5rem',
                                          borderRadius: '6px',
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          border: !isTestTimed ? '1px solid var(--lx-blue)' : '1px solid var(--lx-line)',
                                          backgroundColor: !isTestTimed ? '#EFF6FF' : '#ffffff',
                                          color: !isTestTimed ? '#1D4ED8' : 'var(--lx-txt-2)',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Untimed
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Start Test Action Bar */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--lx-line)', flexWrap: 'wrap', gap: '0.75rem' }}>
                                  <Button
                                    variant="outline"
                                    onClick={() => navigate(`/applications/${selectedAppForDetail.id}/mock-test`)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 700 }}
                                  >
                                    <Shield size={14} color="#6366F1" />
                                    <span>Launch Proctored Exam Portal</span>
                                  </Button>
                                  <Button
                                    variant="primary"
                                    onClick={handleStartMockTest}
                                    disabled={isStartingTest}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.4rem', fontWeight: 800 }}
                                  >
                                    <Play size={14} />
                                    <span>{isStartingTest ? 'Initializing Proctored Session...' : `Start ${selectedTestCategory} Exam`}</span>
                                  </Button>
                                </div>
                              </div>

                              {/* Previous Attempts History Card */}
                              <div style={{
                                padding: '1.15rem',
                                borderRadius: '12px',
                                backgroundColor: '#ffffff',
                                border: '1px solid var(--lx-line)',
                                boxShadow: 'var(--shadow-lx-card)'
                              }}>
                                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.75rem' }}>
                                  Previous Test Attempts ({mockTestAttempts.length})
                                </div>

                                {mockTestAttempts.length === 0 ? (
                                  <div style={{ textAlign: 'center', padding: '2rem 1rem', border: '1px dashed var(--lx-line)', borderRadius: '10px', backgroundColor: '#fafafa', color: 'var(--lx-txt-3)' }}>
                                    <Award size={28} style={{ color: 'var(--lx-txt-3)', margin: '0 auto 0.5rem' }} />
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--lx-ink)' }}>No mock tests taken yet</div>
                                    <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                                      Start your first practice session above to benchmark your readiness and identify weak topics.
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                    {mockTestAttempts.map((att) => {
                                      const isPassed = att.percentage >= 70;
                                      return (
                                        <div
                                          key={att.id}
                                          style={{
                                            padding: '0.75rem 0.95rem',
                                            borderRadius: '10px',
                                            border: '1px solid var(--lx-line)',
                                            backgroundColor: '#ffffff',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '0.65rem'
                                          }}
                                        >
                                          <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                                                {att.category}
                                              </span>
                                              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#475569' }}>
                                                {att.difficulty}
                                              </span>
                                              {att.is_timed && (
                                                <span style={{ fontSize: '0.68rem', color: 'var(--lx-txt-3)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                  <Clock size={11} />
                                                  <span>{att.time_limit_minutes}m limit</span>
                                                </span>
                                              )}
                                            </div>
                                            <div style={{ fontSize: '0.74rem', color: 'var(--lx-txt-3)', marginTop: '2px' }}>
                                              {new Date(att.created_at).toLocaleDateString()} · {att.correct_count}/{att.total_questions} correct ({att.incorrect_count} incorrect, {att.unanswered_count} skipped)
                                            </div>
                                          </div>

                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                              padding: '0.25rem 0.65rem',
                                              borderRadius: '6px',
                                              fontSize: '0.82rem',
                                              fontWeight: 800,
                                              backgroundColor: isPassed ? '#DCFCE7' : '#FEE2E2',
                                              color: isPassed ? '#166534' : '#991B1B',
                                              border: isPassed ? '1px solid #BBF7D0' : '1px solid #FECACA'
                                            }}>
                                              {att.percentage}% Score
                                            </div>

                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleReviewPastAttempt(att.id)}
                                              style={{ fontSize: '0.76rem', padding: '0.35rem 0.65rem' }}
                                            >
                                              Review
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 2. ACTIVE TEST TAKING VIEW */}
                          {mockTestViewMode === 'active' && activeMockTest && (
                            <div style={{
                              padding: '1.25rem',
                              borderRadius: '14px',
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--lx-line)',
                              boxShadow: 'var(--shadow-lx-card)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1.25rem'
                            }}>
                              {/* Active Test Top Header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--lx-line)', paddingBottom: '0.85rem' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                                      {activeMockTest.category}
                                    </span>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                                      {activeMockTest.difficulty}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.76rem', color: 'var(--lx-txt-3)', marginTop: '2px' }}>
                                    Question {currentQuestionIndex + 1} of {activeMockTest.questions?.length || 0}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  {activeMockTest.is_timed && remainingSeconds != null && (
                                    <div style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.4rem',
                                      padding: '0.35rem 0.75rem',
                                      borderRadius: '8px',
                                      fontSize: '0.82rem',
                                      fontWeight: 800,
                                      backgroundColor: remainingSeconds < 120 ? '#FEE2E2' : '#EFF6FF',
                                      color: remainingSeconds < 120 ? '#DC2626' : '#1D4ED8',
                                      border: remainingSeconds < 120 ? '1px solid #FCA5A5' : '1px solid #BFDBFE'
                                    }}>
                                      <Clock size={14} />
                                      <span>Time Remaining: {formatSeconds(remainingSeconds)}</span>
                                    </div>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setMockTestViewMode('lobby')}
                                    style={{
                                      padding: '0.35rem 0.65rem',
                                      borderRadius: '6px',
                                      border: '1px solid var(--lx-line)',
                                      backgroundColor: '#ffffff',
                                      color: 'var(--lx-txt-2)',
                                      fontSize: '0.76rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Save &amp; Exit
                                  </button>
                                </div>
                              </div>

                              {/* Question Quick-Jump Navigator */}
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                {(activeMockTest.questions || []).map((q, qIdx) => {
                                  const isCurrent = currentQuestionIndex === qIdx;
                                  const isAnswered = testAnswers[q.id] != null && String(testAnswers[q.id]).trim() !== '';
                                  return (
                                    <button
                                      key={q.id}
                                      type="button"
                                      onClick={() => setCurrentQuestionIndex(qIdx)}
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        fontSize: '0.78rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: isCurrent ? '2px solid var(--lx-blue)' : '1px solid var(--lx-line)',
                                        backgroundColor: isCurrent ? '#EFF6FF' : (isAnswered ? '#DCFCE7' : '#F8FAFC'),
                                        color: isCurrent ? '#1D4ED8' : (isAnswered ? '#166534' : 'var(--lx-txt-2)'),
                                        transition: 'all 0.15s ease'
                                      }}
                                    >
                                      {qIdx + 1}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Question Display Card */}
                              {(() => {
                                const currentQ = activeMockTest.questions?.[currentQuestionIndex];
                                if (!currentQ) return null;
                                const selectedAnswer = testAnswers[currentQ.id];

                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                      {currentQ.topic && (
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#475569', display: 'inline-block', marginBottom: '0.4rem' }}>
                                          Topic: {currentQ.topic}
                                        </span>
                                      )}
                                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--lx-ink)', lineHeight: 1.5 }}>
                                        {currentQuestionIndex + 1}. {currentQ.question_text}
                                      </div>
                                    </div>

                                    {/* 4 Options Grid */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                      {(currentQ.options || []).map((opt, oIdx) => {
                                        const optLetter = String.fromCharCode(65 + oIdx);
                                        const isChosen = selectedAnswer === opt;
                                        return (
                                          <button
                                            key={oIdx}
                                            type="button"
                                            onClick={() => handleSelectAnswer(currentQ.id, opt)}
                                            style={{
                                              textAlign: 'left',
                                              padding: '0.75rem 0.95rem',
                                              borderRadius: '10px',
                                              border: isChosen ? '2px solid var(--lx-blue)' : '1px solid var(--lx-line)',
                                              backgroundColor: isChosen ? '#EFF6FF' : '#ffffff',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'flex-start',
                                              gap: '0.65rem',
                                              transition: 'all 0.15s ease'
                                            }}
                                          >
                                            <span style={{
                                              width: '22px',
                                              height: '22px',
                                              borderRadius: '6px',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              fontSize: '0.75rem',
                                              fontWeight: 800,
                                              backgroundColor: isChosen ? 'var(--lx-blue)' : '#F1F5F9',
                                              color: isChosen ? '#ffffff' : 'var(--lx-ink)',
                                              flexShrink: 0
                                            }}>
                                              {optLetter}
                                            </span>
                                            <span style={{ fontSize: '0.84rem', color: isChosen ? '#1D4ED8' : 'var(--lx-ink)', fontWeight: isChosen ? 700 : 500, lineHeight: 1.45 }}>
                                              {opt}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Question Navigation Controls */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--lx-line)', paddingTop: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                                    disabled={currentQuestionIndex === 0}
                                  >
                                    Previous
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentQ = activeMockTest.questions?.[currentQuestionIndex];
                                      if (currentQ) {
                                        const updated = { ...testAnswers };
                                        delete updated[currentQ.id];
                                        setTestAnswers(updated);
                                      }
                                    }}
                                    style={{
                                      padding: '0.35rem 0.65rem',
                                      borderRadius: '6px',
                                      border: '1px solid var(--lx-line)',
                                      backgroundColor: 'transparent',
                                      color: 'var(--lx-txt-3)',
                                      fontSize: '0.76rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Clear Selection
                                  </button>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  {currentQuestionIndex < (activeMockTest.questions?.length || 1) - 1 ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                                    >
                                      Next Question
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => setShowSubmitConfirmModal(true)}
                                      disabled={isSubmittingTest}
                                      style={{ fontWeight: 800 }}
                                    >
                                      Finish &amp; Submit Test
                                    </Button>
                                  )}

                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setShowSubmitConfirmModal(true)}
                                    disabled={isSubmittingTest}
                                  >
                                    Submit
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 3. TEST RESULTS & REVISION DASHBOARD VIEW */}
                          {mockTestViewMode === 'result' && completedTestResult && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                              {/* Overall Score Banner */}
                              <div style={{
                                padding: '1.25rem',
                                borderRadius: '14px',
                                backgroundColor: '#ffffff',
                                border: '1px solid var(--lx-line)',
                                boxShadow: 'var(--shadow-lx-card)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '1rem'
                              }}>
                                <div>
                                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--lx-txt-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Mock Test Results · {completedTestResult.category}
                                  </div>
                                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--lx-ink)', marginTop: '2px' }}>
                                    {completedTestResult.score} / {completedTestResult.total_questions} Correct ({completedTestResult.percentage}%)
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: completedTestResult.percentage >= 70 ? '#166534' : '#991B1B', fontWeight: 700, marginTop: '2px' }}>
                                    {completedTestResult.percentage >= 70
                                      ? 'Strong Readiness — Demonstrates solid conceptual grasp for this opportunity.'
                                      : 'Targeted Revision Recommended — Review weak topics below before interviews.'}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                                  <div style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#166534' }}>{completedTestResult.correct_count}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#15803D', fontWeight: 600 }}>Correct</div>
                                  </div>
                                  <div style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', backgroundColor: '#FEE2E2', border: '1px solid #FECACA', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#991B1B' }}>{completedTestResult.incorrect_count}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#B91C1C', fontWeight: 600 }}>Incorrect</div>
                                  </div>
                                  <div style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#92400E' }}>{completedTestResult.unanswered_count}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#B45309', fontWeight: 600 }}>Skipped</div>
                                  </div>
                                </div>
                              </div>

                              {/* Topic Performance Breakdown Card */}
                              {completedTestResult.topic_breakdown && Object.keys(completedTestResult.topic_breakdown).length > 0 && (
                                <div style={{
                                  padding: '1.15rem',
                                  borderRadius: '12px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid var(--lx-line)',
                                  boxShadow: 'var(--shadow-lx-card)'
                                }}>
                                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.75rem' }}>
                                    Topic Performance Breakdown
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                                    {Object.entries(completedTestResult.topic_breakdown).map(([topic, stats]) => (
                                      <div key={topic} style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--lx-ink)' }}>
                                          <span>{topic}</span>
                                          <span>{stats.correct}/{stats.total} ({stats.percentage}%)</span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', borderRadius: '999px', backgroundColor: '#E2E8F0', marginTop: '0.4rem', overflow: 'hidden' }}>
                                          <div style={{
                                            width: `${stats.percentage}%`,
                                            height: '100%',
                                            backgroundColor: stats.percentage >= 70 ? '#16A34A' : (stats.percentage >= 40 ? '#EAB308' : '#DC2626')
                                          }} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Weak Topics & Roadmap Integration Card */}
                              {Array.isArray(completedTestResult.recommended_revisions) && completedTestResult.recommended_revisions.length > 0 && (
                                <div style={{
                                  padding: '1.15rem',
                                  borderRadius: '12px',
                                  backgroundColor: '#FFFBEB',
                                  border: '1px solid #FDE68A',
                                  boxShadow: 'var(--shadow-lx-card)'
                                }}>
                                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#92400E', marginBottom: '0.35rem' }}>
                                    Personalized Weak Topic Revision Recommendations
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: '#78350F', marginBottom: '0.75rem' }}>
                                    Add recommended revision tasks directly to your preparation roadmap to close conceptual gaps.
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                    {completedTestResult.recommended_revisions.map((rev, rIdx) => (
                                      <div
                                        key={rIdx}
                                        style={{
                                          padding: '0.75rem 0.95rem',
                                          borderRadius: '8px',
                                          backgroundColor: '#ffffff',
                                          border: '1px solid #FCD34D',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          flexWrap: 'wrap',
                                          gap: '0.65rem'
                                        }}
                                      >
                                        <div>
                                          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                                            {rev.topic}
                                          </div>
                                          <div style={{ fontSize: '0.76rem', color: 'var(--lx-txt-2)', marginTop: '2px' }}>
                                            {rev.reason} · {rev.suggested_action}
                                          </div>
                                        </div>

                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleAddWeakTopicToRoadmap(rev.topic)}
                                          disabled={addingWeakTopicToRoadmap === rev.topic}
                                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                                        >
                                          <Plus size={12} />
                                          <span>{addingWeakTopicToRoadmap === rev.topic ? 'Adding...' : '+ Add to Roadmap'}</span>
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Question-by-Question Review with Explanations */}
                              <div style={{
                                padding: '1.15rem',
                                borderRadius: '12px',
                                backgroundColor: '#ffffff',
                                border: '1px solid var(--lx-line)',
                                boxShadow: 'var(--shadow-lx-card)'
                              }}>
                                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.75rem' }}>
                                  Detailed Question Review &amp; Explanations
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                  {(completedTestResult.questions || []).map((q, qIdx) => {
                                    const userAns = completedTestResult.submitted_answers?.[q.id];
                                    const isCorrect = userAns != null && String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();
                                    const isUnanswered = userAns == null || String(userAns).trim() === '';
                                    const isExpanded = expandedReviewQuestionId === q.id || expandedReviewQuestionId == null;

                                    return (
                                      <div
                                        key={q.id}
                                        style={{
                                          borderRadius: '10px',
                                          border: isCorrect ? '1px solid #BBF7D0' : (isUnanswered ? '1px solid #FDE68A' : '1px solid #FECACA'),
                                          backgroundColor: '#ffffff',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        <div
                                          onClick={() => setExpandedReviewQuestionId(isExpanded ? '__none__' : q.id)}
                                          style={{
                                            padding: '0.75rem 0.95rem',
                                            backgroundColor: isCorrect ? '#F0FDF4' : (isUnanswered ? '#FFFBEB' : '#FEF2F2'),
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--lx-ink)' }}>
                                              {qIdx + 1}. {q.question_text}
                                            </span>
                                            {q.topic && (
                                              <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#ffffff', color: 'var(--lx-txt-2)', border: '1px solid var(--lx-line)' }}>
                                                {q.topic}
                                              </span>
                                            )}
                                          </div>

                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {isCorrect ? (
                                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', backgroundColor: '#DCFCE7', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                                                Correct
                                              </span>
                                            ) : isUnanswered ? (
                                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400E', backgroundColor: '#FEF3C7', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                                                Unanswered
                                              </span>
                                            ) : (
                                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#991B1B', backgroundColor: '#FEE2E2', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                                                Incorrect
                                              </span>
                                            )}
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                          </div>
                                        </div>

                                        {isExpanded && (
                                          <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                            {/* Candidate answer */}
                                            <div style={{ fontSize: '0.8rem', color: isCorrect ? '#166534' : '#991B1B' }}>
                                              <strong>Your Answer:</strong> {userAns || '(None / Skipped)'}
                                            </div>

                                            {/* Correct Answer */}
                                            <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                                              <strong>Correct Answer:</strong> {q.correct_answer}
                                            </div>

                                            {/* Explanation */}
                                            {q.explanation && (
                                              <div style={{
                                                fontSize: '0.78rem',
                                                lineHeight: 1.5,
                                                color: '#1E293B',
                                                backgroundColor: '#F8FAFC',
                                                padding: '0.65rem 0.85rem',
                                                borderRadius: '8px',
                                                border: '1px solid #E2E8F0',
                                                marginTop: '0.25rem'
                                              }}>
                                                <strong>Explanation: </strong> {q.explanation}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Footer Actions */}
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <Button
                                  variant="outline"
                                  onClick={() => setMockTestViewMode('lobby')}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                  <RotateCcw size={13} />
                                  <span>Retake / Choose Another Test</span>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUB-TAB 4: LEARNING RESOURCES */}
                      {prepSectionTab === 'resources' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div style={{ fontSize: '0.82rem', color: 'var(--lx-txt-2)' }}>
                            Verified learning resources curated directly from official documentation, standard handbooks, and open-source project catalogs to help you close priority gaps for <strong>{prepPack.role_title}</strong>.
                          </div>

                          {(!prepPack.learning_resources || prepPack.learning_resources.length === 0) ? (
                            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid var(--lx-line)', color: 'var(--lx-txt-3)' }}>
                              No learning resources cataloged for this opportunity yet.
                            </div>
                          ) : (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                              gap: '0.85rem'
                            }}>
                              {prepPack.learning_resources.map((res, rIdx) => (
                                <div
                                  key={rIdx}
                                  style={{
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid var(--lx-line)',
                                    boxShadow: 'var(--shadow-lx-card)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: '0.65rem'
                                  }}
                                >
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#475569' }}>
                                        {res.skill || res.type || 'Course / Docs'}
                                      </span>
                                      {res.isFree && (
                                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16A34A', backgroundColor: '#DCFCE7', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                          Free
                                        </span>
                                      )}
                                    </div>

                                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--lx-ink)', marginBottom: '0.25rem' }}>
                                      {res.title}
                                    </div>

                                    {res.provider && (
                                      <div style={{ fontSize: '0.74rem', color: 'var(--lx-txt-3)', marginBottom: '0.4rem' }}>
                                        Provider: {res.provider} {res.difficulty ? `• ${res.difficulty}` : ''} {res.estimatedHours ? `• ~${res.estimatedHours} hrs` : ''}
                                      </div>
                                    )}

                                    {res.description && (
                                      <div style={{ fontSize: '0.78rem', color: 'var(--lx-txt-2)', lineHeight: 1.45 }}>
                                        {res.description}
                                      </div>
                                    )}
                                  </div>

                                  <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--lx-line)' }}>
                                    <a
                                      href={res.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        color: '#2563EB',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        textDecoration: 'none'
                                      }}
                                    >
                                      <span>Open Official Resource</span>
                                      <ExternalLink size={12} />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUB-TAB 5: PERSONALIZED AI INTERVIEW SIMULATOR */}
                      {prepSectionTab === 'simulator' && (
                        <AIInterviewSimulator
                          application={selectedAppForDetail}
                          prepPack={prepPack}
                          toast={toast}
                          onChecklistUpdated={(updatedPrep) => {
                            if (updatedPrep) {
                              setPrepPack(updatedPrep);
                            } else if (selectedAppForDetail?.id) {
                              loadPrepPackForApp(selectedAppForDetail.id, false);
                            }
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Mock Test Submit Confirmation Modal */}
        {showSubmitConfirmModal && activeMockTest && (
          <Modal
            isOpen={showSubmitConfirmModal}
            onClose={() => setShowSubmitConfirmModal(false)}
            title="Confirm Mock Test Submission"
            maxWidth="480px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(() => {
                const totalQ = activeMockTest.questions?.length || 0;
                const answeredQ = Object.values(testAnswers).filter((v) => v != null && String(v).trim() !== '').length;
                const unansweredQ = Math.max(0, totalQ - answeredQ);

                return (
                  <div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--lx-ink)', lineHeight: 1.5 }}>
                      You have answered <strong>{answeredQ}</strong> out of <strong>{totalQ}</strong> questions.
                    </div>

                    {unansweredQ > 0 ? (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        backgroundColor: '#FEF3C7',
                        border: '1px solid #FCD34D',
                        fontSize: '0.78rem',
                        color: '#92400E',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'flex-start'
                      }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#B45309' }} />
                        <div>
                          <strong>Warning:</strong> You have <strong>{unansweredQ}</strong> unanswered {unansweredQ === 1 ? 'question' : 'questions'}.
                          Unanswered questions will be scored as incorrect upon submission.
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        backgroundColor: '#DCFCE7',
                        border: '1px solid #BBF7D0',
                        fontSize: '0.78rem',
                        color: '#166534',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center'
                      }}>
                        <CheckCircle2 size={16} style={{ color: '#16A34A', flexShrink: 0 }} />
                        <span>All questions have been answered. You are ready to grade!</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSubmitConfirmModal(false)}
                >
                  Continue Test
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleSubmitMockTest(false)}
                  disabled={isSubmittingTest}
                >
                  {isSubmittingTest ? 'Grading Test...' : 'Confirm Submission'}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* 5. Add Manual Application Modal */}
        {showAddModal && (
          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Track New Application"
            maxWidth="540px"
          >
            <form onSubmit={handleAddApplication} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Company Name *
                </label>
                <Input
                  placeholder="e.g. Google, Microsoft, Razorpay"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Role Title *
                </label>
                <Input
                  placeholder="e.g. Software Engineer Intern, Graduate Trainee"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Opportunity Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1px solid var(--lx-line)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Job">Job</option>
                    <option value="Internship">Internship</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Scholarship">Scholarship</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Initial Stage
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1px solid var(--lx-line)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    {CANONICAL_STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Recruiter / Contact Name
                  </label>
                  <Input
                    placeholder="e.g. Jane Doe"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Contact Info (Email/LinkedIn)
                  </label>
                  <Input
                    placeholder="e.g. recruiter@company.com"
                    value={newContactInfo}
                    onChange={(e) => setNewContactInfo(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Next Action Item
                </label>
                <Input
                  placeholder="e.g. Complete coding challenge, Send thank you note"
                  value={newNextAction}
                  onChange={(e) => setNewNextAction(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Submission / Applied Date
                  </label>
                  <input
                    type="date"
                    value={newSubmissionDate}
                    onChange={(e) => setNewSubmissionDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1px solid var(--lx-line)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Follow-up Reminder Date
                  </label>
                  <input
                    type="date"
                    value={newFollowUp}
                    onChange={(e) => setNewFollowUp(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1px solid var(--lx-line)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Application URL
                </label>
                <Input
                  placeholder="https://..."
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Initial Notes
                </label>
                <textarea
                  placeholder="Notes, interview date, referral information..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--lx-line)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Track Application
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* 6. Delete Confirmation Modal */}
        {appToDelete && (
          <Modal
            isOpen={Boolean(appToDelete)}
            onClose={() => setAppToDelete(null)}
            title="Remove Application"
            maxWidth="440px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--lx-txt-2)', margin: 0 }}>
                Are you sure you want to remove your tracking record for <strong>{appToDelete.role}</strong> at <strong>{appToDelete.company}</strong>?
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button variant="outline" size="sm" onClick={() => setAppToDelete(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmDelete}
                  style={{ backgroundColor: '#DC2626' }}
                >
                  Delete Record
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PageContainer>
  );
}
