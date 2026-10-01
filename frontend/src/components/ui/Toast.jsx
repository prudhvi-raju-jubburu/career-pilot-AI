import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts = [], onClose }) {
  if (!toasts.length) return null;

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="toast-icon-svg text-success" />;
      case 'danger':
      case 'error':
        return <AlertCircle size={18} className="toast-icon-svg text-danger" />;
      case 'warning':
        return <AlertTriangle size={18} className="toast-icon-svg text-warning" />;
      case 'info':
      default:
        return <Info size={18} className="toast-icon-svg text-info" />;
    }
  };

  return (
    <div
      className="toast-container"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        maxWidth: '420px',
        width: 'calc(100vw - 2rem)',
        pointerEvents: 'none',
      }}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type} animate-toast-enter`}
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-floating)',
            backdropFilter: 'blur(12px)',
            transition: 'all var(--transition-normal)',
          }}
          role="alert"
        >
          <div style={{ flexShrink: 0, marginTop: '2px' }}>
            {getToastIcon(toast.type)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {toast.title && (
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  marginBottom: '0.15rem',
                }}
              >
                {toast.title}
              </div>
            )}
            <div
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
                wordBreak: 'break-word',
              }}
            >
              {toast.message}
            </div>
          </div>
          <button
            onClick={() => onClose(toast.id)}
            style={{
              flexShrink: 0,
              padding: '0.2rem',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color var(--transition-fast)',
            }}
            title="Dismiss notification"
            aria-label="Close notification"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
