import React, { useState, useEffect, useRef } from 'react';
import PersistenceHoloCards from './PersistenceHoloCards';

/**
 * CinematicFilmStage
 * Plays the 6 photorealistic 3D Pixar film scenes with:
 * - Continuous cinematic camera pans, zooms, and subtle parallax
 * - Smooth 1-second crossfades between scenes (no cuts or stuttering)
 * - Image preloading so playback is instant and 60fps smooth
 * - Atmospheric floating embers and cinematic lens flares
 */
const SCENES = [
  {
    id: 'ambition',
    image: '/entrance/scene1_ambition.jpg',
    caption: 'Every journey begins with a dream.',
    cameraAnim: 'cpeCamPan1',
    duration: 3200,
  },
  {
    id: 'obstacles',
    image: '/entrance/scene2_obstacles.jpg',
    caption: 'Low motivation and missing resources test your resolve.',
    cameraAnim: 'cpeCamPan2',
    duration: 3000,
  },
  {
    id: 'fall',
    image: '/entrance/scene3_fall.jpg',
    caption: 'A difficult step breaks the path.',
    cameraAnim: 'cpeCamPan3',
    duration: 2600,
  },
  {
    id: 'pause',
    image: '/entrance/scene4_pause.jpg',
    caption: 'Setbacks are part of the journey.',
    cameraAnim: 'cpeCamPan4',
    duration: 2800,
  },
  {
    id: 'persistence',
    image: '/entrance/scene5_persistence.jpg?v=3',
    caption: 'Rise. Learn. Persist. Every step builds mastery.',
    cameraAnim: 'cpeCamPan5',
    duration: 3200,
  },
  {
    id: 'summit',
    image: '/entrance/scene6_summit.jpg?v=3',
    caption: 'The summit is reached. Success awaits.',
    cameraAnim: 'cpeCamPan6',
    duration: 3400,
  },
];

export default function CinematicFilmStage({ onFilmComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPortalBursting, setIsPortalBursting] = useState(false);

  // Preload all 6 scene images immediately on mount
  useEffect(() => {
    SCENES.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });
  }, []);

  // Coordinated continuous timeline driving the seamless film sequence
  useEffect(() => {
    const currentScene = SCENES[currentIndex];
    let timerId;
    let burstTimerId;

    if (currentIndex < SCENES.length - 1) {
      // Seamlessly advance to the next scene at the exact duration
      timerId = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, currentScene.duration);
    } else {
      // Final summit scene: trigger portal light burst 800ms before finish
      burstTimerId = setTimeout(() => {
        setIsPortalBursting(true);
      }, currentScene.duration - 800);

      // Final summit scene completed -> trigger grand logo reveal
      timerId = setTimeout(() => {
        if (onFilmComplete) onFilmComplete();
      }, currentScene.duration);
    }

    return () => {
      clearTimeout(timerId);
      if (burstTimerId) clearTimeout(burstTimerId);
    };
  }, [currentIndex, onFilmComplete]);

  return (
    <div className="cpe-film-container">
      {/* 3D Film Layers (Render current and neighboring slides with continuous cross-dissolve) */}
      {SCENES.map((scene, idx) => {
        const isActive = idx === currentIndex;
        const isPrev = idx === currentIndex - 1;
        const isPast = idx < currentIndex - 1;

        let statusClass = 'cpe-slide-future';
        if (isActive) statusClass = 'cpe-slide-active';
        else if (isPrev) statusClass = 'cpe-slide-prev';
        else if (isPast) statusClass = 'cpe-slide-past';

        return (
          <div
            key={scene.id}
            className={`cpe-film-slide ${statusClass}`}
          >
            <div
              className={`cpe-film-frame ${isActive || isPrev ? scene.cameraAnim : ''}`}
              style={{ backgroundImage: `url(${scene.image})` }}
            />
            {scene.id === 'persistence' && (
              <PersistenceHoloCards />
            )}
            {scene.id === 'summit' && (
              <div className={`cpe-summit-golden-aura ${isPortalBursting ? 'cpe-portal-bursting' : ''}`} />
            )}
          </div>
        );
      })}

      {/* Cinematic Vignette & Atmospheric Depth Gradients */}
      <div className="cpe-film-vignette" />
      <div className="cpe-film-anamorphic-flare" />

      {/* Minimal Filmic Narrative Subtitle with smooth glide-in */}
      <footer className="cpe-film-caption-bar">
        <p key={currentIndex} className="cpe-cinematic-caption">
          {SCENES[currentIndex]?.caption}
        </p>
      </footer>
    </div>
  );
}
