import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, ArrowRight, Check, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import ProgressRing from '../ui/ProgressRing';
import { formatOpportunityLocation } from '../../utils';

export default function ChatOpportunityCard({ opportunity }) {
  const navigate = useNavigate();
  const [tracked, setTracked] = React.useState(false);

  const handleTrack = () => {
    setTracked(true);
    toast.success(`Added ${opportunity.title} at ${opportunity.company} to your Applications tracker!`, {
      icon: '🎯'
    });
  };

  return (
    <div
      style={{
        marginTop: '0.75rem',
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '200px' }}>
        <ProgressRing score={opportunity.matchScore || 90} size={44} strokeWidth={4} />
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {opportunity.title}
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{opportunity.company}</span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <MapPin size={12} /> {formatOpportunityLocation(opportunity)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={handleTrack}
          disabled={tracked}
          style={{
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            backgroundColor: tracked ? 'var(--success-bg)' : 'var(--surface)',
            color: tracked ? 'var(--success-dark)' : 'var(--text-primary)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: tracked ? 'default' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all var(--transition-fast)'
          }}
        >
          {tracked ? <Check size={13} /> : <Plus size={13} />}
          {tracked ? 'Tracked' : 'Quick Track'}
        </button>

        <button
          onClick={() => navigate('/opportunities')}
          style={{
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all var(--transition-fast)'
          }}
        >
          <span>View</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
