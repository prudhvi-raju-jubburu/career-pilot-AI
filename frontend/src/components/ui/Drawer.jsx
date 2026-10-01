import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable Modern Skeuomorphic Sliding Drawer Component
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {string} title
 * @param {('right'|'left')} position
 * @param {string} width - e.g. '520px'
 */
export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  position = 'right',
  width = '520px',
  footer,
  className = '',
}) {
  const drawerRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        display: 'flex',
        justifyContent: position === 'right' ? 'flex-end' : 'flex-start',
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="mobile-overlay animate-fade-in"
        onClick={onClose}
        style={{ position: 'fixed', inset: 0 }}
      />

      {/* Drawer Container */}
      <div
        ref={drawerRef}
        className={`animate-drawer-enter ${className}`}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: width,
          height: '100vh',
          backgroundColor: 'var(--surface-raised)',
          borderLeft: position === 'right' ? '1px solid var(--border)' : 'none',
          borderRight: position === 'left' ? '1px solid var(--border)' : 'none',
          boxShadow: 'var(--shadow-floating)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1051,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            backgroundColor: 'var(--surface)',
          }}
        >
          <div>
            {title && (
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            title="Close drawer"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
