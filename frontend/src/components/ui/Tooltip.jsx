import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPRINGS } from '../../motion/tokens';

export default function Tooltip({
  content,
  children,
  position = 'top', // 'top' | 'bottom' | 'left' | 'right'
  delay = 200,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [timer, setTimer] = useState(null);

  const handleMouseEnter = () => {
    const t = setTimeout(() => setIsVisible(true), delay);
    setTimer(t);
  };

  const handleMouseLeave = () => {
    clearTimeout(timer);
    setIsVisible(false);
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom':
        return {
          top: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          right: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          left: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
        };
      case 'top':
      default:
        return {
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
        };
    }
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={SPRINGS.snappy}
            role="tooltip"
            style={{
              position: 'absolute',
              ...getPositionStyles(),
              padding: '0.35rem 0.65rem',
              background: 'var(--surface-cockpit, #0f172a)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-control)',
              boxShadow: 'var(--shadow-lg)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 9999,
            }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
