import React, { useState, useEffect } from 'react';

/**
 * BrandReveal
 * Grand CareerPilot AI Logo Reveal (matching Panel 9 of reference image).
 * Features:
 * - Dominant, large hero presentation (45–55% viewport width on desktop, responsive on mobile)
 * - Real /careerpilot-logo.png asset with 100% aspect ratio fidelity
 * - Swirling cosmic orbital light arcs & energy rings
 * - Concentric glowing cyan ground dais / energy disc on the floor
 * - Radiant diagonal light sweep shimmering across the logo
 * - Sequential narrative taglines:
 *   1. "Every step brings you closer."
 *   2. "Your career journey starts here."
 * - Coordinated smooth dissolve into the live CareerPilot AI homepage.
 */
export default function BrandReveal({ onRevealComplete }) {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [showTagline1, setShowTagline1] = useState(false);
  const [showTagline2, setShowTagline2] = useState(false);
  const [imgSrc, setImgSrc] = useState('/careerpilot-logo.png');

  useEffect(() => {
    // Step 0: Animate logo emergence
    const t0 = setTimeout(() => {
      setLogoAnimated(true);
    }, 100);

    // Step 1: Reveal Tagline 1 after 900ms
    const t1 = setTimeout(() => {
      setShowTagline1(true);
    }, 900);

    // Step 2: Reveal Tagline 2 after 1700ms
    const t2 = setTimeout(() => {
      setShowTagline2(true);
    }, 1700);

    // Step 3: Trigger seamless transition to landing page after 4400ms
    const t3 = setTimeout(() => {
      if (onRevealComplete) onRevealComplete();
    }, 4400);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onRevealComplete]);

  const handleImageError = () => {
    if (imgSrc !== '/careerpilot-logo.svg') {
      setImgSrc('/careerpilot-logo.svg');
    }
  };

  return (
    <div className="cpe-grand-brand-stage" aria-label="CareerPilot AI Brand Reveal">
      {/* 1. Concentric Radial Ambient Backlight */}
      <div className="cpe-cosmic-glow-core" />
      <div className="cpe-cosmic-glow-outer" />

      {/* 2. Cosmic Orbital Light Arcs (Panel 9 Reference) */}
      <div className="cpe-orbital-arc cpe-orbital-arc-1" />
      <div className="cpe-orbital-arc cpe-orbital-arc-2" />
      <div className="cpe-orbital-arc cpe-orbital-arc-3" />

      {/* 3. Glowing Floor Portal Disc (Floor Projection Dais) */}
      <div className="cpe-floor-portal-dais">
        <div className="cpe-floor-ring cpe-floor-ring-outer" />
        <div className="cpe-floor-ring cpe-floor-ring-inner" />
        <div className="cpe-floor-radial-glow" />
      </div>

      {/* 4. Grand Hero Logo Presentation (45-55% Viewport Width) */}
      <div className="cpe-grand-logo-container">
        <div className={`cpe-grand-logo-shimmer-shell ${logoAnimated ? 'cpe-logo-animate-in' : ''}`}>
          {/* Luminous ambient backer to ensure high contrast for dark text on dark backdrop */}
          <div className="cpe-logo-ambient-backer" />
          <img
            src={imgSrc}
            alt="CareerPilot AI"
            className="cpe-grand-hero-logo"
            onError={handleImageError}
            onLoad={() => setLogoLoaded(true)}
          />
          {/* Radiant Diagonal Light Sweep Reflection */}
          <div className="cpe-grand-light-sweep" />
        </div>
      </div>

      {/* 5. Sequential Narrative Taglines */}
      <div className="cpe-grand-taglines">
        <h1 className={`cpe-grand-tagline-1 ${showTagline1 ? 'cpe-revealed' : ''}`}>
          Every step brings you closer.
        </h1>
        <p className={`cpe-grand-tagline-2 ${showTagline2 ? 'cpe-revealed' : ''}`}>
          Your career journey starts here.
        </p>
      </div>
    </div>
  );
}
