import React from 'react';
import { motion } from 'framer-motion';

export default function SkillRadar({
  skills = [
    { name: 'Python', user: 90, target: 85 },
    { name: 'Algorithms', user: 85, target: 90 },
    { name: 'System Design', user: 55, target: 80 },
    { name: 'Databases', user: 75, target: 75 },
    { name: 'Cloud/DevOps', user: 50, target: 70 },
    { name: 'Networking', user: 65, target: 60 },
  ],
  size = 280,
  className = '',
}) {
  const center = size / 2;
  const radius = center - 40;
  const total = skills.length;
  const angleStep = (Math.PI * 2) / total;

  // Compute vertices for polygon
  const getCoordinates = (value, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const userPoints = skills.map((s, i) => getCoordinates(s.user, i)).map((p) => `${p.x},${p.y}`).join(' ');
  const targetPoints = skills.map((s, i) => getCoordinates(s.target, i)).map((p) => `${p.x},${p.y}`).join(' ');

  // Grid levels (25%, 50%, 75%, 100%)
  const levels = [0.25, 0.5, 0.75, 1];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        userSelect: 'none',
      }}
      className={`skill-radar-chart ${className}`}
    >
      <svg width={size} height={size}>
        {/* Radar Concentric Rings */}
        {levels.map((lvl) => {
          const ringPoints = skills
            .map((_, i) => getCoordinates(lvl * 100, i))
            .map((p) => `${p.x},${p.y}`)
            .join(' ');
          return (
            <polygon
              key={lvl}
              points={ringPoints}
              fill="none"
              stroke="var(--border-control, rgba(255, 255, 255, 0.08))"
              strokeWidth="1"
              strokeDasharray={lvl < 1 ? '3 3' : 'none'}
            />
          );
        })}

        {/* Radial Axis Spokes */}
        {skills.map((_, i) => {
          const outer = getCoordinates(100, i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--border-control, rgba(255, 255, 255, 0.08))"
              strokeWidth="1"
            />
          );
        })}

        {/* Target Benchmark Area (Amber/Dashed) */}
        <polygon
          points={targetPoints}
          fill="rgba(245, 158, 11, 0.08)"
          stroke="var(--accent-amber, #f59e0b)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* User Skills Area (Pulsar Cyan fill & glow) */}
        <motion.polygon
          points={userPoints}
          fill="rgba(0, 242, 254, 0.22)"
          stroke="var(--accent-cyan, #00f2fe)"
          strokeWidth="2.5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* User Skill Vertices */}
        {skills.map((s, i) => {
          const p = getCoordinates(s.user, i);
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="var(--accent-cyan, #00f2fe)"
              stroke="var(--surface-cockpit, #0f172a)"
              strokeWidth="2"
            />
          );
        })}

        {/* Skill Labels */}
        {skills.map((s, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelDist = radius + 22;
          const x = center + labelDist * Math.cos(angle);
          const y = center + labelDist * Math.sin(angle);
          return (
            <text
              key={i}
              x={x}
              y={y + 4}
              textAnchor="middle"
              fill="var(--text-secondary)"
              fontSize="11"
              fontFamily="var(--font-mono)"
              fontWeight="600"
            >
              {s.name}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '1.25rem',
          marginTop: '0.75rem',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
          Your Mastery
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-amber)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-amber)' }} />
          Target Role Requirement
        </span>
      </div>
    </div>
  );
}
