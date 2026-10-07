import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { SPRINGS } from '../../motion/tokens';

export default function Stepper({ steps = [], currentStep = 0, onStepClick }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Background connector line */}
      <div
        style={{
          position: 'absolute',
          top: '18px',
          left: '20px',
          right: '20px',
          height: '2px',
          background: 'var(--border-control)',
          zIndex: 0,
        }}
      />
      {/* Active progress connector line */}
      <motion.div
        style={{
          position: 'absolute',
          top: '18px',
          left: '20px',
          height: '2px',
          background: 'var(--accent-cyan, #00f2fe)',
          boxShadow: '0 0 8px var(--cyan-glow, rgba(0, 242, 254, 0.4))',
          zIndex: 0,
        }}
        initial={{ width: '0%' }}
        animate={{
          width: steps.length > 1 ? `${(currentStep / (steps.length - 1)) * 100}%` : '0%',
        }}
        transition={SPRINGS.smooth}
      />

      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;

        return (
          <div
            key={step.id || idx}
            onClick={() => onStepClick && onStepClick(idx)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 1,
              cursor: onStepClick ? 'pointer' : 'default',
              userSelect: 'none',
            }}
          >
            <motion.div
              animate={{
                scale: isCurrent ? 1.15 : 1,
                borderColor: isCurrent
                  ? 'var(--accent-cyan)'
                  : isCompleted
                  ? 'var(--primary)'
                  : 'var(--border-control)',
              }}
              transition={SPRINGS.snappy}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isCompleted
                  ? 'var(--primary)'
                  : isCurrent
                  ? 'var(--surface-raised)'
                  : 'var(--surface)',
                border: '2px solid',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCompleted || isCurrent ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.875rem',
                boxShadow: isCurrent ? '0 0 16px var(--cyan-glow)' : 'none',
              }}
            >
              {isCompleted ? <Check size={16} strokeWidth={3} /> : idx + 1}
            </motion.div>
            <span
              style={{
                marginTop: '0.5rem',
                fontSize: '0.8125rem',
                fontWeight: isCurrent ? 600 : 500,
                color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
              }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
