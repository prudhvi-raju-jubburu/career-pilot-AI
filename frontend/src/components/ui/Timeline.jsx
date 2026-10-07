import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../../motion/variants';

export default function Timeline({ items = [], className = '' }) {
  return (
    <div
      style={{
        position: 'relative',
        paddingLeft: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
      className={`trajectory-timeline ${className}`}
    >
      {/* Vertical trajectory line */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          bottom: '8px',
          left: '7px',
          width: '2px',
          background: 'linear-gradient(to bottom, var(--accent-cyan, #00f2fe), var(--primary), var(--border-control))',
        }}
      />

      {items.map((item, idx) => (
        <motion.div
          key={item.id || idx}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          style={{ position: 'relative' }}
        >
          {/* Waypoint Node Dot */}
          <div
            style={{
              position: 'absolute',
              left: '-1.75rem',
              top: '4px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: item.active ? 'var(--accent-cyan)' : 'var(--surface-raised)',
              border: '2px solid var(--border-control)',
              boxShadow: item.active ? '0 0 10px var(--cyan-glow)' : 'none',
              transform: 'translateX(0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {item.active && (
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ffffff',
                }}
              />
            )}
          </div>

          <div
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-hairline, var(--border))',
              borderRadius: 'var(--radius-lg)',
              padding: '0.875rem 1.15rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-cyan, #00f2fe)',
                  fontWeight: 600,
                }}
              >
                {item.date || item.status}
              </span>
              {item.badge && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--primary-subtle)',
                    color: 'var(--primary)',
                    fontWeight: 600,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                margin: '0.35rem 0 0.2rem',
                color: 'var(--text-primary)',
              }}
            >
              {item.title}
            </h4>
            {item.description && (
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {item.description}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
