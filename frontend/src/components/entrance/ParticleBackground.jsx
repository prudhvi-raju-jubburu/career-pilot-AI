import React, { useEffect, useRef } from 'react';

/**
 * ParticleBackground
 * High-performance canvas for ambient space dust, twinkling stars,
 * and the dramatic Scene 4 summit particle explosion.
 */
export default function ParticleBackground({ isExploding, explodeCenter }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create ambient stars
    const starCount = Math.min(80, Math.floor((width * height) / 14000));
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.4,
      alpha: Math.random() * 0.7 + 0.2,
      twinkleSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
      vx: (Math.random() - 0.5) * 0.15,
      vy: -Math.random() * 0.2 - 0.05, // subtle upward drift
    }));

    // Explosion particles (triggered in Scene 4)
    let explosionParticles = [];
    if (isExploding && explodeCenter) {
      const cx = (explodeCenter.x / 1000) * width;
      const cy = (explodeCenter.y / 650) * height;
      const count = 140;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 2;
        const colorPalette = ['#00d2ff', '#38bdf8', '#2563eb', '#818cf8', '#ffffff', '#c084fc'];
        explosionParticles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 3 + 1,
          alpha: 1,
          decay: Math.random() * 0.012 + 0.008,
          color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        });
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render ambient stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.alpha += s.twinkleSpeed;
        if (s.alpha > 0.9 || s.alpha < 0.2) s.twinkleSpeed = -s.twinkleSpeed;
        s.x += s.vx;
        s.y += s.vy;
        if (s.y < 0) s.y = height;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186, 230, 253, ${s.alpha})`;
        ctx.shadowBlur = s.radius > 1.2 ? 6 : 0;
        ctx.shadowColor = '#38bdf8';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Render explosion particles if active
      if (explosionParticles.length > 0) {
        for (let i = explosionParticles.length - 1; i >= 0; i--) {
          const p = explosionParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.alpha -= p.decay;

          if (p.alpha <= 0) {
            explosionParticles.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isExploding, explodeCenter]);

  return (
    <canvas
      ref={canvasRef}
      className="cpe-particle-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
