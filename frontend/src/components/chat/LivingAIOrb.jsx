import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Radio, MessageSquare } from 'lucide-react';
import { SPRINGS } from '../../motion/tokens';

/**
 * CareerPilot AI — Living Holographic AI Orb
 * Dynamic states:
 * - 'idle': gentle breathing pulse
 * - 'listening': expanding outer ring waiting for user query
 * - 'thinking': rapid multi-ring rotation & neural shimmer
 * - 'speaking': kinetic waveform expansion during token streaming
 */
export default function LivingAIOrb({
  state = 'idle', // 'idle' | 'listening' | 'thinking' | 'speaking'
  size = 72,
  showLabel = true,
  onClick,
}) {
  const getStateColors = () => {
    switch (state) {
      case 'listening':
        return {
          primary: '#00f2fe',
          secondary: '#38bdf8',
          glow: 'rgba(0, 242, 254, 0.45)',
          label: 'Awaiting Query...',
          icon: <Radio size={size * 0.32} />,
        };
      case 'thinking':
        return {
          primary: '#8b5cf6',
          secondary: '#c084fc',
          glow: 'rgba(139, 92, 246, 0.55)',
          label: 'Synthesizing Neural Response...',
          icon: <Brain size={size * 0.32} />,
        };
      case 'speaking':
        return {
          primary: '#10b981',
          secondary: '#00f2fe',
          glow: 'rgba(16, 185, 129, 0.5)',
          label: 'Streaming Telemetry...',
          icon: <Sparkles size={size * 0.32} />,
        };
      case 'idle':
      default:
        return {
          primary: '#6366f1',
          secondary: '#00f2fe',
          glow: 'rgba(99, 102, 241, 0.35)',
          label: 'Flight Advisor Ready',
          icon: <Sparkles size={size * 0.32} />,
        };
    }
  };

  const config = getStateColors();

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: `${size}px`,
          height: `${size}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Ambient Glow */}
        <motion.div
          animate={{
            scale: state === 'thinking' ? [1, 1.3, 1] : state === 'speaking' ? [1, 1.2, 1] : [1, 1.08, 1],
            opacity: state === 'thinking' ? [0.5, 0.85, 0.5] : [0.4, 0.7, 0.4],
          }}
          transition={{
            repeat: Infinity,
            duration: state === 'thinking' ? 1.4 : state === 'speaking' ? 1.8 : 3.5,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            inset: '-10px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`,
            filter: 'blur(12px)',
            pointerEvents: 'none',
          }}
        />

        {/* Outer Orbital Ring 1 */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: state === 'speaking' ? [1, 1.06, 1] : 1,
          }}
          transition={{
            rotate: {
              repeat: Infinity,
              ease: 'linear',
              duration: state === 'thinking' ? 4 : 14,
            },
            scale: { repeat: Infinity, duration: 1.2 },
          }}
          style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            border: `1.5px dashed ${config.primary}`,
            opacity: 0.45,
            pointerEvents: 'none',
          }}
        />

        {/* Outer Orbital Ring 2 (counter-rotating) */}
        <motion.div
          animate={{
            rotate: [360, 0],
          }}
          transition={{
            repeat: Infinity,
            ease: 'linear',
            duration: state === 'thinking' ? 6 : 22,
          }}
          style={{
            position: 'absolute',
            inset: '-2px',
            borderRadius: '50%',
            border: `1px solid ${config.secondary}`,
            opacity: 0.3,
            pointerEvents: 'none',
          }}
        />

        {/* Core AI Sphere */}
        <motion.div
          animate={{
            scale: state === 'speaking' ? [1, 1.05, 0.98, 1] : [1, 1.02, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: state === 'speaking' ? 0.8 : 2.5,
            ease: 'easeInOut',
          }}
          style={{
            width: `${Math.round(size * 0.76)}px`,
            height: `${Math.round(size * 0.76)}px`,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${config.primary} 0%, ${config.secondary} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: `0 0 20px ${config.glow}, inset 0 2px 4px rgba(255, 255, 255, 0.4)`,
            zIndex: 1,
          }}
        >
          {config.icon}
        </motion.div>
      </div>

      {showLabel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: '0.65rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: config.primary,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: config.primary,
              boxShadow: `0 0 6px ${config.primary}`,
            }}
            className="animate-pulse"
          />
          <span>{config.label}</span>
        </motion.div>
      )}
    </div>
  );
}
