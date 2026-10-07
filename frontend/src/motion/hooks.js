import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useReducedMotionSafe
 * Detects whether the user prefers reduced motion.
 */
export function useReducedMotionSafe() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * useMagnetic
 * Gives interactive buttons/badges an organic magnetic attraction toward the cursor.
 */
export function useMagnetic(strength = 0.3) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const reducedMotion = useReducedMotionSafe();

  const handleMouseMove = useCallback((e) => {
    if (reducedMotion || !ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const deltaX = (clientX - centerX) * strength;
    const deltaY = (clientY - centerY) * strength;

    setPosition({ x: deltaX, y: deltaY });
  }, [reducedMotion, strength]);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  return {
    ref,
    x: position.x,
    y: position.y,
    bind: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  };
}

/**
 * useTilt
 * High-performance 3D perspective tilt on hover with spotlight coordinates.
 */
export function useTilt(maxTilt = 8) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, spotX: 50, spotY: 50 });
  const reducedMotion = useReducedMotionSafe();

  const handleMouseMove = useCallback((e) => {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    const spotX = (x / rect.width) * 100;
    const spotY = (y / rect.height) * 100;

    setTilt({ rotateX, rotateY, spotX, spotY });
  }, [reducedMotion, maxTilt]);

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0, spotX: 50, spotY: 50 });
  }, []);

  return {
    ref,
    ...tilt,
    bind: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  };
}

/**
 * useScrollProgress
 * Tracks the scroll progress (0 to 1) of the window or a specific container.
 */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll <= 0) {
        setProgress(0);
        return;
      }
      const currentScroll = window.scrollY;
      setProgress(Math.min(1, Math.max(0, currentScroll / totalScroll)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
}

/**
 * useCountUp
 * Smoothly animates numeric telemetry values over a specified duration.
 */
export function useCountUp(targetNumber = 0, duration = 1200) {
  const [current, setCurrent] = useState(0);
  const reducedMotion = useReducedMotionSafe();

  useEffect(() => {
    if (reducedMotion) {
      setCurrent(targetNumber);
      return;
    }

    let startTimestamp = null;
    let initial = 0;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const val = Math.round(initial + (targetNumber - initial) * easeProgress);
      setCurrent(val);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetNumber, duration, reducedMotion]);

  return current;
}

/**
 * useInView
 * Lightweight IntersectionObserver hook for viewport entrance triggering.
 */
export function useInView(options = { threshold: 0.1, triggerOnce: true }) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (options.triggerOnce) {
          observer.unobserve(element);
        }
      } else if (!options.triggerOnce) {
        setIsInView(false);
      }
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isInView];
}
