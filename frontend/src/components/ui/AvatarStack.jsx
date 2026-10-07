import React from 'react';
import { motion } from 'framer-motion';

export default function AvatarStack({
  users = [],
  max = 4,
  size = 32,
  className = '',
}) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexDirection: 'row-reverse',
        justifyContent: 'flex-end',
      }}
      className={`avatar-stack ${className}`}
    >
      {remainingCount > 0 && (
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '999px',
            background: 'var(--surface-raised)',
            border: '2px solid var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.72rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            marginLeft: `-${Math.round(size * 0.28)}px`,
            zIndex: 1,
          }}
        >
          +{remainingCount}
        </div>
      )}

      {visibleUsers.reverse().map((user, idx) => (
        <motion.div
          key={user.id || idx}
          whileHover={{ y: -3, scale: 1.1, zIndex: 10 }}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '999px',
            overflow: 'hidden',
            border: '2px solid var(--surface)',
            marginLeft: idx > 0 ? `-${Math.round(size * 0.28)}px` : 0,
            background: 'var(--surface-raised)',
            cursor: 'pointer',
            position: 'relative',
          }}
          title={user.name}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || 'User'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                color: '#ffffff',
                fontSize: `${Math.round(size * 0.4)}px`,
                fontWeight: 600,
              }}
            >
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
