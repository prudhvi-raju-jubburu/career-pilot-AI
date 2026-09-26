import { useEffect } from 'react';

/**
 * useScrollReveal Hook
 * Automatically attaches an IntersectionObserver to any element matching `selector`
 * and applies the `activeClass` (default: 'is-visible') as the user scrolls into view.
 */
export function useScrollReveal(selector = '.scroll-reveal', threshold = 0.12) {
  useEffect(() => {
    // If running in an environment without IntersectionObserver, reveal immediately
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      document.querySelectorAll(selector).forEach((el) => {
        el.classList.add('is-visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Unobserve after reveal for high performance
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [selector, threshold]);
}

export default useScrollReveal;
