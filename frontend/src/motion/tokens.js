/**
 * CareerPilot AI — Motion Physics & Timing Tokens
 * Based on high-performance 60fps spring models (Linear/Stripe/Vercel standard)
 */

export const DURATION = {
  instant: 0.1,
  fast: 0.18,
  base: 0.28,
  slow: 0.45,
  telemetry: 0.65,
  ambient: 4.0,
};

export const EASING = {
  // Cubic Beziers
  snappy: [0.16, 1, 0.3, 1],
  smooth: [0.25, 0.1, 0.25, 1],
  anticipate: [0.38, -0.2, 0.26, 1.3],
  radar: [0.4, 0, 0.2, 1],
};

export const SPRINGS = {
  // Quick micro-interactions (buttons, badges, icons)
  snappy: {
    type: 'spring',
    stiffness: 420,
    damping: 30,
    mass: 0.8,
  },
  // Cards, dialogs, drawers, route morphing
  smooth: {
    type: 'spring',
    stiffness: 260,
    damping: 26,
    mass: 1,
  },
  // Floating AI orb, breathing indicators
  gentle: {
    type: 'spring',
    stiffness: 120,
    damping: 18,
    mass: 1.2,
  },
  // Celebratory pops, badges, offer acceptance
  bouncy: {
    type: 'spring',
    stiffness: 480,
    damping: 18,
    mass: 0.9,
  },
};
