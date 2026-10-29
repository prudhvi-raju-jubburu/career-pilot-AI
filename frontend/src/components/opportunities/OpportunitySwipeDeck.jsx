import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Bookmark, X, RotateCcw, Sparkles, MapPin, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Card, Button, Badge, ProgressRing, OpportunityTypeBadge } from '../ui';
import useCountdown from '../../hooks/useCountdown';
import { formatOpportunityLocation } from '../../utils';

export default function OpportunitySwipeDeck({
  opportunities = [],
  onSave,
  onSkip,
  onSelectDetail
}) {
  const [deck, setDeck] = useState(opportunities);
  const [history, setHistory] = useState([]);

  const currentOpp = deck[0];

  const handleSwipe = (direction) => {
    if (!currentOpp) return;
    const item = currentOpp;
    setHistory((prev) => [...prev, { item, direction }]);
    setDeck((prev) => prev.slice(1));

    if (direction === 'right') {
      onSave?.(item);
    } else {
      onSkip?.(item);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setDeck((prev) => [last.item, ...prev]);
  };

  if (!currentOpp) {
    return (
      <div
        style={{
          maxWidth: '460px',
          margin: '2rem auto',
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)'
        }}
      >
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-subtle)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}
        >
          <Sparkles size={28} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          All caught up!
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          You have reviewed all available opportunities in this discovery deck.
        </p>
        <Button
          variant="primary"
          onClick={() => {
            setDeck(opportunities);
            setHistory([]);
          }}
          icon={<RotateCcw size={15} />}
        >
          Restart Deck
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ marginBottom: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
        Swipe right to Save • Swipe left to Skip ({deck.length} remaining)
      </div>

      <div style={{ position: 'relative', width: '100%', minHeight: '440px' }}>
        {/* Next Card underneath (for 3D depth) */}
        {deck[1] && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: 'scale(0.95) translateY(12px)',
              opacity: 0.5,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <SwipeCardItem opp={deck[1]} />
          </div>
        )}

        {/* Top Active Swipable Card */}
        <SwipeCardActive
          key={currentOpp.id}
          opp={currentOpp}
          onSwipe={handleSwipe}
          onSelectDetail={onSelectDetail}
        />
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '1.5rem' }}>
        <button
          type="button"
          onClick={() => handleSwipe('left')}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface)',
            border: '2px solid var(--border)',
            color: 'var(--danger)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
            transition: 'transform var(--transition-fast)'
          }}
          title="Skip Opportunity (Left)"
          aria-label="Skip Opportunity"
        >
          <X size={24} />
        </button>

        <button
          type="button"
          onClick={handleUndo}
          disabled={history.length === 0}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: history.length === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
            cursor: history.length === 0 ? 'not-allowed' : 'pointer',
            opacity: history.length === 0 ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}
          title="Undo Last Swipe"
          aria-label="Undo Last Swipe"
        >
          <RotateCcw size={18} />
        </button>

        <button
          type="button"
          onClick={() => handleSwipe('right')}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.45)',
            transition: 'transform var(--transition-fast)'
          }}
          title="Save Opportunity (Right)"
          aria-label="Save Opportunity"
        >
          <Bookmark size={22} fill="white" />
        </button>
      </div>
    </div>
  );
}

function SwipeCardActive({ opp, onSwipe, onSelectDetail }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-250, -100, 0, 100, 250], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        x,
        rotate,
        opacity,
        cursor: 'grab',
        touchAction: 'none'
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      <SwipeCardItem opp={opp} onSelectDetail={onSelectDetail} />
    </motion.div>
  );
}

function SwipeCardItem({ opp, onSelectDetail }) {
  const countdown = useCountdown(opp.deadline);
  const matchScore = opp.matchScore || 88;

  return (
    <Card
      variant="raised"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-raised-lg)',
        userSelect: 'none'
      }}
    >
      <Card.Content style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: 'var(--primary)',
                fontSize: '1.2rem',
              }}
            >
              {opp.company ? opp.company.charAt(0) : 'O'}
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {opp.company}
              </div>
              <OpportunityTypeBadge type={opp.type} size="sm" />
            </div>
          </div>

          <ProgressRing score={matchScore} size={44} strokeWidth={3.8} />
        </div>

        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            {opp.title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <MapPin size={14} />
            <span>{formatOpportunityLocation(opp)}</span>
            <span>•</span>
            <span>{opp.workMode || 'Hybrid'}</span>
          </div>
        </div>

        {opp.deadline && (
          <div
            style={{
              padding: '0.45rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: countdown.isUrgent ? 'var(--danger-subtle)' : 'var(--bg-secondary)',
              color: countdown.isUrgent ? 'var(--danger)' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>Deadline: {countdown.formatted}</span>
          </div>
        )}

        {/* Skills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 'auto' }}>
          {(Array.isArray(opp.skills) ? opp.skills : []).map((s) => (
            <span
              key={s}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)'
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </Card.Content>

      <Card.Footer style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectDetail?.(opp)}
          style={{ width: '100%' }}
        >
          View Full Requirements & Eligibility
        </Button>
      </Card.Footer>
    </Card>
  );
}
