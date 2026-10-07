import { DURATION, EASING, SPRINGS } from './tokens';

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASING.smooth },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast, ease: EASING.smooth },
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRINGS.smooth,
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: DURATION.fast },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: SPRINGS.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: DURATION.fast },
  },
};

export const staggerContainer = (staggerChildren = 0.06, delayChildren = 0.05) => ({
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
  rest: { y: 0, scale: 1, transition: SPRINGS.snappy },
  hover: { y: -4, scale: 1.015, transition: SPRINGS.snappy },
  tap: { y: 0, scale: 0.985, transition: SPRINGS.snappy },
};

export const radarSweep = {
  rotate: [0, 360],
  transition: {
    repeat: Infinity,
    ease: 'linear',
    duration: 6,
  },
};

export const orbitVariant = (duration = 16, reverse = false) => ({
  animate: {
    rotate: reverse ? [-360, 0] : [0, 360],
    transition: {
      repeat: Infinity,
      ease: 'linear',
      duration,
    },
  },
});

export const pulseGlow = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.65, 0.95, 0.65],
    transition: {
      repeat: Infinity,
      ease: 'easeInOut',
      duration: 3.2,
    },
  },
};

export const slideDrawer = {
  hidden: { x: '100%', opacity: 0.6 },
  visible: {
    x: 0,
    opacity: 1,
    transition: SPRINGS.smooth,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: DURATION.fast, ease: EASING.smooth },
  },
};

export const bottomSheetVariant = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: SPRINGS.smooth,
  },
  exit: {
    y: '100%',
    transition: { duration: DURATION.base, ease: EASING.smooth },
  },
};
