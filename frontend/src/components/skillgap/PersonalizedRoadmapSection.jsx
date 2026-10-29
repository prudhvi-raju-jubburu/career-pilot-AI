import React, { useState, useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Badge, { PriorityBadge } from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import confetti from 'canvas-confetti';
import {
  Compass,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Sparkles,
  BookOpen,
  Code,
  Flame,
  CheckCheck,
  Check,
  FolderGit2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function PersonalizedRoadmapSection({
  structuredRoadmap = [],
  targetRole = 'Software Engineer',
  learningProgress = {},
  onUpdateProgress,
  onOpenResources,
}) {
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [expandedMilestones, setExpandedMilestones] = useState({});

  // Flatten milestones for overall progress tracking
  const allMilestones = useMemo(() => {
    const list = [];
    structuredRoadmap.forEach(phase => {
      (phase.milestones || []).forEach(m => {
        list.push({ ...m, phaseName: phase.phase });
      });
    });
    return list;
  }, [structuredRoadmap]);

  const totalEstimatedHours = useMemo(() => {
    return allMilestones.reduce((acc, m) => acc + (m.estimatedHours || 10), 0);
  }, [allMilestones]);

  const estimatedWeeks = useMemo(() => {
    return Math.max(1, Math.ceil(totalEstimatedHours / Math.max(weeklyHours, 1)));
  }, [totalEstimatedHours, weeklyHours]);

  const completedCount = useMemo(() => {
    return allMilestones.filter(m => {
      const p = learningProgress[m.skill] || {};
      return p.status === 'completed' || m.status === 'completed';
    }).length;
  }, [allMilestones, learningProgress]);

  const progressPercent = useMemo(() => {
    if (allMilestones.length === 0) return 0;
    return Math.round((completedCount / allMilestones.length) * 100);
  }, [completedCount, allMilestones.length]);

  const toggleExpand = (id) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleStatusChange = async (skillName, newStatus) => {
    const isCompleted = newStatus === 'completed';
    const progressVal = isCompleted ? 100 : (newStatus === 'in_progress' ? 50 : 0);

    if (isCompleted) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }

    if (onUpdateProgress) {
      onUpdateProgress(skillName, {
        status: newStatus,
        progress: progressVal,
        target_role: targetRole,
      });
    }
  };

  const handleTopicToggle = (skillName, topicName, currentTopics = []) => {
    const p = learningProgress[skillName] || {};
    const existing = p.completed_topics || [];
    const isTopicDone = existing.includes(topicName);

    const updated = isTopicDone
      ? existing.filter(t => t !== topicName)
      : [...existing, topicName];

    const totalTopicsCount = currentTopics.length || 5;
    const newProgress = Math.round((updated.length / totalTopicsCount) * 100);
    const newStatus = newProgress === 100 ? 'completed' : (newProgress > 0 ? 'in_progress' : 'not_started');

    if (onUpdateProgress) {
      onUpdateProgress(skillName, {
        status: newStatus,
        progress: newProgress,
        completed_topics: updated,
        target_role: targetRole,
      });
    }
  };

  if (!structuredRoadmap || structuredRoadmap.length === 0) {
    return (
      <Card className="p-8 text-center border-border">
        <Compass className="w-10 h-10 text-primary-500 mx-auto mb-3 opacity-60" />
        <h3 className="text-base font-semibold text-text-primary">Personalized Learning Roadmap</h3>
        <p className="text-xs text-secondary mt-1">
          No roadmap milestones generated yet. Select a target role and run skill analysis to create your sequential plan.
        </p>
      </Card>
    );
  }

  return (
    <div className="skillgap-roadmap-section">
      {/* 1. Roadmap Hero Overview Card */}
      <div className="skillgap-roadmap-hero">
        <div className="skillgap-roadmap-hero-top">
          <div className="skillgap-roadmap-hero-title-group">
            <div className="skillgap-roadmap-hero-icon">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="skillgap-roadmap-hero-title">
                Personalized Learning Roadmap for {targetRole}
              </h3>
              <p className="skillgap-roadmap-hero-sub">
                Structured sequential phases adapted to your verified skills and weekly study availability. All milestone completions persist to your profile.
              </p>
            </div>
          </div>

          {/* Study Availability Selector */}
          <div className="skillgap-study-selector">
            <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0 0.35rem' }}>
              <Clock className="w-3.5 h-3.5 text-primary-500" />
              <span>Pace:</span>
            </span>
            {[5, 10, 15, 20].map((hrs) => (
              <button
                key={hrs}
                type="button"
                onClick={() => setWeeklyHours(hrs)}
                className={`skillgap-study-btn ${weeklyHours === hrs ? 'active' : ''}`}
              >
                {hrs}h/wk
              </button>
            ))}
          </div>
        </div>

        {/* Hero Progress and Timeline Stats Bar */}
        <div className="skillgap-roadmap-hero-stats">
          {/* Progress Indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Overall Progress:</span>
              <span style={{ fontWeight: 800, color: 'var(--primary, #255eff)' }}>{progressPercent}%</span>
            </div>
            <ProgressBar value={progressPercent} max={100} color="primary" />
            <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
              {completedCount} of {allMilestones.length} milestones verified complete
            </span>
          </div>

          {/* Timeline Estimate */}
          <div className="skillgap-hero-stat-item">
            <div className="skillgap-hero-stat-icon indigo">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="skillgap-hero-stat-info">
              <span className="skillgap-hero-stat-label">Estimated Timeline</span>
              <span className="skillgap-hero-stat-value">
                ~{estimatedWeeks} Weeks ({totalEstimatedHours}h Total)
              </span>
            </div>
          </div>

          {/* Milestone Phases Count */}
          <div className="skillgap-hero-stat-item">
            <div className="skillgap-hero-stat-icon emerald">
              <CheckCheck className="w-5 h-5" />
            </div>
            <div className="skillgap-hero-stat-info">
              <span className="skillgap-hero-stat-label">Sequential Phases</span>
              <span className="skillgap-hero-stat-value">
                {structuredRoadmap.length} Sequential Milestones
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sequential Phase Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {structuredRoadmap.map((phaseGroup, phaseIdx) => {
          const milestones = phaseGroup.milestones || [];
          if (milestones.length === 0) return null;

          return (
            <div key={phaseIdx} className="skillgap-phase-block">
              {/* Phase Banner */}
              <div className="skillgap-phase-banner">
                <div className="skillgap-phase-title-group">
                  <span className="skillgap-phase-badge">
                    {phaseGroup.phaseIndex || phaseIdx + 1}
                  </span>
                  <div>
                    <h4 className="skillgap-phase-title">
                      {phaseGroup.phase}
                    </h4>
                    <p className="skillgap-phase-sub">{phaseGroup.description}</p>
                  </div>
                </div>
                <span className="skillgap-phase-weeks">
                  {phaseGroup.estimatedWeeks}
                </span>
              </div>

              {/* Milestones Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {milestones.map((m) => {
                  const mId = m.id;
                  const isExpanded = !!expandedMilestones[mId];
                  const userProg = learningProgress[m.skill] || {};
                  const status = userProg.status || m.status || 'not_started';
                  const completedTopics = userProg.completed_topics || [];
                  const isCompleted = status === 'completed';
                  const isInProgress = status === 'in_progress' || status === 'learning';

                  return (
                    <div
                      key={mId}
                      className={`skillgap-milestone-card ${
                        isCompleted
                          ? 'completed'
                          : isInProgress
                          ? 'in-progress'
                          : ''
                      }`}
                    >
                      {/* Milestone Card Header */}
                      <div className="skillgap-milestone-header">
                        <div className="skillgap-milestone-left">
                          {/* Completion Check Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(m.skill, isCompleted ? 'not_started' : 'completed')}
                            className={`skillgap-milestone-check ${isCompleted ? 'checked' : ''}`}
                            title={isCompleted ? 'Mark not started' : 'Mark completed'}
                          >
                            {isCompleted ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            )}
                          </button>

                          {/* Title, Badges, and Objective */}
                          <div className="skillgap-milestone-body">
                            <div className="skillgap-milestone-title-row">
                              <h5 className="skillgap-milestone-name">
                                {m.skill}
                              </h5>
                              <PriorityBadge priority={m.priority} />
                              <span className="skillgap-milestone-time">
                                <Clock className="w-3 h-3 text-secondary" />
                                <span>~{m.estimatedHours}h</span>
                              </span>
                            </div>
                            <p className="skillgap-milestone-desc">
                              {m.learningObjective}
                            </p>
                          </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="skillgap-milestone-actions">
                          {/* Status Picker Pill */}
                          <select
                            value={status}
                            onChange={(e) => handleStatusChange(m.skill, e.target.value)}
                            className="skillgap-milestone-status-select"
                          >
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>

                          {/* View Resources Trigger */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenResources && onOpenResources(m.skill)}
                            iconLeft={<BookOpen className="w-3.5 h-3.5 text-primary-500" />}
                            className="skillgap-milestone-res-btn"
                          >
                            Resources
                          </Button>

                          {/* Expand/Collapse Details */}
                          <button
                            type="button"
                            onClick={() => toggleExpand(mId)}
                            className="skillgap-milestone-expand-btn"
                            aria-label="Toggle milestone details"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Collapsible Details Drawer */}
                      {isExpanded && (
                        <div className="skillgap-milestone-details">
                          {/* Practical Deliverable Task */}
                          {m.practicalTask && (
                            <div className="skillgap-deliverable-box">
                              <div className="skillgap-deliverable-header">
                                <Code className="w-4 h-4 text-primary-500" />
                                <span>Practical Implementation Task:</span>
                              </div>
                              <p className="skillgap-deliverable-desc">
                                {m.practicalTask}
                              </p>
                            </div>
                          )}

                          {/* Completion Criteria */}
                          {m.completionCriteria && (
                            <div className="skillgap-criteria-box">
                              <div className="skillgap-criteria-header">
                                <CheckCheck className="w-4 h-4 text-emerald-600" />
                                <span>Clear Completion Criteria:</span>
                              </div>
                              <p className="skillgap-criteria-desc">
                                {m.completionCriteria}
                              </p>
                            </div>
                          )}

                          {/* Topics Sequence Checklist */}
                          {m.topics && m.topics.length > 0 && (
                            <div className="skillgap-topics-wrap">
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Sub-Topics & Implementation Checklist:
                              </span>
                              <div className="skillgap-topics-grid">
                                {m.topics.map((top, tIdx) => {
                                  const tName = typeof top === 'string' ? top : (top.name || top.title);
                                  const isDone = completedTopics.includes(tName);
                                  return (
                                    <button
                                      key={tIdx}
                                      type="button"
                                      onClick={() => handleTopicToggle(m.skill, tName, m.topics)}
                                      className={`skillgap-topic-btn ${isDone ? 'checked' : ''}`}
                                    >
                                      <span className="skillgap-topic-check">
                                        {isDone && <Check className="w-2.5 h-2.5 text-white" />}
                                      </span>
                                      <span style={{ textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {tName}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Curated Resources Quick Links */}
                          {m.resources && m.resources.length > 0 && (
                            <div className="skillgap-resources-wrap">
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Verified Curated Learning Resources:
                              </span>
                              <div className="skillgap-resources-list">
                                {m.resources.slice(0, 3).map((res, rIdx) => (
                                  <a
                                    key={rIdx}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="skillgap-resource-pill"
                                  >
                                    <span>{res.title}</span>
                                    <span style={{ fontSize: '0.675rem', color: 'var(--text-secondary)' }}>
                                      ({res.provider})
                                    </span>
                                    <ExternalLink className="w-3 h-3 text-secondary" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
