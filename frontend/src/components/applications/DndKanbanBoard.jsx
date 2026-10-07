import React, { useState } from 'react';
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
import {
  Calendar,
  Clock,
  ArrowRight,
  GripVertical,
  Plus,
  Trash2,
  Compass
} from 'lucide-react';
import { Card, Button, Badge } from '../ui';

export default function DndKanbanBoard({
  stages,
  applications,
  onMoveStage,
  onSelectDetail,
  onDelete,
  onAddInStage,
  onViewRadar
}) {
  const [activeApp, setActiveApp] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const found = applications.find((a) => a.id === active.id);
    setActiveApp(found || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveApp(null);

    if (!over) return;

    const appId = active.id;
    let targetStageId = over.id;

    // If dropped over a card, find which stage that card belongs to
    const overApp = applications.find((a) => a.id === over.id);
    if (overApp) {
      targetStageId = overApp.status;
    }

    const currentApp = applications.find((a) => a.id === appId);
    if (currentApp && currentApp.status !== targetStageId) {
      onMoveStage(appId, targetStageId);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="dnd-kanban-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${stages.length}, minmax(280px, 1fr))`,
          gap: '1.25rem',
          overflowX: 'auto',
          paddingBottom: '1.5rem',
          alignItems: 'start'
        }}
      >
        {stages.map((stage) => {
          const stageApps = applications.filter((app) => app.status === stage.id);
          return (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              apps={stageApps}
              onSelectDetail={onSelectDetail}
              onDelete={onDelete}
              onAddInStage={onAddInStage}
              onViewRadar={onViewRadar}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeApp ? (
          <div style={{ opacity: 0.9, transform: 'rotate(2deg) scale(1.03)', width: '280px' }}>
            <DraggableCardContent app={activeApp} stageColor="var(--primary)" isDragging onViewRadar={onViewRadar} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({ stage, apps, onSelectDetail, onDelete, onAddInStage, onViewRadar }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const StageIcon = stage.icon;

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: isOver ? 'var(--surface-raised)' : 'var(--surface)',
        border: `1px solid ${isOver ? stage.color : 'var(--border)'}`,
        minHeight: '520px',
        boxShadow: isOver ? `0 0 16px ${stage.color}40` : 'var(--shadow-sm)',
        transition: 'all var(--transition-fast)'
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
          borderTopRightRadius: 'inherit'
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
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.1rem 0.45rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          >
            {apps.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAddInStage(stage.id)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 'var(--radius-sm)'
          }}
          title={`Add application to ${stage.label}`}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Column Droppable Body */}
      <div
        style={{
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          flex: 1,
        }}
      >
        {apps.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              margin: 'auto 0'
            }}
          >
            Drag opportunities here
          </div>
        ) : (
          apps.map((app) => (
            <DraggableCard
              key={app.id}
              app={app}
              stageColor={stage.color}
              onSelectDetail={onSelectDetail}
              onDelete={onDelete}
              onViewRadar={onViewRadar}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DraggableCard({ app, stageColor, onSelectDetail, onDelete, onViewRadar }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: app.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        opacity: isDragging ? 0.35 : 1,
        cursor: 'grab'
      }}
      {...attributes}
      {...listeners}
    >
      <DraggableCardContent
        app={app}
        stageColor={stageColor}
        onSelectDetail={onSelectDetail}
        onDelete={onDelete}
        onViewRadar={onViewRadar}
      />
    </div>
  );
}

function DraggableCardContent({ app, stageColor, onSelectDetail, onDelete, onViewRadar, isDragging = false }) {
  return (
    <Card
      variant="raised"
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: isDragging ? 'var(--shadow-floating)' : 'var(--shadow-sm)',
        transition: 'all var(--transition-fast)'
      }}
      className={isDragging ? '' : 'hover-lift'}
    >
      {/* Top stage color indicator */}
      <div style={{ height: '3px', backgroundColor: stageColor, width: '100%' }} />

      <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem' }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {app.company}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
              {app.role}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {app.matchScore && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.35rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--primary)'
                }}
              >
                {app.matchScore}%
              </span>
            )}
            <GripVertical size={14} color="var(--text-muted)" style={{ cursor: 'grab' }} />
          </div>
        </div>

        {app.nextAction && (
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-secondary)',
              padding: '0.35rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Clock size={11} color="var(--primary)" />
            <span style={{ fontWeight: 600 }}>{app.nextAction}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {app.type || 'Internship'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {app.opportunityId && onViewRadar && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewRadar(app.opportunityId);
                }}
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)'
                }}
                title="View on Opportunity Radar"
              >
                <Compass size={11} />
                <span>Radar</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(app.id, app.company);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px'
                }}
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            )}
            {onSelectDetail && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectDetail(app);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '2px'
                }}
              >
                <span>Details</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
