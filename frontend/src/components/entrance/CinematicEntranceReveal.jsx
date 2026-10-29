import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import CinematicFilmStage from './CinematicFilmStage';
import ParticleBackground from './ParticleBackground';
import BrandReveal from './BrandReveal';
import './CinematicEntrance.css';

/**
 * CinematicEntranceReveal
 * Coordinates the full photorealistic 3D Pixar animated film
 * and the Grand CareerPilot AI Logo Reveal.
 */
export default function CinematicEntranceReveal({ onComplete }) {
  const [showBrandReveal, setShowBrandReveal] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Finish and mark intro as complete
  const handleFinish = useCallback(() => {
    setIsExiting(true);
    try {
      sessionStorage.setItem('careerpilot_intro_played', 'true');
    } catch (e) {}

    // Allow exit transition animation to play smoothly (850ms to match CSS)
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 850);
  }, [onComplete]);

  // Skip Intro handler
  const handleSkip = useCallback(() => {
    handleFinish();
  }, [handleFinish]);

  // Keyboard 'Escape' listener for skip & fail-safe timer
  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setShowBrandReveal(true);
      const reducedTimer = setTimeout(() => {
        handleFinish();
      }, 1400);
      return () => clearTimeout(reducedTimer);
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Fail-safe timeout (max 26 seconds)
    const failSafeTimer = setTimeout(() => {
      handleFinish();
    }, 26000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(failSafeTimer);
    };
  }, [handleFinish, handleSkip]);

  const handleFilmComplete = () => {
    setIsExploding(true);
    setShowBrandReveal(true);
  };

  return (
    <div
      className={`cpe-overlay-root ${isExiting ? 'cpe-exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="CareerPilot AI Introduction Experience"
    >
      {/* Dynamic Stardust Embers & Golden Summit Explosion */}
      <ParticleBackground
        isExploding={isExploding}
        explodeCenter={{ x: 500, y: 325 }}
      />

      {/* Header Bar with Skip Intro Control */}
      <header className="cpe-header-bar">
        <div className="cpe-brand-mini-badge">
          <span className="cpe-pulse-dot" />
          <span>The Career Journey</span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="cpe-skip-btn"
          aria-label="Skip intro animation and enter site"
          title="Press Esc to Skip"
        >
          <span>Skip Intro</span>
          <span className="cpe-skip-shortcut">Esc</span>
          <ArrowRight size={14} />
        </button>
      </header>

      {/* Main Visual Stage: 3D Animated Film -> Grand Logo Reveal */}
      <main className="cpe-main-film-viewport">
        <div className={`cpe-film-wrapper ${showBrandReveal ? 'cpe-film-wrapper-hidden' : ''}`}>
          <CinematicFilmStage onFilmComplete={handleFilmComplete} />
        </div>
        {showBrandReveal && (
          <BrandReveal onRevealComplete={handleFinish} />
        )}
      </main>
    </div>
  );
}
