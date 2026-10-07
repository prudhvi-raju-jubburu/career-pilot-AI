import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Compass,
  Layers,
  Sparkles,
  User,
} from 'lucide-react';
import { SPRINGS } from '../../motion/tokens';

export default function MobileBottomNav() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    return null;
  }

  const navItems = [
    { label: 'Radar', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Discover', path: '/opportunities', icon: Compass },
    { label: 'Advisor', path: '/ai-advisor', icon: Sparkles, isHighlight: true },
    { label: 'Tracker', path: '/applications', icon: Layers },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const handleTap = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch (e) {}
  };

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile Navigation Bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(var(--bottom-nav-height, 64px) + var(--safe-area-bottom, 0px))',
        paddingBottom: 'var(--safe-area-bottom, 0px)',
        background: 'var(--surface-glass, rgba(15, 23, 42, 0.92))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-hairline, rgba(255, 255, 255, 0.08))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 900,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      {navItems.map((item) => {
        const IconComponent = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleTap}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '100%',
              textDecoration: 'none',
              color: 'var(--text-secondary)',
              transition: 'color 0.2s ease',
              touchAction: 'manipulation',
              outline: 'none',
            }}
            className={({ isActive }) => (isActive ? 'active-mobile-link' : '')}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="mobileNavActiveIndicator"
                    transition={SPRINGS.snappy}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      width: '32px',
                      height: '3px',
                      borderRadius: '999px',
                      background: item.isHighlight
                        ? 'var(--accent-cyan)'
                        : 'var(--primary)',
                      boxShadow: item.isHighlight
                        ? '0 0 10px var(--cyan-glow)'
                        : '0 0 8px rgba(99, 102, 241, 0.5)',
                    }}
                  />
                )}

                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: item.isHighlight ? '36px' : '26px',
                    height: item.isHighlight ? '36px' : '26px',
                    borderRadius: item.isHighlight ? '50%' : '0',
                    background: item.isHighlight
                      ? 'linear-gradient(135deg, var(--accent-cyan), var(--primary))'
                      : 'transparent',
                    color: item.isHighlight
                      ? '#ffffff'
                      : isActive
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                    boxShadow: item.isHighlight
                      ? '0 2px 10px var(--cyan-glow)'
                      : 'none',
                  }}
                >
                  <IconComponent size={item.isHighlight ? 18 : 19} />
                </div>

                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    marginTop: '2px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
