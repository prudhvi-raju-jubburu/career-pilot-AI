import React from 'react';
import Drawer from '../ui/Drawer';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import {
  BookOpen,
  ExternalLink,
  Code,
  Video,
  Clock,
  Award,
  Sparkles,
  CheckCircle2,
  BookmarkPlus
} from 'lucide-react';

export default function LearningResourcesDrawer({
  isOpen,
  onClose,
  skillName,
  resources = [],
  onAddToRoadmap
}) {
  const getResourceIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('doc') || t.includes('handbook') || t.includes('guide')) {
      return <BookOpen className="w-4 h-4 text-primary-500" />;
    }
    if (t.includes('video') || t.includes('youtube')) {
      return <Video className="w-4 h-4 text-rose-500" />;
    }
    if (t.includes('practice') || t.includes('interactive')) {
      return <Code className="w-4 h-4 text-emerald-500" />;
    }
    return <Sparkles className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={skillName ? `Curated Resources: ${skillName}` : 'Curated Learning Resources'}
      size="md"
    >
      <div className="skillgap-drawer-container" style={{ padding: '0.25rem', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
        {/* Header Summary */}
        <div className="skillgap-drawer-header-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
              {skillName} Curriculum
            </span>
            <Badge variant="outline" className="text-[11px]">
              {resources.length} Verified Sources
            </Badge>
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
            Verified official documentation, hands-on coding sandboxes, and reputable educator tutorials. Links open directly in a new secure tab.
          </p>
          {onAddToRoadmap && (
            <div style={{ paddingTop: '0.5rem' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onAddToRoadmap(skillName);
                  onClose();
                }}
                iconLeft={<BookmarkPlus className="w-4 h-4" />}
                style={{ width: '100%', fontSize: '0.775rem', height: '34px' }}
              >
                Add {skillName} to Roadmap
              </Button>
            </div>
          )}
        </div>

        {/* Resource Cards */}
        {resources && resources.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {resources.map((res, idx) => {
              const isPrimary = idx === 0;
              return (
                <div
                  key={res.id || idx}
                  className={`skillgap-drawer-card ${isPrimary ? 'primary-rec' : ''}`}
                >
                  <div className="skillgap-drawer-card-top">
                    <div className="skillgap-drawer-icon-box">
                      {getResourceIcon(res.type)}
                    </div>
                    <div className="skillgap-drawer-card-info">
                      <div className="skillgap-drawer-title-row">
                        <h4 className="skillgap-drawer-card-title">
                          {res.title}
                        </h4>
                        {isPrimary && (
                          <Badge variant="primary" className="text-[10px] py-0 px-1.5">
                            Recommended First
                          </Badge>
                        )}
                      </div>
                      <div className="skillgap-drawer-provider">
                        <span>{res.provider}</span> • <span style={{ color: 'var(--text-primary)' }}>{res.type}</span>
                      </div>
                      {res.description && (
                        <p className="skillgap-drawer-desc">
                          {res.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Resource Badges & Link */}
                  <div className="skillgap-drawer-footer">
                    <div className="skillgap-drawer-tags">
                      <span className="skillgap-drawer-tag">
                        {res.difficulty || 'All Levels'}
                      </span>
                      {res.estimatedHours && (
                        <span className="skillgap-drawer-tag">
                          <Clock className="w-3 h-3" />
                          <span>~{res.estimatedHours}h</span>
                        </span>
                      )}
                      {res.isFree && (
                        <span className="skillgap-drawer-tag free">
                          Free Resource
                        </span>
                      )}
                    </div>

                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="skillgap-drawer-link-btn"
                    >
                      <span>Start Learning</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px' }}>
            <BookOpen className="w-8 h-8 text-secondary opacity-40 mx-auto mb-2" />
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>No specific resources indexed yet for {skillName}.</p>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Check official documentation or community hubs.</p>
          </div>
        )}
      </div>
    </Drawer>
  );
}
