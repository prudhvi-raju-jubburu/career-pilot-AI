import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, Building, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, Button, Badge } from '../ui';

export default function ApplicationCalendarView({ applications, onSelectDetail, onMoveStage }) {
  // Sort applications with deadlines or nextActionDate
  const timelineItems = useMemo(() => {
    return applications
      .filter((app) => app.nextActionDate || app.appliedDate)
      .map((app) => {
        const dateStr = app.nextActionDate && app.nextActionDate !== 'TBD' ? app.nextActionDate : app.appliedDate;
        return {
          ...app,
          resolvedDate: dateStr,
        };
      })
      .sort((a, b) => new Date(a.resolvedDate || '2099-01-01') - new Date(b.resolvedDate || '2099-01-01'));
  }, [applications]);

  // Group by timeframe
  const groups = useMemo(() => {
    const today = new Date();
    const urgent = [];
    const upcoming = [];
    const completedOrLater = [];

    timelineItems.forEach((item) => {
      if (!item.resolvedDate) {
        completedOrLater.push(item);
        return;
      }
      const itemDate = new Date(item.resolvedDate);
      const diffDays = Math.ceil((itemDate - today) / (1000 * 60 * 60 * 24));

      if (diffDays <= 3) {
        urgent.push({ ...item, diffDays });
      } else if (diffDays <= 14) {
        upcoming.push({ ...item, diffDays });
      } else {
        completedOrLater.push({ ...item, diffDays });
      }
    });

    return [
      { title: 'Immediate Focus (Next 3 Days)', items: urgent, badge: 'Urgent', color: 'var(--danger)' },
      { title: 'Upcoming (Next 2 Weeks)', items: upcoming, badge: 'Approaching', color: 'var(--warning-dark)' },
      { title: 'Scheduled & Pipeline', items: completedOrLater, badge: 'Future', color: 'var(--primary)' },
    ].filter((g) => g.items.length > 0);
  }, [timelineItems]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Application Milestones & Deadlines Calendar
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Chronological view of technical interviews, take-home challenges, and offer decision dates.
          </p>
        </div>
        <Badge variant="primary" size="md">
          {timelineItems.length} Milestones Tracked
        </Badge>
      </div>

      {groups.length === 0 ? (
        <Card variant="raised" style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '1px solid var(--border)' }}>
          <CalendarIcon size={36} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Deadlines Found</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Add next action dates to your applications to see them in this calendar view.
          </p>
        </Card>
      ) : (
        groups.map((group) => (
          <div key={group.title}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {group.title}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--surface-raised)',
                  border: `1px solid ${group.color}`,
                  color: group.color
                }}
              >
                {group.items.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {group.items.map((app) => (
                <Card
                  key={app.id}
                  variant="raised"
                  style={{
                    padding: '1rem 1.25rem',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                  className="hover-lift"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: '240px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: 'var(--primary)',
                        fontSize: '1.05rem',
                        flexShrink: 0
                      }}
                    >
                      {app.company.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {app.company}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {app.role} • <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{app.status}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        <Clock size={13} color={group.color} />
                        <span>{app.nextAction || 'Interview Round'}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Date: {app.resolvedDate || 'TBD'}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectDetail?.(app)}
                      iconRight={<ArrowRight size={13} />}
                    >
                      Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
