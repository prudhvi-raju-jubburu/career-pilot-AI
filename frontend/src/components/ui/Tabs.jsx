import React from 'react';
import { motion } from 'framer-motion';
import { SPRINGS } from '../../motion/tokens';

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  size = 'md', // 'sm' | 'md'
  className = '',
  style = {},
}) {
  return (
    <div
      role="tablist"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px',
        background: 'var(--surface-raised)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-hairline, var(--border))',
        position: 'relative',
        userSelect: 'none',
        ...style,
      }}
      className={`tabs-nav ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange && onChange(tab.id)}
            style={{
              position: 'relative',
              background: 'transparent',
              border: 'none',
              padding: size === 'sm' ? '0.35rem 0.75rem' : '0.5rem 1rem',
              fontSize: size === 'sm' ? '0.8125rem' : '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              zIndex: 1,
              transition: 'color 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                transition={SPRINGS.snappy}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--surface-active, rgba(255, 255, 255, 0.08))',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--border-control)',
                  zIndex: -1,
                }}
              />
            )}
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: isActive ? 'var(--primary-subtle)' : 'var(--surface)',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
