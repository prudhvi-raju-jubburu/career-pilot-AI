import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { SPRINGS } from '../../motion/tokens';

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [0.6, 0.9],
  className = '',
}) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(6, 9, 15, 0.72)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SPRINGS.smooth}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '90dvh',
              background: 'var(--surface-cockpit, #0f172a)',
              borderTop: '1px solid var(--border-control)',
              borderTopLeftRadius: 'var(--radius-2xl, 24px)',
              borderTopRightRadius: 'var(--radius-2xl, 24px)',
              boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.7)',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 'calc(var(--safe-area-bottom, 0px) + 1.25rem)',
            }}
            className={`bottom-sheet-dialog ${className}`}
          >
            {/* Grab Handle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                paddingTop: '0.75rem',
                paddingBottom: '0.5rem',
                cursor: 'grab',
                touchAction: 'none',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '4px',
                  borderRadius: '999px',
                  background: 'var(--border-control, rgba(255, 255, 255, 0.2))',
                }}
              />
            </div>

            {/* Header */}
            {title && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 1.25rem 0.75rem',
                  borderBottom: '1px solid var(--border-hairline, var(--border))',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    margin: 0,
                    color: 'var(--text-primary)',
                  }}
                >
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close sheet"
                  style={{
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border-hairline, var(--border))',
                    borderRadius: 'var(--radius-full)',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Content with smooth scrolling */}
            <div
              style={{
                padding: '1rem 1.25rem',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                flex: 1,
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
