/**
 * CareerPilot AI — Shared Framer Motion Variants & Presets
 * Optimized for 60fps GPU acceleration (transform & opacity only)
 */

export const springPreset = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

export const gentleSpring = {
  type: 'spring',
  stiffness: 260,
  damping: 24,
};

export const bouncySpring = {
  type: 'spring',
  stiffness: 500,
  damping: 25,
};

export const transitionFast = {
  duration: 0.18,
  ease: [0.16, 1, 0.3, 1],
};

export const transitionMedium = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1],
};

export const transitionSlow = {
  duration: 0.45,
  ease: [0.16, 1, 0.3, 1],
};

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitionMedium,
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: transitionFast,
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitionMedium,
  },
  exit: {
    opacity: 0,
    transition: transitionFast,
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springPreset,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transitionFast,
  },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitionMedium,
  },
  exit: {
    opacity: 0,
    x: 24,
    transition: transitionFast,
  },
};

export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0.04) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -4,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  tap: { scale: 0.98 },
};

export const pulseGlow = {
  initial: { scale: 1, opacity: 0.8 },
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
