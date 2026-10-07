import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  FolderGit2,
  ExternalLink,
  Award,
  ChevronRight,
  Sparkles,
  Play,
  ArrowRight
} from 'lucide-react';
import Card from '../ui/Card';
import Badge, { PriorityBadge } from '../ui/Badge';
import Button from '../ui/Button';

export default function InteractiveLearningTimeline({
  roadmap = [],
  learningProgress = {},
  onToggleTopic,
  onOpenSkillDrawer,
}) {
  const [activeTab, setActiveTab] = useState('all');

  const handleTopicCheck = (skillName, topicTitle, totalTopics, currentlyCompletedCount) => {
    const isNowAllComplete = currentlyCompletedCount + 1 >= totalTopics;

    if (isNowAllComplete) {
      // Confetti burst for milestone achievement!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
        });
      } catch (e) {}

      toast.success(`🎉 Congratulations! You have mastered all milestones for ${skillName}!`, {
        duration: 4000,
      });
    }

    if (onToggleTopic) {
      onToggleTopic(skillName, topicTitle);
    }
  };

  const filteredRoadmap = roadmap.filter(item => {
    if (activeTab === 'high') return item.priority === 'high' || item.priority === 'critical';
    if (activeTab === 'in_progress') {
      const prog = learningProgress[item.skillName];
      return prog && prog.status === 'learning';
    }
    return true;
  });

  return (
    <Card variant="raised" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Personalized Pathway
            </span>
            <Badge variant="purple" size="sm">
              Live Milestone Tracker
            </Badge>
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Structured Learning Timeline
          </h3>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--surface)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          {['all', 'high', 'in_progress'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: activeTab === tab ? 'var(--primary)' : 'transparent',
                color: activeTab === tab ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'all' ? 'All Skills' : tab === 'high' ? 'High Priority' : 'In Progress'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      <div style={{ position: 'relative', paddingLeft: '1.5rem', marginTop: '1rem' }}>
        {/* Continuous vertical timeline track line */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            bottom: '24px',
            left: '11px',
            width: '2px',
            backgroundColor: 'var(--border)',
            zIndex: 1,
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredRoadmap.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No skills in this category. You are on track!
            </div>
          ) : (
            filteredRoadmap.map((item, index) => {
              const skillProgress = learningProgress[item.skillName] || { status: 'not_started', progress: 0, completedTopics: [] };
              const completedTopics = skillProgress.completedTopics || [];
              const totalTopics = item.topics ? item.topics.length : 3;
              const isSkillCompleted = skillProgress.status === 'completed' || (totalTopics > 0 && completedTopics.length >= totalTopics);

              return (
                <div
                  key={item.skillName || index}
                  style={{
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  {/* Timeline Node Dot */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-1.5rem',
                      top: '4px',
                      transform: 'translateX(-50%)',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: isSkillCompleted ? 'var(--success)' : skillProgress.status === 'learning' ? 'var(--primary)' : 'var(--surface-raised)',
                      border: '2px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSkillCompleted || skillProgress.status === 'learning' ? '#ffffff' : 'var(--text-muted)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {isSkillCompleted ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{index + 1}</span>
                    )}
                  </div>

                  {/* Milestone Card */}
                  <div
                    style={{
                      padding: '1.15rem 1.25rem',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.skillName}
                          </span>
                          <PriorityBadge priority={item.priority || 'medium'} size="sm" />
                          {item.difficulty && (
                            <Badge variant="neutral" size="sm">
                              {item.difficulty}
                            </Badge>
                          )}
                          {item.estimatedHours && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={12} /> ~{item.estimatedHours} hrs
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {item.whyImportant || item.description || `Critical competency for ${item.category || 'target career alignment'}.`}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<BookOpen size={13} />}
                          onClick={() => onOpenSkillDrawer && onOpenSkillDrawer(item.skillName)}
                        >
                          View Resources
                        </Button>
                      </div>
                    </div>

                    {/* Topic checklist milestones */}
                    <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                        Milestone Deliverables ({completedTopics.length}/{totalTopics})
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
                        {(item.topics || ['Foundations & Core Syntax', 'Practical Build Implementation', 'Testing & Optimization']).map((topic, tIdx) => {
                          const isTopicDone = completedTopics.includes(topic);
                          return (
                            <div
                              key={tIdx}
                              onClick={() => handleTopicCheck(item.skillName, topic, totalTopics, completedTopics.length)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.45rem 0.65rem',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: isTopicDone ? 'var(--success-bg)' : 'var(--surface)',
                                border: '1px solid var(--border)',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)',
                              }}
                            >
                              {isTopicDone ? (
                                <CheckCircle2 size={16} color="var(--success)" />
                              ) : (
                                <Circle size={16} color="var(--text-muted)" />
                              )}
                              <span
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  color: isTopicDone ? 'var(--success-dark)' : 'var(--text-primary)',
                                  textDecoration: isTopicDone ? 'line-through' : 'none',
                                }}
                              >
                                {topic}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
