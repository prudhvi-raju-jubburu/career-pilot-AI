import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SPRINGS } from '../../motion/tokens';

export default function Accordion({ items = [], allowMultiple = false, className = '' }) {
  const [openIndices, setOpenIndices] = useState([0]);

  const toggleIndex = (index) => {
    if (allowMultiple) {
      setOpenIndices((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenIndices((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
      className={`accordion-group ${className}`}
    >
      {items.map((item, index) => {
        const isOpen = openIndices.includes(index);
        return (
          <div
            key={item.id || index}
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-hairline, var(--border))',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              transition: 'border-color 0.2s ease',
            }}
          >
            <button
              type="button"
              onClick={() => toggleIndex(index)}
              aria-expanded={isOpen}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.9375rem',
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {item.icon && <span style={{ color: 'var(--primary)' }}>{item.icon}</span>}
                {item.title}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={SPRINGS.snappy}
                style={{ color: 'var(--text-secondary)', display: 'flex' }}
              >
                <ChevronDown size={18} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={SPRINGS.smooth}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      padding: '0 1.25rem 1rem 1.25rem',
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      borderTop: '1px solid var(--border-hairline, var(--border))',
                      paddingTop: '0.75rem',
                    }}
                  >
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
