import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Flame,
  Activity,
  Layers,
  Globe,
} from 'lucide-react';
import { Button, MatchRing } from './ui';
import { useTypewriter } from '../hooks/useTypewriter';
import { useReducedMotionSafe } from '../motion/hooks';
import { SPRINGS } from '../motion/tokens';

const ORBITING_NODES = [
  { id: 1, company: 'Stripe', role: 'Infra Intern', match: 96, radius: 140, speed: 0.008, color: '#00f2fe', icon: '⚡' },
  { id: 2, company: 'Google', role: 'SWE 2026', match: 92, radius: 210, speed: -0.005, color: '#6366f1', icon: '✦' },
  { id: 3, company: 'DeepMind', role: 'Research Fellow', match: 98, radius: 280, speed: 0.004, color: '#8b5cf6', icon: '◈' },
  { id: 4, company: 'Adobe', role: 'Design Tech', match: 89, radius: 180, speed: -0.007, color: '#f59e0b', icon: '▲' },
  { id: 5, company: 'Uber', role: 'Backend Intern', match: 90, radius: 245, speed: 0.006, color: '#10b981', icon: '◆' },
];

export default function CareerConstellationHero() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const reducedMotion = useReducedMotionSafe();

  const typewriterText = useTypewriter(
    ['Tier-1 Internships', 'Global Hackathons', 'STEM Scholarships', 'FAANG Residencies'],
    80,
    40,
    2000
  );

  // High-performance canvas constellation renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate background ambient constellation stars
    const starCount = reducedMotion ? 25 : width < 768 ? 40 : 85;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.7 + 0.2,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
    }));

    let angles = ORBITING_NODES.map((_, i) => (i * (Math.PI * 2)) / ORBITING_NODES.length);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse coordinate interpolation
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.05;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.05;

      const centerX = width / 2 + mousePos.current.x * 25;
      const centerY = height / 2 + mousePos.current.y * 20;

      // Draw starry particle field
      ctx.fillStyle = '#ffffff';
      stars.forEach((star) => {
        star.x += star.vx;
        star.y += star.vy;
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw faint constellation connecting lines between nearest stars
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 0.75;
      for (let i = 0; i < stars.length; i += 2) {
        for (let j = i + 1; j < stars.length; j += 3) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 85) {
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw orbital rings
      const rings = [140, 180, 210, 245, 280];
      rings.forEach((r, idx) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle =
          idx % 2 === 0
            ? 'rgba(0, 242, 254, 0.08)'
            : 'rgba(139, 92, 246, 0.08)';
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });

      // Central Orb Ambient Radar Sweep Glow
      const centralGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        80
      );
      centralGlow.addColorStop(0, 'rgba(0, 242, 254, 0.35)');
      centralGlow.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)');
      centralGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = centralGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
      ctx.fill();

      // Draw central beacon node
      ctx.fillStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Update and draw Orbiting Opportunity Nodes
      ORBITING_NODES.forEach((node, i) => {
        if (!reducedMotion) {
          angles[i] += node.speed;
        }
        const nx = centerX + Math.cos(angles[i]) * node.radius;
        const ny = centerY + Math.sin(angles[i]) * node.radius;

        // Draw laser connector line from center beacon to node
        ctx.strokeStyle = `rgba(0, 242, 254, 0.12)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        // Node circle
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(nx, ny, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label banner
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        const text = `${node.company} • ${node.match}%`;
        ctx.font = '600 11px "JetBrains Mono", monospace';
        const textWidth = ctx.measureText(text).width;
        const padX = 8;
        const padY = 4;
        const boxX = nx + 10;
        const boxY = ny - 10;

        ctx.fillRect(boxX, boxY - 10, textWidth + padX * 2, 20);
        ctx.strokeRect(boxX, boxY - 10, textWidth + padX * 2, 20);

        ctx.fillStyle = '#f8fafc';
        ctx.fillText(text, boxX + padX, boxY + 4);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mousePos.current.targetX = x;
    mousePos.current.targetY = y;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 30%, #0d1527 0%, var(--bg-primary) 70%)',
        borderBottom: '1px solid var(--border-hairline, var(--border))',
      }}
    >
      {/* Background Interactive Constellation Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Foreground Content HUD */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '960px',
          margin: '0 auto',
          padding: '4rem 1.5rem',
          textAlign: 'center',
          pointerEvents: 'auto',
        }}
      >
        {/* Telemetry Status Pill */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRINGS.snappy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.45rem 1.15rem',
            borderRadius: '999px',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid var(--border-control)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
            marginBottom: '1.75rem',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--accent-cyan, #00f2fe)',
              boxShadow: '0 0 8px var(--cyan-glow)',
            }}
            className="animate-pulse"
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Mission Control Active • 12,480 Orbiting Nodes
          </span>
        </motion.div>

        {/* Hero Title with Split Text & Space Grotesk */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.4rem, 6vw + 0.5rem, 4.8rem)',
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            margin: '0 0 1.25rem',
          }}
        >
          Navigate Your Career Trajectory with{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #00f2fe 0%, #8b5cf6 50%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
            }}
          >
            AI Flight Precision
          </span>
        </motion.h1>

        {/* Dynamic Typewriter Role Cycling */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
            fontWeight: 600,
            color: 'var(--accent-cyan)',
            marginBottom: '1.5rem',
            minHeight: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Locking radar on:</span>
          <span>{typewriterText}</span>
          <span className="streaming-cursor" style={{ color: 'var(--accent-cyan)' }}>_</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            margin: '0 auto 2.5rem',
          }}
        >
          Deterministic academic eligibility filters, mathematical AI match scores,
          and a flight-deck application tracker. Zero generic fluff. 100% trajectory acceleration.
        </motion.p>

        {/* Hero CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <Button
              variant="glow"
              size="lg"
              magnetic
              icon={<Sparkles size={18} />}
              iconRight={<ArrowRight size={18} />}
            >
              Launch Mission Control
            </Button>
          </Link>

          <Link to="/opportunities" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="lg" icon={<Compass size={18} />}>
              Explore Opportunities
            </Button>
          </Link>
        </motion.div>

        {/* Telemetry Flight Counters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1.5rem',
            marginTop: '3.5rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--border-hairline, var(--border))',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              99.4%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Deterministic Cutoff Accuracy
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
              12,480+
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Scanned Opportunities
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
              &lt; 15ms
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Real-Time Radar Latency
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
              3.8x
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Offer Conversion Velocity
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
