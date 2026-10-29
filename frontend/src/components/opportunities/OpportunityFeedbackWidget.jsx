import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Check, X, RotateCcw, AlertCircle } from 'lucide-react';
import opportunityService from '../../services/opportunityService';
import { useToast } from '../../context/ToastContext';

const REASON_OPTIONS = [
  { label: 'Wrong role', value: 'wrong_role' },
  { label: 'Wrong location', value: 'wrong_location' },
  { label: 'Not eligible', value: 'not_eligible' },
  { label: 'Already applied', value: 'already_applied' },
  { label: 'Not interested', value: 'not_interested' },
  { label: 'Salary/Stipend too low', value: 'salary_too_low' },
];

export default function OpportunityFeedbackWidget({
  opportunityId,
  initialFeedback = null,
  onFeedbackChange = null,
  compact = false
}) {
  const toast = useToast();
  const [rating, setRating] = useState(initialFeedback?.rating || null);
  const [reason, setReason] = useState(initialFeedback?.reason || null);
  const [showReasons, setShowReasons] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialFeedback) {
      setRating(initialFeedback.rating || null);
      setReason(initialFeedback.reason || null);
    }
  }, [initialFeedback]);

  const handleRatingSelect = async (selectedRating) => {
    if (selectedRating === rating && !showReasons) {
      // Clicking same again clears feedback
      handleWithdraw();
      return;
    }

    if (selectedRating === 'not_relevant') {
      setRating('not_relevant');
      setShowReasons(true);
      return;
    }

    // Direct submit for 'relevant'
    setLoading(true);
    try {
      await opportunityService.submitFeedback(opportunityId, 'relevant', 'good_match');
      setRating('relevant');
      setReason('good_match');
      setShowReasons(false);
      toast.success('Thanks! We will recommend more opportunities like this.');
      if (onFeedbackChange) onFeedbackChange({ rating: 'relevant', reason: 'good_match' });
    } catch (e) {
      toast.error('Could not save feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReasonSubmit = async (selectedReason) => {
    setLoading(true);
    try {
      await opportunityService.submitFeedback(opportunityId, 'not_relevant', selectedReason);
      setReason(selectedReason);
      setShowReasons(false);
      toast.info('Feedback saved. We will refine future recommendations.');
      if (onFeedbackChange) onFeedbackChange({ rating: 'not_relevant', reason: selectedReason });
    } catch (e) {
      toast.error('Could not submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    try {
      await opportunityService.deleteFeedback(opportunityId);
      setRating(null);
      setReason(null);
      setShowReasons(false);
      toast.info('Feedback withdrawn.');
      if (onFeedbackChange) onFeedbackChange(null);
    } catch (e) {
      toast.error('Could not withdraw feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        borderRadius: '14px',
        backgroundColor: 'var(--lx-surface-2)',
        border: '1px solid var(--lx-line)',
        padding: compact ? '0.5rem 0.75rem' : '0.85rem 1rem',
        marginTop: '0.75rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--lx-txt-2)',
          }}
        >
          {rating ? 'Your relevance feedback:' : 'Is this recommendation relevant to you?'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {/* Relevant Button */}
          <button
            type="button"
            disabled={loading}
            aria-label="Mark recommendation as relevant"
            onClick={(e) => {
              e.stopPropagation();
              handleRatingSelect('relevant');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: rating === 'relevant' ? '1.5px solid #059669' : '1px solid var(--lx-line)',
              backgroundColor: rating === 'relevant' ? '#ECFDF5' : '#ffffff',
              color: rating === 'relevant' ? '#065F46' : 'var(--lx-txt-2)',
              transition: 'all 0.15s ease',
            }}
          >
            <ThumbsUp size={12} color={rating === 'relevant' ? '#059669' : 'currentColor'} />
            <span>Relevant</span>
          </button>

          {/* Not Relevant Button */}
          <button
            type="button"
            disabled={loading}
            aria-label="Mark recommendation as not relevant"
            onClick={(e) => {
              e.stopPropagation();
              handleRatingSelect('not_relevant');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: rating === 'not_relevant' ? '1.5px solid #DC2626' : '1px solid var(--lx-line)',
              backgroundColor: rating === 'not_relevant' ? '#FEF2F2' : '#ffffff',
              color: rating === 'not_relevant' ? '#991B1B' : 'var(--lx-txt-2)',
              transition: 'all 0.15s ease',
            }}
          >
            <ThumbsDown size={12} color={rating === 'not_relevant' ? '#DC2626' : 'currentColor'} />
            <span>Not relevant</span>
          </button>

          {/* Undo/Change Button */}
          {rating && (
            <button
              type="button"
              disabled={loading}
              aria-label="Undo feedback"
              onClick={(e) => {
                e.stopPropagation();
                handleWithdraw();
              }}
              title="Withdraw feedback"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.3rem 0.5rem',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: 'var(--lx-txt-3)',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} />
              <span>Undo</span>
            </button>
          )}
        </div>
      </div>

      {/* Structured Reason Selector Chips */}
      {showReasons && (
        <div
          style={{
            marginTop: '0.65rem',
            paddingTop: '0.55rem',
            borderTop: '1px solid var(--lx-line)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--lx-txt-3)', marginBottom: '0.4rem', fontWeight: 600 }}>
            Select reason (helps improve recommendations):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {REASON_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={loading}
                onClick={() => handleReasonSubmit(opt.value)}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: reason === opt.value ? '1.5px solid #DC2626' : '1px solid var(--lx-line)',
                  backgroundColor: reason === opt.value ? '#FEF2F2' : '#ffffff',
                  color: reason === opt.value ? '#991B1B' : 'var(--lx-txt-2)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Display recorded reason tag if already submitted */}
      {!showReasons && rating === 'not_relevant' && reason && (
        <div
          style={{
            marginTop: '0.45rem',
            fontSize: '0.72rem',
            color: '#991B1B',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <AlertCircle size={12} />
          <span>Reason: {reason.replace(/_/g, ' ')}</span>
        </div>
      )}
    </div>
  );
}
